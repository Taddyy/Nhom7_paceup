#!/bin/bash

echo "========================================"
echo "PaceUp Backend Setup Script"
echo "========================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo "Please install Python 3.10+ from https://www.python.org/downloads/"
    exit 1
fi

echo "[1/5] Creating virtual environment..."
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "Virtual environment created!"
else
    echo "Virtual environment already exists."
fi

echo ""
echo "[2/5] Activating virtual environment..."
source venv/bin/activate

echo ""
echo "[3/5] Upgrading pip..."
pip install --upgrade pip

echo ""
echo "[4/5] Installing dependencies..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies"
    exit 1
fi

echo ""
echo "[5/5] Checking .env file..."
if [ ! -f ".env" ]; then
    echo ""
    echo "[WARNING] .env file not found!"
    echo "Creating .env from .env.example..."
    if [ -f ".env.example" ]; then
        cp ".env.example" ".env"
        echo ""
        echo "Please edit .env file and update:"
        echo "- DATABASE_URL with your MySQL credentials"
        echo "- SECRET_KEY with a secure random string"
        echo ""
        read -p "Press Enter to continue..."
        ${EDITOR:-nano} .env
    else
        echo "[ERROR] .env.example not found!"
        echo "Please create .env file manually."
    fi
else
    echo ".env file exists."
fi

echo ""
echo "========================================"
echo "Setup completed!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Make sure MySQL is installed and running"
echo "2. Create database: CREATE DATABASE paceup CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "3. Update .env file with your MySQL credentials"
echo "4. Run: alembic upgrade head"
echo "5. Run: python run.py"
echo ""

