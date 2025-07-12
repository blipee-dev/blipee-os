#!/bin/bash

# Deploy to Staging Environment Script
# This script prepares and deploys the retail intelligence module to staging

set -e

echo "🚀 Deploying Retail Intelligence Module to Staging Environment"
echo "============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from project root.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}1. Running pre-deployment checks...${NC}"

# Check if tests pass
echo "   Running tests..."
npm run test:retail-module --silent || {
    echo -e "${RED}Tests failed! Please fix before deploying.${NC}"
    exit 1
}
echo -e "${GREEN}   ✓ Tests passed${NC}"

# Check TypeScript compilation
echo "   Checking TypeScript..."
npm run type-check || {
    echo -e "${RED}TypeScript errors! Please fix before deploying.${NC}"
    exit 1
}
echo -e "${GREEN}   ✓ TypeScript check passed${NC}"

# Check linting
echo "   Running linter..."
npm run lint || {
    echo -e "${RED}Linting errors! Please fix before deploying.${NC}"
    exit 1
}
echo -e "${GREEN}   ✓ Linting passed${NC}"

echo -e "\n${YELLOW}2. Building application...${NC}"
npm run build || {
    echo -e "${RED}Build failed!${NC}"
    exit 1
}
echo -e "${GREEN}   ✓ Build successful${NC}"

echo -e "\n${YELLOW}3. Preparing staging environment variables...${NC}"
if [ -f ".env.staging" ]; then
    echo -e "${GREEN}   ✓ Staging env file found${NC}"
    
    # Check for required variables
    required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "VIEWSONIC_API_KEY"
        "SALES_API_TOKEN"
        "TELEGRAM_BOT_TOKEN"
    )
    
    missing_vars=()
    for var in "${required_vars[@]}"; do
        if ! grep -q "^${var}=.*[^=]" .env.staging; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo -e "${RED}   Missing required environment variables:${NC}"
        printf '   - %s\n' "${missing_vars[@]}"
        echo -e "${YELLOW}   Please update .env.staging before deploying${NC}"
        exit 1
    fi
    echo -e "${GREEN}   ✓ All required variables present${NC}"
else
    echo -e "${RED}   .env.staging not found!${NC}"
    exit 1
fi

echo -e "\n${YELLOW}4. Deploying to Vercel staging...${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Vercel CLI not found. Installing...${NC}"
    npm i -g vercel
fi

# Deploy to staging
echo "   Deploying..."
vercel --prod --env-file=.env.staging --yes || {
    echo -e "${RED}Deployment failed!${NC}"
    exit 1
}

echo -e "\n${GREEN}✅ Deployment to staging complete!${NC}"

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls --json | jq -r '.deployments[0].url' 2>/dev/null || echo "Check Vercel dashboard")

echo -e "\n${YELLOW}5. Post-deployment steps:${NC}"
echo "   1. Test the deployment at: https://${DEPLOYMENT_URL}"
echo "   2. Verify retail module at: https://${DEPLOYMENT_URL}/retail"
echo "   3. Test API endpoints:"
echo "      - https://${DEPLOYMENT_URL}/api/retail/v1/health"
echo "      - https://${DEPLOYMENT_URL}/api/retail/v1/stores"
echo "   4. Verify Telegram bot still works"
echo "   5. Test ViewSonic sensor data collection"

echo -e "\n${YELLOW}6. Monitoring:${NC}"
echo "   - Check Vercel logs: vercel logs"
echo "   - Monitor performance: https://vercel.com/dashboard"
echo "   - Check error tracking in Sentry (if configured)"

echo -e "\n${GREEN}🎉 Staging deployment successful!${NC}"