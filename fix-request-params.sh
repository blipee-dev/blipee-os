#!/bin/bash

echo "Fixing missing request parameters in API routes..."

# Fix compliance routes that are missing request parameter but use request
files=(
  "src/app/api/compliance/consent/route.ts"
  "src/app/api/compliance/data-export/route.ts"
  "src/app/api/compliance/deletion/route.ts"
  "src/app/api/compliance/privacy-settings/route.ts"
)

for file in "${files[@]}"; do
  if [[ -f "$file" ]]; then
    echo "Fixing $file..."
    
    # Add request parameter to GET functions that use request but don't have it
    sed -i 's/export async function GET(/export async function GET(request: NextRequest,/g' "$file"
    
    # Add request parameter to POST functions that use request but don't have it  
    sed -i 's/export async function POST(/export async function POST(request: NextRequest,/g' "$file"
    
    # Add request parameter to PUT functions that use request but don't have it
    sed -i 's/export async function PUT(/export async function PUT(request: NextRequest,/g' "$file"
    
    # Add request parameter to DELETE functions that use request but don't have it
    sed -i 's/export async function DELETE(/export async function DELETE(request: NextRequest,/g' "$file"
    
    # Fix any double commas that might be created
    sed -i 's/request: NextRequest,, /request: NextRequest, /g' "$file"
    sed -i 's/request: NextRequest,) {/request: NextRequest) {/g' "$file"
  fi
done

# Fix SSO routes that have unused request parameters
sso_files=(
  "src/app/api/auth/sso/configurations/[id]/route.ts"
  "src/app/api/auth/sso/configurations/[id]/test/route.ts"
)

for file in "${sso_files[@]}"; do
  if [[ -f "$file" ]]; then
    echo "Fixing unused parameters in $file..."
    
    # Replace unused request parameters with _request
    sed -i 's/export async function GET(request:/export async function GET(_request:/g' "$file"
    sed -i 's/export async function POST(request:/export async function POST(_request:/g' "$file"
    sed -i 's/export async function PUT(request:/export async function PUT(_request:/g' "$file"
    sed -i 's/export async function DELETE(request:/export async function DELETE(_request:/g' "$file"
  fi
done

echo "Fixed request parameter issues"