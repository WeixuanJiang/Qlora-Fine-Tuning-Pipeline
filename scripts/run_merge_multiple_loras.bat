@echo off
setlocal EnableDelayedExpansion

set "ROOT_DIR=%~dp0.."

REM Load environment variables
set "ENV_FILE=%ROOT_DIR%\.env"
if exist "%ENV_FILE%" (
    for /f "usebackq tokens=1,* delims==" %%a in ("%ENV_FILE%") do (
        if not "%%a"=="" if not "%%a:~0,1%"=="#" (
            set "%%a=%%b"
        )
    )
)

REM Set Python path if needed
set "PYTHONPATH=%PYTHONPATH%;%ROOT_DIR%"

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

REM Configuration
REM ROOT_DIR already defined above
set "CONFIG_FILE=%ROOT_DIR%\config\adapters.json"
set "OUTPUT_DIR=%ROOT_DIR%\%MERGED_MODEL_DIR%\merged_%TIMESTAMP%"

REM Create a temporary Python script to update adapters.json
set "UPDATE_CONFIG_SCRIPT=%TEMP%\update_config.py"
(
echo import json
echo import os
echo import sys
echo config_file = sys.argv[1]
echo base_model = os.getenv('BASE_MODEL_NAME'^)
echo with open(config_file, 'r'^) as f:
echo     config = json.load(f^)
echo config['base_model'] = base_model
echo with open(config_file, 'w'^) as f:
echo     json.dump(config, f, indent=4^)
)> "%UPDATE_CONFIG_SCRIPT%"

REM Update adapters.json with base model from environment variable
python "%UPDATE_CONFIG_SCRIPT%" "%CONFIG_FILE%"

REM Create a temporary Python script to read JSON
set "READ_CONFIG_SCRIPT=%TEMP%\read_config.py"
(
echo import json
echo import sys
echo import os
echo with open(sys.argv[1], 'r'^) as f:
echo     config = json.load(f^)
echo base_model = config['base_model']
echo adapter_paths = [adapter['path'] for adapter in config['adapters']]
echo print(base_model^)
echo print(len(adapter_paths^)^)
echo for path in adapter_paths: print(path^)
)> "%READ_CONFIG_SCRIPT%"

REM Read configuration using Python
set "ADAPTER_PATHS="
for /f "usebackq delims=" %%i in (`python "%READ_CONFIG_SCRIPT%" "%CONFIG_FILE%"`) do (
    if not defined BASE_MODEL (
        set "BASE_MODEL=%%i"
    ) else if not defined ADAPTER_COUNT (
        set "ADAPTER_COUNT=%%i"
    ) else (
        set "CURRENT_PATH=%ROOT_DIR%\%%i"
        set "CURRENT_PATH=!CURRENT_PATH:\=/!"
        if defined ADAPTER_PATHS (
            set "ADAPTER_PATHS=!ADAPTER_PATHS!, '!CURRENT_PATH!'"
        ) else (
            set "ADAPTER_PATHS='!CURRENT_PATH!'"
        )
    )
)

echo Starting multiple LoRA merging with:
echo Base Model: %BASE_MODEL%
echo Number of adapters to merge: %ADAPTER_COUNT%
echo Output Directory: %OUTPUT_DIR%
echo.
echo Adapter paths:
echo %ADAPTER_PATHS%

python "%ROOT_DIR%\merge_multiple_loras.py" ^
    --base_model_name="%BASE_MODEL%" ^
    --adapter_paths="[%ADAPTER_PATHS%]" ^
    --output_dir="%OUTPUT_DIR%" ^
    --device=auto ^
    --trust_remote_code

if errorlevel 1 (
    echo Merging failed with error code %errorlevel%
    pause
    exit /b %errorlevel%
)

REM Clean up temporary scripts
del "%UPDATE_CONFIG_SCRIPT%"
del "%READ_CONFIG_SCRIPT%"

echo Model merging completed successfully!
pause
endlocal
