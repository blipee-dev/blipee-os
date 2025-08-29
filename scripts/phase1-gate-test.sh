#!/bin/bash

# Phase 1 Gate Test Script
# This script runs all security tests and generates a gate report

echo "🔐 Phase 1 Security Gate Test"
echo "============================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
WARNINGS=0

# Function to run a test
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -n "Running $test_name... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
        return 1
    fi
}

# Function to check for file
check_file() {
    local file_name=$1
    local file_path=$2
    
    echo -n "Checking $file_name... "
    
    if [ -f "$file_path" ]; then
        echo -e "${GREEN}✓ EXISTS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ MISSING${NC}"
        ((FAILED++))
        return 1
    fi
}

echo "1. Security Tests"
echo "-----------------"
run_test "CSRF Protection" "npm run test:csrf 2>/dev/null"
run_test "XSS Protection" "npm run test:xss 2>/dev/null"
run_test "Session Security" "npm run test:session-security 2>/dev/null"

echo ""
echo "2. Code Quality Checks"
echo "----------------------"
run_test "TypeScript Check" "npm run type-check 2>/dev/null"
run_test "ESLint" "npm run lint 2>/dev/null"

echo ""
echo "3. Security Files"
echo "-----------------"
check_file "CSRF Implementation" "src/lib/security/csrf.ts"
check_file "Security Headers" "src/lib/security/headers.ts"
check_file "Session Security" "src/lib/security/session-security.ts"
check_file "Audit Logger" "src/lib/security/audit-logger.ts"

echo ""
echo "4. Documentation"
echo "----------------"
check_file "Security Guide" "docs/SECURITY_IMPLEMENTATION.md"
check_file "API Documentation" "docs/api/API_DOCUMENTATION.md"
check_file "OpenAPI Spec" "docs/api/openapi.yaml"
check_file "Phase 1 Summary" "docs/PHASE1_SECURITY_SUMMARY.md"

echo ""
echo "5. Security Vulnerability Check"
echo "-------------------------------"
echo -n "Running npm audit... "
AUDIT_OUTPUT=$(npm audit 2>&1)
if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
    echo -e "${GREEN}✓ NO VULNERABILITIES${NC}"
    ((PASSED++))
else
    VULN_COUNT=$(echo "$AUDIT_OUTPUT" | grep -oE '[0-9]+ vulnerabilities' | head -1)
    echo -e "${RED}✗ FOUND $VULN_COUNT${NC}"
    ((FAILED++))
fi

echo ""
echo "6. Build Test"
echo "-------------"
echo -n "Testing production build... "
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ BUILD SUCCESS${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠ BUILD FAILED${NC}"
    ((WARNINGS++))
fi

echo ""
echo "=============================="
echo "GATE TEST RESULTS"
echo "=============================="
echo -e "Passed:   ${GREEN}$PASSED${NC}"
echo -e "Failed:   ${RED}$FAILED${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

# Calculate score
TOTAL=$((PASSED + FAILED))
if [ $TOTAL -gt 0 ]; then
    SCORE=$((PASSED * 100 / TOTAL))
else
    SCORE=0
fi

echo "Security Score: $SCORE%"
echo ""

# Gate decision
if [ $FAILED -eq 0 ] && [ $SCORE -ge 90 ]; then
    echo -e "${GREEN}✅ GATE STATUS: PASSED${NC}"
    echo "Phase 1 security implementation meets all requirements."
    echo ""
    echo "Recommendation: APPROVE progression to Phase 2"
    exit 0
else
    echo -e "${RED}❌ GATE STATUS: FAILED${NC}"
    echo "Please address the failed tests before proceeding."
    echo ""
    echo "Recommendation: FIX ISSUES and rerun gate tests"
    exit 1
fi