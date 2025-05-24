#!/bin/bash
set -e

SCRIPT_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

# Load environment variables
ENV_FILE="$SCRIPT_ROOT_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs) # DATA_DIR, DATASET_NAME, EVAL_MODEL, EVAL_TEMPERATURE etc. loaded here
fi

# Set Python path if needed
export PYTHONPATH="$PYTHONPATH:$SCRIPT_ROOT_DIR"

# Get current date and time for unique folder name
TIMESTAMP=$(date +"%Y-%m-%d_%H%M")

# Set evaluation run directory using SCRIPT_ROOT_DIR
EVAL_RUN_DIR_BASE="$SCRIPT_ROOT_DIR/evaluation"
EVAL_RUN_DIR="$EVAL_RUN_DIR_BASE/run_$TIMESTAMP"
RESULTS_DIR="$EVAL_RUN_DIR/results"
LOGS_DIR="$EVAL_RUN_DIR/logs"

# Create directory structure
mkdir -p "$EVAL_RUN_DIR" # This implicitly creates EVAL_RUN_DIR_BASE if it doesn't exist
mkdir -p "$RESULTS_DIR"
mkdir -p "$LOGS_DIR"

# Set file paths using SCRIPT_ROOT_DIR
# DATA_DIR and DATASET_NAME are from .env
ABS_DATA_DIR_PATH="$SCRIPT_ROOT_DIR/$DATA_DIR" # Assuming DATA_DIR from .env is relative to project root

PREDICTIONS_FILE="$SCRIPT_ROOT_DIR/predictions/predictions.json"
REFERENCE_FILE="$ABS_DATA_DIR_PATH/$DATASET_NAME" 
OUTPUT_FILE="$RESULTS_DIR/evaluation_results.json"
LOG_FILE="$LOGS_DIR/evaluation.log"

# Create metadata file
# Ensure paths in metadata are absolute or clearly understood relative to SCRIPT_ROOT_DIR if needed by consumers of this file
# For consistency, let's make paths in metadata.json absolute if they are file paths.
cat << EOF > "$EVAL_RUN_DIR/metadata.json"
{
    "evaluation_timestamp": "$TIMESTAMP",
    "model": "$EVAL_MODEL",
    "dataset": "$DATASET_NAME", 
    "temperature": "$EVAL_TEMPERATURE",
    "predictions_file": "$PREDICTIONS_FILE",
    "reference_file": "$REFERENCE_FILE", 
    "output_file": "$OUTPUT_FILE"
}
EOF

# Run evaluation
echo "Starting evaluation..."
echo "Evaluation run directory: $EVAL_RUN_DIR"
echo "Using predictions from: $PREDICTIONS_FILE"
echo ""

python "$SCRIPT_ROOT_DIR/eval.py" \
    --predictions="$PREDICTIONS_FILE" \
    --reference="$REFERENCE_FILE" \
    --output="$OUTPUT_FILE" \
    --model="$EVAL_MODEL"

if [ $? -ne 0 ]; then
    echo "Evaluation failed with error code $?"
    echo "Check logs at: $LOG_FILE"
    # pause equivalent in bash: read -p "Press any key to continue..."
    exit $?
fi

echo ""
echo "Evaluation completed successfully!"
echo ""
echo "Results directory: $EVAL_RUN_DIR"
echo "Results file: $OUTPUT_FILE"
echo "Logs: $LOG_FILE"
echo ""
# pause equivalent in bash: read -p "Press any key to continue..."
