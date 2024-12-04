@echo off
setlocal enabledelayedexpansion

:: Load environment variables from .env (using absolute path)
set ENV_FILE=%~dp0..\\.env
if not exist "%ENV_FILE%" (
    echo Error: .env file not found at %ENV_FILE%
    exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
    if not "%%a"=="" if not "%%a:~0,1%"=="#" (
        set "%%a=%%b"
    )
)

:: Set default values for parameters (using .env variables where available)
set TOPIC=machine learning
set NUM_EXAMPLES=10
set FORMAT_TYPE=instruction
set TEMPERATURE=%EVAL_TEMPERATURE%
if "%TEMPERATURE%"=="" set TEMPERATURE=0.1
set MODEL=%MODEL_GEN%
if "%MODEL%"=="" set MODEL=gpt-4o

:: Check if custom parameters are provided
if not "%1"=="" set TOPIC=%1
if not "%2"=="" set NUM_EXAMPLES=%2
if not "%3"=="" set FORMAT_TYPE=%3
if not "%4"=="" set OUTPUT_FILE=%4
if not "%5"=="" set TEMPERATURE=%5
if not "%6"=="" set MODEL=%6

:: Create filename from topic and number of examples (replace spaces with underscores)
set TOPIC_CLEAN=%TOPIC: =_%
set OUTPUT_FILE=%~dp0..\%DATA_DIR%\%TOPIC_CLEAN%_%NUM_EXAMPLES%_%TEMPERATURE%.json

echo Generating dataset with the following parameters:
echo Topic: %TOPIC%
echo Number of examples: %NUM_EXAMPLES%
echo Format type: %FORMAT_TYPE%
echo Output file: %OUTPUT_FILE%
echo Temperature: %TEMPERATURE%
echo Model: %MODEL%

:: Create output directory if it doesn't exist
set OUTPUT_DIR=%~dp0..\%DATA_DIR%
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

:: Run the Python script with absolute paths
python "%~dp0..\dataset_generator.py" ^
    --topic "%TOPIC%" ^
    --num_examples %NUM_EXAMPLES% ^
    --format_type %FORMAT_TYPE% ^
    --output_file "%OUTPUT_FILE%" ^
    --temperature %TEMPERATURE% ^
    --model "%MODEL%" ^
    --api_key "%OPENAI_API_KEY%"

if %ERRORLEVEL% NEQ 0 (
    echo Error in dataset generation
    exit /b 1
)

echo Dataset generation completed successfully
