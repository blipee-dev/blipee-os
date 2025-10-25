#!/bin/bash

echo "🔧 FIXING REMAINING REQUEST ISSUES"
echo "================================="

# Get all remaining request-related errors and fix them
npm run type-check 2>&1 | grep "Cannot find name 'request'" | while read line; do
    file=$(echo "$line" | cut -d: -f1)
    echo "Fixing $file - request reference issue"
    
    # Check if file has _request parameter but uses request
    if grep -q "_request: NextRequest" "$file" && grep -q "request\." "$file"; then
        # Change parameter from _request to request
        sed -i '' 's/(_request: NextRequest)/(request: NextRequest)/g' "$file" 2>/dev/null
        sed -i '' 's/async function \([^(]*\)(_request: NextRequest/async function \1(request: NextRequest/g' "$file" 2>/dev/null
        sed -i '' 's/export async function \([^(]*\)(_request: NextRequest/export async function \1(request: NextRequest/g' "$file" 2>/dev/null
    fi
done

echo "✅ Fixed remaining request issues"
