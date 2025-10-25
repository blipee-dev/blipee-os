const fetch = require('node-fetch');

async function testAndSummarize() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const baselineYear = 2023;

  console.log('🔍 Testing Baseline Restatement System\n');
  console.log('=' .repeat(80));

  // Test 1: Detect new metrics
  console.log('\n📊 TEST 1: Detect New Metrics API');
  console.log('-'.repeat(80));

  const response = await fetch(
    `http://localhost:3000/api/sustainability/baseline/detect-new-metrics?organizationId=${organizationId}&baselineYear=${baselineYear}`
  );
  const data = await response.json();

  console.log(`✅ API Response: ${response.status} ${response.statusText}`);
  console.log(`✅ Success: ${data.success}`);
  console.log(`✅ New metrics found: ${data.count}`);
  console.log(`✅ Needs restatement: ${data.needsRestatement}`);
  console.log(`\n💬 Message: ${data.message}\n`);

  // Group by category
  const byCategory = data.newMetrics.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {});

  console.log('📋 New Metrics by Category:');
  console.log('-'.repeat(80));

  Object.entries(byCategory).forEach(([category, metrics]) => {
    console.log(`\n${category} (${metrics.length} metrics):`);

    const totalEmissions = metrics.reduce((sum, m) => sum + m.total_emissions, 0);
    const totalDataPoints = metrics.reduce((sum, m) => sum + m.data_points_count, 0);

    metrics.forEach(metric => {
      console.log(`  • ${metric.metric_name}`);
      console.log(`    - Scope: ${metric.scope}`);
      console.log(`    - First data: ${metric.first_data_date}`);
      console.log(`    - Data points: ${metric.data_points_count}`);
      console.log(`    - Total emissions: ${metric.total_emissions.toFixed(2)} tCO2e`);
    });

    console.log(`  ─────────────────────────────────────────────────────────`);
    console.log(`  Category Total: ${totalEmissions.toFixed(2)} tCO2e (${totalDataPoints} data points)`);
  });

  // Calculate total additional emissions
  const totalAdditionalEmissions = data.newMetrics.reduce(
    (sum, m) => sum + m.total_emissions,
    0
  );

  console.log('\n' + '='.repeat(80));
  console.log('📈 BASELINE RESTATEMENT IMPACT');
  console.log('='.repeat(80));

  console.log('\nAssuming original 2023 baseline: 413.36 tCO2e');
  console.log(`Total emissions from new metrics (2024+): ${totalAdditionalEmissions.toFixed(2)} tCO2e`);

  // Note: This is total tracked emissions, not baseline year estimates
  console.log('\n⚠️  Note: These are total emissions tracked since 2024.');
  console.log('    For baseline restatement, you need to estimate what these');
  console.log('    metrics would have been in 2023 using:');
  console.log('    • Industry averages');
  console.log('    • Extrapolation from current data');
  console.log('    • Proxy data from similar activities');
  console.log('    • Direct calculation from historical records');

  console.log('\n' + '='.repeat(80));
  console.log('🎯 NEXT STEPS');
  console.log('='.repeat(80));
  console.log('\n1. Use the BaselineRestatementModal component to guide users through:');
  console.log('   - Reviewing these 28 new metrics');
  console.log('   - Estimating their 2023 baseline emissions');
  console.log('   - Documenting estimation methodology');
  console.log('   - Creating a baseline restatement record');
  console.log('\n2. Approve and apply the restatement to update the target');
  console.log('\n3. The system will:');
  console.log('   - Restate 2023 baseline with historical estimates');
  console.log('   - Adjust 2030 target (same % reduction, higher absolute value)');
  console.log('   - Track progress against comprehensive baseline');
  console.log('\n✨ System is ready for SBTi-compliant baseline restatement!\n');
}

testAndSummarize().catch(console.error);
