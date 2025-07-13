#!/bin/bash

echo "Fixing destructuring and object syntax errors..."

# Fix object destructuring that got broken by previous scripts
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/{ *\}/{}}/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/{}/{ }/g'

# Fix specific issues in problematic files
# Fix extractedData issue in chat-enhanced
sed -i 's/extractedData,/extractedData: extractedData,/g' src/app/api/ai/chat-enhanced/route.ts

# Fix commented import lines that are invalid
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '/^\/\/ import.*from.*$/d'

# Fix object spread patterns that got broken
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[,/[,/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/},}/}/g'

# Fix array destructuring patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\], \]/]/g'

# Fix specific object patterns in sustainability report
sed -i 's/annual['energy']/annual.energy/g' src/app/api/documents/sustainability-report/route.ts
sed -i 's/annual['temperature']/annual.temperature/g' src/app/api/documents/sustainability-report/route.ts

echo "Destructuring syntax fixes completed!"