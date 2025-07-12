#!/bin/bash

echo "🏆 Fortune 10 Test Coverage Runner"
echo "================================="
echo ""

# Set test environment
export NODE_ENV=test
export NODE_OPTIONS='--experimental-vm-modules'

# Run tests with full coverage
echo "📊 Running all tests with coverage..."
npm test -- \
  --coverage \
  --collectCoverageFrom='src/**/*.{ts,tsx}' \
  --collectCoverageFrom='!src/**/*.d.ts' \
  --collectCoverageFrom='!src/**/*.stories.{ts,tsx}' \
  --collectCoverageFrom='!src/**/__tests__/**' \
  --collectCoverageFrom='!src/test/**' \
  --collectCoverageFrom='!src/types/**' \
  --coverageReporters='text' \
  --coverageReporters='text-summary' \
  --coverageReporters='json-summary' \
  --maxWorkers=4 \
  --silent 2>&1 | tee test-output.log

# Extract coverage summary
echo ""
echo "📈 Coverage Summary:"
echo "==================="
cat test-output.log | grep -A 10 "Coverage summary" || echo "Coverage data not found"

# Check if we meet Fortune 10 standards
echo ""
echo "🎯 Fortune 10 Compliance Check:"
echo "=============================="

if [ -f coverage/coverage-summary.json ]; then
  node -e "
    const coverage = require('./coverage/coverage-summary.json');
    const total = coverage.total;
    const target = 90;
    
    console.log('Statements: ' + total.statements.pct + '% (Target: ' + target + '%)');
    console.log('Branches: ' + total.branches.pct + '% (Target: ' + target + '%)');
    console.log('Functions: ' + total.functions.pct + '% (Target: ' + target + '%)');
    console.log('Lines: ' + total.lines.pct + '% (Target: ' + target + '%)');
    
    const compliant = 
      total.statements.pct >= target &&
      total.branches.pct >= target &&
      total.functions.pct >= target &&
      total.lines.pct >= target;
    
    console.log('');
    console.log('Status: ' + (compliant ? '✅ COMPLIANT' : '❌ NOT COMPLIANT'));
    
    if (!compliant) {
      console.log('');
      console.log('Gap to target:');
      console.log('- Statements: ' + (target - total.statements.pct).toFixed(1) + '%');
      console.log('- Branches: ' + (target - total.branches.pct).toFixed(1) + '%');
      console.log('- Functions: ' + (target - total.functions.pct).toFixed(1) + '%');
      console.log('- Lines: ' + (target - total.lines.pct).toFixed(1) + '%');
    }
  "
else
  echo "Coverage summary file not found"
fi

echo ""
echo "✅ Test run complete!"