import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function verifyUpdate() {
  console.log('🔍 VERIFYING 2025 PLANE TRAVEL DATA UPDATE\n');
  console.log('='.repeat(100));

  // Fetch 2025 plane travel data
  const { data, error } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      period_start,
      value,
      co2e_emissions,
      data_quality,
      metadata,
      notes,
      updated_at,
      metrics_catalog!inner(code, name)
    `)
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.code', 'scope3_business_travel_air')
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`\n📊 Found ${data.length} records for 2025 Plane Travel\n`);
  console.log('Month       Distance (km)    Emissions (tCO2e)    Data Quality    Updated At          Original Value');
  console.log('='.repeat(100));

  let totalEmissions = 0;
  let totalDistance = 0;

  data.forEach(d => {
    const month = d.period_start?.substring(0, 7);
    const distance = d.value || 0;
    const emissions = (d.co2e_emissions || 0) / 1000;
    const quality = d.data_quality || 'N/A';
    const updatedAt = d.updated_at?.substring(0, 16).replace('T', ' ') || 'N/A';
    const originalValue = d.metadata?.original_value || 'N/A';
    const originalEmissions = d.metadata?.original_emissions ? (d.metadata.original_emissions / 1000).toFixed(2) : 'N/A';

    totalEmissions += emissions;
    totalDistance += distance;

    console.log(
      `${month}   ${distance.toFixed(0).padStart(14)}   ${emissions.toFixed(4).padStart(16)}   ` +
      `${quality.padStart(13)}   ${updatedAt.padStart(18)}   ${originalEmissions} tCO2e (${originalValue} km)`
    );
  });

  console.log('─'.repeat(100));
  console.log(
    `TOTAL       ${totalDistance.toFixed(0).padStart(14)}   ${totalEmissions.toFixed(2).padStart(16)}   ` +
    `${''.padStart(13)}   ${''.padStart(18)}`
  );

  console.log('\n\n🔎 METADATA CHECK (First Record)');
  console.log('─'.repeat(100));
  if (data.length > 0 && data[0].metadata) {
    console.log(JSON.stringify(data[0].metadata, null, 2));
  }

  console.log('\n\n📝 NOTES (First Record)');
  console.log('─'.repeat(100));
  if (data.length > 0) {
    console.log(data[0].notes || 'No notes');
  }

  // Check pattern
  console.log('\n\n📈 PATTERN ANALYSIS');
  console.log('─'.repeat(100));

  const differences: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const diff = (data[i].value || 0) - (data[i - 1].value || 0);
    differences.push(diff);
  }

  if (differences.length > 0) {
    const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    const maxDeviation = Math.max(...differences.map(d => Math.abs(d - avgDiff)));
    const variability = (maxDeviation / Math.abs(avgDiff)) * 100;

    console.log(`Average monthly change: ${avgDiff.toFixed(2)} km`);
    console.log(`Max deviation: ${maxDeviation.toFixed(2)} km`);
    console.log(`Variability: ${variability.toFixed(1)}%`);

    if (variability < 10) {
      console.log('⚠️  HIGHLY LINEAR - Data appears to be projected/estimated');
    } else {
      console.log('✅ VARIABLE - Data shows realistic variation');
    }
  }

  // Compare to historical average
  const { data: historical } = await supabaseAdmin
    .from('metrics_data')
    .select('co2e_emissions, metrics_catalog!inner(code)')
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.code', 'scope3_business_travel_air')
    .gte('period_start', '2022-01-01')
    .lt('period_start', '2025-01-01');

  if (historical) {
    const historicalTotal = historical.reduce((sum, d) => sum + ((d.co2e_emissions || 0) / 1000), 0);
    const historicalAvg = historicalTotal / historical.length;
    const avg2025 = totalEmissions / data.length;

    console.log('\n\n📊 COMPARISON TO HISTORICAL');
    console.log('─'.repeat(100));
    console.log(`Historical avg (2022-2024): ${historicalAvg.toFixed(2)} tCO2e/month`);
    console.log(`Current 2025 avg: ${avg2025.toFixed(2)} tCO2e/month`);
    console.log(`Change: ${((avg2025 / historicalAvg - 1) * 100).toFixed(1)}%`);
  }

  console.log('\n' + '='.repeat(100));
}

verifyUpdate().catch(console.error);
