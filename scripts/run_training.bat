@echo off
setlocal EnableDelayedExpansion

REM Load environment variables
if exist "%~dp0..\.env" (
    for /f "tokens=*" %%a in ('type "%~dp0..\.env" ^| findstr /v "^#" ^| findstr /v "^$"') do (
        set "%%a"
    )
)

REM Set Python path if needed
set PYTHONPATH=%PYTHONPATH%;%~dp0..

REM Get current date and time for unique folder name
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/: " %%a in ('time /t') do (
    set hour=%%a
    set minute=%%b
    REM Convert 12-hour format to 24-hour format
    if "!hour:~0,1!"=="0" (
        set hour=!hour:~1!
    )
    if /i "!time:~-2!"=="PM" (
        if not "!hour!"=="12" (
            set /a hour=!hour!+12
        )
    ) else (
        if "!hour!"=="12" (
            set hour=00
        )
    )
    REM Ensure two digits
    if !hour! lss 10 set hour=0!hour!
)
set mytime=!hour!!minute!
set TIMESTAMP=%mydate%_%mytime%

REM Set paths using environment variables
set DATASET_PATH=%ROOT_DIR%\%DATA_DIR%\%DATASET_NAME%
set OUTPUT_DIR=%ROOT_DIR%\%MODEL_OUTPUT_DIR%\run_%TIMESTAMP%

echo Starting training with:
echo Base Model: %BASE_MODEL_NAME%
echo Dataset: %DATASET_PATH%
echo Output Directory: %OUTPUT_DIR%

REM Run training script
python %~dp0..\train.py ^
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