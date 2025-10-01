# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

QLoRA Fine-Tuning Pipeline for quantized LoRA adapter training on language models. Three-tier architecture:
- **Backend**: FastAPI service (`backend/main.py`) exposing training, inference, evaluation, and adapter management endpoints
- **Frontend**: React/Vite dashboard (`frontend/`) for job orchestration and monitoring
- **CLI scripts**: Bash wrappers in `scripts/` for standalone operations

## Essential Commands

### Backend Development
```bash
# From Qlora-Fine-Tuning-Pipeline/
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd Qlora-Fine-Tuning-Pipeline/frontend
npm install
npm run dev          # Dev server at http://localhost:3000
npm run build        # Production build to dist/
```

### Docker Stack
```bash
cd Qlora-Fine-Tuning-Pipeline/
docker compose up --build                      # Backend + Frontend
docker compose --profile train up --build      # Include trainer service
```
Containers:
- Backend: port 8000
- Frontend: port 3000
- Trainer: activated only with `--profile train`

### Training
```bash
# CLI
./scripts/run_training.sh

# Programmatically (from backend or scripts)
python train.py --dataset_path data/physics_qa.json \
                --output_dir models/my_adapter \
                --adapter_name my_adapter
```

### Inference
```bash
# Interactive mode
./scripts/run_inference.sh "Your prompt here"

# Batch mode (reads data/DATASET_NAME.json, writes to predictions/predictions.json)
./scripts/run_inference.sh
```

### Evaluation
```bash
# Requires predictions/predictions.json and OPENAI_API_KEY
./scripts/run_eval.sh
# Results in evaluation/run_<timestamp>/
```

### Dataset Generation
```bash
./scripts/run_dataset_generator.sh "physics" 50 instruction
# Outputs to data/
```

### Adapter Merging
```bash
./scripts/run_merge_lora.sh
```

## Architecture

### Path Normalization
Both `train.py` and `backend/main.py` normalize Windows paths (`C:\...`) to WSL format (`/mnt/c/...`) via `WINDOWS_DRIVE_PATTERN` regex. All paths in `.env` can be absolute or relative to project root.

### Adapter Registry
`config/adapters.json` tracks trained adapters. Set `REGISTER_ADAPTER=true` in `.env` to auto-register after training. Backend loads this registry for UI display and inference model selection.

### Dataset Format
Expected JSON structure in `data/`:
```json
{
  "input": "Prompt or question",
  "output": "Reference response"
}
```
Or top-level `{"data": [...]}`

Processed by `prepare_dataset.py` → `load_json_dataset()` → HuggingFace `Dataset` → prompt formatting via `format_prompt()`

### Training Pipeline (`train.py`)
1. Load base model with 4-bit quantization (`BitsAndBytesConfig`)
2. Apply LoRA via PEFT (`LoraConfig`, `get_peft_model`)
3. Prepare dataset with prompt template (Qwen format by default)
4. Train with HuggingFace `Trainer`
5. Save adapter to `models/<adapter_name>/`
6. Optional: register in `config/adapters.json`

Key classes:
- `TrainingLogger`: Dual file + console logging
- `DataCollatorForCausalLM`: Batching with label masking for prompts
- `ComputeMetrics`: Perplexity calculation

### FastAPI Backend (`backend/main.py`)
Core endpoints:
- `POST /train`: Async training job launcher (runs in background thread)
- `POST /generate`: Inference with loaded or merged models
- `POST /evaluate`: OpenAI-based evaluation of predictions vs ground truth
- `POST /merge`: Merge multiple LoRA adapters
- `GET /jobs/{job_id}/status`: Poll training progress
- `GET /adapters`: List registered adapters from config

Background job tracking via in-memory `jobs_store` dict. Logs streamed to `{output_dir}/training.log` and tailed by status endpoint.

### Frontend (`frontend/src/App.jsx`)
Single-file React app with Chakra UI. Main views:
- **Train**: Form for dataset selection, hyperparameters, and job submission
- **Jobs**: Active job monitoring with log streaming
- **Generate**: Interactive inference UI
- **Evaluate**: GPT-based evaluation runner
- **Merge**: Multi-adapter merging interface
- **Settings**: Environment variable editor

API calls via Axios to backend. Uses `VITE_API_URL` for backend location (defaults to `http://localhost:8000`).

### Test Mode
Set `PIPELINE_TEST_MODE=1` to bypass GPU/API calls:
- Training: generates synthetic adapter files
- Inference: returns placeholder responses
- Evaluation: uses mock scores
- Dataset generation: creates sample data without OpenAI

## Development Workflow

### Adding a New Adapter
1. Prepare dataset in `data/<name>.json`
2. Update `.env` with `DATASET_NAME=<name>.json`
3. Run training via UI or `./scripts/run_training.sh`
4. Adapter saved to `models/<name>/` and registered in `config/adapters.json`

### Testing Changes Locally
```bash
# Terminal 1: Backend
cd Qlora-Fine-Tuning-Pipeline
uvicorn backend.main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Test pipeline
PIPELINE_TEST_MODE=1 ./scripts/run_training.sh
```

### Running Inference with Custom Adapter
```bash
# Set in .env or export:
export MODEL_PATH=models/my_adapter
./scripts/run_inference.sh "Test prompt"
```

## Configuration Reference

Primary settings in `.env` (copy from `.env.example`):
- `BASE_MODEL_NAME`: HuggingFace model ID (e.g., `Qwen/Qwen2.5-0.5B-Instruct`)
- `MODEL_CACHE_DIR`: Persistent cache to avoid re-downloads
- `LORA_TARGET_MODULES`: List of linear layers to adapt (JSON array string)
- `LORA_R`, `LORA_ALPHA`, `LORA_DROPOUT`: LoRA hyperparameters
- `NUM_TRAIN_EPOCHS`, `LEARNING_RATE`, `PER_DEVICE_TRAIN_BATCH_SIZE`: Training config
- `OPENAI_API_KEY`: Required for dataset generation and evaluation
- `CUDA_VISIBLE_DEVICES`: GPU device selection
- `REGISTER_ADAPTER`: Auto-register trained adapters in config

## Key Files

- `train.py`: Core training loop, LoRA setup, dataset preparation
- `backend/main.py`: FastAPI app with training/inference orchestration
- `run_inference.py`: `ModelInference` class for batch/interactive inference
- `eval.py`: `ModelEvaluator` for OpenAI-based scoring
- `merge_multiple_loras.py`: Adapter merging with weighted combination
- `dataset_generator.py`: OpenAI-powered synthetic dataset creation
- `prepare_dataset.py`: Dataset loading and prompt formatting utilities
- `config/adapters.json`: Adapter registry (auto-updated by training)
- `.env`: All runtime configuration

## Notes

- Docker volumes (`hf_cache`, `datasets`, `outputs`) persist across container restarts
- Backend runs training jobs in background threads; use `/jobs/{job_id}/status` to poll
- Frontend proxies API requests to backend service in Docker (`VITE_API_URL=http://backend:8000`)
- Prompt templates in `prompts/` directory (not heavily used; most formatting in `prepare_dataset.py`)
- Windows paths in `.env` are auto-converted to WSL `/mnt/` format by both backend and training scripts