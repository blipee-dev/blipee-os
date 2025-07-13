#!/bin/bash

echo "Fixing remaining auth route syntax errors..."

# Fix all remaining auth files with the syntax errors
find src/app/api/auth -name "*.ts" | xargs sed -i 's/\([a-zA-Z0-9_]\)!/\1./g'

# Fix array destructuring - replace !Array( with ?.
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!Array(/?.array(/g'

# Fix method calls with !
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!get(/\.get(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!post(/\.post(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!put(/\.put(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!delete(/\.delete(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!create(/\.create(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!update(/\.update(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!select(/\.select(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!from(/\.from(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!where(/\.where(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!eq(/\.eq(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!in(/\.in(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!not(/\.not(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!is(/\.is(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!single(/\.single(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!maybeSingle(/\.maybeSingle(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!then(/\.then(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!catch(/\.catch(/g'

# Fix array methods with !
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!map(/\.map(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!filter(/\.filter(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!find(/\.find(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!reduce(/\.reduce(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!forEach(/\.forEach(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!includes(/\.includes(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!indexOf(/\.indexOf(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!push(/\.push(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!pop(/\.pop(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!splice(/\.splice(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!slice(/\.slice(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!join(/\.join(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!split(/\.split(/g'

# Fix string methods with !
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!toString(/\.toString(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!replace(/\.replace(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!toLowerCase(/\.toLowerCase(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!toUpperCase(/\.toUpperCase(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!trim(/\.trim(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!substring(/\.substring(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!charAt(/\.charAt(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!charCodeAt(/\.charCodeAt(/g'

# Fix object methods with !
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!keys(/\.keys(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!values(/\.values(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!entries(/\.entries(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!hasOwnProperty(/\.hasOwnProperty(/g'

# Fix JSON methods with !
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!parse(/\.parse(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!stringify(/\.stringify(/g'

# Fix Date methods with !
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!getTime(/\.getTime(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!toISOString(/\.toISOString(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!now(/\.now(/g'

# Fix Promise methods with !
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!resolve(/\.resolve(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!reject(/\.reject(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!all(/\.all(/g'
find src/app/api/auth -name "*.ts" | xargs sed -i 's/!race(/\.race(/g'

echo "Remaining auth syntax fixes completed!"