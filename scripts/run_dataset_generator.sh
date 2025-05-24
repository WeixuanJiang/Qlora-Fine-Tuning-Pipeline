#!/bin/bash
set -e

# Load environment variables from .env (using absolute path)
ENV_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: .env file not found at $ENV_FILE"
    exit 1
fi

export $(grep -v '^#' "$ENV_FILE" | xargs)

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

# Create filename from topic and number of examples (replace spaces with underscores)
TOPIC_CLEAN=$(echo "$TOPIC" | tr ' ' '_')
OUTPUT_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../$DATA_DIR/${TOPIC_CLEAN}_${NUM_EXAMPLES}_${TEMPERATURE}.json"

# Check if custom output file is provided by 4th argument
if [ ! -z "$4" ]; then
    OUTPUT_FILE="$4"
fi

echo "Generating dataset with the following parameters:"
echo "Topic: $TOPIC"
echo "Number of examples: $NUM_EXAMPLES"
echo "Format type: $FORMAT_TYPE"
echo "Output file: $OUTPUT_FILE"
echo "Temperature: $TEMPERATURE"
echo "Model: $MODEL"

# Create output directory if it doesn't exist
OUTPUT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../$DATA_DIR"
mkdir -p "$OUTPUT_DIR"

# Run the Python script with absolute paths
python "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../dataset_generator.py" \
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
