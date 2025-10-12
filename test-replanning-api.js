require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testReplanningAPI() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const targetId = 'f26e3d5e-f1c1-4e00-8bdd-4e7f2e5e2e5e';

  console.log('🧪 Testing replanning API response structure...\n');

  // Import the replanning engine
  const { ReplanningEngine } = require('./src/lib/sustainability/replanning-engine.ts');

  try {
    const result = await ReplanningEngine.replanTargets({
      organizationId,
      targetId,
      newTargetYear: 2030,
      newTargetEmissions: 176100, // 176.1 tCO2e in kg
      allocationStrategy: 'equal',
      applyImmediately: false,
      userId: 'test-user'
    });

    console.log('✅ Replanning completed successfully!\n');
    console.log('📊 Response structure:');
    console.log('  success:', result.success);
    console.log('  previousTarget:', result.previousTarget);
    console.log('  newTarget:', result.newTarget);
    console.log('  totalReductionNeeded:', result.totalReductionNeeded);
    console.log('  metricTargets count:', result.metricTargets?.length || 0);
    console.log('  feasibilityScore:', result.feasibilityScore);
    console.log('  monteCarloResults:', !!result.monteCarloResults);

    if (result.monteCarloResults) {
      console.log('    - probabilityOfSuccess:', result.monteCarloResults.probabilityOfSuccess);
      console.log('    - medianOutcome:', result.monteCarloResults.medianOutcome);
    }

    console.log('\n📋 Sample metric targets (first 3):');
    result.metricTargets?.slice(0, 3).forEach((metric, idx) => {
      console.log(`  ${idx + 1}. ${metric.metricName}`);
      console.log(`     - Current: ${metric.currentAnnualEmissions.toFixed(2)} kg`);
      console.log(`     - Target: ${metric.targetAnnualEmissions.toFixed(2)} kg`);
      console.log(`     - Reduction: ${metric.reductionPercent.toFixed(1)}%`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testReplanningAPI().catch(console.error);
