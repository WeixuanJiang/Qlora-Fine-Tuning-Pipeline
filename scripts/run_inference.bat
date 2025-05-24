@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0.."

REM Set CUDA device if needed
if not defined CUDA_VISIBLE_DEVICES set "CUDA_VISIBLE_DEVICES=0"

REM Set Python path if needed
set "PYTHONPATH=%PYTHONPATH%;%ROOT_DIR%"

REM Default paths
set "DEFAULT_MODEL_PATH=%ROOT_DIR%\merged_model\merged_2024-26-11_0450"
set "DEFAULT_INPUT_FILE=%ROOT_DIR%\data\physics_qa.json"
set "DEFAULT_OUTPUT_FILE=%ROOT_DIR%\predictions\predictions.json"

REM Model configuration - Use environment variables if set, otherwise use defaults
if not defined MODEL_PATH set "MODEL_PATH=%DEFAULT_MODEL_PATH%"
if not defined DEVICE set "DEVICE=auto"
if not defined MAX_LENGTH set "MAX_LENGTH=100"
if not defined TEMPERATURE set "TEMPERATURE=0.7"
if not defined TOP_P set "TOP_P=0.9"
if not defined TOP_K set "TOP_K=50"
if not defined NUM_BEAMS set "NUM_BEAMS=1"

REM Query (optional - will start interactive mode if empty)
set "QUERY=%*"

REM Batch inference configuration (optional) - Use environment variables if set
if not defined INPUT_FILE set "INPUT_FILE=%DEFAULT_INPUT_FILE%"
if not defined OUTPUT_FILE set "OUTPUT_FILE=%DEFAULT_OUTPUT_FILE%"
if not defined INPUT_FIELD set "INPUT_FIELD=input"
if not defined MAX_SAMPLES set "MAX_SAMPLES=20"

REM Run inference
if defined QUERY (
    REM Single query mode
    python "%ROOT_DIR%\run_inference.py" ^
        --model_path="%MODEL_PATH%" ^
        --query="%QUERY%" ^
        --device=%DEVICE% ^
        --max_length=%MAX_LENGTH% ^
        --temperature=%TEMPERATURE% ^
        --top_p=%TOP_P% ^
        --top_k=%TOP_K% ^
        --num_beams=%NUM_BEAMS%
) else if defined INPUT_FILE (
    REM Batch mode
    python "%ROOT_DIR%\run_inference.py" ^
        --model_path="%MODEL_PATH%" ^
        --input_file="%INPUT_FILE%" ^
        --output_file="%OUTPUT_FILE%" ^
        --input_field="%INPUT_FIELD%" ^
        --max_samples=%MAX_SAMPLES% ^
        --device=%DEVICE% ^
        --max_length=%MAX_LENGTH% ^
        --temperature=%TEMPERATURE% ^
        --top_p=%TOP_P% ^
        --top_k=%TOP_K% ^
        --num_beams=%NUM_BEAMS%
) else (
    REM Interactive mode
    python "%ROOT_DIR%\run_inference.py" ^
        --model_path="%MODEL_PATH%" ^
        --device=%DEVICE% ^
        --max_length=%MAX_LENGTH% ^
        --temperature=%TEMPERATURE% ^
        --top_p=%TOP_P% ^
        --top_k=%TOP_K% ^
        --num_beams=%NUM_BEAMS%
)

echo.
echo Inference completed!
pause
endlocal
