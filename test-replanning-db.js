require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testReplanning() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const targetId = 'd4a00170-7964-41e2-a61e-3d7b0059cfe5';

  console.log('🧪 Testing replanning database function...\n');

  // Test with minimal data
  const testMetricTargets = [
    {
      metricId: '9c96b4c0-f69e-42a1-9e1e-f46c8eb09742', // scope2_electricity
      metricName: 'Electricity Consumption',
      metricCode: 'scope2_electricity',
      unit: 'kWh',
      scope: 'Scope 2',
      category: 'Energy',
      baselineYear: 2023,
      currentAnnualValue: 100000,
      currentAnnualEmissions: 50,
      currentEmissionFactor: 0.5,
      targetYear: 2030,
      targetAnnualValue: 50000,
      targetAnnualEmissions: 25,
      targetEmissionFactor: 0.5,
      reductionPercent: 50,
      strategyType: 'activity_reduction',
      monthlyTargets: [],
      initiatives: [],
      confidenceLevel: 'medium'
    }
  ];

  const { data, error } = await supabaseAdmin.rpc('apply_target_replanning', {
    p_organization_id: organizationId,
    p_target_id: targetId,
    p_metric_targets: testMetricTargets, // Pass as array, not stringified
    p_strategy: 'test',
    p_trigger: 'manual',
    p_user_id: null,
    p_notes: 'Test replanning from Node.js'
  });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Success!');
  console.log('📦 Response:', JSON.stringify(data, null, 2));
}

testReplanning().catch(console.error);
