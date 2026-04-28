@echo off
setlocal

cd /d "%~dp0"

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo npm install failed.
        pause
        exit /b 1
    )
)

if "%~1"=="" (
    set /p ADDR="Enter Ethereum address to scan (0x...): "
) else (
    set "ADDR=%~1"
)

if "%ADDR%"=="" (
    echo No address provided.
    pause
    exit /b 1
)

echo.
echo Scanning %ADDR% ...
echo.

call npm run scan -- %ADDR%

echo.
pause
endlocal
