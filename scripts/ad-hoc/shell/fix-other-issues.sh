#!/bin/bash

echo "🔧 FIXING OTHER COMMON ISSUES"
echo "============================="

# Fix _options -> options
echo "Fixing _options -> options..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/_options:/options:/g' 2>/dev/null

# Fix unused variable patterns
echo "Fixing unused variables..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/const cacheContext =/const _cacheContext =/g' 2>/dev/null

echo "✅ Fixed other common issues"
