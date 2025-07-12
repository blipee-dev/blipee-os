const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Run jest with coverage for all files
  console.log('Running coverage analysis for entire project...\n');
  
  execSync('npx jest --config jest.config.full.js --coverage --coverageReporters=json --passWithNoTests', {
    stdio: 'inherit'
  });
  
  // Read the coverage summary
  const coverageSummary = JSON.parse(
    fs.readFileSync('coverage/coverage-summary.json', 'utf8')
  );
  
  const total = coverageSummary.total;
  
  console.log('\n=== OVERALL PROJECT COVERAGE ===');
  console.log(`Statements: ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})`);
  console.log(`Branches: ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`);
  console.log(`Functions: ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})`);
  console.log(`Lines: ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})`);
  
} catch (error) {
  console.error('Error calculating coverage:', error.message);
}