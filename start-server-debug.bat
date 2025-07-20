@echo off
setlocal enabledelayedexpansion

title Financial Tracker Server (Debug Mode)

echo ================================
echo   Starting Financial Tracker Server
echo ================================
echo.

REM Set environment variables
set "NODE_ENV=development"
set "PORT=4001"

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Get current timestamp for log files
for /f "tokens=*" %%a in ('powershell -Command "Get-Date -Format 'yyyyMMdd-HHmmss'"') do set "timestamp=%%a"
set "log_file=logs\server-debug-%timestamp%.log"

echo Starting Server on port %PORT%...
echo Logging to: %log_file%
echo.

echo [1/3] Starting Node.js server...
start "Financial Tracker Server" cmd /k "node --version && cd server && node start-server-debug.js %PORT%"

echo [2/3] Waiting for server to start (this may take a minute)...
echo.

echo [3/3] Verifying server status...
set max_retries=30
set retry_count=0

:check_server
set /a retry_count+=1

echo Attempt !retry_count! of !max_retries!: Checking if server is running...

powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:%PORT%/api/health' -UseBasicParsing -TimeoutSec 5; if ($response.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================
    echo   Server is running successfully!
    echo   URL: http://localhost:%PORT%
    echo   Health Check: http://localhost:%PORT%/api/health
    echo ===================================
    echo.
    echo You can now start the client application.
    echo.
    pause
    exit /b 0
) else (
    if !retry_count! GEQ !max_retries! (
        echo.
        echo ===================================
        echo   ERROR: Server failed to start
        echo   Tried !max_retries! times with no success
        echo ===================================
        echo.
        echo Possible issues:
        echo 1. Port %PORT% might be in use by another application
        echo 2. There might be an error in the server code
        echo 3. Check the server window for error messages
        echo.
        echo Press any key to open the server log file...
        pause >nul
        if exist "%log_file%" start notepad "!log_file!"
        exit /b 1
    )
    
    echo Server not ready yet, waiting 2 seconds...
    timeout /t 2 /nobreak >nul
    goto check_server
)
