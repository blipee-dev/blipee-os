#!/bin/bash

echo "🔧 FIXING request PARAMETER NAMING"
echo "================================="

# Fix _request references that should be request in audit logger calls
echo "Fixing _request -> request in audit logger calls..."
find src/app/api/auth -name "*.ts" | xargs sed -i '' 's/auditLogger\.logAuthFailure(_request,/auditLogger.logAuthFailure(request,/g' 2>/dev/null
find src/app/api/auth -name "*.ts" | xargs sed -i '' 's/auditLogger\.logAuthSuccess(_request,/auditLogger.logAuthSuccess(request,/g' 2>/dev/null

# Fix other request references in auth routes
find src/app/api/auth -name "*.ts" | xargs sed -i '' 's/recoveryService\.\w*(_request,/recoveryService.& request,/g' 2>/dev/null

echo "✅ Fixed request parameter naming"
