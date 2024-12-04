import os
import json
import torch
from typing import Optional, List, Dict, Union, Generator
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer, StoppingCriteriaList, StoppingCriteria
from tqdm import tqdm
import fire
import threading

class StopOnTokens(StoppingCriteria):
    def __init__(self, stop_token_ids: List[int]):
        self.stop_token_ids = stop_token_ids

    def __call__(self, input_ids: torch.LongTensor, scores: torch.FloatTensor, **kwargs) -> bool:
        for stop_ids in self.stop_token_ids:
            if input_ids[0][-1] == stop_ids:
                return True
        return False

class ModelInference:
    def __init__(
        self,
        model_path: str,
        device: str = "auto",
        max_length: int = 100,
        temperature: float = 0.7,
        top_p: float = 0.9,
        top_k: int = 50,
        num_beams: int = 1,
        trust_remote_code: bool = True,
    ):
        """
        Initialize the inference model.
        
        Args:
            model_path: Path to the model or model name on HuggingFace Hub
            device: Device to run inference on ('cpu', 'cuda', 'auto')
            max_length: Maximum length of generated text
            temperature: Sampling temperature (higher = more random)
            top_p: Nucleus sampling parameter
            top_k: Top-k sampling parameter
            num_beams: Number of beams for beam search
            trust_remote_code: Whether to trust remote code when loading models
        """
        print(f"Loading model from: {model_path}")
        self.model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype=torch.float16,
            device_map=device,
            trust_remote_code=trust_remote_code
        )
        
        print("Loading tokenizer...")
        self.tokenizer = AutoTokenizer.from_pretrained(
            model_path,
            trust_remote_code=trust_remote_code
        )
        
        if not self.tokenizer.pad_token_id:
            self.tokenizer.pad_token_id = self.tokenizer.eos_token_id
            
        self.max_length = max_length
        self.temperature = temperature
        self.top_p = top_p
        self.top_k = top_k
        self.num_beams = num_beams
        
        # Add stop tokens
        self.stop_tokens = ["</s>", "\n\n", "<|reserved_special_token_236|>", "<|reserved_special_token_237|>","<|endoftext|>"]
        
        print("Model loaded successfully!")
    
    def _generate_tokens(self, prompt: str, max_new_tokens: Optional[int] = None) -> torch.Tensor:
        """Internal method to generate tokens."""
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
        
        generate_kwargs = {
            "max_new_tokens": max_new_tokens or self.max_length,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "top_k": self.top_k,
            "num_beams": self.num_beams,
            "pad_token_id": self.tokenizer.pad_token_id,
            "eos_token_id": self.tokenizer.eos_token_id,
        }
        
        with torch.no_grad():
            outputs = self.model.generate(**inputs, **generate_kwargs)
        return outputs[0]
    
    def generate_response(
        self,
        prompt: str,
        max_new_tokens: Optional[int] = None,
        stream: bool = False
    ) -> str:
        """Generate a response for a given prompt."""
        outputs = self._generate_tokens(prompt, max_new_tokens)
        response = self.tokenizer.decode(outputs, skip_special_tokens=True)
        
        # Remove the prompt from the response
        if response.startswith(prompt):
            response = response[len(prompt):].strip()
        return response
    
    def generate_stream(
        self,
        prompt: str,
        max_new_tokens: Optional[int] = None,
    ) -> Generator[str, None, None]:
        """Generate a streaming response for a given prompt."""
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)
        streamer = TextIteratorStreamer(self.tokenizer, skip_prompt=True, timeout=10)
        
        # Add stop token ids
        stop_token_ids = []
        for token in self.stop_tokens:
            ids = self.tokenizer.encode(token, add_special_tokens=False)
            stop_token_ids.extend(ids)
        
        generate_kwargs = {
            "max_new_tokens": self.max_length,
            "temperature": self.temperature,
            "top_p": self.top_p,
            "top_k": self.top_k,
            "num_beams": self.num_beams,
            "pad_token_id": self.tokenizer.pad_token_id,
            "eos_token_id": self.tokenizer.eos_token_id,
            "do_sample": True if self.temperature > 0 else False,
            "streamer": streamer,
            "stopping_criteria": [StoppingCriteriaList([StopOnTokens(stop_token_ids)])]
        }
        
        # Run generation in a separate thread
        thread = threading.Thread(
            target=self.model.generate,
            kwargs={**inputs, **generate_kwargs}
        )
        thread.start()
        
        # Yield from streamer as tokens are generated
        for text in streamer:
            yield text
    
    def batch_inference(
        self,
        input_file: str,
        output_file: str,
        input_field: str = "input",
        max_samples: Optional[int] = None
    ) -> List[Dict[str, str]]:
        """
        Run inference on a batch of inputs from a JSON file.
        
        Args:
            input_file: Path to input JSON file
            output_file: Path to save results
            input_field: Field name containing input text in JSON
            max_samples: Maximum number of samples to process
        """
        print(f"Loading inputs from: {input_file}")
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        if isinstance(data, dict):
            data = [data]
            
        if max_samples:
            data = data[:max_samples]
            
        results = []
        total = len(data)
        
        print(f"\nProcessing {total} samples...")
        progress_bar = tqdm(total=total, desc="Generating responses", unit="sample")
        
        for item in data:
            input_text = item[input_field]
            response = self.generate_response(input_text)
            
            result = {
                "input": input_text,
                "output": response
            }
            results.append(result)
            
            # Update progress bar
            progress_bar.update(1)
            
            # Save intermediate results every 100 samples
            if len(results) % 100 == 0:
                self._save_results(results, output_file)
                
        progress_bar.close()
        
        # Save final results
        self._save_results(results, output_file)
        print(f"\nResults saved to: {output_file}")
        return results
    
    def interactive_mode(self):
        """Start an interactive chat session."""
        print("\nStarting interactive mode (type 'quit' to exit)")
        print("-" * 50)
        
        while True:
            user_input = input("\nYou: ").strip()
            if user_input.lower() in ['quit', 'exit']:
                break
                
            if not user_input:
                continue
                
            print("\nAssistant: ", end="", flush=True)
            for text in self.generate_stream(user_input):
                print(text, end="", flush=True)
            print()  # New line at the end
    
    @staticmethod
    def _save_results(results: List[Dict[str, str]], output_file: str):
        """Save results to a JSON file."""
        os.makedirs(os.path.dirname(output_file) or '.', exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

def main(
    model_path: str = "./merged_model",
    query: Optional[str] = None,
    input_file: Optional[str] = None,
    output_file: Optional[str] = "predictions.json",
    input_field: str = "input",
    max_samples: Optional[int] = None,
    device: str = "auto",
    max_length: int = 100,
    temperature: float = 0.7,
    top_p: float = 0.9,
    top_k: int = 50,
    num_beams: int = 1,
    trust_remote_code: bool = True,
):
    """
    Run model inference in one of three modes:
    1. Single query mode: Provide a direct query
    2. Batch mode: Process inputs from a JSON file
    3. Interactive mode: Start a chat session
    """
    inference = ModelInference(
        model_path=model_path,
        device=device,
        max_length=max_length,
        temperature=temperature,
        top_p=top_p,
        top_k=top_k,
        num_beams=num_beams,
        trust_remote_code=trust_remote_code,
    )
    
    if query:
        # Single query mode
        print("\nQuery:", query)
        print("\nAssistant:", end=" ", flush=True)
        for text in inference.generate_stream(query):
            print(text, end="", flush=True)
        print()  # New line at the end
    elif input_file:
        # Batch inference mode
        inference.batch_inference(
            input_file=input_file,
            output_file=output_file,
            input_field=input_field,
            max_samples=max_samples
        )
    else:
        # Interactive mode
        inference.interactive_mode()

if __name__ == "__main__":
    fire.Fire(main)
