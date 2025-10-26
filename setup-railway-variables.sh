#!/bin/bash
# Railway Environment Variables Setup Script
# Run this AFTER you've logged in with: railway login

set -e  # Exit on error

echo "🚂 Setting up Railway environment variables..."
echo ""

# Check if logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Error: Not logged in to Railway"
    echo "Please run: railway login"
    exit 1
fi

echo "✅ Logged in to Railway"
echo ""

# Read from .env.local
echo "📖 Reading variables from .env.local..."
export $(grep -E "NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY" .env.local | xargs)

# Set variables in Railway
echo "🔧 Setting environment variables in Railway..."
echo ""

railway variables \
  --set "NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}" \
  --set "SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}" \
  --set "AGENT_POLL_INTERVAL_MS=60000" \
  --set "AGENT_HEARTBEAT_INTERVAL_MS=30000"

echo ""
echo "✅ Environment variables set successfully!"
echo ""
echo "📋 Verifying variables..."
railway variables

echo ""
echo "✅ Setup complete! Your Railway worker is configured."
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub: git push origin main"
echo "2. Railway will automatically deploy the worker"
echo "3. Monitor at: /settings/ai-prompts in your app"
