#!/bin/bash

echo "🔧 FIXING BROKEN CONSOLE.ERROR STATEMENTS"
echo "========================================="

# Fix broken console.error patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/console\.error(\'/console.error('/g" 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/console\.error(\", /console.error(\"/g' 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s/console\.error(\', /console.error('/" 2>/dev/null

echo "✅ Fixed console.error statements"
