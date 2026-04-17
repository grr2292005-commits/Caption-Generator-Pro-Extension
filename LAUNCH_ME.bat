@echo off
title Caption Generator Launcher

echo Checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Python is not installed!
    echo.
    echo The application will now open the Python download page.
    echo Please install Python, check "Add to PATH", and try again.
    echo.
    pause
    start https://www.python.org/downloads/
    exit
)

echo Checking for libraries...
python -c "import requests" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing required helper libraries...
    pip install requests PyQt6
)

echo Starting Caption Generator...
python main.py
pause