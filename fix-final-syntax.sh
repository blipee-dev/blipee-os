#!/bin/bash

echo "Fixing final TypeScript syntax errors..."

# Fix malformed function parameters with _( pattern
find src/app/api -type f -name "*.ts" -exec sed -i '' \
  -e 's/export async function GET(\n  _(_request/export async function GET(\n  _request/g' \
  -e 's/export async function POST(\n  _(_request/export async function POST(\n  _request/g' \
  -e 's/export async function PUT(\n  _(_request/export async function PUT(\n  _request/g' \
  -e 's/export async function DELETE(\n  _(_request/export async function DELETE(\n  _request/g' \
  -e 's/export async function PATCH(\n  _(_request/export async function PATCH(\n  _request/g' {} \;

# Fix multiline patterns using perl for better multiline support
find src/app/api -type f -name "*.ts" -exec perl -i -pe 's/\n\s+_\(_request:/\n  _request:/g' {} \;

# Fix specific route patterns
find src/app/api -type f -name "route.ts" -exec sed -i '' \
  -e 's/_(_request/_request/g' {} \;

# Fix compliance routes with catch syntax issues
sed -i '' 's/} catch (error: any)/} catch (error)/g' src/app/api/compliance/data-export/route.ts
sed -i '' 's/} catch (error: any)/} catch (error)/g' src/app/api/compliance/deletion/route.ts

# Fix monitoring health route
sed -i '' 's/withAuth(withErrorHandler(async (_request: NextRequest, userId: string)/withAuth(withErrorHandler(async (_request: NextRequest, _userId: string)/g' src/app/api/monitoring/health/route.ts

echo "Final syntax fixes applied!"