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

async function testReplanValues() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const targetId = 'f26e3d5e-f1c1-4e00-8bdd-4e7f2e5e2e5e';

  console.log('🔍 Testing replanning API response units...\n');

  // Import the replanning engine
  const { ReplanningEngine } = require('./src/lib/sustainability/replanning-engine.ts');

  try {
    const result = await ReplanningEngine.replanTargets({
      organizationId,
      targetId,
      newTargetYear: 2030,
      newTargetEmissions: 249000, // 249 tCO2e in kg
      allocationStrategy: 'equal',
      applyImmediately: false,
      userId: 'test-user'
    });

    console.log('✅ Replanning completed!\n');
    console.log('📊 Raw API Response Values:');
    console.log('  previousTarget:', result.previousTarget, '(what unit?)');
    console.log('  newTarget:', result.newTarget, '(what unit?)');
    console.log('  totalReductionNeeded:', result.totalReductionNeeded, '(what unit?)');

    console.log('\n🔬 Unit Analysis:');
    console.log('  If previousTarget is in kg:');
    console.log('    previousTarget =', (result.previousTarget / 1000).toFixed(2), 'tCO2e');
    console.log('  If previousTarget is in grams:');
    console.log('    previousTarget =', (result.previousTarget / 1000000).toFixed(2), 'tCO2e');

    console.log('\n  If totalReductionNeeded is in kg:');
    console.log('    totalReductionNeeded =', (result.totalReductionNeeded / 1000).toFixed(2), 'tCO2e');
    console.log('  If totalReductionNeeded is in grams:');
    console.log('    totalReductionNeeded =', (result.totalReductionNeeded / 1000000).toFixed(2), 'tCO2e');

    console.log('\n📐 Expected Values (from context):');
    console.log('  Target (2030): ~249 tCO2e');
    console.log('  Current (2025 projected): ~690 tCO2e');
    console.log('  Gap to close: ~441 tCO2e');

    console.log('\n🧮 Calculating current emissions:');
    const calc1 = (result.previousTarget + result.totalReductionNeeded) / 1000;
    const calc2 = (result.previousTarget / 1000) + (result.totalReductionNeeded / 1000);
    const calc3 = (result.previousTarget + result.totalReductionNeeded) / 1000000;

    console.log('  Calc 1 (add then divide by 1000):', calc1.toFixed(2), 'tCO2e');
    console.log('  Calc 2 (divide each by 1000 then add):', calc2.toFixed(2), 'tCO2e');
    console.log('  Calc 3 (add then divide by 1,000,000):', calc3.toFixed(2), 'tCO2e');

    console.log('\n✨ Which calculation gives ~690 tCO2e?');
    if (Math.abs(calc1 - 690) < 50) console.log('  → Calc 1 is correct! (values are in kg)');
    if (Math.abs(calc2 - 690) < 50) console.log('  → Calc 2 is correct! (values are in kg)');
    if (Math.abs(calc3 - 690) < 50) console.log('  → Calc 3 is correct! (values are in grams)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testReplanValues().catch(console.error);
