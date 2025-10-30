#!/bin/bash

echo "🔍 Testing different connection methods..."
echo ""

# Try pooler ports
echo "1️⃣ Trying pooler (transaction mode - port 6543)..."
PGPASSWORD="MG5faEtcGRvBWkn1" timeout 5 psql \
  -h aws-0-us-west-1.pooler.supabase.com \
  -p 6543 \
  -U postgres.quovvwrwyfkzhgqdeham \
  -d postgres \
  -c "SELECT 'Pooler 6543 works!' as status;" 2>&1 | head -3

echo ""
echo "2️⃣ Trying pooler (session mode - port 5432)..."
PGPASSWORD="MG5faEtcGRvBWkn1" timeout 5 psql \
  -h aws-0-us-west-1.pooler.supabase.com \
  -p 5432 \
  -U postgres.quovvwrwyfkzhgqdeham \
  -d postgres \
  -c "SELECT 'Pooler 5432 works!' as status;" 2>&1 | head -3

echo ""
echo "3️⃣ Trying direct connection (old method)..."
PGPASSWORD="MG5faEtcGRvBWkn1" timeout 5 psql \
  -h db.quovvwrwyfkzhgqdeham.supabase.co \
  -U postgres \
  -d postgres \
  -c "SELECT 'Direct works!' as status;" 2>&1 | head -3

