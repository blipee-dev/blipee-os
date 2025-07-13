#!/bin/bash

echo "Fixing remaining TypeScript issues..."

# Remove unused imports in chat route
sed -i 's/BLIPEE_SYSTEM_PROMPT,//' src/app/api/ai/chat/route.ts
sed -i 's/buildPrompt,//' src/app/api/ai/chat/route.ts
sed -i 's/buildDemoContext,//' src/app/api/ai/chat/route.ts

# Fix process.env access
sed -i "s/process\.env\.NEXT_PUBLIC_APP_URL/process.env\['NEXT_PUBLIC_APP_URL'\]/g" src/app/api/auth/sso/initiate/route.ts

# Remove unused imports
sed -i '/import.*authService.*from/d' src/app/api/auth/signin/route.ts
sed -i '/import.*authService.*from/d' src/app/api/auth/sso/oidc/callback/route.ts
sed -i '/import.*authService.*from/d' src/app/api/auth/sso/saml/callback/route.ts

# Fix unused parameters
sed -i 's/export async function GET(request:/export async function GET(_request:/g' src/app/api/auth/sso/configurations/\[id\]/route.ts
sed -i 's/export async function PUT(request:/export async function PUT(_request:/g' src/app/api/auth/sso/configurations/\[id\]/route.ts
sed -i 's/export async function POST(request:/export async function POST(_request:/g' src/app/api/auth/sso/configurations/\[id\]/test/route.ts
sed -i 's/const samlResponse = request/const samlResponse = _request/g' src/app/api/auth/sso/saml/callback/route.ts

echo "Fixed remaining issues"