@echo off
setlocal enabledelayedexpansion

echo Starting Financial Tracker Application...
echo.

REM Set window title
title Financial Tracker Application

REM Define colors for console output (ANSI escape codes for modern Windows 10+)
set "GREEN=92"
set "YELLOW=93"
set "CYAN=96"
set "WHITE=97"
set "RED=91"

REM Function to display colored text
:colorEcho
echo %~2
exit /b

REM Display welcome message
call :colorEcho %CYAN% "Financial Tracker Application"
call :colorEcho %YELLOW% "================================"
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    call :colorEcho %RED% "Error: Node.js is not installed or not in PATH."
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check Node.js version
for /f "tokens=1 delims=. " %%v in ('node -v') do set node_ver=%%v
set node_ver=%node_ver:~1%
if %node_ver% LSS 14 (
    call :colorEcho %RED% "Error: Node.js version 14 or higher is required. Current version: %node_ver%"
    echo Please update Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Create a new directory for logs if it doesn't exist
if not exist "logs" mkdir logs

REM Get current date and time for log files
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value 2^>nul') do set "dt=%%a"
if not defined dt (
    REM Fallback if wmic is not available (Windows 11+)
    for /f "tokens=2 delims=:." %%a in ('powershell -Command "Get-Date -Format 'yyyyMMddHHmmss'"') do set "dt=%%a"
)
set "logdate=%dt:~0,8%-%dt:~8,6%"

REM Define log files
set "server_log=logs\server-%logdate%.log"
set "client_log=logs\client-%logdate%.log"

REM Set environment variables
set "NODE_ENV=development"
set "PORT=4001"

REM Start the main server
call :colorEcho %YELLOW% "Starting Financial Tracker Server (Port: %PORT%)..."
echo Server logs will be saved to: %server_log%
start "Financial Tracker Server" cmd /k "cd server && node start-server-debug.js %PORT% > ..\%server_log% 2>&1"

REM Wait for server to start
call :waitForServer http://localhost:%PORT%/api/health 30000
if %ERRORLEVEL% NEQ 0 (
    call :colorEcho %RED% "Failed to start server. Check the log file: %server_log%"
    pause
    exit /b 1
)

REM Check if client has node_modules
if not exist "client\node_modules" (
    call :colorEcho %YELLOW% "Installing client dependencies..."
    cd client
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        call :colorEcho %RED% "Failed to install client dependencies"
        pause
        exit /b 1
    )
    cd ..
)

REM Configure client environment
call :colorEcho %CYAN% "Configuring client to use server on port %PORT%..."
echo REACT_APP_API_URL=http://localhost:%PORT% > client\.env.local

REM Start the client application
call :colorEcho %YELLOW% "Starting Client Application..."
echo Client logs will be saved to: %client_log%
start "Financial Tracker Client" cmd /k "cd client && npm start > ..\%client_log% 2>&1"

REM Display status
call :colorEcho %GREEN% "\nFinancial Tracker is starting up!"
call :colorEcho %WHITE% "Server: http://localhost:%PORT%"
call :colorEcho %WHITE% "Client: http://localhost:3000"
echo.
call :colorEcho %YELLOW% "Press any key in this window to stop all services..."

REM Open the application in the default browser
timeout /t 2 /nobreak > nul
start http://localhost:3000

REM Wait for user input to exit
pause >nul

REM Cleanup
call :colorEcho %YELLOW% "\nShutting down Financial Tracker..."
taskkill /F /FI "WINDOWTITLE eq Financial Tracker Server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Financial Tracker Client*" >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1

call :colorEcho %GREEN% "All services have been stopped."
timeout /t 2 /nobreak > nul
exit /b 0

:waitForServer
REM Wait for server to be available
REM Usage: call :waitForServer url timeout_ms
setlocal
set url=%~1
set timeout_ms=%~2
if "%timeout_ms%"=="" set timeout_ms=30000

set start_time=%time%
:retry
powershell -Command "try { $response = Invoke-WebRequest -Uri '%url%' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { exit 1 }"
if %ERRORLEVEL% EQU 0 (
    endlocal
    exit /b 0
)

REM Calculate elapsed time
for /f "tokens=1-4 delims=:.," %%a in ("%start_time% %time%" ) do (
    set /a "start=(((1%%a * 60 + 1%%b) * 60 + 1%%c) * 100 + 1%%d) - 36610100"
    set /a "end=(((1%%e * 60 + 1%%f) * 60 + 1%%g) * 100 + 1%%h) - 36610100"
)
set /a "elapsed=end - start"

if %elapsed% GEQ %timeout_ms% (
    endlocal
    exit /b 1
)

timeout /t 1 /nobreak > nul
goto :retry
