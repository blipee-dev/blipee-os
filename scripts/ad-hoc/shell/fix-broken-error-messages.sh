#!/bin/bash

echo "🔧 FIXING BROKEN ERROR MESSAGE REFERENCES"
echo "========================================"

# Fix broken .message references (should be error.message or _error.message)
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/error instanceof Error ? \.message/error instanceof Error ? error.message/g' 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/_error: \.message/_error: error.message/g' 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/{ error: \.message/{ error: error.message/g' 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/\.message || /error.message || /g' 2>/dev/null

# Fix specific patterns where the error variable name was lost
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/&& _\.message/\&\& _error.message/g' 2>/dev/null

echo "✅ Fixed broken error message references"
