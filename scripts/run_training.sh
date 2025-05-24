#!/bin/bash
set -e

SCRIPT_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

# Load environment variables
ENV_FILE="$SCRIPT_ROOT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs) # DATA_DIR, DATASET_NAME, MODEL_OUTPUT_DIR, etc. loaded here
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

# Run training script
python "$SCRIPT_ROOT_DIR/train.py" \
    --model_name "$BASE_MODEL_NAME" \
    --dataset_path "$DATASET_PATH" \
    --output_dir "$OUTPUT_DIR" \
    --input_column "$INPUT_COLUMN" \
    --target_column "$TARGET_COLUMN" \
    --max_samples "$MAX_SAMPLES" \
    --max_length "$MAX_LENGTH" \
    --num_train_epochs "$NUM_TRAIN_EPOCHS" \
    --per_device_train_batch_size "$PER_DEVICE_TRAIN_BATCH_SIZE" \
    --gradient_accumulation_steps "$GRADIENT_ACCUMULATION_STEPS" \
    --learning_rate "$LEARNING_RATE" \
    --weight_decay "$WEIGHT_DECAY" \
    --warmup_ratio "$WARMUP_RATIO" \
    --lora_r "$LORA_R" \
    --lora_alpha "$LORA_ALPHA" \
    --lora_dropout "$LORA_DROPOUT" \
    --seed "$SEED" \
    --logging_steps "$LOGGING_STEPS" \
    --save_steps "$SAVE_STEPS" \
    --save_total_limit "$SAVE_TOTAL_LIMIT" \
    --bits "$BITS" \
    --double_quant "$DOUBLE_QUANT" \
    --quant_type "$QUANT_TYPE" \
    --prompt_template_type "$PROMPT_TEMPLATE_TYPE" \
    --wandb_project "$WANDB_PROJECT" \
    --trust_remote_code true \
    --report_to wandb

if [ $? -ne 0 ]; then
    echo "Training failed with error code $?"
    # read -p "Press any key to continue..." # Pause equivalent
    exit $?
fi

echo "Training completed successfully!"
# read -p "Press any key to continue..." # Pause equivalent
