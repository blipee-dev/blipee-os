#!/bin/bash

# Apply GRI additional standards migration
# This creates tables for GRI 304 (Biodiversity), 307 (Compliance), 308 (Suppliers)

echo "Applying GRI additional standards migration..."

PGPASSWORD="MG5faEtcGRvBWkn1" psql \
  -h aws-0-eu-central-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.yrbmmymayojycyszUnis \
  -d postgres \
  -f supabase/migrations/20251014_gri_additional_standards.sql

echo ""
echo "✅ Migration complete!"
echo ""
echo "Verifying tables..."

PGPASSWORD="MG5faEtcGRvBWkn1" psql \
  -h aws-0-eu-central-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.yrbmmymayojycyszUnis \
  -d postgres \
  -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('environmental_incidents', 'suppliers', 'biodiversity_sites') ORDER BY table_name;"

echo ""
echo "Checking materials metrics..."

PGPASSWORD="MG5faEtcGRvBWkn1" psql \
  -h aws-0-eu-central-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.yrbmmymayojycyszUnis \
  -d postgres \
  -c "SELECT COUNT(*) as materials_metrics FROM metrics_catalog WHERE category ILIKE '%Material%';"
