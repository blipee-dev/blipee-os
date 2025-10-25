#!/bin/bash

# Test streaming chat with proper authentication using curl
# This simulates what the browser does: get CSRF token, sign in, then chat

echo "🧪 Testing Streaming Chat with Full Authentication"
echo "=================================================="
echo ""

BASE_URL="http://localhost:3000"
COOKIE_JAR="/tmp/blipee-cookies.txt"
rm -f $COOKIE_JAR

# Step 1: Get CSRF token
echo "📝 Step 1: Getting CSRF token..."
curl -s -c $COOKIE_JAR "$BASE_URL/signin" > /dev/null

CSRF_TOKEN=$(grep '_csrf' $COOKIE_JAR | awk '{print $7}')
echo "✅ CSRF Token: ${CSRF_TOKEN:0:20}..."
echo ""

# Step 2: Sign in to get session cookie
echo "📝 Step 2: Signing in..."
curl -s -b $COOKIE_JAR -c $COOKIE_JAR \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -X POST \
  -d '{"email":"jose.pinto@plmj.pt","password":"123456"}' \
  "$BASE_URL/api/auth/signin" > /dev/null

SESSION_COOKIE=$(grep 'blipee-session' $COOKIE_JAR | awk '{print $7}')
if [ -z "$SESSION_COOKIE" ]; then
  echo "❌ Sign in failed! No session cookie received"
  exit 1
fi

echo "✅ Session Cookie: ${SESSION_COOKIE:0:20}..."
echo ""

# Step 3: Test streaming chat endpoint
echo "📝 Step 3: Testing streaming chat endpoint..."
echo "Request: POST $BASE_URL/api/ai/chat?stream=true"
echo "Message: 'What are my top 3 emission sources?'"
echo ""

# Make the streaming request and capture response
echo "🌊 Streaming response:"
echo "=================================================="

curl -N -b $COOKIE_JAR \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -X POST \
  -d '{
    "message": "What are my top 3 emission sources?",
    "conversationId": "test_'$(date +%s)'"
  }' \
  "$BASE_URL/api/ai/chat?stream=true" 2>/dev/null | head -c 1000

echo ""
echo "=================================================="
echo ""
echo "✅ Test complete!"
echo ""
echo "💡 If you see streaming data above, the fix worked!"
echo "   Look for: data: chunks, text content, or tool calls"
echo ""
echo "❌ If you see 403 or error JSON, CSRF headers still not working"
echo "   Check that headers are properly configured in useChat"
