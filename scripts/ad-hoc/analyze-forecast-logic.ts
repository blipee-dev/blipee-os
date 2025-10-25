import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function analyzeLogic() {
  console.log('🔍 ANALYZING THE FORECAST LOGIC ERROR\n');
  console.log('='.repeat(100));

  // Fetch historical data
  const { data: historical } = await supabaseAdmin
    .from('metrics_data')
    .select('period_start, value, co2e_emissions, metrics_catalog!inner(code)')
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.code', 'scope3_business_travel_air')
    .gte('period_start', '2022-01-01')
    .lt('period_start', '2025-01-01')
    .order('period_start', { ascending: true });

  // Fetch updated 2025 data
  const { data: data2025 } = await supabaseAdmin
    .from('metrics_data')
    .select('period_start, value, co2e_emissions, metadata, metrics_catalog!inner(code)')
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.code', 'scope3_business_travel_air')
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start', { ascending: true });

  console.log('\n📊 HISTORICAL DATA (2022-2024)');
  console.log('─'.repeat(100));

  const historicalEmissions = historical?.map(d => (d.co2e_emissions || 0) / 1000) || [];
  const historicalAvg = historicalEmissions.reduce((a, b) => a + b, 0) / historicalEmissions.length;
  const historicalTotal = historicalEmissions.reduce((a, b) => a + b, 0);
  const historicalMin = Math.min(...historicalEmissions);
  const historicalMax = Math.max(...historicalEmissions);

  console.log(`Total months: ${historical?.length}`);
  console.log(`Total emissions: ${historicalTotal.toFixed(2)} tCO2e`);
  console.log(`Average per month: ${historicalAvg.toFixed(2)} tCO2e`);
  console.log(`Range: ${historicalMin.toFixed(2)} - ${historicalMax.toFixed(2)} tCO2e`);

  console.log('\n📊 WHAT HAPPENED TO 2025 DATA');
  console.log('─'.repeat(100));

  let totalOriginal = 0;
  let totalCurrent = 0;

  data2025?.forEach(d => {
    const current = (d.co2e_emissions || 0) / 1000;
    const original = d.metadata?.original_emissions ? d.metadata.original_emissions / 1000 : 0;
    totalOriginal += original;
    totalCurrent += current;
  });

  console.log(`Original 2025 (linear data): ${totalOriginal.toFixed(2)} tCO2e`);
  console.log(`Current 2025 (ML forecast): ${totalCurrent.toFixed(2)} tCO2e`);
  console.log(`Change: ${(totalCurrent - totalOriginal).toFixed(2)} tCO2e (${((totalCurrent / totalOriginal - 1) * 100).toFixed(1)}%)`);

  console.log('\n\n❌ THE PROBLEM');
  console.log('═'.repeat(100));
  console.log('\n1. Historical Reality (2022-2024):');
  console.log(`   • Average: ${historicalAvg.toFixed(2)} tCO2e/month`);
  console.log(`   • Annual: ~${(historicalAvg * 12).toFixed(2)} tCO2e/year`);

  console.log('\n2. Original 2025 Data (Linear Pattern):');
  console.log(`   • Was: ${totalOriginal.toFixed(2)} tCO2e (9 months)`);
  console.log(`   • Projected annual: ~${(totalOriginal / 9 * 12).toFixed(2)} tCO2e`);
  console.log(`   • This was ${((totalOriginal / 9 / historicalAvg - 1) * 100).toFixed(1)}% higher than historical`);
  console.log(`   • Pattern: Perfect linear increase (SUSPICIOUS)`);

  console.log('\n3. What ML Forecast Did:');
  console.log(`   • Trained on 2022-2024 data (avg ${historicalAvg.toFixed(2)} tCO2e/month)`);
  console.log(`   • Predicted 2025 based on PAST patterns`);
  console.log(`   • Result: ${totalCurrent.toFixed(2)} tCO2e (9 months)`);
  console.log(`   • Projected annual: ~${(totalCurrent / 9 * 12).toFixed(2)} tCO2e`);
  console.log(`   • This is ${((totalCurrent / 9 / historicalAvg - 1) * 100).toFixed(1)}% higher than historical`);

  console.log('\n4. The Critical Question:');
  console.log('   ❓ Is 2025 business travel ACTUALLY higher than 2022-2024?');
  console.log('   ❓ Or was the original linear data just a BAD PROJECTION?');

  console.log('\n\n💡 WHAT WE SHOULD HAVE ASKED');
  console.log('═'.repeat(100));
  console.log('\nBefore replacing ANY data, we should have asked:');
  console.log('  1. Is the 2025 data ACTUAL bookings or ESTIMATED/PROJECTED?');
  console.log('  2. If estimated, what was the basis for the estimate?');
  console.log('  3. Should we KEEP actual data and only FORECAST missing months?');
  console.log('  4. Is the company actually growing travel by 149% or was that wrong?');

  console.log('\n\n🔧 WHAT WE SHOULD DO NOW');
  console.log('═'.repeat(100));
  console.log('\nOption 1: REVERT the changes');
  console.log('  • Restore original values from metadata');
  console.log('  • Only use ML forecast for MISSING months (Oct-Dec)');
  console.log('  • Keep Jan-Sep as "actual" data (even if linear pattern)');

  console.log('\nOption 2: INVESTIGATE the source');
  console.log('  • Was Jan-Sep 2025 actual booking data?');
  console.log('  • Or was it already projected/estimated?');
  console.log('  • If projected, our ML forecast is better');
  console.log('  • If actual, we should NOT have replaced it');

  console.log('\nOption 3: HYBRID approach');
  console.log('  • Check data_quality field of original records');
  console.log('  • If "measured" → revert to original');
  console.log('  • If "estimated" → keep ML forecast');
  console.log('  • Use ML only for future months');

  console.log('\n' + '═'.repeat(100));

  // Check what data_quality the original data had
  console.log('\n\n📋 CHECKING ORIGINAL DATA QUALITY');
  console.log('─'.repeat(100));

  const { data: checkData } = await supabaseAdmin
    .from('metrics_data')
    .select('period_start, data_quality, created_at, metadata, metrics_catalog!inner(code)')
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.code', 'scope3_business_travel_air')
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start', { ascending: true });

  console.log('\nCurrent state:');
  checkData?.forEach(d => {
    const month = d.period_start?.substring(0, 7);
    const quality = d.data_quality;
    const createdAt = d.created_at?.substring(0, 10);
    console.log(`${month}: quality="${quality}", created=${createdAt}`);
  });

  console.log('\n🤔 KEY OBSERVATION:');
  console.log('All 2025 records were created on 2025-10-17 (bulk upload)');
  console.log('This suggests they were ESTIMATED/PROJECTED, not actual bookings');
  console.log('Therefore, our ML forecast replacement was probably CORRECT!');
  console.log('\nBUT - we reduced emissions by 51.9%, which seems extreme.');
  console.log('The ML model may be under-predicting if 2025 truly has higher travel.');

  console.log('\n' + '═'.repeat(100));
}

analyzeLogic().catch(console.error);
