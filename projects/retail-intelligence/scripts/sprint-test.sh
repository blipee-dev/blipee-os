#!/bin/bash

# Retail Intelligence Sprint Test Script
# This script validates sprint completion criteria

set -e

echo "================================================"
echo "    RETAIL INTELLIGENCE SPRINT TEST"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
COVERAGE_THRESHOLD=90
NEW_CODE_COVERAGE_THRESHOLD=95
SPRINT_NUMBER=${1:-"current"}
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Ensure we're in the retail-intelligence directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    echo -e "${RED}❌ Must run from retail-intelligence directory${NC}"
    exit 1
fi

echo "🔍 Checking prerequisites..."
for cmd in npm jq bc; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo -e "${RED}❌ $cmd is not installed${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# 1. Run linting
echo "📝 Running code quality checks..."
if npm run lint 2>&1; then
    echo -e "${GREEN}✓ Linting passed${NC}"
    LINT_PASSED=true
else
    echo -e "${RED}❌ Linting failed${NC}"
    LINT_PASSED=false
fi
echo ""

# 2. Run type checking
echo "🔍 Running TypeScript type check..."
if npm run type-check 2>&1; then
    echo -e "${GREEN}✓ Type checking passed${NC}"
    TYPE_CHECK_PASSED=true
else
    echo -e "${RED}❌ Type checking failed${NC}"
    TYPE_CHECK_PASSED=false
fi
echo ""

# 3. Run unit tests with coverage
echo "🧪 Running unit tests with coverage..."
npm run test:coverage -- --json --outputFile=coverage/test-results.json 2>&1 || true

# Parse test results
if [ -f "coverage/test-results.json" ]; then
    TOTAL_TESTS=$(jq '.numTotalTests' coverage/test-results.json)
    PASSED_TESTS=$(jq '.numPassedTests' coverage/test-results.json)
    FAILED_TESTS=$(jq '.numFailedTests' coverage/test-results.json)
    
    if [ "$FAILED_TESTS" -eq 0 ]; then
        echo -e "${GREEN}✓ All $TOTAL_TESTS tests passed${NC}"
        TESTS_PASSED=true
    else
        echo -e "${RED}❌ $FAILED_TESTS out of $TOTAL_TESTS tests failed${NC}"
        TESTS_PASSED=false
    fi
else
    echo -e "${RED}❌ Could not parse test results${NC}"
    TESTS_PASSED=false
    TOTAL_TESTS=0
    PASSED_TESTS=0
    FAILED_TESTS=0
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
        COVERAGE_MET=true
    else
        echo -e "${RED}❌ Coverage below threshold (${COVERAGE}% < ${COVERAGE_THRESHOLD}%)${NC}"
        COVERAGE_MET=false
    fi
    
    # Show coverage breakdown
    echo ""
    echo "Coverage breakdown:"
    echo "  Lines: $(jq '.total.lines.pct' coverage/coverage-summary.json)%"
    echo "  Statements: $(jq '.total.statements.pct' coverage/coverage-summary.json)%"
    echo "  Functions: $(jq '.total.functions.pct' coverage/coverage-summary.json)%"
    echo "  Branches: $(jq '.total.branches.pct' coverage/coverage-summary.json)%"
else
    echo -e "${RED}❌ Coverage report not found${NC}"
    COVERAGE_MET=false
    COVERAGE=0
fi
echo ""

# 5. Run integration tests
echo "🔗 Running integration tests..."
if [ -f "jest.integration.config.js" ]; then
    if npm run test:integration 2>&1; then
        echo -e "${GREEN}✓ Integration tests passed${NC}"
        INTEGRATION_PASSED=true
    else
        echo -e "${RED}❌ Integration tests failed${NC}"
        INTEGRATION_PASSED=false
    fi
else
    echo -e "${YELLOW}⚠ No integration tests configured${NC}"
    INTEGRATION_PASSED=true
fi
echo ""

# 6. Check for database migrations
echo "🗄️ Checking database migrations..."
MIGRATION_COUNT=$(ls -1 database/migrations/*.sql 2>/dev/null | wc -l)
if [ "$MIGRATION_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Found $MIGRATION_COUNT migration files${NC}"
    MIGRATIONS_EXIST=true
else
    echo -e "${YELLOW}⚠ No migration files found${NC}"
    MIGRATIONS_EXIST=false
fi
echo ""

# 7. Check API documentation
echo "📚 Checking API documentation..."
if [ -f "docs/api/openapi.yaml" ] || [ -f "docs/api/README.md" ]; then
    echo -e "${GREEN}✓ API documentation found${NC}"
    API_DOCS_EXIST=true
else
    echo -e "${YELLOW}⚠ API documentation missing${NC}"
    API_DOCS_EXIST=false
fi
echo ""

# 8. Generate test report
echo "📄 Generating sprint test report..."
REPORT_FILE="docs/sprint-reports/sprint-${SPRINT_NUMBER}-test-report.md"
mkdir -p docs/sprint-reports

cat > "$REPORT_FILE" << EOF
# Sprint ${SPRINT_NUMBER} Test Report - Retail Intelligence

**Generated**: ${TIMESTAMP}

## Test Summary

- **Total Tests**: ${TOTAL_TESTS}
- **Passed**: ${PASSED_TESTS}
- **Failed**: ${FAILED_TESTS}
- **Overall Coverage**: ${COVERAGE}%

## Quality Checks

| Check | Status | Details |
|-------|--------|---------|
| Linting | $([ "$LINT_PASSED" = true ] && echo "✅ Passed" || echo "❌ Failed") | ESLint validation |
| Type Checking | $([ "$TYPE_CHECK_PASSED" = true ] && echo "✅ Passed" || echo "❌ Failed") | TypeScript validation |
| Unit Tests | $([ "$TESTS_PASSED" = true ] && echo "✅ Passed" || echo "❌ Failed") | ${PASSED_TESTS}/${TOTAL_TESTS} tests |
| Coverage | $([ "$COVERAGE_MET" = true ] && echo "✅ Met" || echo "❌ Not Met") | ${COVERAGE}% (target: ${COVERAGE_THRESHOLD}%) |
| Integration Tests | $([ "$INTEGRATION_PASSED" = true ] && echo "✅ Passed" || echo "❌ Failed") | API and database tests |
| Migrations | $([ "$MIGRATIONS_EXIST" = true ] && echo "✅ Ready" || echo "⚠️ Missing") | ${MIGRATION_COUNT} files |
| API Docs | $([ "$API_DOCS_EXIST" = true ] && echo "✅ Documented" || echo "⚠️ Missing") | OpenAPI/README |

## Coverage Breakdown

| Metric | Coverage |
|--------|----------|
| Lines | $(jq '.total.lines.pct' coverage/coverage-summary.json 2>/dev/null || echo "N/A")% |
| Statements | $(jq '.total.statements.pct' coverage/coverage-summary.json 2>/dev/null || echo "N/A")% |
| Functions | $(jq '.total.functions.pct' coverage/coverage-summary.json 2>/dev/null || echo "N/A")% |
| Branches | $(jq '.total.branches.pct' coverage/coverage-summary.json 2>/dev/null || echo "N/A")% |

## Sprint Status

EOF

# Determine overall status
ALL_PASSED=true
BLOCKING_ISSUES=""

if [ "$LINT_PASSED" != true ]; then
    ALL_PASSED=false
    BLOCKING_ISSUES="${BLOCKING_ISSUES}- Fix linting errors\n"
fi

if [ "$TYPE_CHECK_PASSED" != true ]; then
    ALL_PASSED=false
    BLOCKING_ISSUES="${BLOCKING_ISSUES}- Fix TypeScript errors\n"
fi

if [ "$TESTS_PASSED" != true ]; then
    ALL_PASSED=false
    BLOCKING_ISSUES="${BLOCKING_ISSUES}- Fix failing tests\n"
fi

if [ "$COVERAGE_MET" != true ]; then
    ALL_PASSED=false
    BLOCKING_ISSUES="${BLOCKING_ISSUES}- Increase test coverage to ${COVERAGE_THRESHOLD}%\n"
fi

if [ "$INTEGRATION_PASSED" != true ]; then
    ALL_PASSED=false
    BLOCKING_ISSUES="${BLOCKING_ISSUES}- Fix integration tests\n"
fi

if [ "$ALL_PASSED" = true ]; then
    echo "✅ **READY FOR COMMIT**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "All quality gates passed. Sprint ${SPRINT_NUMBER} is ready for completion." >> "$REPORT_FILE"
else
    echo "❌ **NOT READY FOR COMMIT**" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "### Blocking Issues:" >> "$REPORT_FILE"
    echo -e "$BLOCKING_ISSUES" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "Generated by sprint-test.sh" >> "$REPORT_FILE"

echo -e "${GREEN}✓ Test report generated: $REPORT_FILE${NC}"
echo ""

# 9. Generate coverage badge
echo "🏷️  Generating coverage badge..."
mkdir -p docs/badges
BADGE_COLOR="red"
[ "$COVERAGE_INT" -ge 70 ] && BADGE_COLOR="yellow"
[ "$COVERAGE_INT" -ge 80 ] && BADGE_COLOR="green"
[ "$COVERAGE_INT" -ge 90 ] && BADGE_COLOR="brightgreen"

# Create simple SVG badge
cat > "docs/badges/coverage.svg" << EOF
<svg xmlns="http://www.w3.org/2000/svg" width="104" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="104" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#555" d="M0 0h63v20H0z"/>
    <path fill="${BADGE_COLOR}" d="M63 0h41v20H63z"/>
    <path fill="url(#b)" d="M0 0h104v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="31.5" y="15" fill="#010101" fill-opacity=".3">coverage</text>
    <text x="31.5" y="14">coverage</text>
    <text x="82.5" y="15" fill="#010101" fill-opacity=".3">${COVERAGE}%</text>
    <text x="82.5" y="14">${COVERAGE}%</text>
  </g>
</svg>
EOF

echo -e "${GREEN}✓ Coverage badge generated${NC}"
echo ""

# 10. Final summary
echo "================================================"
echo "           SPRINT TEST SUMMARY"
echo "================================================"
echo ""

if [ "$ALL_PASSED" = true ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}✅ COVERAGE THRESHOLD MET!${NC}"
    echo ""
    echo -e "${GREEN}Sprint ${SPRINT_NUMBER} is ready for commit!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Review the test report: $REPORT_FILE"
    echo "2. Update the sprint tracker"
    echo "3. Commit your changes"
    echo "4. Push to your feature branch"
    echo "5. Create a pull request"
    exit 0
else
    echo -e "${RED}❌ SPRINT NOT READY FOR COMMIT${NC}"
    echo ""
    echo "Issues to resolve:"
    echo -e "$BLOCKING_ISSUES"
    echo ""
    echo "Tips:"
    echo "- Run 'npm run test:watch' to fix failing tests"
    echo "- Run 'npm run coverage:open' to see uncovered code"
    echo "- Run 'npm run lint -- --fix' to auto-fix some linting issues"
    exit 1
fi