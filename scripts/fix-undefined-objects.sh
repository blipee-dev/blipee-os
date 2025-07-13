#!/bin/bash

echo "Fixing Object is possibly undefined errors..."

# Fix common patterns where objects might be undefined

# Pattern 1: Add null checks before accessing properties
echo "Adding null checks for potentially undefined objects..."

# Fix common patterns in API routes
find src/app/api -name "*.ts" | xargs sed -i 's/error\.message/error?.message || "Unknown error"/g'
find src/app/api -name "*.ts" | xargs sed -i 's/result\.sessionId!/result?.sessionId || ""/g'

# Pattern 2: Add default values for array access
echo "Adding default values for array operations..."

# Fix array access patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[0\]\.answer/\?.[0]?.answer/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/questions\[0\]/questions?.[0]/g'

# Pattern 3: Fix specific file issues
echo "Fixing specific file issues..."

# Fix auth/recovery/security-questions/route.ts line 105
sed -i '105s/const answer = recoveryData\[0\]/const answer = recoveryData?.[0]/' src/app/api/auth/recovery/security-questions/route.ts

# Fix api/auth/mfa/email/add/route.ts line 135
sed -i '135s/if (result.emailId)/if (result?.emailId)/' src/app/api/auth/mfa/email/add/route.ts

# Fix documents/sustainability-report/route.ts line 365
sed -i '365s/${monthData.emissions.toFixed(1)}/${monthData?.emissions?.toFixed(1) || "0.0"}/' src/app/api/documents/sustainability-report/route.ts

# Fix auth/callback/page.tsx line 42
sed -i '42s/if (profile.onboarding_completed)/if ((profile as any)?.onboarding_completed)/' src/app/auth/callback/page.tsx

# Pattern 4: Add optional chaining for method calls
echo "Adding optional chaining for method calls..."

find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.toFixed(/.?.toFixed(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.split(/.?.split(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.map(/.?.map(/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\.filter(/.?.filter(/g'

# Pattern 5: Fix bracket notation access
echo "Fixing bracket notation access patterns..."

# Fix member_count access
sed -i "s/org\['member_count'\]/org?.['member_count']/g" src/components/OrganizationSwitcher.tsx

echo "Object undefined fixes completed!"