#!/bin/bash
set -e

# Load environment variables
ENV_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Set Python path if needed
export PYTHONPATH="$PYTHONPATH:$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

# Get current date and time for unique folder name
TIMESTAMP=$(date +"%Y-%m-%d_%H%M")

# Set paths using environment variables
DATASET_PATH="$ROOT_DIR/$DATA_DIR/$DATASET_NAME"
OUTPUT_DIR="$ROOT_DIR/$MODEL_OUTPUT_DIR/run_$TIMESTAMP"

echo "Starting training with:"
echo "Base Model: $BASE_MODEL_NAME"
echo "Dataset: $DATASET_PATH"
echo "Output Directory: $OUTPUT_DIR"

# Run training script
python "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../train.py" \
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
