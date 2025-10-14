/**
 * Test script to verify the /api/sustainability/top-metrics endpoint
 * Run with: node test-top-metrics-api.js
 */

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const startDate = '2025-01-01';
const endDate = '2025-12-31';

async function testTopMetricsAPI() {
  try {
    console.log('🔍 Testing Top Metrics API');
    console.log(`Organization ID: ${organizationId}`);
    console.log(`Period: ${startDate} to ${endDate}`);
    console.log('');

    const url = `http://localhost:3002/api/sustainability/top-metrics?start_date=${startDate}&end_date=${endDate}`;
    console.log(`📡 Fetching: ${url}`);
    console.log('');

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      const error = await response.text();
      console.error('Error details:', error);
      return;
    }

    const data = await response.json();
    console.log('✅ API Response received');
    console.log('');

    console.log('📊 Top Metrics Data:');
    console.log(`  Total metrics returned: ${data.metrics?.length || 0}`);
    console.log('');

    if (data.metrics && data.metrics.length > 0) {
      console.log('🏆 Top 5 Emission-Generating Metrics:');
      console.log('');
      console.log('Rank | Metric Name                      | Emissions   | Category              | Scope   ');
      console.log('─'.repeat(100));

      data.metrics.slice(0, 5).forEach((metric, index) => {
        const rank = (index + 1).toString().padStart(4);
        const name = metric.name.padEnd(35);
        const emissions = `${metric.emissions.toFixed(1)} tCO2e`.padEnd(12);
        const category = metric.category.padEnd(20);
        const scope = metric.scope.padEnd(8);

        console.log(`${rank} │ ${name} │ ${emissions} │ ${category} │ ${scope}`);
      });

      console.log('─'.repeat(100));
      console.log('');

      console.log('📈 Expected Results:');
      console.log('  The top metrics should be individual metrics like:');
      console.log('    - Business Travel - Flights');
      console.log('    - Grid Electricity');
      console.log('    - Car Travel - Gasoline');
      console.log('    - District Heating');
      console.log('    - etc.');
      console.log('');
      console.log('  NOT aggregated categories like "Purchased Electricity"');
      console.log('');

      console.log('✅ Test completed successfully!');
    } else {
      console.log('⚠️  No metrics data returned from API');
      console.log('   This might indicate:');
      console.log('   1. No emissions data in the database for this period');
      console.log('   2. Authentication issues');
      console.log('   3. Organization ID mismatch');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTopMetricsAPI();
