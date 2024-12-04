import os
import json
import argparse
import logging
from typing import Dict, List, Optional
from pathlib import Path
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.output_parsers import PydanticOutputParser, OutputFixingParser
from pydantic import BaseModel, Field
from tenacity import retry, stop_after_attempt, wait_exponential
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Example(BaseModel):
    """Pydantic model for a single example"""
    input: str = Field(description="The input text for the example")
    output: str = Field(description="The output text for the example")

    class Config:
        json_schema_extra = {
            "example": {
                "input": "What is machine learning?",
                "output": "Machine learning is a branch of artificial intelligence..."
            }
        }

class Examples(BaseModel):
    """Pydantic model for a list of examples"""
    examples: List[Example] = Field(description="List of generated examples")

    class Config:
        json_schema_extra = {
            "example": {
                "examples": [
                    {
                        "input": "What is machine learning?",
                        "output": "Machine learning is a branch of artificial intelligence..."
                    }
                ]
            }
        }

class DatasetGenerator:
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gpt-3.5-turbo"):
        """Initialize the dataset generator with OpenAI API key"""
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key must be provided or set in OPENAI_API_KEY environment variable")
        
        # Initialize LangChain components
        self.llm = ChatOpenAI(
            openai_api_key=self.api_key,
            model_name=model_name,
            temperature=0.7
        )
        self.load_prompts()
        self.output_parser = PydanticOutputParser(pydantic_object=Examples)
        # Add fixing parser for robustness
        self.fixing_parser = OutputFixingParser.from_llm(parser=self.output_parser, llm=self.llm)

    def load_prompts(self):
        """Load prompts from prompt.json"""
        prompt_path = Path(__file__).parent / "prompts" / "prompt.json"
        with open(prompt_path, 'r', encoding='utf-8') as f:
            prompts = json.load(f)
        self.prompts = prompts["dataset_generator"]

    def create_prompt_template(self, format_type: str) -> ChatPromptTemplate:
        """Create a LangChain prompt template for the specified format"""
        if format_type not in self.prompts["format_examples"]:
            raise ValueError(f"Unsupported format type: {format_type}. Available types: {list(self.prompts['format_examples'].keys())}")
        
        format_example = self.prompts["format_examples"][format_type]
        format_requirements = f"Input format: {format_example['input']}\nOutput format: {format_example['output']}"
        
        system_template = self.prompts["system"]
        human_template = """
Generate {num_examples} diverse examples about {topic}.
Format requirements:
{format_requirements}

The output should be a JSON object with the following structure:
{format_instructions}

Make sure each example follows the exact format specified above.
"""
        
        system_message_prompt = SystemMessagePromptTemplate.from_template(system_template)
        human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)
        
        chat_prompt = ChatPromptTemplate.from_messages([
            system_message_prompt,
            human_message_prompt
        ])
        
        return chat_prompt

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def generate_examples(self, topic: str, num_examples: int, format_type: str, 
                         temperature: float = 0.7) -> List[Dict]:
        """Generate dataset examples using LangChain"""
        # Update LLM temperature
        self.llm.temperature = temperature
        
        # Create prompt template
        prompt = self.create_prompt_template(format_type)
        
        # Create runnable sequence
        chain = prompt | self.llm
        
        # Generate examples
        logger.info(f"Generating {num_examples} examples about {topic} in {format_type} format...")
        response = chain.invoke({
            "num_examples": num_examples,
            "topic": topic,
            "format_requirements": self.prompts["format_examples"][format_type],
            "format_instructions": self.output_parser.get_format_instructions()
        })
        
        try:
            # Get response content
            content = response.content if hasattr(response, 'content') else str(response)
            logger.debug(f"Raw response: {content}")
            
            # Try parsing with fixing parser first
            try:
                parsed_examples = self.fixing_parser.parse(content)
                return [example.dict() for example in parsed_examples.examples]
            except Exception as fix_error:
                logger.warning(f"Fixing parser failed: {fix_error}")
                # Try direct parsing
                parsed_examples = self.output_parser.parse(content)
                return [example.dict() for example in parsed_examples.examples]
        except Exception as e:
            logger.error(f"Failed to parse examples: {e}")
            # Fallback to basic parsing if all parsing attempts fail
            return self.parse_examples(content, format_type)

    def parse_examples(self, text: str, format_type: str) -> List[Dict]:
        """Fallback parser for generated examples"""
        examples = []
        lines = text.strip().split('\n')
        current_example = {}
        
        for line in lines:
            line = line.strip()
            if not line:
                if current_example:
                    examples.append(current_example)
                    current_example = {}
                continue
            
            format_example = self.prompts["format_examples"][format_type]
            if line.startswith(format_example["input"].split("{")[0].strip()):
                current_example["input"] = line
            elif line.startswith(format_example["output"].split("{")[0].strip()):
                current_example["output"] = line
                examples.append(current_example)
                current_example = {}
        
        if current_example:
            examples.append(current_example)
        
        return examples

    def save_dataset(self, examples: List[Dict], output_file: str):
        """Save generated examples to a JSON file"""
        # Ensure output directory exists
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Add .json extension if not present
        if not output_path.suffix:
            output_path = output_path.with_suffix('.json')
        
        # Prepare dataset with simplified format
        dataset = [{"input": ex["input"], "output": ex["output"]} for ex in examples]
        
        # Save to file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(dataset, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Saved {len(examples)} examples to {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Generate training datasets using LangChain and OpenAI")
    parser.add_argument("--topic", required=True, help="Topic for generating examples")
    parser.add_argument("--num_examples", type=int, default=10, help="Number of examples to generate")
    parser.add_argument("--format_type", default="instruction", choices=["qa", "instruction", "chat", "summary"],
                      help="Format type for the examples")
    parser.add_argument("--output_file", required=True, help="Output file path (will be saved as JSON)")
    parser.add_argument("--temperature", type=float, default=0.7, help="Temperature for generation (0.0 to 1.0)")
    parser.add_argument("--model", default="gpt-4o-mini", help="OpenAI model to use")
    parser.add_argument("--api_key", help="OpenAI API key (optional if set in environment)")
    
    args = parser.parse_args()
    
    try:
        generator = DatasetGenerator(api_key=args.api_key, model_name=args.model)
        examples = generator.generate_examples(
            topic=args.topic,
            num_examples=args.num_examples,
            format_type=args.format_type,
            temperature=args.temperature
        )
        generator.save_dataset(examples, args.output_file)
    except Exception as e:
        logger.error(f"Error: {e}")
        raise

if __name__ == "__main__":
    main()
