@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0.."
set "ENV_FILE=%ROOT_DIR%\.env"

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
set "TOPIC=%~1"
if "%TOPIC%"=="" set "TOPIC=machine learning"
set "NUM_EXAMPLES=%~2"
if "%NUM_EXAMPLES%"=="" set "NUM_EXAMPLES=10"
set "FORMAT_TYPE=%~3"
if "%FORMAT_TYPE%"=="" set "FORMAT_TYPE=instruction"

set "TEMPERATURE=%~5"
if "%TEMPERATURE%"=="" set "TEMPERATURE=%EVAL_TEMPERATURE%"
if "%TEMPERATURE%"=="" set "TEMPERATURE=0.1"

set "MODEL=%~6"
if "%MODEL%"=="" set "MODEL=%MODEL_GEN%"
if "%MODEL%"=="" set "MODEL=gpt-4o"

:: Define absolute path for DATA_DIR (DATA_DIR comes from .env)
set "ABS_DATA_DIR=%ROOT_DIR%\%DATA_DIR%"

:: Create filename from topic and number of examples (replace spaces with underscores)
set "TOPIC_CLEAN=%TOPIC: =_%"
set "DEFAULT_OUTPUT_FILE=%ABS_DATA_DIR%\%TOPIC_CLEAN%_%NUM_EXAMPLES%_%TEMPERATURE%.json"

set "OUTPUT_FILE=%~4"
if "%OUTPUT_FILE%"=="" (
    set "OUTPUT_FILE=%DEFAULT_OUTPUT_FILE%"
)

echo Generating dataset with the following parameters:
echo Topic: %TOPIC%
echo Number of examples: %NUM_EXAMPLES%
echo Format type: %FORMAT_TYPE%
echo Output file: %OUTPUT_FILE%
echo Temperature: %TEMPERATURE%
echo Model: %MODEL%

:: Create output directory if it doesn't exist (use the directory of the final OUTPUT_FILE)
for %%F in ("%OUTPUT_FILE%") do set "FINAL_OUTPUT_DIR=%%~dpF"
if not exist "%FINAL_OUTPUT_DIR%" mkdir "%FINAL_OUTPUT_DIR%"

:: Run the Python script with absolute paths
python "%ROOT_DIR%\dataset_generator.py" ^
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
endlocal
