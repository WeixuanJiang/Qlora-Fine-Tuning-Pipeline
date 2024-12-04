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

REM Set evaluation run directory
set EVAL_RUN_DIR=%ROOT_DIR%\evaluation\run_%TIMESTAMP%
set RESULTS_DIR=%EVAL_RUN_DIR%\results
set LOGS_DIR=%EVAL_RUN_DIR%\logs

REM Create directory structure
mkdir "%EVAL_RUN_DIR%"
mkdir "%RESULTS_DIR%"
mkdir "%LOGS_DIR%"

REM Set file paths
set PREDICTIONS_FILE=%ROOT_DIR%\predictions\predictions.json
set REFERENCE_FILE=%ROOT_DIR%\%DATA_DIR%\%DATASET_NAME%
set OUTPUT_FILE=%RESULTS_DIR%\evaluation_results.json
set LOG_FILE=%LOGS_DIR%\evaluation.log

REM Create metadata file
echo {^
    "evaluation_timestamp": "%TIMESTAMP%",^
    "model": "%EVAL_MODEL%",^
    "dataset": "%DATASET_NAME%",^
    "temperature": "%EVAL_TEMPERATURE%",^
    "predictions_file": "%PREDICTIONS_FILE%"^
} > "%EVAL_RUN_DIR%\metadata.json"

REM Run evaluation
echo Starting evaluation...
echo Evaluation run directory: %EVAL_RUN_DIR%
echo Using predictions from: %PREDICTIONS_FILE%
echo.

python "%ROOT_DIR%\eval.py" ^
    --predictions="%PREDICTIONS_FILE%" ^
    --reference="%REFERENCE_FILE%" ^
    --output="%OUTPUT_FILE%" ^
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
echo Results file: %OUTPUT_FILE%
echo Logs: %LOG_FILE%
echo.
pause
