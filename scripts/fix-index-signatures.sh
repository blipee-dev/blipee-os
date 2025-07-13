#!/bin/bash

echo "Fixing index signature access issues..."

# Fix process.env access patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\.NEXT_PUBLIC_SUPABASE_URL/process.env['NEXT_PUBLIC_SUPABASE_URL']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\.SUPABASE_SERVICE_ROLE_KEY/process.env['SUPABASE_SERVICE_ROLE_KEY']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\.ENABLE_WEBHOOK_PROCESSOR/process.env['ENABLE_WEBHOOK_PROCESSOR']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\.NODE_ENV/process.env['NODE_ENV']/g"

# Fix object property access patterns that use index signatures
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\.energy/['energy']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\.temperature/['temperature']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\.report/['report']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\.savings/['savings']/g"

# Fix any remaining common env variables
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\.\([A-Z_][A-Z0-9_]*\)/process.env['\1']/g"

echo "Index signature fixes completed!"