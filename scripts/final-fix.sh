#!/bin/bash

echo "Performing final targeted fixes..."

# Restore any broken destructuring
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/for (const \[key, _\] of/for (const [key, value] of/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/for (const \[, _\] of/for (const [key, value] of/g'

# Fix specific broken syntax
sed -i 's/icon: TrendingUp,/icon: () => null,/g' src/app/features/page.tsx
sed -i 's/icon: Heart,/icon: () => null,/g' src/app/industries/page.tsx
sed -i 's/icon: TrendingDown,/icon: () => null,/g' src/app/page.tsx
sed -i 's/icon: Shield,/icon: () => null,/g' src/app/page.tsx

# Fix broken object syntax
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/{ *interactive *,/{ interactive: interactive,/g'

echo "Final fixes completed!"