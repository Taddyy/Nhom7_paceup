#!/bin/bash

echo "========================================"
echo "PaceUp Frontend Setup Script"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

echo "[1/4] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies"
    exit 1
fi

echo ""
echo "[2/4] Checking .env.local file..."
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local..."
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api" > .env.local
    echo ".env.local created!"
else
    echo ".env.local already exists."
fi

echo ""
echo "[3/4] Checking public/Image folder..."
if [ ! -d "public/Image" ]; then
    echo "Creating public/Image folder..."
    mkdir -p public/Image
    if [ -d "Image" ]; then
        echo "Copying images..."
        cp -r Image/* public/Image/
        echo "Images copied!"
    else
        echo "[WARNING] Image folder not found. Please copy images manually."
    fi
else
    echo "public/Image folder exists."
fi

echo ""
echo "[4/4] Setup completed!"
echo ""
echo "Next steps:"
echo "1. Make sure backend is running on http://localhost:8000"
echo "2. Run: npm run dev"
echo "3. Open http://localhost:3000 in your browser"
echo ""

