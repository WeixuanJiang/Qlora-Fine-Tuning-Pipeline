# QLoRA Fine-tuning Pipeline 

A comprehensive pipeline for fine-tuning language models using QLoRA (Quantized Low-Rank Adaptation) techniques. This project provides tools for dataset preparation, model training, adapter merging, and inference through a Streamlit interface.

## Usage

### 1. Data Preparation

Place your training data in the `data/` directory. The expected format is JSON:
```json
{
    "input": "Your question or prompt here",
    "output": "Expected model response"
}
```

### 2. Training

Run the training script:
```bash
cd scripts
run_training.bat
```

Training progress and metrics will be logged to Weights & Biases.

### 3. Merging Adapters

After training, merge the most recent adapter (or pass a path/override when needed):
```bash
cd scripts
./run_merge_lora.sh            # merges most recent adapter
# ./run_merge_lora.sh path/to/adapter  # merge specific adapter
```

### 4. Chat Interface

Launch the Streamlit chat interface:
```bash
cd streamlit_app
streamlit run app.py
```

### 5. Web UI (React) & Docker Compose

A full control center is available via a React frontend (parameter-rich forms for training, generation, evaluation, and merging) backed by a FastAPI API. Bring the stack up with Docker Compose:

```bash
docker compose up --build
```

Services launched:

- **Backend** (FastAPI) on `http://localhost:8000`
- **Frontend** (React) on `http://localhost:3000`

Both containers mount the repository so outputs appear on the host. Provide required environment variables (e.g. `OPENAI_API_KEY`, huggingface credentials) in `.env` before starting the stack. Use the “Jobs” view in the UI to monitor long-running operations.

## Training Monitoring

Monitor training progress through Weights & Biases:
- Model checkpoints
- Training metrics
- System resource usage
- Hyperparameter configurations

## Advanced Configuration

### adapters.json
Configure multiple adapters for merging:
```json
{
    "base_model": "Qwen/Qwen2.5-0.5B-Instruct",
    "adapters": [
        {
            "name": "adapter_name",
            "path": "path/to/adapter",
            "description": "Description",
            "training_date": "YYYY-MM-DD"
        }
    ]
}
```

## Project Components

### Training Script
- Implements QLoRA fine-tuning
- Handles data loading and preprocessing
- Manages checkpointing and logging

### Merge Script
- Merges multiple LoRA adapters
- Supports weighted merging
- Validates adapter compatibility

### Streamlit App
- Interactive chat interface
- Configurable generation parameters
- Real-time response streaming

## Performance Optimization

- **Memory Usage**: Uses 4-bit quantization to reduce memory footprint
- **Training Speed**: Implements gradient accumulation for larger effective batch sizes
- **Inference**: Optimized for streaming responses in the chat interface

## Qwen LoRA Fine-Tuning Pipeline

A comprehensive machine learning pipeline for fine-tuning and evaluating Qwen language models using QLoRA (Quantized Low-Rank Adaptation) and advanced evaluation techniques.

## Features

- QLoRA fine-tuning for Qwen/Qwen2.5-0.5B-Instruct model
- GPT-4 based evaluation system
- Comprehensive metrics tracking
- Batch processing support
- Detailed logging and analysis

## Project Structure

```
qlora_pipeline/
├── .env                   # Configuration settings
├── data/                  # Training and evaluation datasets
│   └── physics_qa.json
├── predictions/           # Model predictions
│   └── predictions.json
├── evaluation/           # Evaluation results
│   └── run_[TIMESTAMP]/
│       ├── metadata.json
│       ├── results/
│       └── logs/
└── scripts/
    └── run_eval.bat      # Evaluation script
```

## Getting Started

### Prerequisites

- Python 3.8+
- CUDA-compatible GPU (recommended)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd qlora_pipeline
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables in `.env`:
```env
EVAL_MODEL=gpt-4o
EVAL_TEMPERATURE=0.0
EVAL_MAX_TOKENS=1000
EVAL_BATCH_SIZE=1
PREDICTIONS_DIR=predictions
EVALUATION_DIR=evaluation
```

## Evaluation System

The evaluation system uses GPT-4 to assess model outputs across multiple dimensions:

- Relevance Score (0-10)
- Completeness Score (0-10)
- Clarity Score (0-10)
- Factual Accuracy Score (0-10)

### Running Evaluations

```bash
scripts/run_eval.bat
```

Results will be saved in `evaluation/run_[TIMESTAMP]/` with:
- Detailed metrics for each response
- Aggregate scores
- Full evaluation logs

## Evaluation Metrics

The system evaluates responses based on:

1. **Relevance**: How well the response addresses the question
2. **Completeness**: Coverage of all aspects of the question
3. **Clarity**: Structure and readability of the response
4. **Factual Accuracy**: Correctness of information provided

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| EVAL_MODEL | Model for evaluation | gpt-4o |
| EVAL_TEMPERATURE | Temperature for evaluation | 0.0 |
| EVAL_MAX_TOKENS | Maximum tokens for evaluation | 1000 |
| EVAL_BATCH_SIZE | Batch size for processing | 1 |

## Data Format

### Input Format
```json
{
    "input": "question text",
    "output": "reference answer"
}
```

### Prediction Format
```json
{
    "output": "model generated response"
}
```
