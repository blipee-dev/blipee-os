#!/bin/bash

# Read the service key from .env.local
SERVICE_KEY=$(grep "^SUPABASE_SERVICE_KEY=" .env.local | cut -d'=' -f2)

if [ -z "$SERVICE_KEY" ]; then
  echo "Error: SUPABASE_SERVICE_KEY not found in .env.local"
  exit 1
fi

echo "Adding SUPABASE_SERVICE_ROLE_KEY to Vercel..."
echo "$SERVICE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production

echo "Done! The environment variable has been added."