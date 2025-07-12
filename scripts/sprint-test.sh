#!/bin/bash

# Sprint Test Phase Script
# This script must be run at the end of each sprint before committing

set -e

echo "================================================"
echo "       SPRINT TEST PHASE EXECUTION"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
COVERAGE_THRESHOLD=90
NEW_CODE_COVERAGE_THRESHOLD=95
SPRINT_NUMBER=${1:-"current"}
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Ensure required tools are installed
echo "🔍 Checking prerequisites..."
for cmd in npm git jq bc; do
    if ! command_exists "$cmd"; then
        echo -e "${RED}❌ $cmd is not installed${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# 1. Run linting
echo "📝 Running code quality checks..."
if npm run lint; then
    echo -e "${GREEN}✓ Linting passed${NC}"
else
    echo -e "${RED}❌ Linting failed${NC}"
    exit 1
fi
echo ""

# 2. Run type checking
echo "🔍 Running TypeScript type check..."
if npm run type-check; then
    echo -e "${GREEN}✓ Type checking passed${NC}"
else
    echo -e "${RED}❌ Type checking failed${NC}"
    exit 1
fi
echo ""

# 3. Run unit tests with coverage
echo "🧪 Running unit tests with coverage..."
npm run test:coverage -- --json --outputFile=coverage/test-results.json || true

# Parse test results
if [ -f "coverage/test-results.json" ]; then
    TOTAL_TESTS=$(jq '.numTotalTests' coverage/test-results.json)
    PASSED_TESTS=$(jq '.numPassedTests' coverage/test-results.json)
    FAILED_TESTS=$(jq '.numFailedTests' coverage/test-results.json)
    
    if [ "$FAILED_TESTS" -eq 0 ]; then
        echo -e "${GREEN}✓ All $TOTAL_TESTS tests passed${NC}"
    else
        echo -e "${RED}❌ $FAILED_TESTS out of $TOTAL_TESTS tests failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Could not parse test results${NC}"
    exit 1
fi
echo ""

# 4. Check coverage thresholds
echo "📊 Analyzing test coverage..."
if [ -f "coverage/coverage-summary.json" ]; then
    COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
    COVERAGE_INT=${COVERAGE%.*}
    
    echo "Overall coverage: ${COVERAGE}%"
    
    if [ "$COVERAGE_INT" -ge "$COVERAGE_THRESHOLD" ]; then
        echo -e "${GREEN}✓ Coverage meets threshold (${COVERAGE}% >= ${COVERAGE_THRESHOLD}%)${NC}"
    else
        echo -e "${RED}❌ Coverage below threshold (${COVERAGE}% < ${COVERAGE_THRESHOLD}%)${NC}"
        exit 1
    fi
    
    # Check coverage by type
    echo ""
    echo "Coverage breakdown:"
    echo "  Lines: $(jq '.total.lines.pct' coverage/coverage-summary.json)%"
    echo "  Statements: $(jq '.total.statements.pct' coverage/coverage-summary.json)%"
    echo "  Functions: $(jq '.total.functions.pct' coverage/coverage-summary.json)%"
    echo "  Branches: $(jq '.total.branches.pct' coverage/coverage-summary.json)%"
else
    echo -e "${RED}❌ Coverage report not found${NC}"
    exit 1
fi
echo ""

# 5. Run integration tests
echo "🔗 Running integration tests..."
if npm run test:integration; then
    echo -e "${GREEN}✓ Integration tests passed${NC}"
else
    echo -e "${RED}❌ Integration tests failed${NC}"
    exit 1
fi
echo ""

# 6. Run E2E tests (if available)
if command_exists "playwright"; then
    echo "🌐 Running E2E tests..."
    if npm run test:e2e:headless; then
        echo -e "${GREEN}✓ E2E tests passed${NC}"
    else
        echo -e "${YELLOW}⚠ E2E tests failed (non-blocking)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Skipping E2E tests (Playwright not installed)${NC}"
fi
echo ""

# 7. Check for new code coverage
echo "🆕 Checking new code coverage..."
# Get list of changed files
CHANGED_FILES=$(git diff --name-only HEAD~1 HEAD | grep -E '\.(ts|tsx|js|jsx)$' | grep -v test | grep -v spec || true)

if [ -n "$CHANGED_FILES" ]; then
    echo "Changed files:"
    echo "$CHANGED_FILES" | sed 's/^/  - /'
    
    # Run coverage for changed files only
    npm run test:coverage -- --collectCoverageFrom="[${CHANGED_FILES}]" --json --outputFile=coverage/new-code-results.json || true
    
    if [ -f "coverage/new-code-results.json" ]; then
        NEW_CODE_COVERAGE=$(jq '.coverageMap | to_entries | map(.value.lines.pct) | add / length' coverage/new-code-results.json)
        echo "New code coverage: ${NEW_CODE_COVERAGE}%"
    fi
else
    echo "No code changes detected in this sprint"
fi
echo ""

# 8. Generate test report
echo "📄 Generating sprint test report..."
REPORT_FILE="sprint-${SPRINT_NUMBER}-test-report.md"

cat > "$REPORT_FILE" << EOF
# Sprint ${SPRINT_NUMBER} Test Report

**Generated**: ${TIMESTAMP}

## Test Summary

- **Total Tests**: ${TOTAL_TESTS}
- **Passed**: ${PASSED_TESTS}
- **Failed**: ${FAILED_TESTS}
- **Overall Coverage**: ${COVERAGE}%

## Coverage Breakdown

| Metric | Coverage |
|--------|----------|
| Lines | $(jq '.total.lines.pct' coverage/coverage-summary.json)% |
| Statements | $(jq '.total.statements.pct' coverage/coverage-summary.json)% |
| Functions | $(jq '.total.functions.pct' coverage/coverage-summary.json)% |
| Branches | $(jq '.total.branches.pct' coverage/coverage-summary.json)% |

## Test Execution Time

- Unit Tests: $(grep "Time:" coverage/test-results.json | head -1 || echo "N/A")
- Integration Tests: $(npm run test:integration -- --listTests 2>&1 | grep "Time:" || echo "N/A")
- E2E Tests: $(npm run test:e2e:headless -- --list 2>&1 | grep "Duration:" || echo "N/A")

## Changed Files

$(if [ -n "$CHANGED_FILES" ]; then echo "$CHANGED_FILES" | sed 's/^/- /'; else echo "No files changed"; fi)

## Sprint Status

$(if [ "$FAILED_TESTS" -eq 0 ] && [ "$COVERAGE_INT" -ge "$COVERAGE_THRESHOLD" ]; then
    echo "✅ **READY FOR COMMIT**"
else
    echo "❌ **NOT READY FOR COMMIT**"
    echo ""
    echo "Issues:"
    [ "$FAILED_TESTS" -gt 0 ] && echo "- $FAILED_TESTS tests are failing"
    [ "$COVERAGE_INT" -lt "$COVERAGE_THRESHOLD" ] && echo "- Coverage is below $COVERAGE_THRESHOLD% threshold"
fi)

---

Generated by sprint-test.sh
EOF

echo -e "${GREEN}✓ Test report generated: $REPORT_FILE${NC}"
echo ""

# 9. Generate coverage badge
echo "🏷️  Generating coverage badge..."
BADGE_COLOR="red"
[ "$COVERAGE_INT" -ge 70 ] && BADGE_COLOR="yellow"
[ "$COVERAGE_INT" -ge 80 ] && BADGE_COLOR="green"
[ "$COVERAGE_INT" -ge 90 ] && BADGE_COLOR="brightgreen"

curl -s "https://img.shields.io/badge/coverage-${COVERAGE}%25-${BADGE_COLOR}" > coverage-badge.svg
echo -e "${GREEN}✓ Coverage badge generated${NC}"
echo ""

# 10. Final summary
echo "================================================"
echo "           SPRINT TEST SUMMARY"
echo "================================================"
echo ""

if [ "$FAILED_TESTS" -eq 0 ] && [ "$COVERAGE_INT" -ge "$COVERAGE_THRESHOLD" ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}✅ COVERAGE THRESHOLD MET!${NC}"
    echo ""
    echo -e "${GREEN}Sprint ${SPRINT_NUMBER} is ready for commit!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review the test report: $REPORT_FILE"
    echo "2. Commit your changes:"
    echo "   git add ."
    echo "   git commit -m \"chore: Sprint ${SPRINT_NUMBER} completion - ${COVERAGE}% coverage\""
    echo "3. Push to your feature branch"
    echo "4. Create a pull request"
    exit 0
else
    echo -e "${RED}❌ SPRINT NOT READY FOR COMMIT${NC}"
    echo ""
    echo "Issues to resolve:"
    [ "$FAILED_TESTS" -gt 0 ] && echo "- Fix $FAILED_TESTS failing tests"
    [ "$COVERAGE_INT" -lt "$COVERAGE_THRESHOLD" ] && echo "- Increase coverage to at least $COVERAGE_THRESHOLD%"
    echo ""
    echo "Run 'npm run test:watch' to fix failing tests"
    echo "Run 'npm run coverage:open' to see uncovered code"
    exit 1
fi