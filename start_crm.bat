@echo off
setlocal EnableDelayedExpansion

:: 1. Configuration
set "CRM_ROOT=D:\AI-CRM"
set "LOG_DIR=%CRM_ROOT%\logs"
set "PORT=3002"
set "APP_URL=http://localhost:%PORT%/login"

:: 2. Init
title Prestige CRM System Manager
chcp 65001 >nul
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
echo [%date% %time%] Starting CRM... > "%LOG_DIR%\launcher.log"

:: 3. Check Node/NPM
where node >nul 2>nul || (echo [ERROR] Node.js not installed & pause & exit /b)
where npm >nul 2>nul || (echo [ERROR] NPM not installed & pause & exit /b)

:: 4. Port/duplicate check
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%"') do (
    echo [INFO] Port %PORT% occupied, PID: %%a, terminating...
    taskkill /PID %%a /F >nul 2>&1
)

:: 5. Dependency check
if not exist "%CRM_ROOT%\node_modules" (
    echo [INFO] Installing dependencies...
    cd /d "%CRM_ROOT%" && npm install > "%LOG_DIR%\install.log" 2>&1
)

:: 5. Start backend (log to file)
echo [INFO] Starting backend...
cd /d "%CRM_ROOT%"
start "CRM-Backend" /min node server.js > "%LOG_DIR%\backend.log" 2>&1

:: 6. Health Check (max 40 seconds)
echo [INFO] Waiting for API health check...
for /l %%i in (1,1,20) do (
    curl -s http://localhost:%PORT%/api/health >nul 2>&1
    if !errorlevel! equ 0 goto :launch_browser
    timeout /t 2 >nul
)

echo [ERROR] Backend failed to start. Check %LOG_DIR%\backend.log
pause & exit /b

:launch_browser
echo [INFO] CRM ready, launching browser...
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=%APP_URL%
exit