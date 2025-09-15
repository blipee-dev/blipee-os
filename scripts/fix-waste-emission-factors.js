const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixWasteEmissionFactors() {
  console.log('🔧 Fixing Waste Emission Factors...\n');

  // Correct emission factors (in kgCO2e/kg, not per ton)
  const corrections = [
    {
      code: 'scope3_waste_landfill',
      emission_factor: 0.467,  // Was 467, should be 0.467 kgCO2e/kg
      emission_factor_unit: 'kgCO2e/kg'
    },
    {
      code: 'scope3_waste_recycling',
      emission_factor: 0.021,  // Was 21, should be 0.021 kgCO2e/kg
      emission_factor_unit: 'kgCO2e/kg'
    },
    {
      code: 'scope3_waste_composting',
      emission_factor: 0.010,  // Was 10, should be 0.010 kgCO2e/kg
      emission_factor_unit: 'kgCO2e/kg'
    },
    {
      code: 'scope3_waste_incineration',
      emission_factor: 0.883,  // Was 883, should be 0.883 kgCO2e/kg
      emission_factor_unit: 'kgCO2e/kg'
    },
    {
      code: 'scope3_waste_ewaste',
      emission_factor: 0.021,  // Was 21, should be 0.021 kgCO2e/kg (similar to recycling)
      emission_factor_unit: 'kgCO2e/kg'
    }
  ];

  // Update emission factors in metrics_catalog
  for (const correction of corrections) {
    const { data, error } = await supabase
      .from('metrics_catalog')
      .update({
        emission_factor: correction.emission_factor,
        emission_factor_unit: correction.emission_factor_unit,
        unit: 'kg'  // Ensure unit is kg, not tons
      })
      .eq('code', correction.code);

    if (error) {
      console.error(`❌ Error updating ${correction.code}:`, error);
    } else {
      console.log(`✅ Updated ${correction.code}: ${correction.emission_factor} ${correction.emission_factor_unit}`);
    }
  }

  // Now recalculate CO2e emissions for all waste data
  console.log('\n🔄 Recalculating CO2e emissions for waste data...');

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'PLMJ')
    .single();

  // Get all waste metrics
  const { data: wasteMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, emission_factor')
    .eq('category', 'Waste');

  const wasteMetricIds = wasteMetrics?.map(m => m.id) || [];
  const metricFactors = new Map(wasteMetrics?.map(m => [m.id, m.emission_factor]));

  // Get all waste data records
  const { data: wasteData } = await supabase
    .from('metrics_data')
    .select('id, metric_id, value')
    .eq('organization_id', org.id)
    .in('metric_id', wasteMetricIds);

  console.log(`Found ${wasteData?.length || 0} waste records to update`);

  // Update each record with correct emissions
  let updated = 0;
  for (const record of wasteData || []) {
    const factor = metricFactors.get(record.metric_id) || 0;
    const newEmissions = record.value * factor;

    const { error } = await supabase
      .from('metrics_data')
      .update({ co2e_emissions: newEmissions })
      .eq('id', record.id);

    if (!error) {
      updated++;
      if (updated % 10 === 0) {
        process.stdout.write(`\r   Updated ${updated}/${wasteData?.length} records...`);
      }
    }
  }

  console.log(`\n✅ Updated ${updated} waste records with correct emissions`);

  // Show sample of corrected data
  const { data: sample } = await supabase
    .from('metrics_data')
    .select(`
      value,
      unit,
      co2e_emissions,
      metrics_catalog (
        name,
        emission_factor
      )
    `)
    .eq('organization_id', org.id)
    .in('metric_id', wasteMetricIds)
    .gte('period_start', '2024-03-01')
    .lt('period_start', '2024-04-01')
    .limit(5);

  console.log('\n📊 Sample of Corrected March 2024 Data:');
  console.log('─'.repeat(60));
  sample?.forEach(d => {
    console.log(`${d.metrics_catalog?.name}: ${d.value} kg → ${d.co2e_emissions.toFixed(2)} kgCO2e`);
    console.log(`   (Factor: ${d.metrics_catalog?.emission_factor} kgCO2e/kg)`);
  });

  // Recalculate total emissions
  const { data: yearTotals } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, period_start')
    .eq('organization_id', org.id)
    .gte('period_start', '2024-01-01')
    .lt('period_start', '2025-01-01');

  const total2024 = yearTotals?.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) || 0;

  console.log(`\n📈 New 2024 Total Emissions: ${(total2024 / 1000).toFixed(2)} tCO2e`);
  console.log('   (Was 6564.31 tCO2e with incorrect waste factors)');
}

fixWasteEmissionFactors().catch(console.error);