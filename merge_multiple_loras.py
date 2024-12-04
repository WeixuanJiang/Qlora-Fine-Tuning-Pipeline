import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import fire
import logging
import sys
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('merge_lora.log')
    ]
)

def merge_multiple_loras(
    base_model_name: str,
    adapter_paths: list,
    output_dir: str,
    device: str = "auto",
    push_to_hub: bool = False,
    trust_remote_code: bool = True,
):
    """
    Merge multiple LoRA fine-tuned models with the base model sequentially.
    
    Args:
        base_model_name (str): Name or path of the base model (e.g., "Qwen/Qwen-0.5B")
        adapter_paths (list): List of paths to the trained adapter models in order of merging
        output_dir (str): Directory to save the merged model
        device (str): Device to load model on ('cpu', 'cuda', 'auto')
        push_to_hub (bool): Whether to push the merged model to Hugging Face Hub
        trust_remote_code (bool): Whether to trust remote code when loading models
    """
    try:
        # Convert string representation of list to actual list if needed
        if isinstance(adapter_paths, str):
            if adapter_paths.startswith('[') and adapter_paths.endswith(']'):
                # Remove brackets and split by comma
                paths = adapter_paths[1:-1].split(',')
                # Clean up each path
                adapter_paths = [p.strip().strip("'\"") for p in paths if p.strip()]
        
        # Validate paths exist
        for adapter_path in adapter_paths:
            path = Path(adapter_path)
            if not path.exists():
                raise ValueError(f"Adapter path does not exist: {adapter_path}")
            if not (path / "adapter_config.json").exists():
                raise ValueError(f"No adapter_config.json found in: {adapter_path}")
        
        logging.info(f"Loading base model: {base_model_name}")
        try:
            # Load tokenizer first to get configuration files
            tokenizer = AutoTokenizer.from_pretrained(
                base_model_name,
                trust_remote_code=trust_remote_code
            )
        except Exception as e:
            logging.error(f"Failed to load tokenizer: {str(e)}")
            raise
        
        try:
            # Load the base model
            current_model = AutoModelForCausalLM.from_pretrained(
                base_model_name,
                torch_dtype=torch.float16,
                device_map=device,
                trust_remote_code=trust_remote_code
            )
        except Exception as e:
            logging.error(f"Failed to load base model: {str(e)}")
            raise
        
        # Sequentially merge each adapter
        for i, adapter_path in enumerate(adapter_paths, 1):
            try:
                # Normalize path
                adapter_path = os.path.normpath(adapter_path)
                logging.info(f"\nMerging adapter {i}/{len(adapter_paths)}: {adapter_path}")
                
                # Load the current model state with the adapter
                logging.info(f"Loading adapter model from: {adapter_path}")
                model_with_adapter = PeftModel.from_pretrained(
                    current_model,
                    adapter_path,
                    device_map=device,
                )
                
                logging.info("Merging adapter weights...")
                current_model = model_with_adapter.merge_and_unload()
                
                logging.info(f"Successfully merged adapter {i}")
            except Exception as e:
                logging.error(f"Failed to merge adapter {i}: {str(e)}")
                raise
        
        # Create output directory if it doesn't exist
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        logging.info(f"\nSaving merged model to: {output_dir}")
        try:
            # Save the merged model and tokenizer with all necessary files
            current_model.save_pretrained(
                output_dir,
                safe_serialization=True
            )
            tokenizer.save_pretrained(output_dir)
        except Exception as e:
            logging.error(f"Failed to save merged model: {str(e)}")
            raise
        
        logging.info("Model merging completed successfully!")
        
        if push_to_hub:
            try:
                logging.info("\nPushing merged model to Hub...")
                current_model.push_to_hub(output_dir)
                tokenizer.push_to_hub(output_dir)
                logging.info("Model pushed to Hub successfully!")
            except Exception as e:
                logging.error(f"Failed to push model to Hub: {str(e)}")
                raise
        
        return True
    
    except Exception as e:
        logging.error(f"Error during model merging: {str(e)}")
        raise

def main():
    try:
        fire.Fire(merge_multiple_loras)
    except Exception as e:
        logging.error(f"Fatal error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
