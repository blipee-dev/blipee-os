#!/bin/bash

echo "Fixing unused variable issues..."

# Fix specific unused variables by prefixing with underscore

# Fix compliance report route
sed -i 's/const { period }/const { period: _period }/' src/app/api/compliance/report/route.ts

# Fix sustainability report route
sed -i 's/const { site, siteData }/const { site: _site, siteData: _siteData }/' src/app/api/documents/sustainability-report/route.ts
sed -i 's/async function generateReport(organizationId,/async function generateReport(_organizationId,/' src/app/api/documents/sustainability-report/route.ts
sed -i 's/const generateMonthlyBreakdown =/const _generateMonthlyBreakdown =/' src/app/api/documents/sustainability-report/route.ts

# Fix files upload route  
sed -i 's/const { uploadData }/const { uploadData: _uploadData }/' src/app/api/files/upload/route.ts

echo "Fixed unused variable issues"