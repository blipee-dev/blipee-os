#!/bin/bash

# Railway Deployment Script for Agent Worker
# Usage: ./scripts/deploy-railway.sh

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🚂 Railway Deployment - Blipee AI Agent Worker         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found${NC}"
    echo ""
    echo "Please install Railway CLI first:"
    echo "  npm install -g @railway/cli"
    echo ""
    echo "Then login:"
    echo "  railway login"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI found${NC}"
echo ""

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Railway${NC}"
    echo ""
    echo "Please login first:"
    echo "  railway login"
    exit 1
fi

echo -e "${GREEN}✅ Logged in to Railway${NC}"
echo ""

# Check if project is linked
if ! railway status &> /dev/null; then
    echo -e "${YELLOW}⚠️  No Railway project linked${NC}"
    echo ""
    echo "Options:"
    echo "  1. Link to existing project: railway link"
    echo "  2. Create new project: railway init"
    echo ""
    read -p "Would you like to create a new project? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        railway init
    else
        echo "Please run 'railway link' or 'railway init' first"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Railway project linked${NC}"
echo ""

# Pre-deployment checklist
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Pre-Deployment Checklist"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for required files
echo -e "${BLUE}Checking required files...${NC}"

required_files=(
    "railway.json"
    "Dockerfile.worker"
    "supervisord.conf"
    "package.json"
    "src/workers/agent-worker.ts"
    "services/forecast-service/main.py"
)

all_files_present=true
for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓${NC} $file"
    else
        echo -e "  ${RED}✗${NC} $file ${RED}(MISSING)${NC}"
        all_files_present=false
    fi
done

if [ "$all_files_present" = false ]; then
    echo ""
    echo -e "${RED}❌ Some required files are missing${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}Checking environment variables...${NC}"

# Check if environment variables are set
required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "OPENAI_API_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if railway variables get "$var" &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $var (set)"
    else
        echo -e "  ${YELLOW}!${NC} $var ${YELLOW}(not set)${NC}"
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Missing environment variables:${NC}"
    for var in "${missing_vars[@]}"; do
        echo "    - $var"
    done
    echo ""
    echo "Set them using:"
    echo "  railway variables set $var=\"your-value\""
    echo ""
    echo "Or import from .env file:"
    echo "  railway variables set --file .env.production"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Starting Deployment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Show what will be deployed
echo -e "${BLUE}Deployment Configuration:${NC}"
echo "  • Builder: Dockerfile"
echo "  • Dockerfile: Dockerfile.worker"
echo "  • Services: agent-worker + prophet-service"
echo "  • Health Check: /health (timeout: 300s)"
echo "  • Restart Policy: ON_FAILURE (max 10 retries)"
echo ""

read -p "Proceed with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled"
    exit 0
fi

echo ""
echo -e "${BLUE}Deploying to Railway...${NC}"
echo ""

# Deploy
if railway up; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${GREEN}✅ Deployment initiated successfully!${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    echo "📊 Monitoring deployment..."
    echo ""
    echo "View logs:"
    echo "  railway logs --follow"
    echo ""
    echo "Check service status:"
    echo "  railway status"
    echo ""
    echo "Open in browser:"
    echo "  railway open"
    echo ""

    read -p "Open logs now? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        railway logs --follow
    else
        echo ""
        echo -e "${GREEN}Deployment complete!${NC}"
        echo ""
        echo "Monitor your deployment at:"
        echo "  https://railway.app"
        echo ""
    fi
else
    echo ""
    echo -e "${RED}❌ Deployment failed${NC}"
    echo ""
    echo "Check logs for errors:"
    echo "  railway logs"
    exit 1
fi
