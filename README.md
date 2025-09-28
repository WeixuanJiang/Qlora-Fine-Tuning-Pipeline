# QLoRA Fine-Tuning Pipeline

End-to-end tooling for fine-tuning, evaluating, and deploying quantized LoRA adapters on Qwen-sized language models.

## Highlights
- 4-bit QLoRA fine-tuning with configurable hyperparameters and automatic adapter registration.
- Dataset synthesis utilities powered by OpenAI, plus offline `PIPELINE_TEST_MODE` for smoke runs.
- Modern React dashboard for launching jobs, tracking progress, and reviewing outputs.
- Lightweight CLI wrappers for data prep, inference, and evaluation when you need terminal access.

## Repository Layout
```
.
├── backend/             # FastAPI service that exposes training & inference endpoints
├── config/              # Adapter metadata and other configuration files
├── data/                # Place raw and processed datasets here (gitignored)
├── docker/              # Dockerfiles used for trainer images
├── frontend/            # Vite + React dashboard for managing jobs
├── models/              # Intermediate fine-tuned checkpoints
├── merged_model/        # Fully merged model artifacts
├── predictions/         # Inference outputs
├── scripts/             # Convenience Bash entry points
├── train.py             # Core QLoRA training script
├── run_inference.py     # CLI for batch or interactive inference
├── eval.py              # OpenAI-assisted evaluation harness
└── dataset_generator.py # Synthetic data generation helper
```

## Prerequisites
- Python 3.10 or newer.
- CUDA-capable GPU with the correct NVIDIA drivers (strongly recommended).
- Optional: Docker + Docker Compose v2 for the backend/frontend stack.
- OpenAI API key if you plan to use dataset generation or GPT-based evaluation.

## Installation
1. Clone the repository and move into it:
   ```bash
   git clone <repo-url>
   cd Qlora-Fine-Tuning-Pipeline
   ```
2. (Recommended) Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\\Scripts\\activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Update the values in `.env` to match your hardware, dataset paths, Hugging Face cache, and API keys.

## Frontend Dashboard
Launch the React dashboard to orchestrate training, merging, inference, and evaluation jobs through the FastAPI backend.

```bash
cd frontend
npm install
npm run dev
```

By default the UI proxies requests to `http://localhost:8000`. Point it elsewhere by setting `VITE_API_URL` in your shell or via a `.env` file inside `frontend/`. The main views cover:
- **Train** – configure datasets, adapters, hyperparameters, and kick off jobs.
- **Jobs** – monitor active runs, inspect logs, and download artifacts.
- **Generate / Evaluate / Merge / Settings** – manage inference, GPT-based evaluations, adapter merges, and environment credentials.

Build optimized assets for deployment with `npm run build` (served from `frontend/dist/`).

## Data Preparation
- Drop existing JSON datasets into `data/`. Expected schema:
  ```json
  {
    "input": "Prompt or question",
    "output": "Reference response"
  }
  ```
- To synthesize examples with OpenAI:
  ```bash
  ./scripts/run_dataset_generator.sh "topic" 50 instruction
  ```
  Outputs land in `data/` by default. Requires `OPENAI_API_KEY`.

## Inference (CLI)
- Interactive or single prompt:
  ```bash
  ./scripts/run_inference.sh "Who discovered gravity?"
  ```
- Batch mode (reads from `data/<dataset>.json`, writes to `predictions/predictions.json`):
  ```bash
  ./scripts/run_inference.sh
  ```
Override `MODEL_PATH`, `INPUT_FILE`, `OUTPUT_FILE`, or decoding params through environment variables. Set `PIPELINE_TEST_MODE=1` to produce synthetic responses without accessing GPUs or hosted models.

## Evaluation (CLI)
```bash
./scripts/run_eval.sh
```
This compares `predictions/predictions.json` against the ground-truth dataset and writes results to `evaluation/run_<timestamp>/`. Requires `OPENAI_API_KEY`; use `PIPELINE_TEST_MODE=1` for offline scoring stubs.

## Docker Compose Stack
Bring up the FastAPI backend and React control center (plus the optional trainer profile):
```bash
docker compose up --build
```
- Backend: `http://localhost:8000`
- Frontend dashboard: `http://localhost:3000`
- Named volumes share Hugging Face caches, datasets, and outputs with the host.
All containers load settings from `.env`; set `CUDA_VISIBLE_DEVICES` or `CUDA_VISIBLE_DEVICES_COUNT` to scope GPU usage. Enable the `train` profile when you need the dedicated trainer service for long-running jobs triggered from the dashboard.

## Helpful Environment Flags
- `PIPELINE_TEST_MODE=1` – emit synthetic artifacts so you can validate the workflow without GPU or API usage.
- `CUDA_VISIBLE_DEVICES=0` – limit operations to a specific GPU.
- `MODEL_CACHE_DIR` – point to a persistent path to avoid repeated downloads.
- `REGISTER_ADAPTER=false` – skip adapter bookkeeping when experimenting.

## Troubleshooting
- Paths inside `.env` can be absolute or relative to the project root; Windows-style drive prefixes are normalized automatically.
- Ensure Hugging Face tokens are configured if you are pulling private base models.
- When using OpenAI-powered features behind a proxy or custom endpoint, set `OPENAI_API_BASE` accordingly.
- Logs from the latest runs are stored alongside the generated artifacts (`models/`, `predictions/`, `evaluation/`).

Happy fine-tuning!
