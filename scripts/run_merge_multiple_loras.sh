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

ADAPTER_PATHS_ARRAY=()
for (( i=2; i<${#CONFIG_DATA[@]}; i++ )); do
    CURRENT_PATH="$ROOT_DIR/${CONFIG_DATA[i]}"
    # Replace backslashes with forward slashes for cross-platform compatibility (though less critical in .sh)
    CURRENT_PATH=$(echo "$CURRENT_PATH" | sed 's/\\/\//g')
    ADAPTER_PATHS_ARRAY+=("'$CURRENT_PATH'")
done

ADAPTER_PATHS=$(IFS=, ; echo "${ADAPTER_PATHS_ARRAY[*]}")

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
