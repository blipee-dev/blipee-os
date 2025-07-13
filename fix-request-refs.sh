#!/bin/bash

echo "Fixing request variable references..."

# Fix files where request parameter was renamed to _request but references weren't updated
files_to_fix=(
  "src/app/api/ai/chat-enhanced/route.ts"
  "src/app/api/ai/stream/route.ts"
  "src/app/api/audit/export/route.ts"
  "src/app/api/audit/logs/route.ts"
  "src/app/api/auth/recovery/security-questions/route.ts"
  "src/app/api/auth/recovery/verify/route.ts"
  "src/app/api/auth/mfa/email/add/route.ts"
  "src/app/api/auth/mfa/verify/route.ts"
  "src/app/api/auth/sso/saml/callback/route.ts"
  "src/app/api/compliance/report/route.ts"
  "src/app/api/monitoring/alerts/route.ts"
)

for file in "${files_to_fix[@]}"; do
  if [ -f "$file" ]; then
    # Only replace request. when function parameter is _request
    if grep -q "export async function.*(_request:" "$file"; then
      sed -i 's/\brequest\./\_request\./g' "$file"
      sed -i 's/\brequest,/_request,/g' "$file"
      sed -i 's/\brequest)/_request)/g' "$file"
      echo "Fixed $file"
    fi
  fi
done

echo "Fixed request variable references"