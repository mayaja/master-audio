@echo off
setlocal

set "FILE_URL=https://github.com/mayaja/master-audio/releases/download/assets-v1/htdemucs_embedded.onnx"
set "TARGET_DIR=public\models"
set "OUT_FILE=%TARGET_DIR%\htdemucs_embedded.onnx"

if not exist "%TARGET_DIR%" (
    echo Creating %TARGET_DIR%...
    mkdir "%TARGET_DIR%"
)

if exist "%OUT_FILE%" (
    for %%A in ("%OUT_FILE%") do (
        if %%~zA GTR 0 (
            echo Asset already exists: %OUT_FILE%
            exit /b 0
        )
    )
)

echo Downloading StemMix model to %OUT_FILE%...
curl.exe -L "%FILE_URL%" -o "%OUT_FILE%"

if errorlevel 1 (
    echo Download failed.
    if exist "%OUT_FILE%" del "%OUT_FILE%"
    exit /b 1
)

if not exist "%OUT_FILE%" (
    echo Download failed: file was not created.
    exit /b 1
)

for %%A in ("%OUT_FILE%") do (
    if %%~zA EQU 0 (
        echo Download failed: file is empty.
        del "%OUT_FILE%"
        exit /b 1
    )
    if %%~zA LSS 100000000 (
        echo Download failed: file is too small to be the model.
        del "%OUT_FILE%"
        exit /b 1
    )
)

echo Download complete.
exit /b 0
