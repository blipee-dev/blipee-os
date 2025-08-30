#!/bin/bash

echo "🔧 FIXING userId/_userId NAMING ISSUES"
echo "======================================="

# Fix _userId in security audit logger calls - should be userId
echo "Fixing security audit logger userId references..."
find src/app/api -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/_userId: user\.id/userId: user.id/g' 2>/dev/null
find src/app/api -name "*.ts" -o -name "*.tsx" | xargs sed -i '' 's/_userId: userId/userId: userId/g' 2>/dev/null

# Fix AI chat-enhanced route where _userId is declared but userId is used
echo "Fixing AI chat-enhanced route..."
sed -i '' 's/let _userId: string;/let userId: string;/g' src/app/api/ai/chat-enhanced/route.ts 2>/dev/null
sed -i '' 's/userId = formData\.get("userId") as string;/_userId = formData.get("userId") as string;/g' src/app/api/ai/chat-enhanced/route.ts 2>/dev/null
sed -i '' 's/userId = body\.userId;/_userId = body.userId;/g' src/app/api/ai/chat-enhanced/route.ts 2>/dev/null

# Actually, let's be consistent - if the function parameter is _userId, use _userId throughout
echo "Making userId usage consistent in AI routes..."
# For files where the withAuth gives us userId as a parameter, keep it as userId
# For files where we declare it ourselves, use consistent naming

# Fix chat-enhanced specifically
cat > /tmp/fix_chat_enhanced.sed << 'EOF'
s/let _userId: string;/let userId: string;/g
s/userId = formData\.get("userId")/userId = formData.get("userId")/g
s/userId = body\.userId/userId = body.userId/g
EOF
sed -i '' -f /tmp/fix_chat_enhanced.sed src/app/api/ai/chat-enhanced/route.ts 2>/dev/null

echo "✅ Fixed userId naming consistency"