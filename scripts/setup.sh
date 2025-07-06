#!/bin/bash

# Blipee OS Setup Script
# This script helps you set up Supabase and Vercel for Blipee OS

echo "🚀 Welcome to Blipee OS Setup!"
echo "================================"
echo ""

# Check if .env.local exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists. Backing up to .env.local.backup"
    cp .env.local .env.local.backup
fi

# Copy environment template
echo "📋 Creating .env.local from template..."
cp .env.example .env.local

echo ""
echo "🔧 Supabase Setup"
echo "-----------------"
echo "1. Go to https://supabase.com and create a new project"
echo "2. Once created, go to Settings → API"
echo "3. Copy your project URL and keys"
echo ""
read -p "Enter your Supabase URL: " SUPABASE_URL
read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY
read -p "Enter your Supabase Service Key: " SUPABASE_SERVICE_KEY

# Update .env.local with Supabase values
sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL|" .env.local
sed -i.bak "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|" .env.local
sed -i.bak "s|SUPABASE_SERVICE_KEY=.*|SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY|" .env.local

echo ""
echo "🤖 AI Provider Setup"
echo "--------------------"
echo "Choose your AI provider (you can add multiple):"
echo "1. OpenAI (GPT-4)"
echo "2. Anthropic (Claude)"
echo "3. Both"
echo ""
read -p "Enter your choice (1-3): " AI_CHOICE

if [ "$AI_CHOICE" = "1" ] || [ "$AI_CHOICE" = "3" ]; then
    read -p "Enter your OpenAI API Key: " OPENAI_KEY
    sed -i.bak "s|OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_KEY|" .env.local
fi

if [ "$AI_CHOICE" = "2" ] || [ "$AI_CHOICE" = "3" ]; then
    read -p "Enter your Anthropic API Key: " ANTHROPIC_KEY
    sed -i.bak "s|ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=$ANTHROPIC_KEY|" .env.local
fi

# Clean up backup files
rm -f .env.local.bak

echo ""
echo "✅ Environment variables configured!"
echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Setting up database..."
echo "Please run the following in your Supabase SQL editor:"
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Create a new query"
echo "4. Copy and paste the contents of: supabase/schema.sql"
echo "5. Run the query"
echo ""
read -p "Press Enter once you've run the schema..."

echo ""
echo "🚀 Vercel Deployment"
echo "-------------------"
echo "Choose deployment method:"
echo "1. Deploy now with Vercel CLI"
echo "2. Deploy via GitHub integration (recommended)"
echo "3. Skip deployment for now"
echo ""
read -p "Enter your choice (1-3): " DEPLOY_CHOICE

if [ "$DEPLOY_CHOICE" = "1" ]; then
    echo "Installing Vercel CLI..."
    npm i -g vercel
    echo ""
    echo "Deploying to Vercel..."
    vercel
elif [ "$DEPLOY_CHOICE" = "2" ]; then
    echo ""
    echo "📝 GitHub Integration Instructions:"
    echo "1. Push your code to GitHub"
    echo "2. Go to https://vercel.com"
    echo "3. Import your GitHub repository"
    echo "4. Add the same environment variables from .env.local"
    echo "5. Deploy!"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "✅ Next steps:"
echo "1. Run 'npm run dev' to start development"
echo "2. Open http://localhost:3000"
echo "3. Start building the future of building management!"
echo ""
echo "📚 Documentation:"
echo "- Vision: docs/vision/VISION.md"
echo "- Getting Started: docs/guides/GETTING_STARTED.md"
echo "- Architecture: docs/architecture/OVERVIEW.md"
echo ""
echo "Happy coding! 🚀"