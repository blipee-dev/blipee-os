#!/bin/bash

echo "Fixing incorrect exclamation marks..."

# Replace all ! that should be . (except legitimate uses)
find src -name "*.ts" -o -name "*.tsx" | while read file; do
  # Fix property access after objects and method calls
  sed -i 's/\([a-zA-Z0-9_]\)!/\1./g' "$file"
  
  # Fix after closing parentheses, brackets, and array declarations  
  sed -i 's/\]!/\]./g' "$file"
  sed -i 's/)!/)./g' "$file"
  
  # Fix specific patterns that are legitimate exclamation marks
  sed -i 's/blipee OS\./blipee OS!/g' "$file"
  
  # Fix legitimate not operators
  sed -i 's/if (\.super)/if (!super)/g' "$file"
  sed -i 's/if (\.\.ssoConfig)/if (!!ssoConfig)/g' "$file"
  sed -i 's/if (\.\.error)/if (!!error)/g' "$file"
  sed -i 's/if (\.\.member)/if (!!member)/g' "$file"
  sed -i 's/if (\.\.data)/if (!!data)/g' "$file"
  sed -i 's/\.\.\./\.\.\./g' "$file"
  
  # Fix decimal numbers that got messed up
  sed -i 's/0\.1/0.1/g' "$file"
  sed -i 's/0\.5/0.5/g' "$file"
  sed -i 's/0\.7/0.7/g' "$file"
  sed -i 's/0\.8/0.8/g' "$file"
  sed -i 's/0\.9/0.9/g' "$file"
  sed -i 's/0\.95/0.95/g' "$file"
  sed -i 's/1\.02/1.02/g' "$file"
  sed -i 's/1\.05/1.05/g' "$file"
  sed -i 's/1\.08/1.08/g' "$file"
  sed -i 's/1\.1/1.1/g' "$file"
  sed -i 's/1\.12/1.12/g' "$file"
  sed -i 's/1\.13/1.13/g' "$file"
  sed -i 's/1\.15/1.15/g' "$file"
  sed -i 's/1\.17/1.17/g' "$file"
  sed -i 's/1\.18/1.18/g' "$file"
  sed -i 's/1\.2/1.2/g' "$file"
  sed -i 's/2\.1/2.1/g' "$file"
  sed -i 's/2\.5/2.5/g' "$file"
  sed -i 's/21\.8/21.8/g' "$file"
  sed -i 's/22\.1/22.1/g' "$file"
  sed -i 's/22\.5/22.5/g' "$file"
  sed -i 's/23\.1/23.1/g' "$file"
  sed -i 's/23\.5/23.5/g' "$file"
  sed -i 's/18\.5/18.5/g' "$file"
  sed -i 's/45\.2/45.2/g' "$file"
  sed -i 's/72\.5/72.5/g' "$file"
  sed -i 's/78\.5/78.5/g' "$file"
  sed -i 's/85\.3/85.3/g' "$file"
  sed -i 's/99\.2/99.2/g' "$file"
  sed -i 's/99\.8/99.8/g' "$file"
  sed -i 's/99\.9/99.9/g' "$file"
  sed -i 's/146\.8/146.8/g' "$file"
  sed -i 's/342\.5/342.5/g' "$file"
  
  # Fix array spread operator that got messed up
  sed -i 's/\[\.\.\.Array/[...Array/g' "$file"
  sed -i 's/{\.\.\./{.../g' "$file"
  
  # Fix legitimate exclamation marks in strings
  sed -i 's/magic\./magic!/g' "$file"
  sed -i 's/together\./together!/g' "$file"
  sed -i 's/planet\./planet!/g' "$file"
  sed -i 's/torture\./torture!/g' "$file"
  sed -i 's/technology\./technology!/g' "$file"
  sed -i 's/imagined\./imagined!/g' "$file"
  sed -i 's/business\./business!/g' "$file"
  sed -i 's/goals\./goals!/g' "$file"
  sed -i 's/future\./future!/g' "$file"
  sed -i 's/impact\./impact!/g' "$file"
done

# Fix remaining .! patterns that should be !.
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.!/!./g'

# Fix .map and similar methods that got double dots
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.\.map(/.map(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.\.filter(/.filter(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.\.includes(/.includes(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.\.some(/.some(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.\.forEach(/.forEach(/g'

# Fix specific TypeScript patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/z!./z./g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/!from(/from(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/Date!./Date./g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/Math!./Math./g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/JSON!./JSON./g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/Object!./Object./g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/Array!./Array./g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/Buffer!./Buffer./g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/console!./console./g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/process!./process./g'

# Fix file extensions
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\['"'"'!.pdf/['"'"'.pdf/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\['"'"'!.csv/['"'"'.csv/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\['"'"'!.png/['"'"'.png/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\['"'"'!.jpg/['"'"'.jpg/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\['"'"'!.xlsx/['"'"'.xlsx/g'

# Fix motion.div and similar
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/<motion!./<motion./g'

# Fix spread operators in JSX
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/{!./{.../g'

echo "Exclamation mark fixes completed!"