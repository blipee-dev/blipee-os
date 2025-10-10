#!/usr/bin/env node

/**
 * Comprehensive API Calculator Migration Test
 *
 * Tests all 6 updated APIs to ensure they return consistent 303.6 tCO2e for 2023
 *
 * Expected result: ALL APIs should show 303.6 tCO2e (not 303.5!)
 */

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'; // PLMJ

// Test configuration
const tests = [
  {
    name: 'Scope Analysis API',
    endpoint: '/api/sustainability/scope-analysis?year=2023',
    extractValue: (data) => data.totalEmissions,
    extractScopes: (data) => ({
      scope1: data.scope1Total,
      scope2: data.scope2Total,
      scope3: data.scope3Total
    })
  },
  {
    name: 'Emissions API',
    endpoint: '/api/sustainability/emissions?period=all',
    extractValue: (data) => {
      // Find 2023 data in historical
      const year2023 = data.historical?.find(h => h.year === 2023);
      return year2023?.total || data.current?.total;
    },
    extractScopes: (data) => {
      const year2023 = data.historical?.find(h => h.year === 2023);
      return {
        scope1: year2023?.scope1 || data.current?.scope1,
        scope2: year2023?.scope2 || data.current?.scope2,
        scope3: year2023?.scope3 || data.current?.scope3
      };
    }
  },
  {
    name: 'Emissions Detailed API',
    endpoint: '/api/sustainability/emissions-detailed?start_date=2023-01-01&end_date=2023-12-31',
    extractValue: (data) => data.summary?.totalEmissions,
    extractScopes: (data) => ({
      scope1: data.summary?.scope1,
      scope2: data.summary?.scope2,
      scope3: data.summary?.scope3
    })
  },
  {
    name: 'Forecast API',
    endpoint: '/api/sustainability/forecast?start_date=2023-01-01&end_date=2023-12-31',
    extractValue: (data) => {
      // This API returns forecasts, check metadata or last actual
      return null; // Forecast API doesn't return 2023 totals directly
    },
    skip: true,
    reason: 'Forecast API returns future predictions, not historical totals'
  },
  {
    name: 'Dashboard API',
    endpoint: '/api/sustainability/dashboard?range=2023',
    extractValue: (data) => data.metrics?.totalEmissions?.value,
    extractScopes: (data) => {
      const breakdown = data.scopeBreakdown || [];
      return {
        scope1: breakdown.find(s => s.name === 'Scope 1')?.value,
        scope2: breakdown.find(s => s.name === 'Scope 2')?.value,
        scope3: breakdown.find(s => s.name === 'Scope 3')?.value
      };
    }
  },
  {
    name: 'Energy Baseline API',
    endpoint: '/api/sustainability/metrics/energy-baseline',
    extractValue: (data) => data.totalEnergy,
    skip: true,
    reason: 'Energy API returns kWh, not emissions'
  }
];

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI(test, baseUrl) {
  if (test.skip) {
    log(`⏭️  ${test.name}: ${test.reason}`, 'yellow');
    return { skipped: true };
  }

  try {
    log(`\n🧪 Testing ${test.name}...`, 'cyan');
    log(`   ${baseUrl}${test.endpoint}`, 'blue');

    const response = await fetch(`${baseUrl}${test.endpoint}`);

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();

    // Extract values
    const totalEmissions = test.extractValue(data);
    const scopes = test.extractScopes ? test.extractScopes(data) : null;

    // Check if we got 303.6
    const expected = 303.6;
    const tolerance = 0.1;
    const isCorrect = totalEmissions && Math.abs(totalEmissions - expected) < tolerance;

    // Results
    if (isCorrect) {
      log(`   ✅ PASS: ${totalEmissions} tCO2e`, 'green');
    } else {
      log(`   ❌ FAIL: ${totalEmissions} tCO2e (expected ${expected})`, 'red');
    }

    // Scope breakdown
    if (scopes) {
      log(`   📊 Scopes:`, 'blue');
      log(`      Scope 1: ${scopes.scope1?.toFixed(1) || 'N/A'} tCO2e`, 'blue');
      log(`      Scope 2: ${scopes.scope2?.toFixed(1) || 'N/A'} tCO2e`, 'blue');
      log(`      Scope 3: ${scopes.scope3?.toFixed(1) || 'N/A'} tCO2e`, 'blue');

      // Verify scopes add up
      if (scopes.scope1 && scopes.scope2 && scopes.scope3) {
        const sum = scopes.scope1 + scopes.scope2 + scopes.scope3;
        const scopeSum = Math.round(sum * 10) / 10;
        log(`      Sum: ${scopeSum} tCO2e`, scopeSum === totalEmissions ? 'green' : 'yellow');
      }
    }

    return {
      success: isCorrect,
      value: totalEmissions,
      scopes,
      data
    };

  } catch (error) {
    log(`   ❌ ERROR: ${error.message}`, 'red');
    return {
      success: false,
      error: error.message
    };
  }
}

async function runTests() {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3003';

  log('═══════════════════════════════════════════════════════════', 'bold');
  log('🧮 CALCULATOR API MIGRATION TEST SUITE', 'bold');
  log('═══════════════════════════════════════════════════════════', 'bold');
  log(`\n📍 Base URL: ${baseUrl}`, 'cyan');
  log(`📅 Test Year: 2023`, 'cyan');
  log(`🎯 Expected: 303.6 tCO2e (scope-by-scope rounding)`, 'cyan');
  log(`❌ Wrong: 303.5 tCO2e (direct sum then divide)\n`, 'cyan');

  const results = [];

  for (const test of tests) {
    const result = await testAPI(test, baseUrl);
    results.push({
      name: test.name,
      ...result
    });
  }

  // Summary
  log('\n═══════════════════════════════════════════════════════════', 'bold');
  log('📊 TEST SUMMARY', 'bold');
  log('═══════════════════════════════════════════════════════════', 'bold');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success && !r.skipped).length;
  const skipped = results.filter(r => r.skipped).length;
  const total = results.length - skipped;

  log(`\n✅ Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  log(`❌ Failed: ${failed}/${total}`, failed === 0 ? 'green' : 'red');
  log(`⏭️  Skipped: ${skipped}`, 'yellow');

  // Details
  if (failed > 0) {
    log('\n❌ Failed Tests:', 'red');
    results
      .filter(r => !r.success && !r.skipped)
      .forEach(r => {
        log(`   - ${r.name}: ${r.error || `Got ${r.value}, expected 303.6`}`, 'red');
      });
  }

  // Consistency check
  const values = results
    .filter(r => r.success && r.value)
    .map(r => r.value);

  if (values.length > 0) {
    const allSame = values.every(v => Math.abs(v - values[0]) < 0.1);
    log('\n🔍 Consistency Check:', 'cyan');
    if (allSame) {
      log(`   ✅ ALL APIs return the same value: ${values[0]} tCO2e`, 'green');
    } else {
      log(`   ❌ APIs return different values!`, 'red');
      results
        .filter(r => r.success && r.value)
        .forEach(r => {
          log(`      ${r.name}: ${r.value} tCO2e`, 'yellow');
        });
    }
  }

  log('\n═══════════════════════════════════════════════════════════\n', 'bold');

  // Exit code
  process.exit(failed > 0 ? 1 : 0);
}

// Check if server is running
async function checkServer(baseUrl) {
  try {
    log('🔌 Checking if server is running...', 'cyan');
    const response = await fetch(baseUrl, { method: 'HEAD' });
    log('✅ Server is running!\n', 'green');
    return true;
  } catch (error) {
    log('❌ Server is not running!', 'red');
    log('   Please start the dev server first:', 'yellow');
    log('   npm run dev\n', 'yellow');
    return false;
  }
}

// Main
(async () => {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3003';

  const serverRunning = await checkServer(baseUrl);
  if (!serverRunning) {
    process.exit(1);
  }

  await runTests();
})();
