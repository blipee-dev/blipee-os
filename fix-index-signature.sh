#!/bin/bash

# Fix index signature access issues by converting dot notation to bracket notation

# Fix process.env access
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\.SUPABASE_SERVICE_KEY/process.env['SUPABASE_SERVICE_KEY']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY/process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']/g"

# Fix common property access patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\.id\b/['id']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\.member_count\b/['member_count']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\.agent_id\b/['agent_id']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\.organization_id\b/['organization_id']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\.capabilities\b/['capabilities']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\.max_autonomy_level\b/['max_autonomy_level']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\.execution_interval\b/['execution_interval']/g"

echo "Fixed index signature access issues"