# TimeOut App - Quick Setup Script (Windows)
# Run this to get the app running immediately

Write-Host "🚀 TimeOut App - Quick Setup" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green

# Check if Node.js is installed
try {
    $nodeVersion = node -v
    Write-Host "✅ Node.js $nodeVersion detected" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ first." -ForegroundColor Red
    Write-Host "📖 Download from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check Node version
$nodeVersionNumber = ($nodeVersion -replace 'v', '').Split('.')[0]
if ([int]$nodeVersionNumber -lt 18) {
    Write-Host "❌ Node.js version is too old ($nodeVersionNumber). Please upgrade to Node.js 18+." -ForegroundColor Red
    exit 1
}

# Navigate to frontend directory
if (-not (Test-Path "Timeout Frontend")) {
    Write-Host "❌ Timeout Frontend directory not found. Are you in the project root?" -ForegroundColor Red
    exit 1
}

Set-Location "Timeout Frontend"

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies. Check your internet connection." -ForegroundColor Red
    exit 1
}

# Check if .env exists, if not create one
if (-not (Test-Path ".env")) {
    Write-Host "🔧 Setting up demo environment..." -ForegroundColor Yellow
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
    } else {
        @"
VITE_DEMO_MODE=true
VITE_APP_NAME=TimeOut Study App (Demo)
VITE_APP_VERSION=1.0.0
"@ | Out-File -FilePath ".env" -Encoding UTF8
    }
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 To start the app:" -ForegroundColor Cyan
Write-Host "   cd 'Timeout Frontend'" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Then open: http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 For full setup with backend: see SETUP_GUIDE.md" -ForegroundColor Yellow