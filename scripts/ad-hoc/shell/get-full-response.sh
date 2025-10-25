#!/bin/bash
COOKIE_JAR="/tmp/blipee-cookies.txt"
CSRF_TOKEN=$(grep '_csrf' $COOKIE_JAR | awk '{print $7}')

echo "Fetching complete streaming response..."
echo ""

curl -N -b $COOKIE_JAR \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $CSRF_TOKEN" \
  -X POST \
  -d '{"message": "What are my top 3 emission sources?", "conversationId": "test_full"}' \
  "http://localhost:3000/api/ai/chat?stream=true" 2>&1
