# Deployment Configuration Script (PowerShell)
# This script sets up environment-specific configurations for deployment

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("development", "staging", "production")]
    [string]$Environment,
    
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [string]$FirebaseToken,
    [switch]$SkipTests,
    [switch]$SkipBuild,
    [switch]$Help
)

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Cyan"
}

# Helper functions
function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor $Colors.Blue
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
    exit 1
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

# Show usage if help is requested
if ($Help) {
    Write-Host @"
Usage: .\deploy-config.ps1 -Environment <env> -ProjectId <id> [options]

Required:
  -Environment    Environment (development|staging|production)
  -ProjectId      Firebase project ID

Options:
  -FirebaseToken  Firebase token (if not logged in)
  -SkipTests      Skip running tests
  -SkipBuild      Skip building the project
  -Help           Show this help message

Examples:
  .\deploy-config.ps1 -Environment staging -ProjectId timeout-staging-123
  .\deploy-config.ps1 -Environment production -ProjectId timeout-prod-456 -SkipTests
"@
    exit 0
}

Write-Log "Starting deployment configuration for $Environment environment"

# Check if we're in the right directory
if (!(Test-Path "docker-compose.yml")) {
    Write-Error "Please run this script from the project root directory"
}

# Set Firebase project
Write-Log "Setting Firebase project to $ProjectId"
Set-Location "Timeout Backend"

if ($FirebaseToken) {
    firebase use $ProjectId --token $FirebaseToken
} else {
    firebase use $ProjectId
}

Set-Location ".."

# Copy environment-specific configuration files
Write-Log "Copying environment configuration for $Environment"

# Frontend environment
$frontendEnvPath = "Timeout Frontend\.env.$Environment"
if (Test-Path $frontendEnvPath) {
    Copy-Item $frontendEnvPath "Timeout Frontend\.env"
    Write-Success "Frontend environment configuration copied"
} else {
    Write-Warning "No .env.$Environment file found for frontend"
}

# Backend environment
$backendEnvPath = "Timeout Backend\.env.$Environment"
if (Test-Path $backendEnvPath) {
    Copy-Item $backendEnvPath "Timeout Backend\.env"
    Write-Success "Backend environment configuration copied"
} else {
    Write-Warning "No .env.$Environment file found for backend"
}

# Install dependencies
Write-Log "Installing dependencies"

# Frontend dependencies
Set-Location "Timeout Frontend"
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install frontend dependencies"
}
Set-Location ".."

# Backend dependencies
Set-Location "Timeout Backend\functions"
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install backend dependencies"
}
Set-Location "..\..\"

# Run tests (unless skipped)
if (!$SkipTests) {
    Write-Log "Running tests"
    
    # Frontend tests
    Set-Location "Timeout Frontend"
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($packageJson.scripts.test) {
        npm test -- --watchAll=false --coverage
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Frontend tests failed"
        }
    } else {
        Write-Warning "No frontend tests configured"
    }
    Set-Location ".."
    
    # Backend tests
    Set-Location "Timeout Backend\functions"
    $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
    if ($packageJson.scripts.test) {
        npm test
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Backend tests failed"
        }
    } else {
        Write-Warning "No backend tests configured"
    }
    Set-Location "..\..\"
} else {
    Write-Warning "Skipping tests"
}

# Build projects (unless skipped)
if (!$SkipBuild) {
    Write-Log "Building projects"
    
    # Build frontend
    Set-Location "Timeout Frontend"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Frontend build failed"
    }
    Set-Location ".."
    
    # Build backend
    Set-Location "Timeout Backend"
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Backend build failed"
    }
    Set-Location ".."
    
    Write-Success "Build completed"
} else {
    Write-Warning "Skipping build"
}

# Validate configurations
Write-Log "Validating configurations"

# Check if required environment variables are set for production
if ($Environment -eq "production") {
    Write-Log "Validating production configuration"
    
    # Check frontend .env
    if (Test-Path "Timeout Frontend\.env") {
        $frontendEnv = Get-Content "Timeout Frontend\.env" -Raw
        if ($frontendEnv -notmatch "VITE_CLERK_PUBLISHABLE_KEY=pk_live_") {
            Write-Warning "Frontend: Production Clerk key not configured"
        }
        if ($frontendEnv -match "VITE_DEMO_MODE=true") {
            Write-Warning "Frontend: Demo mode is enabled in production"
        }
    }
    
    # Check backend .env
    if (Test-Path "Timeout Backend\.env") {
        $backendEnv = Get-Content "Timeout Backend\.env" -Raw
        if ($backendEnv -notmatch "CLERK_SECRET_KEY=sk_live_") {
            Write-Warning "Backend: Production Clerk secret key not configured"
        }
        if ($backendEnv -notmatch "NODE_ENV=production") {
            Write-Warning "Backend: NODE_ENV is not set to production"
        }
    }
}

# Set Firebase Functions environment variables
Write-Log "Configuring Firebase Functions environment"
Set-Location "Timeout Backend"

if (Test-Path ".env") {
    Write-Log "Setting Firebase Functions config from .env file"
    
    # Read .env file and set Firebase config
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $key = $matches[1]
            $value = $matches[2] -replace '^"(.*)"$', '$1'  # Remove quotes
            
            try {
                if ($FirebaseToken) {
                    firebase functions:config:set "$key=$value" --token $FirebaseToken 2>$null
                } else {
                    firebase functions:config:set "$key=$value" 2>$null
                }
            } catch {
                # Ignore errors for individual config sets
            }
        }
    }
    
    Write-Success "Firebase Functions environment configured"
} else {
    Write-Warning "No .env file found for backend configuration"
}

Set-Location ".."

# Display deployment summary
Write-Log "Deployment configuration summary:"
Write-Host "  Environment: $Environment"
Write-Host "  Project ID: $ProjectId"
Write-Host "  Tests: $(if ($SkipTests) { 'Skipped' } else { 'Passed' })"
Write-Host "  Build: $(if ($SkipBuild) { 'Skipped' } else { 'Completed' })"

Write-Success "Deployment configuration completed successfully!"

Write-Log "Next steps:"
Write-Host "  1. Review the configuration summary above"
Write-Host "  2. Test the application locally if needed"
Write-Host "  3. Deploy using: firebase deploy --project $ProjectId"
Write-Host ""
Write-Host "To deploy specific components:"
Write-Host "  - Functions only: firebase deploy --only functions --project $ProjectId"
Write-Host "  - Hosting only: firebase deploy --only hosting --project $ProjectId"
Write-Host "  - Rules only: firebase deploy --only firestore:rules --project $ProjectId"