#!/bin/bash

echo "🔧 FIXING BACK TO request (not _request)"
echo "======================================="

# Revert _request back to request in API route handlers
# The underscore was wrong - we DO use the request parameter

# Fix function parameters first
find src/app/api -name "*.ts" | xargs sed -i '' 's/export async function \([A-Z]*\)(_request: NextRequest)/export async function \1(request: NextRequest)/g' 2>/dev/null

# Fix all _request usage back to request in API routes
find src/app/api -name "*.ts" | xargs sed -i '' 's/_request\./request./g' 2>/dev/null
find src/app/api -name "*.ts" | xargs sed -i '' 's/_request,/request,/g' 2>/dev/null
find src/app/api -name "*.ts" | xargs sed -i '' 's/(_request)/\(request\)/g' 2>/dev/null
find src/app/api -name "*.ts" | xargs sed -i '' 's/, _request)/, request)/g' 2>/dev/null

# Fix audit logger calls
find src/app/api -name "*.ts" | xargs sed -i '' 's/auditLogger\.logUserAction(_request,/auditLogger.logUserAction(request,/g' 2>/dev/null
find src/app/api -name "*.ts" | xargs sed -i '' 's/auditLogger\.logAuthFailure(_request,/auditLogger.logAuthFailure(request,/g' 2>/dev/null
find src/app/api -name "*.ts" | xargs sed -i '' 's/auditLogger\.logAuthSuccess(_request,/auditLogger.logAuthSuccess(request,/g' 2>/dev/null

echo "✅ Fixed back to request parameters"
