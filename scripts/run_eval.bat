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
set "TIMESTAMP_DATE_FOR_DIR=%mydate%_%mytime%" REM Renamed to avoid conflict with metadata field name

REM Set evaluation run directory using SCRIPT_ROOT_DIR
set "EVAL_RUN_DIR_BASE=%SCRIPT_ROOT_DIR%\evaluation"
set "EVAL_RUN_DIR=%EVAL_RUN_DIR_BASE%\run_%TIMESTAMP_DATE_FOR_DIR%"
set "RESULTS_DIR=%EVAL_RUN_DIR%\results"
set "LOGS_DIR=%EVAL_RUN_DIR%\logs"

REM Create directory structure
if not exist "%EVAL_RUN_DIR_BASE%" mkdir "%EVAL_RUN_DIR_BASE%"
if not exist "%EVAL_RUN_DIR%" mkdir "%EVAL_RUN_DIR%"
if not exist "%RESULTS_DIR%" mkdir "%RESULTS_DIR%"
if not exist "%LOGS_DIR%" mkdir "%LOGS_DIR%"

REM Set file paths using SCRIPT_ROOT_DIR
REM DATA_DIR and DATASET_NAME are from .env
set "ABS_DATA_DIR_PATH=%SCRIPT_ROOT_DIR%\%DATA_DIR%"

set "PREDICTIONS_FILE_RAW=%SCRIPT_ROOT_DIR%\predictions\predictions.json"
set "REFERENCE_FILE_RAW=%ABS_DATA_DIR_PATH%\%DATASET_NAME%"
set "OUTPUT_FILE_RAW=%RESULTS_DIR%\evaluation_results.json"
set "LOG_FILE=%LOGS_DIR%\evaluation.log"

REM Escape paths for JSON
set "PREDICTIONS_FILE_JSON=!PREDICTIONS_FILE_RAW:\=\\!"
set "REFERENCE_FILE_JSON=!REFERENCE_FILE_RAW:\=\\!"
set "OUTPUT_FILE_JSON=!OUTPUT_FILE_RAW:\=\\!"

REM Create metadata file
(
echo {
echo     "evaluation_timestamp": "%TIMESTAMP_DATE_FOR_DIR%",
echo     "model": "%EVAL_MODEL%",
echo     "dataset": "%DATASET_NAME%",
echo     "temperature": "%EVAL_TEMPERATURE%",
echo     "predictions_file": "!PREDICTIONS_FILE_JSON!",
echo     "reference_file": "!REFERENCE_FILE_JSON!",
echo     "output_file": "!OUTPUT_FILE_JSON!"
echo }
) > "%EVAL_RUN_DIR%\metadata.json"

REM Run evaluation
echo Starting evaluation...
echo Evaluation run directory: %EVAL_RUN_DIR%
echo Using predictions from: %PREDICTIONS_FILE_RAW%
echo.

python "%SCRIPT_ROOT_DIR%\eval.py" ^
    --predictions="%PREDICTIONS_FILE_RAW%" ^
    --reference="%REFERENCE_FILE_RAW%" ^
    --output="%OUTPUT_FILE_RAW%" ^
    --model="%EVAL_MODEL%"

if errorlevel 1 (
    echo Evaluation failed with error code %errorlevel%
    echo Check logs at: %LOG_FILE%
    pause
    exit /b %errorlevel%
)

echo.
echo Evaluation completed successfully!
echo.
echo Results directory: %EVAL_RUN_DIR%
echo Results file: %OUTPUT_FILE_RAW%
echo Logs: %LOG_FILE%
echo.
pause
endlocal
