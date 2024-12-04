import os
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import fire

def merge_model(
    base_model_name: str,
    adapter_model_path: str,
    output_dir: str,
    device: str = "auto",
    push_to_hub: bool = False,
    trust_remote_code: bool = True,
):
    """
    Merge a LoRA fine-tuned model with its base model.
    
    Args:
        base_model_name (str): Name or path of the base model (e.g., "Qwen/Qwen-0.5B")
        adapter_model_path (str): Path to the trained adapter model
        output_dir (str): Directory to save the merged model
        device (str): Device to load model on ('cpu', 'cuda', 'auto')
        push_to_hub (bool): Whether to push the merged model to Hugging Face Hub
        trust_remote_code (bool): Whether to trust remote code when loading models
    """
    print(f"Loading base model: {base_model_name}")
    base_model = AutoModelForCausalLM.from_pretrained(
        base_model_name,
        torch_dtype=torch.float16,
        device_map=device,
        trust_remote_code=trust_remote_code
    )
    
    print(f"Loading adapter model from: {adapter_model_path}")
    model = PeftModel.from_pretrained(
        base_model,
        adapter_model_path,
        device_map=device,
    )
    
    print("Merging adapter weights with base model...")
    model = model.merge_and_unload()
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Saving merged model to: {output_dir}")
    model.save_pretrained(
        output_dir,
        safe_serialization=True,
    )
    
    # Save tokenizer
    print("Saving tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(
        base_model_name,
        trust_remote_code=trust_remote_code
    )
    tokenizer.save_pretrained(output_dir)
    
    if push_to_hub:
        print("Pushing merged model to Hub...")
        model.push_to_hub(output_dir)
        tokenizer.push_to_hub(output_dir)
    
    print("Model merging completed successfully!")
    return True

if __name__ == "__main__":
    fire.Fire(merge_model)
