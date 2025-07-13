#!/bin/bash

echo "Fixing incorrect optional chaining syntax..."

# Fix incorrect ?. usage after array methods
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.?.map(/\.map(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.?.filter(/\.filter(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.?.split(/\.split(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.?.toFixed(/\.toFixed(/g'

# Fix incorrect usage with arrays
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\]\.?\.map(/\]\.map(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\]\.?\.filter(/\]\.filter(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\]\.\?/\]\./g'

# Fix double ?. usage
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\?\.\?/\?/g'

# Fix specific patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/org\?\.\['member_count'\]/org\?.['member_count']/g"

# Fix error?.message patterns - should be error?.message
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/error\?\./error\./g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/error\.message/error?.message/g'

# Fix split patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/email\.\?\.split/email?.split/g"
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i "s/key\.\?\.split/key?.split/g"

# Remove double || operators
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/ || "Unknown error" || / || /g'

echo "Optional chaining fixes completed!"