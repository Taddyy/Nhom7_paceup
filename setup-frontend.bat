@echo off
echo ========================================
echo PaceUp Frontend Setup Script
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Checking .env.local file...
if not exist ".env.local" (
    echo Creating .env.local...
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:8000/api
    ) > .env.local
    echo .env.local created!
) else (
    echo .env.local already exists.
)

echo.
echo [3/4] Checking public/Image folder...
if not exist "public\Image" (
    echo Creating public\Image folder...
    mkdir public\Image
    if exist "Image" (
        echo Copying images...
        xcopy Image public\Image /E /I /Y
        echo Images copied!
    ) else (
        echo [WARNING] Image folder not found. Please copy images manually.
    )
) else (
    echo public\Image folder exists.
)

echo.
echo [4/4] Setup completed!
echo.
echo Next steps:
echo 1. Make sure backend is running on http://localhost:8000
echo 2. Run: npm run dev
echo 3. Open http://localhost:3000 in your browser
echo.
pause

