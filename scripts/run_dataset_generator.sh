#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
ENV_FILE="$ROOT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

export $(grep -v '^#' "$ENV_FILE" | xargs) # DATA_DIR is loaded here

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
ABS_DATA_DIR="$ROOT_DIR/$DATA_DIR" 

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

# Run the Python script with absolute paths
python "$ROOT_DIR/dataset_generator.py" \
    --topic "$TOPIC" \
    --num_examples "$NUM_EXAMPLES" \
    --format_type "$FORMAT_TYPE" \
    --output_file "$OUTPUT_FILE" \
    --temperature "$TEMPERATURE" \
    --model "$MODEL" \
    --api_key "$OPENAI_API_KEY"

if [ $? -ne 0 ]; then
    echo "Error in dataset generation"
    exit 1
fi

echo "Dataset generation completed successfully"
