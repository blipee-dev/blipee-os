#!/bin/bash

echo "🔧 FIXING REQUEST PARAMETER ISSUES"
echo "================================="

# Fix files where parameter is _request but body uses request
find src -name "*.ts" | while read file; do
    if grep -q "function.*_request: NextRequest" "$file" && grep -q "request\." "$file"; then
        echo "Fixing $file - changing _request parameter to request"
        sed -i '' 's/function \([^(]*\)(_request: NextRequest)/function \1(request: NextRequest)/g' "$file" 2>/dev/null
        sed -i '' 's/async function \([^(]*\)(_request: NextRequest)/async function \1(request: NextRequest)/g' "$file" 2>/dev/null
    fi
done

echo "✅ Fixed request parameter issues"
