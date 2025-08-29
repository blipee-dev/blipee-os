#!/bin/bash

# Fix route handler parameter syntax issues
# Pattern: async function handler((_request: NextRequest) { 
# Should be: async function handler(_request: NextRequest) {

echo "Fixing route handler parameter syntax issues..."

# Fix patterns like ((_request: NextRequest) to (_request: NextRequest)
find src/app/api -name "*.ts" -type f | while read file; do
  # Fix double parenthesis pattern
  sed -i '' 's/async function \([a-zA-Z]*\)((\(_request: NextRequest\)/async function \1(\2/g' "$file"
  
  # Fix patterns with route params
  sed -i '' 's/export async function \([A-Z]*\)((\(_request: NextRequest\)/export async function \1(\2/g' "$file"
done

# Fix patterns with route context params
find src/app/api -name "*.ts" -type f | while read file; do
  # Fix patterns like ((_request: NextRequest, { params }: { params: { id: string } })
  sed -i '' 's/((\(_request: NextRequest,/(\1/g' "$file"
done

# Fix arrow function patterns
find src/app/api -name "*.ts" -type f | while read file; do
  # Fix patterns like }) => { at the end of parameter lists
  sed -i '' 's/}\))$/})/g' "$file"
done

echo "Route parameter fixes complete!"