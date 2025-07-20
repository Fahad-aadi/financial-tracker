@echo off
setlocal enabledelayedexpansion

title Financial Tracker Application

echo ================================
echo   Starting Financial Tracker
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Set environment variables
set "NODE_ENV=development"
set "PORT=4001"

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Get current timestamp for log files
for /f "tokens=*" %%a in ('powershell -Command "Get-Date -Format 'yyyyMMdd-HHmmss'"') do set "timestamp=%%a"
set "server_log=logs\server-%timestamp%.log"
set "client_log=logs\client-%timestamp%.log"

echo Starting Server on port %PORT%...
start "Financial Tracker Server" cmd /k "cd server && node start-server-debug.js %PORT% > ..\%server_log% 2>&1"

echo Waiting for server to start...
call :waitForServer http://localhost:%PORT%/api/health
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to start server. Check the log file: %server_log%
    pause
    exit /b 1
)

echo Server started successfully!

echo Configuring client...
echo REACT_APP_API_URL=http://localhost:%PORT% > client\.env.local

REM Check if client dependencies are installed
if not exist "client\node_modules\react" (
    echo Installing client dependencies...
    cd client
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install client dependencies
        pause
        exit /b 1
    )
    cd ..
)

echo Starting Client Application...
start "Financial Tracker Client" cmd /k "cd client && npm start > ..\%client_log% 2>&1"

echo.
echo ===================================
echo Financial Tracker is starting up!
echo.
echo Server: http://localhost:%PORT%
echo Client: http://localhost:3000
echo.
echo Logs are being saved to the 'logs' directory.
echo.
echo Press any key to stop all services...
pause >nul

echo.
echo Shutting down Financial Tracker...

taskkill /F /FI "WINDOWTITLE eq Financial Tracker Server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Financial Tracker Client*" >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

echo All services have been stopped.
timeout /t 2 /nobreak > nul
exit /b 0

:waitForServer
set timeout=30
set counter=0

:retry
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:%PORT%/api/health' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { exit 1 }"
if %ERRORLEVEL% EQU 0 (
    exit /b 0
)

set /a "counter+=1"
if %counter% GEQ %timeout% (
    echo Server did not start within %timeout% seconds
    exit /b 1
)

echo Waiting for server to start... (%counter%/%timeout%)
timeout /t 1 /nobreak > nul
goto :retry
