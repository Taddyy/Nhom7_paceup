@echo off
echo ========================================
echo PaceUp Backend Setup Script
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [1/5] Creating virtual environment...
if not exist "venv" (
    python -m venv venv
    echo Virtual environment created!
) else (
    echo Virtual environment already exists.
)

echo.
echo [2/5] Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo [3/5] Upgrading pip...
python -m pip install --upgrade pip

echo.
echo [4/5] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [5/5] Checking .env file...
if not exist ".env" (
    echo.
    echo [WARNING] .env file not found!
    echo Creating .env from .env.example...
    if exist ".env.example" (
        copy ".env.example" ".env"
        echo.
        echo Please edit .env file and update:
        echo - DATABASE_URL with your MySQL credentials
        echo - SECRET_KEY with a secure random string
        echo.
        echo Press any key to open .env file for editing...
        pause >nul
        notepad .env
    ) else (
        echo [ERROR] .env.example not found!
        echo Please create .env file manually.
    )
) else (
    echo .env file exists.
)

echo.
echo ========================================
echo Setup completed!
echo ========================================
echo.
echo Next steps:
echo 1. Make sure MySQL is installed and running
echo 2. Create database: CREATE DATABASE paceup CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
echo 3. Update .env file with your MySQL credentials
echo 4. Run: alembic upgrade head
echo 5. Run: python run.py
echo.
pause

