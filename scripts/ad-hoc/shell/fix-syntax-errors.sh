#!/bin/bash

echo "🔧 FIXING SYNTAX ERRORS FROM OVER-AGGRESSIVE REPLACEMENTS"
echo "=========================================================="

# Fix requireAuth_request → requireAuth(_request
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/requireAuth_request/requireAuth(_request/g' {} \;

# Fix limiter.check_request → limiter.check(_request
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/limiter\.check_request/limiter.check(_request/g' {} \;

# Fix validateSession_request → validateSession(_request
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/validateSession_request/validateSession(_request/g' {} \;

# Fix sessionManager.validateSession_request → sessionManager.validateSession(_request
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/sessionManager\.validateSession_request/sessionManager.validateSession(_request/g' {} \;

# Fix secureSessionManager.validateSession_request → secureSessionManager.validateSession(_request
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/secureSessionManager\.validateSession_request/secureSessionManager.validateSession(_request/g' {} \;

# Fix auditLogger.logUserAction_request → auditLogger.logUserAction(_request
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/auditLogger\.logUserAction_request/auditLogger.logUserAction(_request/g' {} \;

# Fix withErrorHandler(async (request: → withErrorHandler(async (_request:
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/withErrorHandler(async (request:/withErrorHandler(async (_request:/g' {} \;

# Fix other common patterns that got broken
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/getClientIp_request/getClientIp(_request/g' {} \;
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/logRequest_request/logRequest(_request/g' {} \;
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' 's/validateRequest_request/validateRequest(_request/g' {} \;

echo "✅ Fixed common syntax errors"
echo ""
echo "🎯 Running type check to verify..."