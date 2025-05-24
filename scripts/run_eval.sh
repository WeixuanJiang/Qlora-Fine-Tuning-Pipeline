#!/bin/bash
set -e

# Load environment variables
ENV_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../.env"
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

# Set Python path if needed
export PYTHONPATH="$PYTHONPATH:$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

# Define ROOT_DIR
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

# Get current date and time for unique folder name
TIMESTAMP=$(date +"%Y-%m-%d_%H%M")

# Set evaluation run directory
EVAL_RUN_DIR="$ROOT_DIR/evaluation/run_$TIMESTAMP"
RESULTS_DIR="$EVAL_RUN_DIR/results"
LOGS_DIR="$EVAL_RUN_DIR/logs" # Corrected from LOGS_DIR to LOG_DIR to match .bat script, though LOGS_DIR is more conventional

# Create directory structure
mkdir -p "$EVAL_RUN_DIR"
mkdir -p "$RESULTS_DIR"
mkdir -p "$LOGS_DIR"

# Set file paths
PREDICTIONS_FILE="$ROOT_DIR/predictions/predictions.json"
REFERENCE_FILE="$ROOT_DIR/$DATA_DIR/$DATASET_NAME"
OUTPUT_FILE="$RESULTS_DIR/evaluation_results.json"
LOG_FILE="$LOGS_DIR/evaluation.log" # Corrected from LOG_DIR

# Create metadata file
cat << EOF > "$EVAL_RUN_DIR/metadata.json"
{
    "evaluation_timestamp": "$TIMESTAMP",
    "model": "$EVAL_MODEL",
    "dataset": "$DATASET_NAME",
    "temperature": "$EVAL_TEMPERATURE",
    "predictions_file": "$PREDICTIONS_FILE"
}
EOF

# Run evaluation
echo "Starting evaluation..."
echo "Evaluation run directory: $EVAL_RUN_DIR"
echo "Using predictions from: $PREDICTIONS_FILE"
echo ""

python "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../eval.py" \
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
echo "Logs: $LOG_FILE" # Corrected from LOG_DIR
echo ""
# pause equivalent in bash: read -p "Press any key to continue..."
