@echo off
chcp 65001 >nul
REM ============================================
REM  Start the app (run every time)
REM  Opens two windows: Django + Next.js
REM  Close those two windows to stop the app
REM ============================================

if not exist "%~dp0backend\venv" (
  echo Run setup.bat first!
  pause
  exit /b 1
)

start "Django - backend" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && python manage.py migrate && python manage.py runserver"
start "Next.js - frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Starting... the browser will open in a few seconds
timeout /t 10 /nobreak >nul
start http://localhost:3000
