#!/bin/bash

echo "Fixing remaining syntax errors..."

# Fix extra periods after brackets
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\]\./]/g"

# Fix extra periods in specific patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\['NEXT_PUBLIC_SUPABASE_URL'\]\./['NEXT_PUBLIC_SUPABASE_URL']/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\['SUPABASE_SERVICE_ROLE_KEY'\]\./['SUPABASE_SERVICE_ROLE_KEY']/g"

# Fix array syntax with extra periods
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/\]\./]/g"

# Fix error?.message patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/error?message/error?.message/g"

# Fix specific patterns from the errors
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/request!headers!get/request.headers.get/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/formData!get/formData.get/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/files!push/files.push/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/files!length/files.length/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/conversationalEngine!chat/conversationalEngine.chat/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/contextualResponse!response/contextualResponse.response/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/contextualResponse!visualizations/contextualResponse.visualizations/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/files!map/files.map/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/error!message/error.message/g"

# Fix exclamation marks that are incorrectly placed
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/console!log/console.log/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/console!error/console.error/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/Date!now/Date.now/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/NextResponse!json/NextResponse.json/g"

echo "Syntax fixes completed!"