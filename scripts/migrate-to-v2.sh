#!/bin/bash

# =====================================================
# MIGRATE TO V2.0.0 FORTUNE 10 SCHEMA
# =====================================================
# This script will DROP ALL DATA and create the new schema

set -e  # Exit on error

echo "🚀 Blipee OS - Fortune 10 Database Migration"
echo "============================================"
echo ""
echo "⚠️  WARNING: This will DELETE ALL DATA in your database!"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Migration cancelled."
    exit 1
fi

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "❌ .env.local not found!"
    exit 1
fi

# Extract connection details from Supabase URL
# Format: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo "❌ Could not parse DATABASE_URL"
    echo "Using Supabase credentials instead..."
    
    # Alternative: Use Supabase project details
    if [ -z "$SUPABASE_DB_PASSWORD" ]; then
        read -p "Enter Supabase database password: " SUPABASE_DB_PASSWORD
    fi
    
    # Extract host from Supabase URL
    if [[ $NEXT_PUBLIC_SUPABASE_URL =~ https://([^.]+) ]]; then
        PROJECT_REF="${BASH_REMATCH[1]}"
        DB_HOST="db.${PROJECT_REF}.supabase.co"
        DB_PORT="5432"
        DB_USER="postgres"
        DB_PASS="$SUPABASE_DB_PASSWORD"
        DB_NAME="postgres"
    else
        echo "❌ Could not determine database host"
        exit 1
    fi
fi

echo ""
echo "📊 Database Connection:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   User: $DB_USER"
echo "   Database: $DB_NAME"
echo ""

# Create backup first
echo "📦 Creating backup..."
BACKUP_FILE="backup/pre-v2-migration-$(date +%Y%m%d-%H%M%S).sql"
mkdir -p backup

PGPASSWORD=$DB_PASS pg_dump \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    --no-owner \
    --no-acl \
    > $BACKUP_FILE

echo "✅ Backup saved to: $BACKUP_FILE"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql command not found. Please install PostgreSQL client."
    echo "   Mac: brew install postgresql"
    echo "   Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Navigate to migrations directory
cd supabase/migrations

# Run the migration
echo "🔄 Running migration..."
echo ""

PGPASSWORD=$DB_PASS psql \
    -h $DB_HOST \
    -p $DB_PORT \
    -U $DB_USER \
    -d $DB_NAME \
    -f DROP_AND_CREATE_V2.sql

echo ""
echo "✅ Migration complete!"
echo ""

# Generate TypeScript types
echo "📝 Generating TypeScript types..."
cd ../..

if command -v supabase &> /dev/null; then
    npx supabase gen types typescript --project-id $PROJECT_REF > src/types/database.v2.ts
    echo "✅ Types generated at: src/types/database.v2.ts"
else
    echo "⚠️  Supabase CLI not found. Please generate types manually:"
    echo "   npx supabase gen types typescript --project-id $PROJECT_REF > src/types/database.v2.ts"
fi

echo ""
echo "🎉 Migration to Fortune 10 schema complete!"
echo ""
echo "Next steps:"
echo "1. Update your application code to use the new schema"
echo "2. Replace src/types/database.ts with database.v2.ts"
echo "3. Update API routes and queries"
echo "4. Test the application: npm run dev"
echo ""
echo "If you need to rollback:"
echo "psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < $BACKUP_FILE"
echo ""