#!/bin/bash

echo "Running final comprehensive syntax fixes..."

# Fix all remaining questionmark patterns to proper optional chaining
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/?message/?.message/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/?organizationId/?.organizationId/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/?content/?.content/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/?data/?.data/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/?visualization/?.visualization/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/?error/?.error/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/?session/?.session/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/?metadata/?.metadata/g'

# Fix error parameters in catch blocks
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/catch (_error: any)/catch (error: any)/g'

# Fix NextRequest parameter issues
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/POST(_request: NextRequest)/POST(request: NextRequest)/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/GET(_request: NextRequest)/GET(request: NextRequest)/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/PUT(_request: NextRequest)/PUT(request: NextRequest)/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/DELETE(_request: NextRequest)/DELETE(request: NextRequest)/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/PATCH(_request: NextRequest)/PATCH(request: NextRequest)/g'

# Fix exclamation marks in array access
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[0\]!/[0]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[1\]!/[1]/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/\[2\]!/[2]/g'

# Fix dot access after exclamation marks that should be question marks
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/error!message/error?.message/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/session!organizationId/session?.organizationId/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/metadata!suppliers_investigated/metadata?.suppliers_investigated/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/metadata!total_risks/metadata?.total_risks/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/result!executionTimeMs/result?.executionTimeMs/g'

# Fix improper property access patterns
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/impact!expectedChange/impact.expectedChange/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/impact!metric/impact.metric/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/impact!timeframe/impact.timeframe/g'

echo "Final syntax fixes completed!"