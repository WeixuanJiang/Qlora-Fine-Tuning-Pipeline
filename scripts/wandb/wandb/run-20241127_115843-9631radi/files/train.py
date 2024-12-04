import os
import sys
import json
import logging
import traceback
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List, Union
from datetime import datetime

import torch
from datasets import Dataset, load_dataset
import transformers
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    TrainingArguments,
    Trainer,
    set_seed,
)
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
import pandas as pd
import wandb

from prepare_dataset import prepare_dataset, format_prompt, load_json_dataset

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

class TrainingLogger:
    """Custom logger for training process"""
    def __init__(self, log_dir: str = "training_logs"):
        self.log_dir = log_dir
        os.makedirs(log_dir, exist_ok=True)
        
        # Configure logging
        self.logger = logging.getLogger("TrainingLogger")
        self.logger.setLevel(logging.INFO)
        
        # File handler
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_file = os.path.join(log_dir, f"training_{timestamp}.log")
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(logging.INFO)
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(file_formatter)
        
        # Console handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter('%(levelname)s: %(message)s')
        console_handler.setFormatter(console_formatter)
        
        # Add handlers if not already added
        if not self.logger.handlers:
            self.logger.addHandler(file_handler)
            self.logger.addHandler(console_handler)
    
    def log_config(self, config: Dict):
        """Log configuration settings"""
        self.logger.info("="*50)
        self.logger.info("Configuration:")
        for section, params in config.items():
            self.logger.info(f"\n{section}:")
            for key, value in params.items():
                self.logger.info(f"  {key}: {value}")
    
    def log_dataset_info(self, dataset: Union[Dataset, Dict[str, Dataset]]):
        """Log dataset information"""
        self.logger.info("\n" + "="*50)
        self.logger.info("Dataset Information:")
        
        if isinstance(dataset, dict):
            # Handle DatasetDict
            for split_name, split_dataset in dataset.items():
                self.logger.info(f"\n{split_name} split:")
                self.logger.info(f"  Number of examples: {len(split_dataset)}")
                self.logger.info(f"  Features: {split_dataset.features}")
                self.logger.info(f"  Column names: {split_dataset.column_names}")
                if len(split_dataset) > 0:
                    self.logger.info(f"  First example:")
                    for key, value in split_dataset[0].items():
                        self.logger.info(f"    {key}: {value[:100]}..." if isinstance(value, str) else f"    {key}: {value}")
        else:
            # Handle single Dataset
            self.logger.info(f"Number of examples: {len(dataset)}")
            self.logger.info(f"Features: {dataset.features}")
            self.logger.info(f"Column names: {dataset.column_names}")
            if len(dataset) > 0:
                self.logger.info("First example:")
                for key, value in dataset[0].items():
                    self.logger.info(f"  {key}: {value[:100]}..." if isinstance(value, str) else f"  {key}: {value}")
    
    def log_model_info(self, model_info: Dict):
        """Log model information"""
        self.logger.info("\n" + "="*50)
        self.logger.info("Model Information:")
        for key, value in model_info.items():
            self.logger.info(f"  {key}: {value}")
    
    def log_system_info(self):
        """Log system and environment information"""
        self.logger.info("="*50)
        self.logger.info("System Information:")
        self.logger.info(f"Python version: {sys.version}")
        self.logger.info(f"PyTorch version: {torch.__version__}")
        self.logger.info(f"CUDA available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            self.logger.info(f"CUDA device: {torch.cuda.get_device_name(0)}")
            self.logger.info(f"CUDA memory allocated: {torch.cuda.memory_allocated(0)/(1024**2):.2f} MB")
    
    def log_training_step(self, step: int, metrics: Dict[str, float]):
        """Log training step metrics"""
        self.logger.info(f"Step {step} - " + " - ".join([f"{k}: {v:.4f}" for k, v in metrics.items()]))
    
    def log_epoch_metrics(self, epoch: int, metrics: Dict[str, float]):
        """Log epoch metrics"""
        self.logger.info("="*50)
        self.logger.info(f"Epoch {epoch} Metrics:")
        for key, value in metrics.items():
            self.logger.info(f"{key}: {value:.4f}")
    
    def log_error(self, error_msg: str, exception: Optional[Exception] = None):
        """Log error information"""
        self.logger.error(f"Error: {error_msg}")
        if exception:
            self.logger.error(f"Exception details:", exc_info=True)
    
    def log_training_complete(self, output_dir: str):
        """Log training completion"""
        self.logger.info("="*50)
        self.logger.info("Training Complete!")
        self.logger.info(f"Model saved to: {output_dir}")

def load_local_dataset(
    dataset_path: str,
    input_column: str = "input",
    target_column: str = "output",
    max_samples: Optional[int] = None,
    prompt_template: Optional[Union[str, Dict]] = None,
) -> Dataset:
    """
    Load and prepare a local dataset
    """
    # Load dataset
    dataset = load_json_dataset(
        dataset_path=dataset_path,
        input_column=input_column,
        target_column=target_column,
        max_samples=max_samples
    )
    
    # Prepare dataset with prompt template if provided
    if prompt_template:
        dataset = prepare_dataset(
            dataset,
            input_column=input_column,
            target_column=target_column,
            prompt_template=prompt_template
        )
    
    logger = TrainingLogger()
    logger.logger.info(f"Dataset loaded with {len(dataset)} examples")
    return dataset

def load_prompt_templates() -> Dict:
    """
    Load prompt templates from the JSON file in the prompts folder
    """
    prompt_file = os.path.join(os.path.dirname(__file__), "prompts", "prompt.json")
    try:
        with open(prompt_file, 'r', encoding='utf-8') as f:
            templates = json.load(f)
        return templates
    except Exception as e:
        logging.warning(f"Failed to load prompt templates from {prompt_file}: {str(e)}")
        return {}

def get_model_prompt_template(model_name: str, template_type: str = "default") -> Dict:
    """
    Get the appropriate prompt template for a model
    """
    # Load templates from JSON file
    templates = load_prompt_templates()
    
    if not templates:
        # Fallback to default templates if loading fails
        templates = {
            "default": {
                "system": "You are a helpful AI assistant that follows instructions carefully.",
                "user": "{input}",
                "assistant": "{output}"
            }
        }
    
    # Get model type from name
    model_type = model_name.lower().split('/')[0]
    
    # Try to get template in the following order:
    # 1. Specified template_type
    # 2. Model-specific template
    # 3. Default template
    if template_type and template_type in templates:
        return templates[template_type]
    elif model_type in templates:
        return templates[model_type]
    else:
        return templates.get("default", templates[next(iter(templates))])

class DatasetProcessor:
    """Handles dataset processing and tokenization for training"""
    def __init__(
        self,
        tokenizer: transformers.PreTrainedTokenizer,
        max_length: int,
        input_column: str,
        target_column: str
    ):
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.input_column = input_column
        self.target_column = target_column

    def tokenize_and_format(self, examples):
        # Combine input and target into a single text
        texts = []
        for i in range(len(examples[self.input_column])):
            input_text = str(examples[self.input_column][i])
            target_text = str(examples[self.target_column][i])
            combined_text = f"{input_text}{target_text}"
            texts.append(combined_text)

        # Tokenize with padding and truncation
        tokenized = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=self.max_length,
            return_tensors=None  # Return lists instead of tensors
        )

        # Create labels (same as input_ids for causal LM)
        tokenized["labels"] = tokenized["input_ids"].copy()

        return tokenized

    def process_dataset(self, dataset: Dataset) -> Dataset:
        # Process the entire dataset at once
        processed_dataset = dataset.map(
            self.tokenize_and_format,
            batched=True,
            remove_columns=dataset.column_names,
            desc="Processing dataset"
        )
        
        return processed_dataset

def train(
    # Model arguments
    model_name: str = "Qwen/Qwen-0.5B",
    dataset_path: Optional[str] = None,
    dataset_name: Optional[str] = None,
    output_dir: str = "output",
    trust_remote_code: bool = True,
    
    # Dataset arguments
    input_column: str = "input",
    target_column: str = "output",
    max_samples: Optional[int] = None,
    max_length: int = 2048,
    max_target_length: Optional[int] = None,
    
    # Training arguments
    num_train_epochs: float = 3.0,
    per_device_train_batch_size: int = 4,
    gradient_accumulation_steps: int = 4,
    learning_rate: float = 2e-4,
    weight_decay: float = 0.001,
    warmup_ratio: float = 0.03,
    warmup_steps: int = 0,
    max_grad_norm: float = 1.0,
    lr_scheduler_type: str = "cosine",
    optim: str = "adamw_bnb_8bit",
    fp16: bool = False,
    bf16: bool = False,
    max_steps: int = -1,
    evaluation_strategy: str = "no",
    eval_steps: Optional[int] = None,
    
    # LoRA arguments
    lora_r: int = 64,
    lora_alpha: int = 128,
    lora_dropout: float = 0.05,
    lora_target_modules: Optional[List[str]] = None,
    modules_to_save: Optional[List[str]] = None,
    fan_in_fan_out: bool = False,
    bias: str = "none",
    use_gradient_checkpointing: bool = False,
    
    # Other arguments
    seed: int = 42,
    logging_steps: int = 10,
    save_steps: int = 100,
    save_total_limit: int = 3,
    
    # Quantization arguments
    bits: int = 4,
    double_quant: bool = True,
    quant_type: str = "nf4",
    load_in_8bit: bool = False,
    load_in_4bit: bool = True,
    group_size: int = 128,
    use_nested_quant: bool = False,
    
    # Prompt template
    prompt_template_type: Optional[str] = None,
    prompt_template: Optional[Union[str, Dict]] = None,
    
    # Wandb arguments
    wandb_project: str = "qlora-finetune",
    wandb_run_name: Optional[str] = None,
    wandb_watch: str = "gradients",
    wandb_log_model: str = "checkpoint",
    report_to: List[str] = field(default_factory=lambda: ["wandb"]),
    
    # Model saving and loading
    save_safetensors: bool = True,
    resume_from_checkpoint: Optional[str] = None,
    push_to_hub: bool = False,
    hub_model_id: Optional[str] = None,
    hub_private_repo: bool = True,
    hub_token: Optional[str] = None,
):
    """
    Fine-tune a model using QLoRA
    """
    logger = None
    try:
        # Set random seed
        set_seed(seed)
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Initialize logger
        logger = TrainingLogger(
            log_dir=os.path.join(output_dir, "logs")
        )
        
        # Log system information
        logger.log_system_info()
        
        # Initialize wandb
        if wandb_run_name is None:
            wandb_run_name = f"{model_name.split('/')[-1]}-{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        wandb.init(
            project=wandb_project,
            name=wandb_run_name,
            config={
                "model_name": model_name,
                "dataset_path": dataset_path,
                "max_samples": max_samples,
                "max_length": max_length,
                "num_train_epochs": num_train_epochs,
                "batch_size": per_device_train_batch_size,
                "learning_rate": learning_rate,
                "weight_decay": weight_decay,
                "warmup_ratio": warmup_ratio,
                "lr_scheduler": lr_scheduler_type,
                "lora_r": lora_r,
                "lora_alpha": lora_alpha,
                "lora_dropout": lora_dropout,
                "bits": bits,
                "double_quant": double_quant,
                "quant_type": quant_type,
            },
            # Disable model logging to avoid directory issues
            settings=wandb.Settings(start_method="thread", _disable_stats=True)
        )
        
        # Log configuration
        config = {
            "Model": {
                "name": model_name,
                "bits": bits,
                "double_quant": double_quant,
                "quant_type": quant_type
            },
            "Dataset": {
                "path": dataset_path,
                "name": dataset_name,
                "max_samples": max_samples,
                "max_length": max_length
            },
            "Training": {
                "num_epochs": num_train_epochs,
                "batch_size": per_device_train_batch_size,
                "learning_rate": learning_rate,
                "weight_decay": weight_decay,
                "warmup_ratio": warmup_ratio,
                "lr_scheduler": lr_scheduler_type
            },
            "LoRA": {
                "r": lora_r,
                "alpha": lora_alpha,
                "dropout": lora_dropout
            },
            "Wandb": {
                "project": wandb_project,
                "run_name": wandb_run_name,
                "watch": wandb_watch,
                "log_model": wandb_log_model
            }
        }
        logger.log_config(config)
        
        # Load tokenizer
        logger.logger.info("Loading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            trust_remote_code=trust_remote_code
        )
        if not tokenizer.pad_token_id:
            tokenizer.pad_token_id = tokenizer.eos_token_id
            
        # Load model
        logger.logger.info("Loading model...")
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=bits == 4,
            load_in_8bit=bits == 8,
            bnb_4bit_quant_type=quant_type,
            bnb_4bit_double_quant=double_quant,
            bnb_4bit_compute_dtype=torch.float16,
        )
        
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=trust_remote_code,
        )
        model.config.use_cache = False
        
        # Log model information
        model_info = {
            "Total parameters": sum(p.numel() for p in model.parameters()),
            "Trainable parameters": sum(p.numel() for p in model.parameters() if p.requires_grad),
            "Percentage of trainable parameters": (sum(p.numel() for p in model.parameters() if p.requires_grad) / sum(p.numel() for p in model.parameters())) * 100,
        }
        logger.log_model_info(model_info)
        wandb.log({"model_info": model_info})
        
        # Watch model with wandb
        if wandb_watch:
            wandb.watch(model, log=wandb_watch, log_freq=max(100, logging_steps))
        
        # Prepare model for k-bit training
        logger.logger.info("Preparing model for k-bit training...")
        model = prepare_model_for_kbit_training(model)
        
        # Get prompt template
        if prompt_template is None and prompt_template_type:
            prompt_template = get_model_prompt_template(model_name, prompt_template_type)
        
        # Load dataset
        logger.logger.info("Loading dataset...")
        dataset = load_local_dataset(
            dataset_path=dataset_path,
            input_column=input_column,
            target_column=target_column,
            max_samples=max_samples,
            prompt_template=prompt_template
        )
        logger.log_dataset_info(dataset)
        
        # Initialize dataset processor
        dataset_processor = DatasetProcessor(
            tokenizer=tokenizer,
            max_length=max_length,
            input_column=input_column,
            target_column=target_column
        )
        
        # Process dataset
        logger.logger.info("Processing dataset...")
        if isinstance(dataset, dict):
            processed_dataset = {
                split: dataset_processor.process_dataset(split_dataset)
                for split, split_dataset in dataset.items()
            }
            train_dataset = processed_dataset["train"]
            eval_dataset = processed_dataset.get("test")
        else:
            train_dataset = dataset_processor.process_dataset(dataset)
            eval_dataset = None
        
        # Configure LoRA
        logger.logger.info("Configuring LoRA...")
        peft_config = LoraConfig(
            r=lora_r,
            lora_alpha=lora_alpha,
            lora_dropout=lora_dropout,
            bias="none",
            task_type="CAUSAL_LM",
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
        )
        
        # Apply LoRA
        logger.logger.info("Applying LoRA...")
        model = get_peft_model(model, peft_config)
        
        # Training arguments
        logger.logger.info("Configuring training arguments...")
        training_args = TrainingArguments(
            output_dir=output_dir,
            run_name=wandb_run_name,  # Set explicit run name for wandb
            num_train_epochs=num_train_epochs,
            per_device_train_batch_size=per_device_train_batch_size,
            learning_rate=learning_rate,
            weight_decay=weight_decay,
            warmup_ratio=warmup_ratio,
            lr_scheduler_type=lr_scheduler_type,
            logging_steps=logging_steps,
            save_steps=save_steps,
            save_total_limit=save_total_limit,
            logging_dir=os.path.join(output_dir, "logs"),
            report_to=report_to,
            remove_unused_columns=False,
            hub_strategy="end",
            hub_model_id=None,
            push_to_hub=False,
            optim=optim,
            gradient_checkpointing=True,
        )
        
        # Initialize trainer
        logger.logger.info("Initializing trainer...")
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=eval_dataset,
            tokenizer=tokenizer,
        )
        
        # Start training
        logger.logger.info("Starting training...")
        trainer.train()
        
        # Save model
        logger.logger.info("Saving model...")
        trainer.save_model(output_dir)
        
        # Finish wandb run
        wandb.finish()
        
        logger.logger.info("Training completed successfully!")
        return True
        
    except Exception as e:
        if logger:
            logger.logger.error("Error: Training failed")
            logger.logger.error("Exception details:")
            logger.logger.error(traceback.format_exc())
        else:
            print("Error: Training failed")
            print("Exception details:")
            print(traceback.format_exc())
        
        # Ensure wandb run is finished even if there's an error
        if wandb.run is not None:
            wandb.finish()
        
        return False

if __name__ == "__main__":
    import fire
    fire.Fire(train)
