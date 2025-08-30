#!/bin/bash

echo "🔧 FIXING error/_error NAMING CONSISTENCY"
echo "========================================="

# Fix _error references in catch blocks - should be error
echo "Fixing error variable references in catch blocks..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/} catch (_error:/} catch (error:/g' 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/console.error(.*_error:/console.error(/g' 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/_error\.message/error.message/g' 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/_error\.stack/error.stack/g' 2>/dev/null

# Fix response objects to use error instead of _error property
echo "Fixing response objects to use error property..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/{ _error:/{ error:/g' 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/_error: error\.message/_error: error.message/g' 2>/dev/null

# Fix destructuring patterns
echo "Fixing destructuring patterns..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/error: _error/error/g' 2>/dev/null
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/const { data, _error }/const { data, error }/g' 2>/dev/null

echo "✅ Fixed error naming consistency"
