#!/bin/bash

echo "Fixing unused parameters..."

# Fix unused parameters by prefixing with underscore
sed -i 's/export async function GET(request:/export async function GET(_request:/g' src/app/api/auth/sso/configurations/[id]/route.ts
sed -i 's/export async function PUT(request:/export async function PUT(_request:/g' src/app/api/auth/sso/configurations/[id]/route.ts  
sed -i 's/export async function POST(request:/export async function POST(_request:/g' src/app/api/auth/sso/configurations/[id]/test/route.ts

# Fix webauthn routes
sed -i 's/export async function GET(request:/export async function GET(_request:/g' src/app/api/auth/webauthn/credentials/route.ts
sed -i 's/export async function GET(request:/export async function GET(_request:/g' src/app/api/auth/webauthn/stats/route.ts

# Fix SAML callback
sed -i 's/const samlResponse = request/const _samlResponse = request/g' src/app/api/auth/sso/saml/callback/route.ts

# Remove unused imports
sed -i '/import.*complianceService.*from/d' src/app/api/compliance/report/route.ts

# Fix unused destructuring in sustainability report
sed -i 's/const { site, siteData } =/const { } =/g' src/app/api/documents/sustainability-report/route.ts

echo "Fixed unused parameters"