@echo off
setlocal enabledelayedexpansion

REM Set CUDA device if needed
set CUDA_VISIBLE_DEVICES=0

REM Set Python path if needed
set PYTHONPATH=%PYTHONPATH%;%~dp0..

REM Model configuration
set MODEL_PATH=%~dp0..\merged_model\merged_2024-26-11_0450
set DEVICE=auto
set MAX_LENGTH=100
set TEMPERATURE=0.7
set TOP_P=0.9
set TOP_K=50
set NUM_BEAMS=1

REM Query (optional - will start interactive mode if empty)
set QUERY=%*

REM Batch inference configuration (optional)
set INPUT_FILE=..\data\physics_qa.json
set OUTPUT_FILE=%~dp0..\predictions\predictions.json
set INPUT_FIELD=input
set MAX_SAMPLES=20

REM Run inference
if defined QUERY (
    REM Single query mode
    python %~dp0..\run_inference.py ^
        --model_path=%MODEL_PATH% ^
        --query="%QUERY%" ^
        --device=%DEVICE% ^
        --max_length=%MAX_LENGTH% ^
        --temperature=%TEMPERATURE% ^
        --top_p=%TOP_P% ^
        --top_k=%TOP_K% ^
        --num_beams=%NUM_BEAMS%
) else if defined INPUT_FILE (
    REM Batch mode
    python %~dp0..\run_inference.py ^
        --model_path=%MODEL_PATH% ^
        --input_file=%INPUT_FILE% ^
        --output_file=%OUTPUT_FILE% ^
        --input_field=%INPUT_FIELD% ^
        --max_samples=%MAX_SAMPLES% ^
        --device=%DEVICE% ^
        --max_length=%MAX_LENGTH% ^
        --temperature=%TEMPERATURE% ^
        --top_p=%TOP_P% ^
        --top_k=%TOP_K% ^
        --num_beams=%NUM_BEAMS%
) else (
    REM Interactive mode
    python %~dp0..\run_inference.py ^
        --model_path=%MODEL_PATH% ^
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
