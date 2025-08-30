#!/bin/bash

echo "🔧 FIXING UserResponse _error property issues"
echo "============================================="

# Fix UserResponse _error property access - should be error
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/authError || !user)/authError || !user)/g' 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/_error: authError/error: authError/g' 2>/dev/null

# More specific fixes for destructuring patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/const { data: { user }, _error:/const { data: { user }, error:/g' 2>/dev/null

echo "✅ Fixed UserResponse _error properties"
