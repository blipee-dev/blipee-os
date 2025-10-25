require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function calculateEnergyBaseline() {
  // Get PLMJ organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('name', 'PLMJ')
    .single();

  console.log('Organization:', org?.name);

  // Based on our earlier calculation: Scope 2 was 1,163 tCO2e
  // Scope 2 emissions typically come from purchased electricity
  // Using European grid average: 400 gCO2/kWh = 0.4 kgCO2/kWh

  const scope2EmissionsKg = 1162790; // From earlier calculation
  const gridFactor = 0.4; // kgCO2 per kWh

  const estimatedElectricityKWh = Math.round(scope2EmissionsKg / gridFactor);
  const estimatedElectricityMWh = Math.round(estimatedElectricityKWh / 1000);

  console.log('\n📊 Energy Baseline Calculation:');
  console.log('====================================');
  console.log('Scope 2 emissions: 1,163 tCO2e');
  console.log('Grid emission factor: 400 gCO2/kWh (European average)');
  console.log('\n✅ Estimated electricity baseline:');
  console.log('  -', estimatedElectricityKWh.toLocaleString(), 'kWh');
  console.log('  -', estimatedElectricityMWh.toLocaleString(), 'MWh');

  // For energy management targets
  console.log('\n🎯 Suggested targets:');
  console.log('  - 25% reduction:', Math.round(estimatedElectricityKWh * 0.75).toLocaleString(), 'kWh');
  console.log('  - 30% reduction:', Math.round(estimatedElectricityKWh * 0.70).toLocaleString(), 'kWh');
  console.log('  - SBTi aligned (42% reduction):', Math.round(estimatedElectricityKWh * 0.58).toLocaleString(), 'kWh');

  return estimatedElectricityKWh;
}

calculateEnergyBaseline()
  .then(baseline => {
    console.log('\n💡 The Energy Management baseline should be:', baseline.toLocaleString(), 'kWh');
    console.log('(Not 20,000% as shown in the wizard)');
  })
  .catch(console.error);