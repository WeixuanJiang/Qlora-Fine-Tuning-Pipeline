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

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
export PROJECT_ROOT_DIR
ENV_FILE="$PROJECT_ROOT_DIR/.env"
if [ ! -f "$ENV_FILE" ] && [ -f "$PROJECT_ROOT_DIR/.env.example" ]; then
    echo "Warning: .env file not found at $ENV_FILE. Using .env.example for defaults."
    ENV_FILE="$PROJECT_ROOT_DIR/.env.example"
fi

if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

MERGED_MODEL_DIR=${MERGED_MODEL_DIR:-merged_model}

# Set Python path if needed
export PYTHONPATH="$PYTHONPATH:$PROJECT_ROOT_DIR"

# Get current date and time for unique folder name
TIMESTAMP=$(date +"%Y-%m-%d_%H%M")

# Configuration
CONFIG_FILE="$PROJECT_ROOT_DIR/config/adapters.json"
OUTPUT_DIR="$PROJECT_ROOT_DIR/$MERGED_MODEL_DIR/merged_$TIMESTAMP"

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

# Ensure temporary scripts are cleaned up on exit
cleanup() {
    rm -f "$UPDATE_CONFIG_SCRIPT" "$READ_CONFIG_SCRIPT"
}
trap cleanup EXIT

# Update adapters.json with base model from environment variable
"$PYTHON_BIN" "$UPDATE_CONFIG_SCRIPT" "$CONFIG_FILE"

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
CONFIG_DATA=($("$PYTHON_BIN" "$READ_CONFIG_SCRIPT" "$CONFIG_FILE"))
BASE_MODEL=${CONFIG_DATA[0]}
ADAPTER_COUNT=${CONFIG_DATA[1]}
ADAPTER_PATH_OVERRIDE=${1:-${ADAPTER_PATH_OVERRIDE:-}}
ADAPTER_PATHS_RAW=()
for (( i=2; i<${#CONFIG_DATA[@]}; i++ )); do
    ADAPTER_PATHS_RAW+=("${CONFIG_DATA[i]}")
done

export OUTPUT_DIR BASE_MODEL PROJECT_ROOT_DIR

resolve_adapter_path() {
    local raw_path="$1"
    RAW_ADAPTER_PATH="$raw_path" "$PYTHON_BIN" - <<'PY'
import os
project_root = os.environ["PROJECT_ROOT_DIR"]
adapter_path = os.environ["RAW_ADAPTER_PATH"]
candidate = adapter_path if os.path.isabs(adapter_path) else os.path.join(project_root, adapter_path)
print(os.path.normpath(candidate))
PY
}

if [ ${#ADAPTER_PATHS_RAW[@]} -eq 0 ] && [ -z "$ADAPTER_PATH_OVERRIDE" ]; then
    echo "Error: no adapters listed in config/adapters.json." >&2
    exit 1
fi

if [ -n "$ADAPTER_PATH_OVERRIDE" ]; then
    SELECTED_ADAPTER_RAW="$ADAPTER_PATH_OVERRIDE"
else
    last_index=$((${#ADAPTER_PATHS_RAW[@]} - 1))
    if [ $last_index -ge 0 ]; then
        SELECTED_ADAPTER_RAW="${ADAPTER_PATHS_RAW[$last_index]}"
    fi
fi

if [ -z "$SELECTED_ADAPTER_RAW" ]; then
    echo "Error: unable to determine adapter path to merge." >&2
    exit 1
fi

SELECTED_ADAPTER_RESOLVED=$(resolve_adapter_path "$SELECTED_ADAPTER_RAW")

if [ "${PIPELINE_TEST_MODE:-0}" = "1" ]; then
    echo "PIPELINE_TEST_MODE detected; creating synthetic merge artifacts."
    mkdir -p "$OUTPUT_DIR"
    SELECTED_ADAPTER_RAW_ENV="$SELECTED_ADAPTER_RAW" SELECTED_ADAPTER_RESOLVED_ENV="$SELECTED_ADAPTER_RESOLVED" \
        "$PYTHON_BIN" - <<'PY'
import json
import os
from pathlib import Path

output_dir = Path(os.environ['OUTPUT_DIR'])
output_dir.mkdir(parents=True, exist_ok=True)

summary = {
    'status': 'completed',
    'mode': 'PIPELINE_TEST_MODE',
    'base_model': os.environ.get('BASE_MODEL'),
    'adapter_path_raw': os.environ.get('SELECTED_ADAPTER_RAW_ENV'),
    'adapter_path_resolved': os.environ.get('SELECTED_ADAPTER_RESOLVED_ENV'),
}

(output_dir / 'merge_summary.json').write_text(json.dumps(summary, indent=2), encoding='utf-8')
(output_dir / 'merged_model.bin').write_text('synthetic merged model placeholder', encoding='utf-8')

print(f"Synthetic merge artifacts written to {output_dir}")
PY

    echo "Model merging completed successfully!"
    exit 0
fi

if [ ! -d "$SELECTED_ADAPTER_RESOLVED" ]; then
    echo "Error: adapter directory not found -> $SELECTED_ADAPTER_RESOLVED" >&2
    if [ -n "$ADAPTER_PATH_OVERRIDE" ]; then
        echo "(from override path: $ADAPTER_PATH_OVERRIDE)" >&2
    fi
    exit 1
fi

ADAPTER_PATHS="'$SELECTED_ADAPTER_RESOLVED'"

echo "Starting single LoRA merge with:"
echo "Base Model: $BASE_MODEL"
echo "Adapter path (raw): $SELECTED_ADAPTER_RAW"
echo "Adapter path (resolved): $SELECTED_ADAPTER_RESOLVED"
echo "Output Directory: $OUTPUT_DIR"
echo ""
echo "Adapter path list passed to Python: [$ADAPTER_PATHS]"

"$PYTHON_BIN" "$PROJECT_ROOT_DIR/merge_multiple_loras.py" \
    --base_model_name="$BASE_MODEL" \
    --adapter_paths="[$ADAPTER_PATHS]" \
    --output_dir="$OUTPUT_DIR" \
    --device=auto \
    --trust_remote_code

echo "Model merging completed successfully!"
# read -p "Press any key to continue..." # Pause equivalent
