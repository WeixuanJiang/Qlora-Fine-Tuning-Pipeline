#!/bin/bash
set -e

if [ -z "$PYTHON_BIN" ]; then
    if command -v python >/dev/null 2>&1; then
        PYTHON_BIN=$(command -v python)
    elif command -v python3 >/dev/null 2>&1; then
        PYTHON_BIN=$(command -v python3)
    else
        echo "Error: Python interpreter not found in PATH."
        exit 1
    fi
fi

PROJECT_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
SCRIPT_ROOT_DIR="$PROJECT_ROOT_DIR"

# Load environment variables
ENV_FILE="$SCRIPT_ROOT_DIR/.env"
if [ ! -f "$ENV_FILE" ] && [ -f "$SCRIPT_ROOT_DIR/.env.example" ]; then
    echo "Warning: .env file not found at $ENV_FILE. Using .env.example for defaults."
    ENV_FILE="$SCRIPT_ROOT_DIR/.env.example"
fi

if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs) # DATA_DIR, DATASET_NAME, MODEL_OUTPUT_DIR, etc. loaded here
fi

DATA_DIR=${DATA_DIR:-data}
DATASET_NAME=${DATASET_NAME:-physics_qa.json}
MODEL_OUTPUT_DIR=${MODEL_OUTPUT_DIR:-model_output}
BASE_MODEL_NAME=${BASE_MODEL_NAME:-Qwen/Qwen2.5-0.5B-Instruct}
INPUT_COLUMN=${INPUT_COLUMN:-input}
TARGET_COLUMN=${TARGET_COLUMN:-output}
MAX_SAMPLES=${MAX_SAMPLES:-1000}
MAX_LENGTH=${MAX_LENGTH:-2048}
NUM_TRAIN_EPOCHS=${NUM_TRAIN_EPOCHS:-1}
PER_DEVICE_TRAIN_BATCH_SIZE=${PER_DEVICE_TRAIN_BATCH_SIZE:-1}
GRADIENT_ACCUMULATION_STEPS=${GRADIENT_ACCUMULATION_STEPS:-1}
LEARNING_RATE=${LEARNING_RATE:-0.0002}
WEIGHT_DECAY=${WEIGHT_DECAY:-0.0}
WARMUP_RATIO=${WARMUP_RATIO:-0.0}
LORA_R=${LORA_R:-8}
LORA_ALPHA=${LORA_ALPHA:-32}
LORA_DROPOUT=${LORA_DROPOUT:-0.1}
SEED=${SEED:-42}
LOGGING_STEPS=${LOGGING_STEPS:-10}
SAVE_STEPS=${SAVE_STEPS:-50}
SAVE_TOTAL_LIMIT=${SAVE_TOTAL_LIMIT:-1}
BITS=${BITS:-4}
DOUBLE_QUANT=${DOUBLE_QUANT:-true}
QUANT_TYPE=${QUANT_TYPE:-nf4}
PROMPT_TEMPLATE_TYPE=${PROMPT_TEMPLATE_TYPE:-qwen}
MODEL_CACHE_DIR=${MODEL_CACHE_DIR:-}
REGISTER_ADAPTER=${REGISTER_ADAPTER:-true}
ADAPTER_NAME=${ADAPTER_NAME:-${DATASET_NAME%.*}}
ADAPTER_DESCRIPTION=${ADAPTER_DESCRIPTION:-}
ADAPTER_CONFIG_PATH=${ADAPTER_CONFIG_PATH:-config/adapters.json}

if [[ -n "$ADAPTER_CONFIG_PATH" && "$ADAPTER_CONFIG_PATH" != /* ]]; then
    ADAPTER_CONFIG_PATH="$PROJECT_ROOT_DIR/$ADAPTER_CONFIG_PATH"
fi

# Set Python path if needed
export PYTHONPATH="$PYTHONPATH:$SCRIPT_ROOT_DIR"

# Get current date and time for unique folder name
TIMESTAMP=$(date +"%Y-%m-%d_%H%M")

# Set paths using SCRIPT_ROOT_DIR and environment variables from .env
# DATA_DIR, DATASET_NAME, MODEL_OUTPUT_DIR are from .env
ABS_DATA_DIR_PATH="$SCRIPT_ROOT_DIR/$DATA_DIR" 
DATASET_PATH="$ABS_DATA_DIR_PATH/$DATASET_NAME"

ABS_MODEL_OUTPUT_DIR="$SCRIPT_ROOT_DIR/$MODEL_OUTPUT_DIR"
OUTPUT_DIR="$ABS_MODEL_OUTPUT_DIR/run_$TIMESTAMP"

# Create the output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "Starting training with:"
echo "Base Model: $BASE_MODEL_NAME" # From .env
echo "Dataset: $DATASET_PATH"       # Now an absolute path
echo "Output Directory: $OUTPUT_DIR" # Now an absolute path

if [ "${PIPELINE_TEST_MODE:-0}" = "1" ]; then
    echo "PIPELINE_TEST_MODE detected; creating synthetic training artifacts."
    export OUTPUT_DIR BASE_MODEL_NAME DATASET_PATH
    "$PYTHON_BIN" - <<'PY'
import json
import os
from pathlib import Path

output_dir = Path(os.environ['OUTPUT_DIR'])
output_dir.mkdir(parents=True, exist_ok=True)

summary = {
    'status': 'completed',
    'mode': 'PIPELINE_TEST_MODE',
    'base_model': os.environ.get('BASE_MODEL_NAME'),
    'dataset': os.environ.get('DATASET_PATH'),
}

(output_dir / 'training_summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
(output_dir / 'checkpoint.pt').write_text('synthetic checkpoint placeholder', encoding='utf-8')

print(f"Synthetic training artifacts written to {output_dir}")
PY
    echo "Training completed successfully (test mode)."
    exit 0
fi

# Run training script
CMD=(
    "$PYTHON_BIN" "$SCRIPT_ROOT_DIR/train.py"
    --model_name "$BASE_MODEL_NAME"
    --dataset_path "$DATASET_PATH"
    --output_dir "$OUTPUT_DIR"
    --input_column "$INPUT_COLUMN"
    --target_column "$TARGET_COLUMN"
    --max_samples "$MAX_SAMPLES"
    --max_length "$MAX_LENGTH"
    --num_train_epochs "$NUM_TRAIN_EPOCHS"
    --per_device_train_batch_size "$PER_DEVICE_TRAIN_BATCH_SIZE"
    --gradient_accumulation_steps "$GRADIENT_ACCUMULATION_STEPS"
    --learning_rate "$LEARNING_RATE"
    --weight_decay "$WEIGHT_DECAY"
    --warmup_ratio "$WARMUP_RATIO"
    --lora_r "$LORA_R"
    --lora_alpha "$LORA_ALPHA"
    --lora_dropout "$LORA_DROPOUT"
    --seed "$SEED"
    --logging_steps "$LOGGING_STEPS"
    --save_steps "$SAVE_STEPS"
    --save_total_limit "$SAVE_TOTAL_LIMIT"
    --bits "$BITS"
    --double_quant "$DOUBLE_QUANT"
    --quant_type "$QUANT_TYPE"
    --prompt_template_type "$PROMPT_TEMPLATE_TYPE"
    --trust_remote_code true
)

CMD+=( --register_adapter "$REGISTER_ADAPTER" )

if [ -n "$ADAPTER_NAME" ]; then
    CMD+=( --adapter_name "$ADAPTER_NAME" )
fi

if [ -n "$ADAPTER_DESCRIPTION" ]; then
    CMD+=( --adapter_description "$ADAPTER_DESCRIPTION" )
fi

if [ -n "$ADAPTER_CONFIG_PATH" ]; then
    CMD+=( --adapter_config_path "$ADAPTER_CONFIG_PATH" )
fi

if [ -n "$MODEL_CACHE_DIR" ]; then
    CMD+=(--model_cache_dir "$MODEL_CACHE_DIR")
fi

"${CMD[@]}"

echo "Training completed successfully!"
# read -p "Press any key to continue..." # Pause equivalent
