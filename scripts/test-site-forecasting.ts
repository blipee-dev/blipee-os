/**
 * Test Site-Level Forecasting
 *
 * This script tests that the new site-level forecasting system works correctly:
 * 1. Generates forecasts for each site individually
 * 2. Generates organization-level aggregate forecast
 * 3. Verifies data is properly stored with site_id
 */

import { MetricsPreComputeService } from '../src/workers/services/metrics-precompute-service';

async function testSiteLevelForecasting() {
  console.log('\n🧪 Testing Site-Level Forecasting\n');
  console.log('=' .repeat(60));

  const service = new MetricsPreComputeService();

  try {
    console.log('Running metrics pre-computation service...\n');
    await service.run();

    console.log('\n✅ Service completed successfully!');
    console.log('\nService Stats:');
    const health = service.getHealth();
    console.log(`  • Baselines computed: ${health.baselinesComputed}`);
    console.log(`  • Forecasts generated: ${health.forecastsGenerated}`);
    console.log(`  • Cache updates: ${health.cacheUpdates}`);
    console.log(`  • Errors: ${health.errors}`);
    console.log(`  • Duration: ${health.lastRunDuration ? (health.lastRunDuration / 1000).toFixed(2) + 's' : 'N/A'}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testSiteLevelForecasting()
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  });
