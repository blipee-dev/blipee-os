#!/bin/bash

echo "Fixing array syntax errors..."

# Fix [!!Array(12)] pattern
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[\!\!\Array(\([0-9]*\))\]/[...Array(\1)]/g'

# Fix missing . in array methods
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\]map(/].map(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\]filter(/].filter(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\]reduce(/].reduce(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\]forEach(/].forEach(/g'

# Fix double !! usage
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/!!\([a-zA-Z_]*\)/.../g'

echo "Array syntax fixes completed!"