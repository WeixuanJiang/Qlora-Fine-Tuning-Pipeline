import os
import json
import logging
from typing import List, Dict, Optional
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

# Get environment variables
EVAL_MODEL = os.getenv('EVAL_MODEL', 'gpt-4o')
EVAL_TEMPERATURE = float(os.getenv('EVAL_TEMPERATURE', '0.0'))
EVAL_MAX_TOKENS = int(os.getenv('EVAL_MAX_TOKENS', '1000'))
ROOT_DIR = os.getenv('ROOT_DIR', '.')
PREDICTIONS_DIR = os.path.join(ROOT_DIR, os.getenv('PREDICTIONS_DIR', 'predictions'))
EVALUATION_DIR = os.path.join(ROOT_DIR, os.getenv('EVALUATION_DIR', 'evaluation'))

# Create directories if they don't exist
os.makedirs(PREDICTIONS_DIR, exist_ok=True)
os.makedirs(EVALUATION_DIR, exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(EVALUATION_DIR, 'evaluation.log')),
        logging.StreamHandler()
    ]
)

class EvaluationMetrics(BaseModel):
    """Schema for evaluation metrics"""
    relevance_score: float = Field(
        description="Score from 0-10 indicating how relevant and accurate the response is to the question"
    )
    completeness_score: float = Field(
        description="Score from 0-10 indicating how complete the response is"
    )
    clarity_score: float = Field(
        description="Score from 0-10 indicating how clear and well-structured the response is"
    )
    factual_accuracy: float = Field(
        description="Score from 0-10 indicating the factual accuracy of the response"
    )
    explanation: str = Field(
        description="Detailed explanation of the scores and suggestions for improvement"
    )

    def to_dict(self) -> Dict:
        """Convert the model to a dictionary"""
        return {
            "relevance_score": self.relevance_score,
            "completeness_score": self.completeness_score,
            "clarity_score": self.clarity_score,
            "factual_accuracy": self.factual_accuracy,
            "explanation": self.explanation
        }

class ModelEvaluator:
    def __init__(self, model_name: str = EVAL_MODEL, temperature: float = EVAL_TEMPERATURE):
        """Initialize the evaluator with GPT-4o"""
        self.evaluator = ChatOpenAI(
            model=model_name,
            temperature=temperature,
            max_tokens=EVAL_MAX_TOKENS
        )
        self.parser = JsonOutputParser(pydantic_object=EvaluationMetrics)
        
        # Create evaluation prompt
        system_message = """You are an expert evaluator for language model responses. 
Your task is to evaluate the quality of model-generated responses by comparing them 
with reference answers. Provide detailed, objective evaluations focusing on:

1. Relevance and accuracy of the response
2. Completeness of the answer
3. Clarity and structure
4. Factual accuracy

Provide scores on a scale of 0-10 and detailed explanations.

Your response must be a valid JSON object with this exact structure:
{{
    "relevance_score": <score between 0-10>,
    "completeness_score": <score between 0-10>,
    "clarity_score": <score between 0-10>,
    "factual_accuracy": <score between 0-10>,
    "explanation": "<your detailed explanation>"
}}"""

        human_message = """Please evaluate the following:

Question: {question}
Reference Answer: {reference}
Model Response: {response}

Provide a detailed evaluation following the specified metrics."""

        self.eval_prompt = ChatPromptTemplate.from_messages([
            ("system", system_message),
            ("human", human_message)
        ])

    def evaluate_single_response(
        self,
        question: str,
        reference: str,
        response: str
    ) -> EvaluationMetrics:
        """Evaluate a single model response"""
        try:
            # Create evaluation chain
            chain = self.eval_prompt | self.evaluator | self.parser
            
            # Run evaluation
            result = chain.invoke({
                "question": question,
                "reference": reference,
                "response": response
            })
            
            # Convert dictionary to EvaluationMetrics object
            if isinstance(result, dict):
                result = EvaluationMetrics(**result)
            elif not isinstance(result, EvaluationMetrics):
                logging.error(f"Unexpected evaluation result type: {type(result)}")
                raise ValueError("Invalid evaluation result format")
            
            return result
        except Exception as e:
            logging.error(f"Error evaluating response: {str(e)}")
            raise

    def evaluate_dataset(
        self,
        predictions_file: str,
        reference_file: str,
        output_file: Optional[str] = None
    ) -> Dict:
        """Evaluate predictions against a reference dataset"""
        try:
            # Load predictions and reference data
            with open(predictions_file, 'r', encoding='utf-8') as f:
                predictions = json.load(f)
            
            with open(reference_file, 'r', encoding='utf-8') as f:
                reference_data = json.load(f)
            
            # Initialize results
            results = {
                "metadata": {
                    "evaluation_date": datetime.now().isoformat(),
                    "predictions_file": predictions_file,
                    "reference_file": reference_file,
                    "model": EVAL_MODEL
                },
                "evaluations": [],
                "aggregate_metrics": {
                    "avg_relevance": 0.0,
                    "avg_completeness": 0.0,
                    "avg_clarity": 0.0,
                    "avg_factual_accuracy": 0.0
                }
            }
            
            # Evaluate each prediction
            total_samples = len(predictions)
            for i, (pred, ref) in enumerate(zip(predictions, reference_data)):
                logging.info(f"Evaluating sample {i+1}/{total_samples}")
                
                # Get the response text (handle both 'generated_text' and 'output' formats)
                response_text = pred.get('generated_text', pred.get('output', ''))
                if not response_text:
                    logging.warning(f"No response text found in prediction {i+1}")
                    continue
                
                try:
                    evaluation = self.evaluate_single_response(
                        question=ref["input"],
                        reference=ref["output"],
                        response=response_text
                    )
                    
                    metrics_dict = evaluation.to_dict()
                    results["evaluations"].append({
                        "sample_id": i,
                        "question": ref["input"],
                        "reference": ref["output"],
                        "prediction": response_text,
                        "metrics": metrics_dict
                    })
                    
                    # Update aggregate metrics
                    results["aggregate_metrics"]["avg_relevance"] += metrics_dict["relevance_score"]
                    results["aggregate_metrics"]["avg_completeness"] += metrics_dict["completeness_score"]
                    results["aggregate_metrics"]["avg_clarity"] += metrics_dict["clarity_score"]
                    results["aggregate_metrics"]["avg_factual_accuracy"] += metrics_dict["factual_accuracy"]
                except Exception as e:
                    logging.error(f"Error evaluating sample {i+1}: {str(e)}")
                    continue
            
            # Calculate averages
            num_evaluated = len(results["evaluations"])
            if num_evaluated > 0:
                for metric in results["aggregate_metrics"]:
                    results["aggregate_metrics"][metric] /= num_evaluated
            
            # Save results if output file is specified
            if output_file:
                output_path = Path(output_file)
                output_path.parent.mkdir(parents=True, exist_ok=True)
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(results, f, indent=4, ensure_ascii=False)
            
            return results
        
        except Exception as e:
            logging.error(f"Error in dataset evaluation: {str(e)}")
            raise

def main():
    """Main function to run evaluation"""
    import argparse
    parser = argparse.ArgumentParser(description='Evaluate model predictions using GPT-4o')
    parser.add_argument('--predictions', type=str, required=True,
                      help='Path to predictions JSON file')
    parser.add_argument('--reference', type=str, required=True,
                      help='Path to reference dataset JSON file')
    parser.add_argument('--output', type=str, default=None,
                      help='Path to save evaluation results')
    parser.add_argument('--model', type=str, default=EVAL_MODEL,
                      help=f'GPT model to use for evaluation (default: {EVAL_MODEL})')
    
    args = parser.parse_args()
    
    # Initialize evaluator
    evaluator = ModelEvaluator(model_name=args.model)
    
    # Run evaluation
    logging.info(f"Starting evaluation using model: {args.model}")
    results = evaluator.evaluate_dataset(
        predictions_file=args.predictions,
        reference_file=args.reference,
        output_file=args.output
    )
    
    # Print summary
    logging.info("\nEvaluation Summary:")
    logging.info(f"Total samples evaluated: {len(results['evaluations'])}")
    logging.info("\nAggregate Metrics:")
    for metric, value in results["aggregate_metrics"].items():
        logging.info(f"{metric}: {value:.2f}")

if __name__ == "__main__":
    main()
