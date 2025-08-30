#!/bin/bash

echo "🔧 FIXING ALL BROKEN CONSOLE.ERROR PATTERNS"
echo "============================================"

# Fix unterminated console.error strings
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/console\.error('error);/console.error('Error:', error);/g" 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/console\.error(\"error);/console.error('Error:', error);/g" 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/console\.error('Error:', error\./console.error('Error:', error/g" 2>/dev/null

# Fix double quotes and missing parameters
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/console\.error(\", error)/console.error("Error:", error)/g' 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/console\.error(', error)/console.error('Error:', error)/g" 2>/dev/null

echo "✅ Fixed all broken console.error patterns"
