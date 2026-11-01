@echo off
chcp 65001 >nul
REM ============================================
REM  First-time setup (run ONCE)
REM  Installs everything and creates the database
REM ============================================

echo.
echo [1/5] Checking Python and Node...
python --version || (echo Python is not installed. Install it from python.org & pause & exit /b 1)
node --version || (echo Node.js is not installed. Install it from nodejs.org & pause & exit /b 1)

echo.
echo [2/5] Creating Python virtual environment...
cd /d "%~dp0backend"
if not exist venv python -m venv venv
call venv\Scripts\activate.bat

echo.
echo [3/5] Installing Django packages...
pip install -r requirements.txt || (echo pip install failed & pause & exit /b 1)

echo.
echo [4/5] Creating the database...
python manage.py migrate || (echo migrate failed & pause & exit /b 1)

echo.
echo Create an admin account for the admin panel (you can skip with Ctrl+C):
python manage.py createsuperuser

echo.
echo [5/5] Installing Next.js packages (this can take a few minutes)...
cd /d "%~dp0frontend"
call npm install || (echo npm install failed & pause & exit /b 1)

echo.
echo ============================================
echo  Done! Now double-click start.bat
echo ============================================
pause
