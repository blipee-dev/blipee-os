#!/bin/bash

echo "Fixing global syntax errors across all TypeScript files..."

# Fix all remaining TypeScript files with the syntax errors
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\([a-zA-Z0-9_]\)!/\1./g'

# Fix optional chaining - reverse any that got messed up
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\?\./\?\./g'

# Fix regex patterns that got broken
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\\\./\\./g'

# Fix import paths
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/'!\//'.\//g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/"!\//".\//g'

# Fix object destructuring and spread operators
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.\.\.,/...,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.\.\. }/...}/g'

# Fix array operations
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[.\./[.../g'

echo "Global syntax fixes completed!"