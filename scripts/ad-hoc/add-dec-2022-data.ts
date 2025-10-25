import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function addDecember2022Data() {
  console.log('📅 Adding December 2022 Plane Travel Data\n');
  console.log('='.repeat(80));

  // First, get the metric_id for plane travel
  const { data: catalog, error: catalogError } = await supabaseAdmin
    .from('metrics_catalog')
    .select('id, code, name')
    .eq('code', 'scope3_business_travel_air')
    .single();

  if (catalogError || !catalog) {
    console.error('❌ Error finding metric:', catalogError);
    return;
  }

  console.log(`\n✅ Found metric: ${catalog.name} (${catalog.code})`);
  console.log(`   Metric ID: ${catalog.id}`);

  // Get 2022 data to understand the pattern
  const { data: data2022, error: error2022 } = await supabaseAdmin
    .from('metrics_data')
    .select('period_start, value, co2e_emissions')
    .eq('organization_id', organizationId)
    .eq('metric_id', catalog.id)
    .gte('period_start', '2022-01-01')
    .lt('period_start', '2023-01-01')
    .order('period_start', { ascending: true });

  if (error2022) {
    console.error('❌ Error fetching 2022 data:', error2022);
    return;
  }

  console.log(`\n📊 Current 2022 Data (${data2022?.length || 0} months):`);
  console.log('─'.repeat(80));

  let total2022 = 0;
  data2022?.forEach(d => {
    const month = d.period_start?.substring(0, 7);
    const distance = d.value || 0;
    const emissions = (d.co2e_emissions || 0) / 1000;
    total2022 += emissions;
    console.log(`   ${month}: ${distance.toFixed(0)} km = ${emissions.toFixed(4)} tCO2e`);
  });

  const avg2022 = data2022?.length ? total2022 / data2022.length : 0;
  console.log(`\n   Average 2022: ${avg2022.toFixed(4)} tCO2e/month`);

  // Calculate what December 2022 should be (use average or Nov 2022 value)
  const nov2022 = data2022?.find(d => d.period_start?.startsWith('2022-11'));
  const estimatedDistance = nov2022?.value || avg2022 * 6667; // Rough km conversion
  const estimatedEmissions = nov2022?.co2e_emissions || avg2022 * 1000; // Convert back to kg

  console.log(`\n💡 Estimated December 2022 value:`);
  console.log(`   Based on: November 2022 = ${(nov2022?.co2e_emissions || 0) / 1000} tCO2e`);
  console.log(`   Estimated Distance: ${estimatedDistance.toFixed(0)} km`);
  console.log(`   Estimated Emissions: ${(estimatedEmissions / 1000).toFixed(4)} tCO2e`);

  // Check if December 2022 already exists
  const { data: existingDec, error: checkError } = await supabaseAdmin
    .from('metrics_data')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('metric_id', catalog.id)
    .eq('period_start', '2022-12-01')
    .maybeSingle();

  if (checkError) {
    console.error('❌ Error checking existing data:', checkError);
    return;
  }

  if (existingDec) {
    console.log('\n⚠️  December 2022 data already exists!');
    console.log(`   Record ID: ${existingDec.id}`);
    console.log('   Skipping insert.');
    return;
  }

  // Insert December 2022 data
  console.log('\n📝 Inserting December 2022 data...');

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from('metrics_data')
    .insert({
      organization_id: organizationId,
      metric_id: catalog.id,
      period_start: '2022-12-01',
      period_end: '2022-12-31',
      value: estimatedDistance,
      unit: 'km',
      co2e_emissions: estimatedEmissions,
      data_quality: 'estimated',
      notes: 'Estimated based on November 2022 value to enable 36-month seasonal ML forecasting',
      metadata: {
        estimation_method: 'november_baseline',
        created_for: 'seasonal_decomposition_ml_model',
        source: 'automated_estimation'
      }
    })
    .select();

  if (insertError) {
    console.error('❌ Error inserting data:', insertError);
    return;
  }

  console.log('✅ Successfully inserted December 2022 data!');
  console.log(`   Record ID: ${inserted?.[0]?.id}`);

  // Verify we now have 36 months
  const { data: allData, error: verifyError } = await supabaseAdmin
    .from('metrics_data')
    .select('period_start')
    .eq('organization_id', organizationId)
    .eq('metric_id', catalog.id)
    .gte('period_start', '2022-01-01')
    .lt('period_start', '2025-01-01')
    .order('period_start', { ascending: true });

  if (verifyError) {
    console.error('❌ Error verifying:', verifyError);
    return;
  }

  console.log('\n\n✅ VERIFICATION:');
  console.log('─'.repeat(80));
  console.log(`Total historical months (2022-2024): ${allData?.length || 0} months`);

  if (allData && allData.length >= 36) {
    console.log('\n🎉 SUCCESS! We now have 36+ months of data!');
    console.log('   The Enterprise Forecast model will now use:');
    console.log('   ✅ seasonalDecompositionForecast()');
    console.log('   ✅ Full trend + seasonality + residual decomposition');
    console.log('   ✅ 36-month pattern recognition');
  } else {
    console.log(`\n⚠️  Still need ${36 - (allData?.length || 0)} more months for full seasonal model`);
  }

  console.log('\n' + '='.repeat(80));
}

addDecember2022Data().catch(console.error);
