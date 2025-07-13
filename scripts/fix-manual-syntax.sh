#!/bin/bash

echo "Fixing remaining manual syntax errors..."

# Fix specific broken files
# Fix webhook-verifier.ts
sed -i 's/{ }}/{}}/g' src/lib/webhooks/webhook-verifier.ts
sed -i 's/sanitizedObj[key] = sanitizeObject(value);/sanitizedObj[key] = sanitizeObject(obj[key]);/g' src/lib/webhooks/webhook-verifier.ts
sed -i 's/urlObj.searchParams.forEach((key) => {/urlObj.searchParams.forEach((value, key) => {/g' src/lib/webhooks/webhook-verifier.ts

# Fix webhook-processor.ts
sed -i 's/constructor() { }}/constructor() {}/g' src/lib/webhooks/webhook-processor.ts

# Fix webhook-service.ts
sed -i 's/headers: data.headers || { }}/headers: data.headers || {}/g' src/lib/webhooks/webhook-service.ts

# Fix signin route
sed -i 's/.catch(() => ({ }}))/.catch(() => ({}))/g' src/app/api/auth/signin/route.ts

# Fix chat route - restore proper import syntax
sed -i 's/\/\/ \/\/ \/\/ \/\/ \/\/ \/\/ \/\/ import { }} from/\/\/ import from/g' src/app/api/ai/chat/route.ts
sed -i 's/\/\/ \/\/ \/\/ \/\/ \/\/ \/\/ import { }} from/\/\/ import from/g' src/app/api/ai/chat/route.ts
sed -i 's/\/\/ \/\/ \/\/ \/\/ \/\/ import { }} from/\/\/ import from/g' src/app/api/ai/chat/route.ts
sed -i 's/\/\/ \/\/ \/\/ import { }} from/\/\/ import from/g' src/app/api/ai/chat/route.ts

# Fix documents route
sed -i 's/"{ }}"/"{}"/' src/app/api/documents/sustainability-report/route.ts
sed -i 's/data.emissions.byScope || { }}/data.emissions.byScope || {}/' src/app/api/documents/sustainability-report/route.ts
sed -i 's/organization_id: $/organization_id: organizationId,/' src/app/api/documents/sustainability-report/route.ts
sed -i 's/extractedData,$/extractedData,/' src/app/api/documents/sustainability-report/route.ts

# Fix import lines that got corrupted
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '/^\/\/ import.*$/d'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '/^\/\/ \/\/ import.*$/d'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '/^\/\/ \/\/ \/\/ import.*$/d'

# Fix any remaining empty object syntax
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/{ }}/{}}/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/}}}/}/g'

echo "Manual syntax fixes completed!"