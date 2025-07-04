#!/bin/bash
set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

# Set CUDA device if needed
export CUDA_VISIBLE_DEVICES=${CUDA_VISIBLE_DEVICES:-0}

# Set Python path if needed
export PYTHONPATH="$PYTHONPATH:$ROOT_DIR"

# Default paths constructed from ROOT_DIR
DEFAULT_MODEL_PATH="$ROOT_DIR/merged_model/merged_2024-26-11_0450"
DEFAULT_INPUT_FILE="$ROOT_DIR/data/physics_qa.json"
DEFAULT_OUTPUT_FILE="$ROOT_DIR/predictions/predictions.json"

# Model configuration - respect environment variables if set, otherwise use defaults
MODEL_PATH="${MODEL_PATH:-$DEFAULT_MODEL_PATH}"
DEVICE="${DEVICE:-auto}"
MAX_LENGTH="${MAX_LENGTH:-100}"
TEMPERATURE="${TEMPERATURE:-0.7}"
TOP_P="${TOP_P:-0.9}"
TOP_K="${TOP_K:-50}"
NUM_BEAMS="${NUM_BEAMS:-1}"

# Query (optional - will start interactive mode if empty)
QUERY="$*"

# Batch inference configuration (optional) - respect environment variables if set
INPUT_FILE="${INPUT_FILE:-$DEFAULT_INPUT_FILE}"
OUTPUT_FILE="${OUTPUT_FILE:-$DEFAULT_OUTPUT_FILE}"
INPUT_FIELD="${INPUT_FIELD:-input}"
MAX_SAMPLES="${MAX_SAMPLES:-20}"

# Run inference
if [ -n "$QUERY" ]; then
    # Single query mode
    python "$ROOT_DIR/run_inference.py" \
        --model_path="$MODEL_PATH" \
        --query="$QUERY" \
        --device="$DEVICE" \
        --max_length="$MAX_LENGTH" \
        --temperature="$TEMPERATURE" \
        --top_p="$TOP_P" \
        --top_k="$TOP_K" \
        --num_beams="$NUM_BEAMS"
elif [ -n "$INPUT_FILE" ]; then # Check if INPUT_FILE is non-empty after potential default assignment
    # Batch mode
    python "$ROOT_DIR/run_inference.py" \
        --model_path="$MODEL_PATH" \
        --input_file="$INPUT_FILE" \
        --output_file="$OUTPUT_FILE" \
        --input_field="$INPUT_FIELD" \
        --max_samples="$MAX_SAMPLES" \
        --device="$DEVICE" \
        --max_length="$MAX_LENGTH" \
        --temperature="$TEMPERATURE" \
        --top_p="$TOP_P" \
        --top_k="$TOP_K" \
        --num_beams="$NUM_BEAMS"
else
    # Interactive mode
    python "$ROOT_DIR/run_inference.py" \
        --model_path="$MODEL_PATH" \
        --device="$DEVICE" \
        --max_length="$MAX_LENGTH" \
        --temperature="$TEMPERATURE" \
        --top_p="$TOP_P" \
        --top_k="$TOP_K" \
        --num_beams="$NUM_BEAMS"
fi

echo ""
echo "Inference completed!"
# pause equivalent: read -p "Press any key to continue..."
