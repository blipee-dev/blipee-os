#!/bin/bash

echo "Fixing exactOptionalPropertyTypes errors..."

# Fix common patterns where undefined is not handled properly

# Pattern 1: Fix object assignments where properties might be undefined
echo "Fixing object property assignments..."

# Fix components: UIComponent[] | undefined assignments
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/components: parsedResponse?.data?.components,/components: parsedResponse?.data?.components || [],/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/suggestions: parsedResponse?.data?.suggestions,/suggestions: parsedResponse?.data?.suggestions || [],/g'

# Fix Date | undefined assignments
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,/startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : new Date(),/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,/endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : new Date(),/g'

# Pattern 2: Fix function parameters where optional params need to be handled
echo "Fixing function parameter types..."

# Fix rememberDevice: boolean | undefined
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/rememberDevice: data.rememberDevice,/rememberDevice: data.rememberDevice || false,/g'

# Fix company_name: string | undefined  
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/company_name: data.company_name,/company_name: data.company_name || "",/g'

# Fix securityAnswers: string[] | undefined
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/securityAnswers: data.securityAnswers,/securityAnswers: data.securityAnswers || [],/g'

# Fix backupCode: string | undefined
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/backupCode: data.backupCode,/backupCode: data.backupCode || "",/g'

# Fix adminUserId: string | undefined
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/adminUserId: data.adminUserId,/adminUserId: data.adminUserId || "",/g'

# Fix domain: string | undefined in SSOAuthOptions
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/{ domain: searchParams.get("domain") }/{ domain: searchParams.get("domain") || "" }/g'

# Fix organizationId: string | undefined props
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/organizationId: user?.organization_id }/organizationId: user?.organization_id || "" }/g'

echo "ExactOptionalPropertyTypes fixes completed!"