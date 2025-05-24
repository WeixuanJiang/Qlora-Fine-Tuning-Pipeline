@echo off
setlocal EnableDelayedExpansion

set "SCRIPT_ROOT_DIR=%~dp0.."

REM Load environment variables
set "ENV_FILE=%SCRIPT_ROOT_DIR%\.env"
if exist "%ENV_FILE%" (
    for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
)

REM Set Python path if needed
set "PYTHONPATH=%PYTHONPATH%;%SCRIPT_ROOT_DIR%"

REM Get current date and time for unique folder name
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/: " %%a in ('time /t') do (
    set hour=%%a
    set minute=%%b
    if "!hour:~0,1!"=="0" (set hour=!hour:~1!)
    if /i "!time:~-2!"=="PM" (if not "!hour!"=="12" (set /a hour=!hour!+12)) else (if "!hour!"=="12" (set hour=00))
    if !hour! lss 10 set hour=0!hour!
)
set "mytime=%hour%%minute%"
set "TIMESTAMP=%mydate%_%mytime%"


REM Set paths using SCRIPT_ROOT_DIR and environment variables from .env
REM DATA_DIR, DATASET_NAME, MODEL_OUTPUT_DIR are from .env
set "ABS_DATA_DIR_PATH=%SCRIPT_ROOT_DIR%\%DATA_DIR%"
set "DATASET_PATH=%ABS_DATA_DIR_PATH%\%DATASET_NAME%"

set "ABS_MODEL_OUTPUT_DIR=%SCRIPT_ROOT_DIR%\%MODEL_OUTPUT_DIR%"
set "OUTPUT_DIR=%ABS_MODEL_OUTPUT_DIR%\run_%TIMESTAMP%"

REM Create the output directory if it doesn't exist
if not exist "%ABS_MODEL_OUTPUT_DIR%" mkdir "%ABS_MODEL_OUTPUT_DIR%"
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"


echo Starting training with:
echo Base Model: %BASE_MODEL_NAME%
echo Dataset: %DATASET_PATH%
echo Output Directory: %OUTPUT_DIR%

REM Run training script
python "%SCRIPT_ROOT_DIR%\train.py" ^
    --model_name "%BASE_MODEL_NAME%" ^
    --dataset_path "%DATASET_PATH%" ^
    --output_dir "%OUTPUT_DIR%" ^
    --input_column "%INPUT_COLUMN%" ^
    --target_column "%TARGET_COLUMN%" ^
    --max_samples %MAX_SAMPLES% ^
    --max_length %MAX_LENGTH% ^
    --num_train_epochs %NUM_TRAIN_EPOCHS% ^
    --per_device_train_batch_size %PER_DEVICE_TRAIN_BATCH_SIZE% ^
    --gradient_accumulation_steps %GRADIENT_ACCUMULATION_STEPS% ^
    --learning_rate %LEARNING_RATE% ^
    --weight_decay %WEIGHT_DECAY% ^
    --warmup_ratio %WARMUP_RATIO% ^
    --lora_r %LORA_R% ^
    --lora_alpha %LORA_ALPHA% ^
    --lora_dropout %LORA_DROPOUT% ^
    --seed %SEED% ^
    --logging_steps %LOGGING_STEPS% ^
    --save_steps %SAVE_STEPS% ^
    --save_total_limit %SAVE_TOTAL_LIMIT% ^
    --bits %BITS% ^
    --double_quant %DOUBLE_QUANT% ^
    --quant_type %QUANT_TYPE% ^
    --prompt_template_type %PROMPT_TEMPLATE_TYPE% ^
    --wandb_project %WANDB_PROJECT% ^
    --trust_remote_code true ^
    --report_to wandb

if errorlevel 1 (
    echo Training failed with error code %errorlevel%
    pause
    exit /b %errorlevel%
)

echo Training completed successfully!
pause
endlocal
