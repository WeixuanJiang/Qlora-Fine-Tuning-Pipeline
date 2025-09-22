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

SCRIPT_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

# Load environment variables
ENV_FILE="$SCRIPT_ROOT_DIR/.env"
if [ ! -f "$ENV_FILE" ] && [ -f "$SCRIPT_ROOT_DIR/.env.example" ]; then
    echo "Warning: .env file not found at $ENV_FILE. Using .env.example for defaults."
    ENV_FILE="$SCRIPT_ROOT_DIR/.env.example"
fi

if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs) # DATA_DIR, DATASET_NAME, EVAL_MODEL, EVAL_TEMPERATURE etc. loaded here
fi

DATA_DIR=${DATA_DIR:-data}
DATASET_NAME=${DATASET_NAME:-physics_qa.json}
EVAL_MODEL=${EVAL_MODEL:-gpt-4o}
EVAL_TEMPERATURE=${EVAL_TEMPERATURE:-0.0}

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

# Pre-create log file so downstream tools can append to it if needed
: > "$LOG_FILE"

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

if [ "${PIPELINE_TEST_MODE:-0}" = "1" ]; then
    echo "PIPELINE_TEST_MODE detected; running lightweight local evaluation."
    export PREDICTIONS_FILE REFERENCE_FILE OUTPUT_FILE LOG_FILE
    "$PYTHON_BIN" - <<'PY'
import json
import os
from pathlib import Path

predictions_path = Path(os.environ['PREDICTIONS_FILE'])
reference_path = Path(os.environ['REFERENCE_FILE'])
output_path = Path(os.environ['OUTPUT_FILE'])
log_path = Path(os.environ['LOG_FILE'])

def load_items(path):
    with path.open('r', encoding='utf-8') as handle:
        data = json.load(handle)
    if isinstance(data, dict):
        data = [data]
    return data

predictions = load_items(predictions_path)
references = load_items(reference_path)

paired = zip(predictions, references)
results = []
for idx, (pred, ref) in enumerate(paired, start=1):
    pred_text = pred.get('output', '')
    ref_text = ref.get('output') or ref.get('answer') or ''
    question = pred.get('input') or ref.get('input') or ''
    match = int(pred_text.strip().lower() == ref_text.strip().lower())
    score = 8 + match * 2
    results.append({
        'id': idx,
        'question': question,
        'model_response': pred_text,
        'reference_answer': ref_text,
        'relevance_score': score,
        'completeness_score': score,
        'clarity_score': score,
        'factual_accuracy': score,
        'explanation': 'Synthetic evaluation generated in PIPELINE_TEST_MODE.'
    })

summary = {
    'total_samples': len(results),
    'average_relevance': round(sum(r['relevance_score'] for r in results) / max(len(results), 1), 2),
    'average_completeness': round(sum(r['completeness_score'] for r in results) / max(len(results), 1), 2),
    'average_clarity': round(sum(r['clarity_score'] for r in results) / max(len(results), 1), 2),
    'average_factual_accuracy': round(sum(r['factual_accuracy'] for r in results) / max(len(results), 1), 2)
}

output_path.write_text(json.dumps({
    'summary': summary,
    'results': results
}, indent=2), encoding='utf-8')

log_path.write_text('Synthetic evaluation completed successfully.\n', encoding='utf-8')

print(f"Evaluation results written to {output_path}")
PY
    echo "Evaluation completed successfully (test mode)."
    echo "Results directory: $EVAL_RUN_DIR"
    echo "Results file: $OUTPUT_FILE"
    echo "Logs: $LOG_FILE"
    exit 0
fi

"$PYTHON_BIN" "$SCRIPT_ROOT_DIR/eval.py" \
    --predictions="$PREDICTIONS_FILE" \
    --reference="$REFERENCE_FILE" \
    --output="$OUTPUT_FILE" \
    --model="$EVAL_MODEL"

echo ""
echo "Evaluation completed successfully!"
echo ""
echo "Results directory: $EVAL_RUN_DIR"
echo "Results file: $OUTPUT_FILE"
echo "Logs: $LOG_FILE"
echo ""
# pause equivalent in bash: read -p "Press any key to continue..."
