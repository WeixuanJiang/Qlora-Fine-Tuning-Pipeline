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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."
ENV_FILE="$PROJECT_ROOT/.env"

if [ ! -f "$ENV_FILE" ]; then
    if [ -f "$PROJECT_ROOT/.env.example" ]; then
        echo "Warning: .env file not found at $ENV_FILE. Using .env.example for defaults."
        ENV_FILE="$PROJECT_ROOT/.env.example"
    else
        echo "Error: .env file not found at $ENV_FILE and no .env.example fallback available."
        exit 1
    fi
fi

if [ -s "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs) # DATA_DIR is loaded here
fi

DATA_DIR=${DATA_DIR:-data}
MODEL_GEN=${MODEL_GEN:-gpt-4o}
EVAL_TEMPERATURE=${EVAL_TEMPERATURE:-0.1}

# Set default values for parameters (using .env variables where available)
TOPIC="${1:-machine learning}"
NUM_EXAMPLES="${2:-10}"
FORMAT_TYPE="${3:-instruction}"
TEMPERATURE="${5:-$EVAL_TEMPERATURE}"
if [ -z "$TEMPERATURE" ]; then
    TEMPERATURE=0.1
fi
MODEL="${6:-$MODEL_GEN}"
if [ -z "$MODEL" ]; then
    MODEL=gpt-4o
fi

# Define absolute path for DATA_DIR
ABS_DATA_DIR="$PROJECT_ROOT/$DATA_DIR" 

# Create filename from topic and number of examples (replace spaces with underscores)
TOPIC_CLEAN=$(echo "$TOPIC" | tr ' ' '_')
# Default output file using ABS_DATA_DIR
DEFAULT_OUTPUT_FILE="$ABS_DATA_DIR/${TOPIC_CLEAN}_${NUM_EXAMPLES}_${TEMPERATURE}.json"
OUTPUT_FILE="${4:-$DEFAULT_OUTPUT_FILE}" # Use 4th arg if provided, else default

echo "Generating dataset with the following parameters:"
echo "Topic: $TOPIC"
echo "Number of examples: $NUM_EXAMPLES"
echo "Format type: $FORMAT_TYPE"
echo "Output file: $OUTPUT_FILE" # This will be either custom path or the one in ABS_DATA_DIR
echo "Temperature: $TEMPERATURE"
echo "Model: $MODEL"

# Create output directory if it doesn't exist (use the directory of the final OUTPUT_FILE)
# If OUTPUT_FILE is the default, its directory is ABS_DATA_DIR.
# If OUTPUT_FILE is custom, its directory is dirname "$OUTPUT_FILE".
FINAL_OUTPUT_DIR=$(dirname "$OUTPUT_FILE")
mkdir -p "$FINAL_OUTPUT_DIR"

if [ "${PIPELINE_TEST_MODE:-0}" = "1" ]; then
    echo "PIPELINE_TEST_MODE detected; generating synthetic dataset without external API calls."
    export OUTPUT_FILE TOPIC NUM_EXAMPLES FORMAT_TYPE
    "$PYTHON_BIN" - <<'PY'
import json
import os

output_path = os.environ['OUTPUT_FILE']
topic = os.environ.get('TOPIC', 'sample topic')
format_type = os.environ.get('FORMAT_TYPE', 'instruction')
num_examples = int(float(os.environ.get('NUM_EXAMPLES', '1')))

examples = []
for idx in range(1, num_examples + 1):
    examples.append({
        "input": f"[{format_type}] Example {idx} about {topic}",
        "output": f"This is a placeholder response for {topic} example {idx}."
    })

with open(output_path, 'w', encoding='utf-8') as handle:
    json.dump(examples, handle, indent=2, ensure_ascii=False)

print(f"Wrote {len(examples)} synthetic examples to {output_path}")
PY
    echo "Dataset generation completed successfully (test mode)."
    exit 0
fi

# Run the Python script with absolute paths
"$PYTHON_BIN" "$PROJECT_ROOT/dataset_generator.py" \
    --topic "$TOPIC" \
    --num_examples "$NUM_EXAMPLES" \
    --format_type "$FORMAT_TYPE" \
    --output_file "$OUTPUT_FILE" \
    --temperature "$TEMPERATURE" \
    --model "$MODEL" \
    --api_key "$OPENAI_API_KEY"

echo "Dataset generation completed successfully"
