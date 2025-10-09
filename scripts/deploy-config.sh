#!/bin/bash

# Deployment Configuration Script
# This script sets up environment-specific configurations for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=""
PROJECT_ID=""
FIREBASE_TOKEN=""
SKIP_TESTS=false
SKIP_BUILD=false

# Helper functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

# Usage function
usage() {
    echo "Usage: $0 -e <environment> -p <project_id> [options]"
    echo ""
    echo "Required:"
    echo "  -e, --environment    Environment (development|staging|production)"
    echo "  -p, --project        Firebase project ID"
    echo ""
    echo "Options:"
    echo "  -t, --token         Firebase token (if not logged in)"
    echo "  --skip-tests        Skip running tests"
    echo "  --skip-build        Skip building the project"
    echo "  -h, --help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -e staging -p timeout-staging-123"
    echo "  $0 -e production -p timeout-prod-456 --skip-tests"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -p|--project)
            PROJECT_ID="$2"
            shift 2
            ;;
        -t|--token)
            FIREBASE_TOKEN="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            error "Unknown option $1"
            ;;
    esac
done

# Validate required arguments
if [[ -z "$ENVIRONMENT" || -z "$PROJECT_ID" ]]; then
    usage
fi

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    error "Environment must be one of: development, staging, production"
fi

log "Starting deployment configuration for $ENVIRONMENT environment"

# Check if we're in the right directory
if [[ ! -f "docker-compose.yml" ]]; then
    error "Please run this script from the project root directory"
fi

# Set Firebase project
log "Setting Firebase project to $PROJECT_ID"
cd "Timeout Backend"
if [[ -n "$FIREBASE_TOKEN" ]]; then
    firebase use "$PROJECT_ID" --token "$FIREBASE_TOKEN"
else
    firebase use "$PROJECT_ID"
fi
cd ..

# Copy environment-specific configuration files
log "Copying environment configuration for $ENVIRONMENT"

# Frontend environment
if [[ -f "Timeout Frontend/.env.$ENVIRONMENT" ]]; then
    cp "Timeout Frontend/.env.$ENVIRONMENT" "Timeout Frontend/.env"
    success "Frontend environment configuration copied"
else
    warn "No .env.$ENVIRONMENT file found for frontend"
fi

# Backend environment
if [[ -f "Timeout Backend/.env.$ENVIRONMENT" ]]; then
    cp "Timeout Backend/.env.$ENVIRONMENT" "Timeout Backend/.env"
    success "Backend environment configuration copied"
else
    warn "No .env.$ENVIRONMENT file found for backend"
fi

# Install dependencies
log "Installing dependencies"

# Frontend dependencies
cd "Timeout Frontend"
npm ci
cd ..

# Backend dependencies
cd "Timeout Backend/functions"
npm ci
cd ../..

# Run tests (unless skipped)
if [[ "$SKIP_TESTS" == false ]]; then
    log "Running tests"
    
    # Frontend tests
    cd "Timeout Frontend"
    if [[ -f "package.json" ]] && grep -q '"test"' package.json; then
        npm test -- --watchAll=false --coverage
    else
        warn "No frontend tests configured"
    fi
    cd ..
    
    # Backend tests
    cd "Timeout Backend/functions"
    if [[ -f "package.json" ]] && grep -q '"test"' package.json; then
        npm test
    else
        warn "No backend tests configured"
    fi
    cd ../..
else
    warn "Skipping tests"
fi

# Build projects (unless skipped)
if [[ "$SKIP_BUILD" == false ]]; then
    log "Building projects"
    
    # Build frontend
    cd "Timeout Frontend"
    npm run build
    cd ..
    
    # Build backend
    cd "Timeout Backend"
    npm run build
    cd ..
    
    success "Build completed"
else
    warn "Skipping build"
fi

# Validate configurations
log "Validating configurations"

# Check if required environment variables are set for production
if [[ "$ENVIRONMENT" == "production" ]]; then
    log "Validating production configuration"
    
    # Check frontend .env
    if [[ -f "Timeout Frontend/.env" ]]; then
        if ! grep -q "VITE_CLERK_PUBLISHABLE_KEY=pk_live_" "Timeout Frontend/.env"; then
            warn "Frontend: Production Clerk key not configured"
        fi
        if grep -q "VITE_DEMO_MODE=true" "Timeout Frontend/.env"; then
            warn "Frontend: Demo mode is enabled in production"
        fi
    fi
    
    # Check backend .env
    if [[ -f "Timeout Backend/.env" ]]; then
        if ! grep -q "CLERK_SECRET_KEY=sk_live_" "Timeout Backend/.env"; then
            warn "Backend: Production Clerk secret key not configured"
        fi
        if ! grep -q "NODE_ENV=production" "Timeout Backend/.env"; then
            warn "Backend: NODE_ENV is not set to production"
        fi
    fi
fi

# Set Firebase Functions environment variables
log "Configuring Firebase Functions environment"
cd "Timeout Backend"

if [[ -f ".env" ]]; then
    log "Setting Firebase Functions config from .env file"
    
    # Read .env file and set Firebase config
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ $key =~ ^#.*$ ]] && continue
        [[ -z $key ]] && continue
        
        # Remove quotes from value
        value=$(echo "$value" | sed 's/^"//;s/"$//')
        
        # Set Firebase config
        if [[ -n "$FIREBASE_TOKEN" ]]; then
            firebase functions:config:set "$key"="$value" --token "$FIREBASE_TOKEN" 2>/dev/null || true
        else
            firebase functions:config:set "$key"="$value" 2>/dev/null || true
        fi
    done < .env
    
    success "Firebase Functions environment configured"
else
    warn "No .env file found for backend configuration"
fi

cd ..

# Display deployment summary
log "Deployment configuration summary:"
echo "  Environment: $ENVIRONMENT"
echo "  Project ID: $PROJECT_ID"
echo "  Tests: $([ "$SKIP_TESTS" == true ] && echo "Skipped" || echo "Passed")"
echo "  Build: $([ "$SKIP_BUILD" == true ] && echo "Skipped" || echo "Completed")"

success "Deployment configuration completed successfully!"

log "Next steps:"
echo "  1. Review the configuration summary above"
echo "  2. Test the application locally if needed"
echo "  3. Deploy using: firebase deploy --project $PROJECT_ID"
echo ""
echo "To deploy specific components:"
echo "  - Functions only: firebase deploy --only functions --project $PROJECT_ID"
echo "  - Hosting only: firebase deploy --only hosting --project $PROJECT_ID"
echo "  - Rules only: firebase deploy --only firestore:rules --project $PROJECT_ID"