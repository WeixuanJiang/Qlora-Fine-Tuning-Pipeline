import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Union
from datasets import Dataset, load_dataset
import pandas as pd

logger = logging.getLogger(__name__)

def load_json_dataset(
    dataset_path: str,
    input_column: str = "input",
    target_column: str = "output",
    max_samples: Optional[int] = None,
) -> Dataset:
    """
    Load a JSON dataset and convert it to HuggingFace Dataset format.
    
    Args:
        dataset_path: Path to the JSON dataset file
        input_column: Name of the input column
        target_column: Name of the target column
        max_samples: Maximum number of samples to load
        
    Returns:
        HuggingFace Dataset
    """
    try:
        # Load JSON data
        with open(dataset_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Handle both list and dict formats
        if isinstance(data, dict) and "data" in data:
            examples = data["data"]
        elif isinstance(data, list):
            examples = data
        else:
            raise ValueError("Invalid dataset format. Expected list of examples or dict with 'data' field")
        
        # Limit samples if specified
        if max_samples is not None:
            examples = examples[:max_samples]
        
        # Convert to DataFrame then to Dataset
        df = pd.DataFrame(examples)
        
        # Verify required columns exist
        required_columns = {input_column, target_column}
        missing_columns = required_columns - set(df.columns)
        if missing_columns:
            raise ValueError(f"Missing required columns: {missing_columns}")
        
        # Convert to HuggingFace Dataset
        dataset = Dataset.from_pandas(df)
        logger.info(f"Loaded {len(dataset)} examples from {dataset_path}")
        
        return dataset
    
    except Exception as e:
        logger.error(f"Error loading dataset from {dataset_path}: {e}")
        raise

def format_prompt(
    example: Dict,
    input_column: str = "input",
    target_column: str = "output",
    prompt_template: Optional[Union[str, Dict]] = None
) -> Dict:
    """
    Format a single example with the given prompt template.
    
    Args:
        example: Dictionary containing the example
        input_column: Name of the input column
        target_column: Name of the target column
        prompt_template: Optional prompt template string or dict
        
    Returns:
        Formatted example
    """
    input_text = example[input_column]
    target_text = example[target_column]
    
    # Use default format if no template provided
    if not prompt_template:
        formatted_input = f"{input_text}\n\n### Response:"
    else:
        # Handle both string and dict templates
        if isinstance(prompt_template, dict):
            # Extract template parts
            system = prompt_template.get("system", "").strip()
            user = prompt_template.get("user", "{input}").strip()
            assistant = prompt_template.get("assistant", "{output}").strip()
            
            # Build formatted input
            parts = []
            if system:
                parts.append(system)
            if user:
                parts.append(user.format(input=input_text))
            formatted_input = "\n\n".join(parts)
        else:
            # Use string template directly
            formatted_input = prompt_template.format(
                input=input_text,
                output=target_text
            )
    
    return {
        "input": formatted_input,
        "output": target_text
    }

def prepare_dataset(
    dataset: Dataset,
    input_column: str = "input",
    target_column: str = "output",
    prompt_template: Optional[Union[str, Dict]] = None,
    train_test_split: Optional[float] = None
) -> Union[Dataset, Dict[str, Dataset]]:
    """
    Prepare a dataset for training by formatting prompts and optionally splitting it.
    
    Args:
        dataset: HuggingFace Dataset to prepare
        input_column: Name of the input column
        target_column: Name of the target column
        prompt_template: Optional prompt template string or dict
        train_test_split: If not None, split ratio for test set
        
    Returns:
        Either a single Dataset or a dict with 'train' and 'test' splits
    """
    # Format prompts
    dataset = dataset.map(
        lambda x: format_prompt(
            x,
            input_column=input_column,
            target_column=target_column,
            prompt_template=prompt_template
        )
    )
    
    # Split dataset if requested
    if train_test_split is not None:
        dataset = dataset.train_test_split(test_size=train_test_split)
        logger.info(f"Split dataset into {len(dataset['train'])} train and {len(dataset['test'])} test examples")
    
    return dataset
