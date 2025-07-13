#!/bin/bash

echo "Fixing validation schema syntax errors..."

# Fix Zod method chains with exclamation marks to dots
find src/lib/validation -name "*.ts" | xargs sed -i 's/!min(/\.min(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!max(/\.max(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!regex(/\.regex(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!optional(/\.optional(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!default(/\.default(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!nullable(/\.nullable(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!refine(/\.refine(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!transform(/\.transform(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!catch(/\.catch(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!describe(/\.describe(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!email(/\.email(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!url(/\.url(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!uuid(/\.uuid(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!pipe(/\.pipe(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!length(/\.length(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!gt(/\.gt(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!gte(/\.gte(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!lt(/\.lt(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!lte(/\.lte(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!positive(/\.positive(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!negative(/\.negative(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!nonnegative(/\.nonnegative(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!nonpositive(/\.nonpositive(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!int(/\.int(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!array(/\.array(/g'
find src/lib/validation -name "*.ts" | xargs sed -i 's/!nonempty(/\.nonempty(/g'

echo "Validation schema fixes completed!"