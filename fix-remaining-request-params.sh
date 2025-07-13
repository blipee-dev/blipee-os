#!/bin/bash

echo "Fixing remaining missing request parameters..."

# Fix routes missing request parameter
files=(
  "src/app/api/compliance/status/route.ts"
  "src/app/api/emissions/bulk/route.ts"
  "src/app/api/energy/bulk/route.ts"
  "src/app/api/gateway/keys/[id]/route.ts"
)

for file in "${files[@]}"; do
  if [[ -f "$file" ]]; then
    echo "Fixing $file..."
    
    # Look for functions that use request but don't have it as parameter
    # Add request parameter where missing
    sed -i 's/export async function GET(/export async function GET(request: NextRequest,/g' "$file"
    sed -i 's/export async function POST(/export async function POST(request: NextRequest,/g' "$file" 
    sed -i 's/export async function PUT(/export async function PUT(request: NextRequest,/g' "$file"
    sed -i 's/export async function DELETE(/export async function DELETE(request: NextRequest,/g' "$file"
    
    # Fix any cases where we might have added to existing NextRequest parameter
    sed -i 's/request: NextRequest,request: NextRequest,/request: NextRequest,/g' "$file"
    sed -i 's/request: NextRequest, request: NextRequest,/request: NextRequest,/g' "$file"
  fi
done

# Fix SSO routes with unused request parameters 
echo "Fixing unused request parameters in SSO routes..."

# Fix the specific SSO files that have unused request parameters
sed -i 's/export async function PUT(request: NextRequest,/export async function PUT(_request: NextRequest,/g' "src/app/api/auth/sso/configurations/[id]/route.ts"
sed -i 's/export async function DELETE(request: NextRequest,/export async function DELETE(_request: NextRequest,/g' "src/app/api/auth/sso/configurations/[id]/route.ts"

sed -i 's/export async function POST(request: NextRequest,/export async function POST(_request: NextRequest,/g' "src/app/api/auth/sso/configurations/[id]/test/route.ts"

echo "Fixed remaining request parameter issues"