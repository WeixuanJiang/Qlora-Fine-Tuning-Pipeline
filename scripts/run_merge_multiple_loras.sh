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

# Configuration
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
CONFIG_FILE="$ROOT_DIR/config/adapters.json"
OUTPUT_DIR="$ROOT_DIR/$MERGED_MODEL_DIR/merged_$TIMESTAMP"

# Create a temporary Python script to update adapters.json
UPDATE_CONFIG_SCRIPT=$(mktemp /tmp/update_config.XXXXXX.py)
cat << EOF > "$UPDATE_CONFIG_SCRIPT"
import json
import os
import sys
config_file = sys.argv[1]
base_model = os.getenv('BASE_MODEL_NAME')
with open(config_file, 'r') as f:
    config = json.load(f)
config['base_model'] = base_model
with open(config_file, 'w') as f:
    json.dump(config, f, indent=4)
EOF

# Update adapters.json with base model from environment variable
python "$UPDATE_CONFIG_SCRIPT" "$CONFIG_FILE"

# Create a temporary Python script to read JSON
READ_CONFIG_SCRIPT=$(mktemp /tmp/read_config.XXXXXX.py)
cat << EOF > "$READ_CONFIG_SCRIPT"
import json
import sys
import os
with open(sys.argv[1], 'r') as f:
    config = json.load(f)
base_model = config['base_model']
adapter_paths = [adapter['path'] for adapter in config['adapters']]
print(base_model)
print(len(adapter_paths))
for path in adapter_paths: print(path)
EOF

# Read configuration using Python
CONFIG_DATA=($(python "$READ_CONFIG_SCRIPT" "$CONFIG_FILE"))
BASE_MODEL=${CONFIG_DATA[0]}
ADAPTER_COUNT=${CONFIG_DATA[1]}

# ADAPTER_PATHS_ARRAY and ADAPTER_PATHS will be constructed by the new loop below

echo "Verifying adapter paths..."
VALID_ADAPTER_PATHS_ARRAY=() # Will store quoted, normalized paths for the final ADAPTER_PATHS string
MISSING_PATHS=0
TEMP_ADAPTER_PATHS_FOR_PYTHON=() # Will store unquoted, normalized paths for the python script argument construction

for (( i=2; i<${#CONFIG_DATA[@]}; i++ )); do
    RAW_ADAPTER_PATH_FROM_CONFIG="${CONFIG_DATA[i]}"
    # Construct the absolute path. ROOT_DIR is defined as $(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/..
    RESOLVED_ADAPTER_PATH="$ROOT_DIR/$RAW_ADAPTER_PATH_FROM_CONFIG"

    echo "Adapter source path from config: \"$RAW_ADAPTER_PATH_FROM_CONFIG\""
    echo "Attempting to resolve to absolute path: \"$RESOLVED_ADAPTER_PATH\""

    # Normalize the path: remove trailing slashes, resolve . and ..
    # Using Python for robust normalization to handle various cases like trailing slashes consistently
    NORMALIZED_ADAPTER_PATH=$(python -c "import os; print(os.path.normpath('$RESOLVED_ADAPTER_PATH'))")
    
    if [ ! -d "$NORMALIZED_ADAPTER_PATH" ]; then
        echo "ERROR: Adapter directory not found or is not a directory: \"$NORMALIZED_ADAPTER_PATH\" (derived from \"$RAW_ADAPTER_PATH_FROM_CONFIG\")"
        MISSING_PATHS=$((MISSING_PATHS + 1))
    else
        echo "Found adapter directory: \"$NORMALIZED_ADAPTER_PATH\""
        TEMP_ADAPTER_PATHS_FOR_PYTHON+=("$NORMALIZED_ADAPTER_PATH")
    fi
done

if [ "$MISSING_PATHS" -gt 0 ]; then
    echo "Error: $MISSING_PATHS adapter directory/directories not found. Please check config/adapters.json and ensure directories exist at the correct locations relative to the project root."
    exit 1
fi

# Reconstruct ADAPTER_PATHS string for the python script, ensuring paths are quoted
QUOTED_VALIDATED_PATHS=()
for p in "${TEMP_ADAPTER_PATHS_FOR_PYTHON[@]}"; do
    QUOTED_VALIDATED_PATHS+=("'$p'") # Add single quotes around each path
done
ADAPTER_PATHS=$(IFS=, ; echo "${QUOTED_VALIDATED_PATHS[*]}")

echo "Final validated and quoted adapter paths to be used by Python script: [$ADAPTER_PATHS]"

echo "Starting multiple LoRA merging with:"
echo "Base Model: $BASE_MODEL"
echo "Number of adapters to merge: $ADAPTER_COUNT"
echo "Output Directory: $OUTPUT_DIR"
echo ""
echo "Adapter paths:"
echo "$ADAPTER_PATHS" # This will print with single quotes and commas

python "$ROOT_DIR/merge_multiple_loras.py" \
    --base_model_name="$BASE_MODEL" \
    --adapter_paths="[$ADAPTER_PATHS]" \
    --output_dir="$OUTPUT_DIR" \
    --device=auto \
    --trust_remote_code

if [ $? -ne 0 ]; then
    echo "Merging failed with error code $?"
    # read -p "Press any key to continue..." # Pause equivalent
    exit $?
fi

# Clean up temporary scripts
rm "$UPDATE_CONFIG_SCRIPT"
rm "$READ_CONFIG_SCRIPT"

echo "Model merging completed successfully!"
# read -p "Press any key to continue..." # Pause equivalent
