#!/bin/bash

echo "🚀 Deploying Retail Module to Vercel"
echo "===================================="

# First, you need to login to Vercel if not already logged in
echo "Step 1: Checking Vercel authentication..."
vercel whoami || {
    echo "You need to login to Vercel first:"
    vercel login
}

echo -e "\nStep 2: Linking to your project (if needed)..."
if [ ! -d ".vercel" ]; then
    echo "Linking to your existing Blipee OS project..."
    vercel link
else
    echo "Project already linked ✓"
fi

echo -e "\nStep 3: Deploying with staging environment variables..."
echo "Deploying to: blipee-os.vercel.app"

# Deploy with staging env file
vercel --prod --env-file=.env.staging --yes

echo -e "\n✅ Deployment command executed!"
echo -e "\n🔄 Don't forget to update the Telegram webhook:"
echo "curl -X POST https://api.telegram.org/bot7320381187:AAGGqR6KIQySaEP7P_ucCf_9HV-gku7duM8/setWebhook \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"url\": \"https://blipee-os.vercel.app/api/retail/v1/telegram/webhook\"}'"