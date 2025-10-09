#!/bin/bash
# TimeOut App - Quick Setup Script
# Run this to get the app running immediately

echo "🚀 TimeOut App - Quick Setup"
echo "============================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "📖 Download from: https://nodejs.org/"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version is too old ($NODE_VERSION). Please upgrade to Node.js 18+."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Navigate to frontend directory
if [ ! -d "Timeout Frontend" ]; then
    echo "❌ Timeout Frontend directory not found. Are you in the project root?"
    exit 1
fi

cd "Timeout Frontend"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Check your internet connection."
    exit 1
fi

# Check if .env exists, if not copy from example
if [ ! -f ".env" ]; then
    echo "🔧 Setting up demo environment..."
    cp .env.example .env 2>/dev/null || {
        echo "VITE_DEMO_MODE=true" > .env
        echo "VITE_APP_NAME=TimeOut Study App (Demo)" >> .env
        echo "VITE_APP_VERSION=1.0.0" >> .env
    }
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 To start the app:"
echo "   cd 'Timeout Frontend'"
echo "   npm run dev"
echo ""
echo "🌐 Then open: http://localhost:8080"
echo ""
echo "📖 For full setup with backend: see SETUP_GUIDE.md"