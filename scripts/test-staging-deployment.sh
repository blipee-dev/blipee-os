#!/bin/bash

# Test Staging Deployment Script
# Validates that the retail module is working correctly in staging

set -e

echo "🧪 Testing Retail Module Staging Deployment"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get staging URL from command line or use default
STAGING_URL=${1:-"https://staging-retail.blipee.dev"}

echo -e "\n${YELLOW}Testing deployment at: ${STAGING_URL}${NC}\n"

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Testing ${description}... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "${STAGING_URL}${endpoint}")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓ Pass (${response})${NC}"
        return 0
    else
        echo -e "${RED}✗ Fail (Expected ${expected_status}, got ${response})${NC}"
        return 1
    fi
}

# Function to test JSON response
test_json_endpoint() {
    local endpoint=$1
    local json_path=$2
    local expected_value=$3
    local description=$4
    
    echo -n "Testing ${description}... "
    
    response=$(curl -s "${STAGING_URL}${endpoint}")
    actual_value=$(echo "$response" | jq -r "$json_path" 2>/dev/null)
    
    if [ "$actual_value" = "$expected_value" ]; then
        echo -e "${GREEN}✓ Pass${NC}"
        return 0
    else
        echo -e "${RED}✗ Fail (Expected '${expected_value}', got '${actual_value}')${NC}"
        return 1
    fi
}

# Track results
total_tests=0
passed_tests=0

# Test 1: Health Check
echo -e "${YELLOW}1. Testing Health Endpoints${NC}"
test_endpoint "/api/retail/v1/health" "200" "Retail Health API" && ((passed_tests++))
((total_tests++))

test_json_endpoint "/api/retail/v1/health" ".status" "healthy" "Health status check" && ((passed_tests++))
((total_tests++))

test_json_endpoint "/api/retail/v1/health" ".module" "retail-intelligence" "Module identification" && ((passed_tests++))
((total_tests++))

# Test 2: Main App Health
echo -e "\n${YELLOW}2. Testing Main Application${NC}"
test_endpoint "/api/monitoring/health" "200" "Main app health" && ((passed_tests++))
((total_tests++))

test_endpoint "/" "200" "Homepage" && ((passed_tests++))
((total_tests++))

test_endpoint "/retail" "200" "Retail dashboard" && ((passed_tests++))
((total_tests++))

# Test 3: API Endpoints (without auth)
echo -e "\n${YELLOW}3. Testing API Endpoints${NC}"
test_endpoint "/api/retail/v1/stores" "200" "Stores endpoint" && ((passed_tests++))
((total_tests++))

test_endpoint "/api/retail/v1/analytics" "200" "Analytics endpoint" && ((passed_tests++))
((total_tests++))

test_endpoint "/api/retail/v1/traffic/realtime" "200" "Real-time traffic" && ((passed_tests++))
((total_tests++))

# Test 4: Telegram Integration
echo -e "\n${YELLOW}4. Testing Telegram Integration${NC}"
test_endpoint "/api/retail/v1/telegram/auth?telegram_user_id=12345&chat_id=67890" "200" "Telegram auth" && ((passed_tests++))
((total_tests++))

# Test 5: Performance
echo -e "\n${YELLOW}5. Testing Performance${NC}"
echo -n "Testing response time... "
start_time=$(date +%s%N)
curl -s "${STAGING_URL}/api/retail/v1/health" > /dev/null
end_time=$(date +%s%N)
response_time=$(((end_time - start_time) / 1000000))

if [ $response_time -lt 1000 ]; then
    echo -e "${GREEN}✓ Pass (${response_time}ms)${NC}"
    ((passed_tests++))
else
    echo -e "${RED}✗ Fail (${response_time}ms > 1000ms)${NC}"
fi
((total_tests++))

# Test 6: Security Headers
echo -e "\n${YELLOW}6. Testing Security Headers${NC}"
headers=$(curl -s -I "${STAGING_URL}/")

check_header() {
    local header=$1
    local description=$2
    
    echo -n "Testing ${description}... "
    if echo "$headers" | grep -qi "$header"; then
        echo -e "${GREEN}✓ Pass${NC}"
        ((passed_tests++))
    else
        echo -e "${RED}✗ Fail${NC}"
    fi
    ((total_tests++))
}

check_header "X-Content-Type-Options: nosniff" "X-Content-Type-Options"
check_header "X-Frame-Options: DENY" "X-Frame-Options"
check_header "X-XSS-Protection: 1; mode=block" "X-XSS-Protection"

# Summary
echo -e "\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test Summary${NC}"
echo -e "${YELLOW}========================================${NC}"
echo "Total Tests: ${total_tests}"
echo -e "Passed: ${GREEN}${passed_tests}${NC}"
echo -e "Failed: ${RED}$((total_tests - passed_tests))${NC}"
echo -e "Success Rate: ${YELLOW}$(( (passed_tests * 100) / total_tests ))%${NC}"

if [ $passed_tests -eq $total_tests ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Staging deployment is healthy.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please check the deployment.${NC}"
    exit 1
fi