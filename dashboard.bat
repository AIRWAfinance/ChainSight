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

echo.
echo Starting ChainSight web app on http://localhost:3000
echo Press Ctrl+C to stop.
echo.

start "" "http://localhost:3000"

call npm run dev

endlocal
