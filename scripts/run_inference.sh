#!/bin/bash
set -e

# Set CUDA device if needed
export CUDA_VISIBLE_DEVICES=${CUDA_VISIBLE_DEVICES:-0}

# Set Python path if needed
export PYTHONPATH="$PYTHONPATH:$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

# Model configuration
MODEL_PATH="${MODEL_PATH:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../merged_model/merged_2024-26-11_0450}"
DEVICE="${DEVICE:-auto}"
MAX_LENGTH="${MAX_LENGTH:-100}"
TEMPERATURE="${TEMPERATURE:-0.7}"
TOP_P="${TOP_P:-0.9}"
TOP_K="${TOP_K:-50}"
NUM_BEAMS="${NUM_BEAMS:-1}"

# Query (optional - will start interactive mode if empty)
QUERY="$*"

# Batch inference configuration (optional)
INPUT_FILE="${INPUT_FILE:-../data/physics_qa.json}"
OUTPUT_FILE="${OUTPUT_FILE:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../predictions/predictions.json}"
INPUT_FIELD="${INPUT_FIELD:-input}"
MAX_SAMPLES="${MAX_SAMPLES:-20}"

# Run inference
if [ -n "$QUERY" ]; then
    # Single query mode
    python "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../run_inference.py" \
        --model_path="$MODEL_PATH" \
        --query="$QUERY" \
        --device="$DEVICE" \
        --max_length="$MAX_LENGTH" \
        --temperature="$TEMPERATURE" \
        --top_p="$TOP_P" \
        --top_k="$TOP_K" \
        --num_beams="$NUM_BEAMS"
elif [ -n "$INPUT_FILE" ]; then
    # Batch mode
    python "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../run_inference.py" \
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
    python "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/../run_inference.py" \
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
