#!/bin/bash

echo "🔍 Verifying Retail Module Deployment"
echo "===================================="

# Base URL
BASE_URL="https://blipee-os.vercel.app"

# Test health endpoint
echo -e "\n1. Testing API Health..."
curl -s "$BASE_URL/api/retail/v1/health" | jq '.' || echo "❌ Health check failed"

# Test stores endpoint
echo -e "\n2. Testing Stores Endpoint..."
curl -s "$BASE_URL/api/retail/v1/stores" | jq '.stores[0]' || echo "❌ Stores endpoint failed"

# Test module registry
echo -e "\n3. Testing Module Registry..."
curl -s "$BASE_URL/api/monitoring/health" | jq '.modules' || echo "❌ Module registry failed"

# Check if retail page loads
echo -e "\n4. Testing Retail Dashboard..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/retail")
if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Retail dashboard is accessible (HTTP $HTTP_STATUS)"
else
    echo "❌ Retail dashboard returned HTTP $HTTP_STATUS"
fi

echo -e "\n✅ Deployment verification complete!"
echo -e "\nAccess your retail module at:"
echo "  - Dashboard: $BASE_URL/retail"
echo "  - API Docs: $BASE_URL/api/retail/v1/health"
echo -e "\nTelegram bot commands:"
echo "  /start - Welcome message"
echo "  /sales OML01 - Sales data"
echo "  /traffic OML01 - People counting"