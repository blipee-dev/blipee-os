#!/bin/bash

# Script to apply the handle_new_user race condition fix
# This adds a unique constraint and improves the trigger logic

echo "🔧 Applying handle_new_user race condition fix..."
echo ""

PGPASSWORD="MG5faEtcGRvBWkn1" psql \
  -h aws-0-eu-central-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.yrbmmymayojycyszUnis \
  -d postgres \
  -f supabase/migrations/20251015_fix_handle_new_user_race_condition.sql

echo ""
echo "✅ Migration applied successfully!"
echo ""
echo "What was fixed:"
echo "  1. Added UNIQUE constraint on auth_user_id"
echo "  2. Improved trigger to check for existing auth_user_id first"
echo "  3. Better error handling for unique violations"
echo "  4. Race condition protection enabled"
