#!/bin/bash

echo "Fixing ALL function parameter syntax errors comprehensively..."

# Find all TypeScript files and fix the pattern where we have (_request: instead of _request:
find src/app/api -type f -name "*.ts" -exec perl -i -pe '
  # Fix function declarations with (_request
  s/^export async function ([A-Z]+)\(\s*\n\s*\(_request:/export async function $1(\n  _request:/gm;
  
  # Fix inline patterns
  s/\(\s*\(_request:/(_request:/g;
  
  # Fix trailing commas after params
  s/\{ params \}: \{ params: \{ [^}]+ \} \},$/{ params }: { params: { $1 } }/gm;
' {} \;

# More specific fixes for organization routes
for file in src/app/api/organizations/\[id\]/*.ts; do
  echo "Fixing organization route: $file"
  perl -i -pe '
    s/export async function ([A-Z]+)\(\s*\n\s*\(_request: NextRequest,\s*\n\s*\{ params \}: \{ params: \{ id: string \} \},/export async function $1(\n  _request: NextRequest,\n  { params }: { params: { id: string } }/gm;
  ' "$file"
done

# Fix conversation routes
for file in src/app/api/conversations/\[conversationId\]/*.ts; do
  echo "Fixing conversation route: $file"
  perl -i -pe '
    s/export async function ([A-Z]+)\(\s*\n\s*\(_request: NextRequest,\s*\n\s*\{ params \}: \{ params: \{ conversationId: string \} \}/export async function $1(\n  _request: NextRequest,\n  { params }: { params: { conversationId: string } }/gm;
  ' "$file"
done

echo "Comprehensive parameter fixes applied!"