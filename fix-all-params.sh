#!/bin/bash

echo "Fixing all function parameter syntax errors..."

# Fix all route files with malformed parameter syntax
find src/app/api -type f -name "*.ts" -exec grep -l "(_request:" {} \; | while read file; do
  echo "Fixing $file"
  # Fix the pattern where we have (_request: instead of _request:
  sed -i '' 's/(\s*(_request:/(_request:/g' "$file"
  sed -i '' 's/export async function \([A-Z]*\)(\s*\n\s*(_request:/export async function \1(\n  _request:/g' "$file"
  sed -i '' 's/export async function \([A-Z]*\)(\s*\n\s*(_request/export async function \1(\n  _request/g' "$file"
done

# Fix monitoring routes with wrong async syntax
echo "Fixing monitoring routes..."
sed -i '' 's/export const DELETE = createMonitoredHandler(async ((_request:/export const DELETE = createMonitoredHandler(async (_request:/g' src/app/api/monitoring/alerts/\[id\]/route.ts 2>/dev/null || true
sed -i '' 's/export const GET = createMonitoredHandler(async ((_request:/export const GET = createMonitoredHandler(async (_request:/g' src/app/api/monitoring/dashboard/route.ts 2>/dev/null || true

# Fix routes where request is used instead of _request
echo "Fixing request variable references..."
find src/app/api/monitoring -type f -name "*.ts" -exec grep -l "await requireAuth(request," {} \; | while read file; do
  echo "Fixing request references in $file"
  sed -i '' 's/await requireAuth(request,/await requireAuth(_request,/g' "$file"
done

# Fix organization routes
echo "Fixing organization routes..."
find src/app/api/organizations -type f -name "*.ts" -exec grep -l "(_request:" {} \; | while read file; do
  echo "Fixing $file"
  sed -i '' 's/export async function \([A-Z]*\)(\s*\n\s*(_request:/export async function \1(\n  _request:/g' "$file"
done

# Fix conversation routes
echo "Fixing conversation routes..."
find src/app/api/conversations -type f -name "*.ts" -exec grep -l "(_request:" {} \; | while read file; do
  echo "Fixing $file"
  sed -i '' 's/export async function \([A-Z]*\)(\s*\n\s*(_request:/export async function \1(\n  _request:/g' "$file"
done

echo "All parameter syntax fixes applied!"