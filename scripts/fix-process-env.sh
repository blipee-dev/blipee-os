#!/bin/bash

# Script to fix process.env access to use bracket notation

echo "Fixing process.env access patterns..."

# List of environment variables to fix
ENV_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "SUPABASE_SERVICE_KEY"
  "NEXT_PUBLIC_APP_URL"
  "OPENAI_API_KEY"
  "DEEPSEEK_API_KEY"
  "ANTHROPIC_API_KEY"
  "OPENWEATHERMAP_API_KEY"
  "ELECTRICITY_MAPS_API_KEY"
  "DATABASE_URL"
  "DIRECT_URL"
  "NODE_ENV"
  "ANALYZE"
  "VERCEL_URL"
  "PORT"
)

# Fix each environment variable
for var in "${ENV_VARS[@]}"; do
  echo "Fixing process.env.$var..."
  find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\.$var/process.env['$var']/g"
done

echo "Process.env fixes completed!"