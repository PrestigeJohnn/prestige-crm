@echo off
echo ============================================
echo   AI CRM — Desktop Launcher
echo ============================================
echo.
echo Starting server...
cd /d D:\AI-CRM
start "AI CRM Server" /min node server.js
echo Waiting for server to start...
timeout /t 5 /nobreak >nul
echo Opening browser...
start http://localhost:3002
echo.
echo AI CRM is now running!
echo Close this window to shut down the server.
echo.
pause
