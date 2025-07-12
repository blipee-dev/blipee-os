#!/bin/bash

# Test script for Retail Intelligence API endpoints
# This script tests both standard REST endpoints and Telegram compatibility

API_BASE_URL=${API_BASE_URL:-"http://localhost:3001"}
API_KEY=${API_KEY:-"test-api-key"}

# Use retail API namespace
RETAIL_API_BASE="${API_BASE_URL}/api/retail/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "Method: $method"
    echo "Endpoint: $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET \
            -H "X-API-Key: $API_KEY" \
            "$API_BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE_URL$endpoint")
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    # Extract body (all but last line)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ Status: $status_code (Expected: $expected_status)${NC}"
        echo "Response: $body" | jq . 2>/dev/null || echo "Response: $body"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}✗ Status: $status_code (Expected: $expected_status)${NC}"
        echo "Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

echo "====================================="
echo "Retail Intelligence API Test Suite"
echo "API URL: $API_BASE_URL"
echo "====================================="

# 1. Health Check
test_endpoint "GET" "/api/retail/v1/health" "" "200" "Health Check"

# 2. Telegram Authentication
test_endpoint "POST" "/api/retail/v1/auth/telegram" '{"telegram_user_id":"123456789","telegram_username":"test_user","chat_id":"987654321"}' "200" "Telegram Authentication"

# 3. Get Stores
test_endpoint "GET" "/api/retail/v1/stores" "" "200" "Get Available Stores"

# 4. Get Analytics (Telegram Format)
test_endpoint "GET" "/api/retail/v1/analytics?loja=OML01&start_date=2024-01-01&end_date=2024-01-31" "" "200" "Get Analytics Data"

# 5. Real-time Traffic
test_endpoint "GET" "/api/retail/v1/traffic/realtime?loja=OML01" "" "200" "Get Real-time Traffic"

# 6. Bot State Management - Get
test_endpoint "GET" "/api/retail/v1/telegram/state?chat_id=987654321" "" "200" "Get Bot State"

# 7. Bot State Management - Update
test_endpoint "POST" "/api/retail/v1/telegram/state" '{"chat_id":"987654321","state":"waiting_for_store","context":{"command":"analytics"}}' "200" "Update Bot State"

# 8. Test Invalid API Key
echo -e "\n${YELLOW}Testing: Invalid API Key${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "X-API-Key: invalid-key" \
    "$API_BASE_URL/api/retail/v1/stores")
status_code=$(echo "$response" | tail -n1)
if [ "$status_code" = "401" ]; then
    echo -e "${GREEN}✓ Correctly rejected invalid API key${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}✗ Should have rejected invalid API key${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

# 9. Test Missing Required Parameters
test_endpoint "GET" "/api/retail/v1/traffic/realtime" "" "400" "Missing Required Parameter (loja)"

# 10. Test Analytics with Different Metric Types
test_endpoint "GET" "/api/retail/v1/analytics?loja=OML01&start_date=2024-01-01&end_date=2024-01-31&metric_type=sales" "" "200" "Analytics - Sales Only"
test_endpoint "GET" "/api/retail/v1/analytics?loja=OML01&start_date=2024-01-01&end_date=2024-01-31&metric_type=traffic" "" "200" "Analytics - Traffic Only"

# Summary
echo -e "\n====================================="
echo "Test Summary"
echo "====================================="
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo -e "Total: $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}Some tests failed!${NC}"
    exit 1
fi