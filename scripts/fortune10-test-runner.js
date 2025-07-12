#!/usr/bin/env node

const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Fortune 10 Test Requirements
const COVERAGE_TARGETS = {
  statements: 90,
  branches: 90,
  functions: 90,
  lines: 90
};

const TEST_CATEGORIES = [
  { name: 'Unit Tests', pattern: '**/*.test.{ts,tsx}', exclude: 'integration|e2e|performance' },
  { name: 'Integration Tests', pattern: '**/integration*.test.{ts,tsx}' },
  { name: 'API Tests', pattern: '**/api/**/*.test.{ts,tsx}' },
  { name: 'Security Tests', pattern: '**/security*.test.{ts,tsx}' },
  { name: 'Performance Tests', pattern: '**/performance*.test.{ts,tsx}' },
  { name: 'E2E Tests', command: 'npm run test:e2e' }
];

async function runTestCategory(category) {
  console.log(`\n🏃 Running ${category.name}...`);
  
  try {
    if (category.command) {
      const { stdout, stderr } = await execAsync(category.command);
      return { category: category.name, success: true, output: stdout };
    } else {
      const cmd = `npm test -- --testPathPattern='${category.pattern}' ${category.exclude ? `--testPathIgnorePatterns='${category.exclude}'` : ''} --json --outputFile=test-results/${category.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      const { stdout, stderr } = await execAsync(cmd);
      return { category: category.name, success: true, output: stdout };
    }
  } catch (error) {
    return { category: category.name, success: false, error: error.message };
  }
}

async function runCoverageAnalysis() {
  console.log('\n📊 Running coverage analysis...');
  
  try {
    const { stdout } = await execAsync('npm run test:coverage -- --json --outputFile=coverage/coverage-summary.json');
    const coverageData = JSON.parse(await fs.readFile('coverage/coverage-summary.json', 'utf8'));
    
    const summary = coverageData.total;
    const meetsTargets = Object.entries(COVERAGE_TARGETS).every(([metric, target]) => {
      return summary[metric].pct >= target;
    });
    
    return {
      summary,
      meetsTargets,
      gaps: Object.entries(COVERAGE_TARGETS).reduce((acc, [metric, target]) => {
        const actual = summary[metric].pct;
        if (actual < target) {
          acc[metric] = { target, actual, gap: target - actual };
        }
        return acc;
      }, {})
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function generateReport(results, coverage) {
  const report = {
    timestamp: new Date().toISOString(),
    testResults: results,
    coverage,
    fortune10Compliant: coverage.meetsTargets && results.every(r => r.success),
    recommendations: []
  };
  
  if (!coverage.meetsTargets) {
    report.recommendations.push('Increase test coverage to meet Fortune 10 standards (90%+ in all metrics)');
  }
  
  const failedCategories = results.filter(r => !r.success);
  if (failedCategories.length > 0) {
    report.recommendations.push(`Fix failing tests in: ${failedCategories.map(r => r.category).join(', ')}`);
  }
  
  await fs.writeFile('fortune10-test-report.json', JSON.stringify(report, null, 2));
  
  // Generate human-readable report
  const readableReport = `
# Fortune 10 Test Report
Generated: ${report.timestamp}

## Test Results
${results.map(r => `- ${r.category}: ${r.success ? '✅ PASS' : '❌ FAIL'}`).join('\n')}

## Coverage Summary
- Statements: ${coverage.summary?.statements.pct || 0}% (Target: ${COVERAGE_TARGETS.statements}%)
- Branches: ${coverage.summary?.branches.pct || 0}% (Target: ${COVERAGE_TARGETS.branches}%)
- Functions: ${coverage.summary?.functions.pct || 0}% (Target: ${COVERAGE_TARGETS.functions}%)
- Lines: ${coverage.summary?.lines.pct || 0}% (Target: ${COVERAGE_TARGETS.lines}%)

## Fortune 10 Compliance: ${report.fortune10Compliant ? '✅ COMPLIANT' : '❌ NOT COMPLIANT'}

## Recommendations
${report.recommendations.map(r => `- ${r}`).join('\n')}
`;
  
  await fs.writeFile('FORTUNE10_TEST_REPORT.md', readableReport);
  console.log(readableReport);
}

async function main() {
  console.log('🏆 Fortune 10 Test Runner');
  console.log('========================\n');
  
  // Create test results directory
  await fs.mkdir('test-results', { recursive: true });
  
  // Run all test categories
  const results = [];
  for (const category of TEST_CATEGORIES) {
    const result = await runTestCategory(category);
    results.push(result);
  }
  
  // Run coverage analysis
  const coverage = await runCoverageAnalysis();
  
  // Generate report
  await generateReport(results, coverage);
  
  // Exit with appropriate code
  const isCompliant = coverage.meetsTargets && results.every(r => r.success);
  process.exit(isCompliant ? 0 : 1);
}

main().catch(console.error);