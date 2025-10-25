/**
 * Direct test of BlipeeBrain's queryMetrics tool
 * This bypasses the HTTP layer and tests the tool execution directly
 */

import { BlipeeBrain } from './src/lib/ai/blipee-brain.ts';

async function testQueryMetricsTool() {
  console.log('🧪 Testing BlipeeBrain queryMetrics Tool Directly\n');
  console.log('='.repeat(80));

  try {
    // Create BlipeeBrain instance with test context
    const brain = new BlipeeBrain({
      userId: 'test-user',
      organizationId: '22647141-2ee4-4d8d-8b47-16b0cbd830b2', // Real org ID from logs
      conversationId: 'test-conversation',
      userName: 'Test User'
    });

    // Test 1: Query emissions for YTD
    console.log('\n📊 Test 1: Query Emissions (Year-to-Date)');
    console.log('-'.repeat(80));
    const emissionsResult = await brain.tools.get('queryMetrics').execute({
      metricTypes: ['emissions'],
      period: 'ytd'
    });
    console.log('Result:', JSON.stringify(emissionsResult, null, 2).substring(0, 500) + '...');

    // Test 2: Query energy for last 3 months
    console.log('\n⚡ Test 2: Query Energy (Last Quarter)');
    console.log('-'.repeat(80));
    const energyResult = await brain.tools.get('queryMetrics').execute({
      metricTypes: ['energy'],
      period: '3m'
    });
    console.log('Result:', JSON.stringify(energyResult, null, 2).substring(0, 500) + '...');

    // Test 3: Query multiple metrics
    console.log('\n🌊 Test 3: Query Water and Waste');
    console.log('-'.repeat(80));
    const multiResult = await brain.tools.get('queryMetrics').execute({
      metricTypes: ['water', 'waste'],
      period: 'ytd'
    });
    console.log('Result:', JSON.stringify(multiResult, null, 2).substring(0, 500) + '...');

    // Test 4: Query all metrics
    console.log('\n🌍 Test 4: Query All Metrics (Overall Impact)');
    console.log('-'.repeat(80));
    const allResult = await brain.tools.get('queryMetrics').execute({
      metricTypes: ['emissions', 'energy', 'water', 'waste'],
      period: '6m'
    });
    console.log('Result:', JSON.stringify(allResult, null, 2).substring(0, 500) + '...');

    console.log('\n' + '='.repeat(80));
    console.log('✅ All tests completed successfully!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    console.error('Stack trace:', error.stack);
  }
}

testQueryMetricsTool();
