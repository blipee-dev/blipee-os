#!/bin/bash

# Deploy Retail Module to Existing Vercel Project
# This script deploys to your existing Blipee OS Vercel project

set -e

echo "🚀 Deploying Retail Module to Existing Blipee OS Project"
echo "======================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from project root.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}1. Pre-deployment checks...${NC}"

# Run tests
echo "   Running retail module tests..."
npm run test:retail-module --silent || {
    echo -e "${YELLOW}   Warning: Some tests failed. Continue anyway? (y/n)${NC}"
    read -r response
    if [[ "$response" != "y" ]]; then
        exit 1
    fi
}

# Check TypeScript
echo "   Checking TypeScript..."
npm run type-check || {
    echo -e "${YELLOW}   Warning: TypeScript errors found. Continue? (y/n)${NC}"
    read -r response
    if [[ "$response" != "y" ]]; then
        exit 1
    fi
}

echo -e "\n${YELLOW}2. Building application...${NC}"
npm run build || {
    echo -e "${RED}Build failed!${NC}"
    exit 1
}
echo -e "${GREEN}   ✓ Build successful${NC}"

echo -e "\n${YELLOW}3. Checking environment variables...${NC}"
if [ ! -f ".env.staging" ]; then
    echo -e "${RED}   .env.staging not found!${NC}"
    exit 1
fi

# Check for admin chat ID
if grep -q "your-admin-chat-id-here" .env.staging; then
    echo -e "${YELLOW}   ⚠️  TELEGRAM_ADMIN_CHAT_ID not set!${NC}"
    echo -e "${YELLOW}   Get your chat ID by running:${NC}"
    echo "   curl https://api.telegram.org/bot7320381187:AAGGqR6KIQySaEP7P_ucCf_9HV-gku7duM8/getUpdates"
    echo -e "${YELLOW}   Add it to .env.staging line 36${NC}"
    echo -e "${YELLOW}   Continue without it? (y/n)${NC}"
    read -r response
    if [[ "$response" != "y" ]]; then
        exit 1
    fi
fi

echo -e "\n${YELLOW}4. Deploying to Vercel...${NC}"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}   Installing Vercel CLI...${NC}"
    npm i -g vercel
fi

# Check if project is linked
if [ ! -d ".vercel" ]; then
    echo -e "${YELLOW}   Linking to Vercel project...${NC}"
    vercel link
fi

# Deploy with staging environment
echo -e "${YELLOW}   Deploying to your existing Vercel project...${NC}"
echo -e "${YELLOW}   Using environment: staging${NC}"

# Deploy to preview URL first
DEPLOYMENT_URL=$(vercel --env-file=.env.staging --yes)

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}Preview URL: ${DEPLOYMENT_URL}${NC}"
    
    echo -e "\n${YELLOW}5. Do you want to promote to production? (y/n)${NC}"
    read -r response
    if [[ "$response" == "y" ]]; then
        vercel --prod --env-file=.env.staging --yes
        echo -e "${GREEN}✅ Promoted to production!${NC}"
    fi
else
    echo -e "${RED}Deployment failed!${NC}"
    exit 1
fi

echo -e "\n${YELLOW}6. Post-deployment steps:${NC}"
echo "   1. Update Telegram webhook:"
echo "      curl -X POST https://api.telegram.org/bot7320381187:AAGGqR6KIQySaEP7P_ucCf_9HV-gku7duM8/setWebhook \\"
echo "        -H \"Content-Type: application/json\" \\"
echo "        -d '{\"url\": \"${DEPLOYMENT_URL}/api/retail/v1/telegram/webhook\"}'"
echo ""
echo "   2. Test the deployment:"
echo "      - Web: ${DEPLOYMENT_URL}/retail"
echo "      - API: ${DEPLOYMENT_URL}/api/retail/v1/health"
echo "      - Telegram: Send /help to your bot"
echo ""
echo "   3. Monitor logs:"
echo "      vercel logs --follow"

echo -e "\n${GREEN}🎉 Retail Module deployed to your Blipee OS project!${NC}"