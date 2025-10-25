#!/bin/bash

echo "🔧 FIXING ALL request -> _request REFERENCES"
echo "==========================================="

# Find and fix all standalone 'request' references in function calls
# But preserve 'request' in comments and strings

# Fix audit logger calls
find src -name "*.ts" | xargs sed -i '' 's/auditLogger\.logUserAction(request,/auditLogger.logUserAction(_request,/g' 2>/dev/null
find src -name "*.ts" | xargs sed -i '' 's/auditLogger\.logAuthFailure(request,/auditLogger.logAuthFailure(_request,/g' 2>/dev/null  
find src -name "*.ts" | xargs sed -i '' 's/auditLogger\.logAuthSuccess(request,/auditLogger.logAuthSuccess(_request,/g' 2>/dev/null

# Fix service calls that take request as parameter
find src -name "*.ts" | xargs sed -i '' 's/(\s*request\s*)/(_request)/g' 2>/dev/null
find src -name "*.ts" | xargs sed -i '' 's/,\s*request\s*)/, _request)/g' 2>/dev/null
find src -name "*.ts" | xargs sed -i '' 's/(\s*request\s*,/(_request,/g' 2>/dev/null

echo "✅ Fixed all request references"
