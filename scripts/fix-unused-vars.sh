#!/bin/bash

echo "Fixing unused variable errors..."

# Function to prefix unused parameters with underscore
fix_unused_params() {
    local file=$1
    local var=$2
    
    # For function parameters, prefix with underscore
    sed -i "s/(\([^)]*\)\b${var}\b/(\1_${var}/g" "$file"
    sed -i "s/, ${var}:/, _${var}:/g" "$file"
    sed -i "s/(${var}:/(_${var}:/g" "$file"
}

# Common unused parameters in route handlers
echo "Fixing unused request parameters in route handlers..."
find src/app/api -name "route.ts" | while read file; do
    # Fix unused request parameter
    sed -i 's/export async function \(GET\|POST\|PUT\|DELETE\|PATCH\)(request:/export async function \1(_request:/g' "$file"
    sed -i 's/}, request:/}, _request:/g' "$file"
done

# Fix specific unused imports
echo "Removing unused imports..."

# Remove unused imports from specific files
sed -i '/^import.*ChatRequest.*from.*ai-types/d' src/app/api/ai/chat/route.ts
sed -i '/^import.*aiService.*from.*service/d' src/app/api/ai/chat/route.ts
sed -i '/^import.*authService.*from.*auth-service/d' src/app/api/auth/signin/route.ts
sed -i '/^import.*complianceService.*from.*compliance-service/d' src/app/api/compliance/report/route.ts
sed -i '/^import.*createClient.*from.*supabase/d' src/app/api/import/sustainability-report/route.ts
sed -i '/^import.*getRateLimitService.*from.*rate-limit/d' src/app/api/security/stats/route.ts
sed -i '/^import.*cookies.*from.*next\/headers/d' src/app/api/auth/mfa/verify/route.ts
sed -i '/^import.*crypto.*from.*crypto/d' src/app/api/auth/mfa/verify/route.ts

# Fix unused destructured variables
echo "Fixing unused destructured variables..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { \([^,}]*\), userId }/const { \1 }/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/const { userId, \([^}]*\) }/const { \1 }/g'

# Fix unused function parameters by prefixing with underscore
echo "Fixing unused function parameters..."

# Common patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/(error:/(\_error:/g'
find src -name "*.tsx" | xargs sed -i 's/(event:/(\_event:/g'
find src -name "*.tsx" | xargs sed -i 's/(parent:/(\_parent:/g'

# Fix specific files with many unused icon imports
echo "Removing unused icon imports..."
for file in src/app/about/page.tsx src/app/ai-technology/page.tsx src/app/features/page.tsx src/app/industries/page.tsx src/app/page.tsx; do
    if [ -f "$file" ]; then
        # Comment out unused imports instead of removing to preserve structure
        sed -i 's/^import {/\/\/ Unused icons commented out\n\/\/ import {/' "$file"
    fi
done

echo "Unused variable fixes completed!"