import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function verifyJanSep2025() {
  console.log('🔍 Verifying Jan-Sep 2025 Forecasts\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Get 2024 actual data
  const { data: data2024 } = await supabase
    .from('metrics_data')
    .select('metric_id, site_id, co2e_emissions')
    .eq('organization_id', organizationId)
    .gte('period_start', '2024-01-01')
    .lt('period_start', '2025-01-01');

  // Get Jan-Sep 2025 forecast data
  const { data: data2025 } = await supabase
    .from('metrics_data')
    .select('metric_id, site_id, co2e_emissions, metadata')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2025-10-01');

  if (!data2024 || !data2025) {
    console.error('❌ Error fetching data');
    return;
  }

  console.log(`📊 Data Retrieved:`);
  console.log(`   2024 actual: ${data2024.length} records`);
  console.log(`   2025 forecast: ${data2025.length} records\n`);

  // Deduplicate 2024
  const seen2024 = new Set<string>();
  const unique2024 = data2024.filter(r => {
    const key = `${r.metric_id}|${r.site_id || 'null'}`;
    if (seen2024.has(key)) return false;
    seen2024.add(key);
    return true;
  });

  // Check for duplicates in 2025
  const seen2025 = new Set<string>();
  const duplicates2025: string[] = [];
  data2025.forEach(r => {
    const key = `${r.metric_id}|${r.site_id || 'null'}`;
    if (seen2025.has(key)) {
      duplicates2025.push(key);
    }
    seen2025.add(key);
  });

  if (duplicates2025.length > 0) {
    console.log(`⚠️  WARNING: Found ${duplicates2025.length} duplicate combinations in 2025 data\n`);
  }

  // Calculate totals
  const total2024 = unique2024.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);
  const total2025 = data2025.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);

  console.log('📈 Annual Totals:');
  console.log(`   2024 actual (full year): ${(total2024 / 1000).toFixed(1)} tCO2e`);
  console.log(`   2025 forecast (Jan-Sep): ${(total2025 / 1000).toFixed(1)} tCO2e\n`);

  // Monthly breakdown
  const monthly2025 = new Map<string, number>();
  data2025.forEach(r => {
    const month = r.metadata?.period_start?.substring(0, 7) || 'unknown';
    monthly2025.set(month, (monthly2025.get(month) || 0) + (r.co2e_emissions || 0));
  });

  console.log('📊 Monthly Breakdown 2025:');
  console.log('Month       Emissions (tCO2e)');
  console.log('-'.repeat(35));

  const months = Array.from(monthly2025.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let totalFromMonthly = 0;
  months.forEach(([month, emissions]) => {
    console.log(`${month}    ${(emissions / 1000).toFixed(1).padStart(16)}`);
    totalFromMonthly += emissions;
  });

  console.log('-'.repeat(35));
  console.log(`Total       ${(totalFromMonthly / 1000).toFixed(1).padStart(16)}`);

  // Average monthly
  const avgMonthly2025 = total2025 / 9;
  const projected2025Full = avgMonthly2025 * 12;

  console.log('\n📊 Projections:');
  console.log(`   Average monthly (Jan-Sep): ${(avgMonthly2025 / 1000).toFixed(1)} tCO2e`);
  console.log(`   Projected full year 2025: ${(projected2025Full / 1000).toFixed(1)} tCO2e`);
  console.log(`   Change vs 2024: ${((projected2025Full - total2024) / total2024 * 100).toFixed(1)}%`);

  // Check for improved model metadata
  const withImprovedModel = data2025.filter(r => r.metadata?.improved_model === true).length;
  console.log(`\n✅ Records with improved model: ${withImprovedModel}/${data2025.length} (${(withImprovedModel / data2025.length * 100).toFixed(1)}%)`);

  // Reasonableness check
  const ratio = projected2025Full / total2024;
  console.log(`\n🎯 Reasonableness Check:`);
  console.log(`   2025 projection / 2024 actual = ${ratio.toFixed(2)}x`);

  if (ratio > 1.5) {
    console.log('   ⚠️  WARNING: Forecast shows >50% increase - may need review');
  } else if (ratio < 0.5) {
    console.log('   ⚠️  WARNING: Forecast shows >50% decrease - may need review');
  } else {
    console.log('   ✅ Forecast looks reasonable');
  }
}

verifyJanSep2025().catch(console.error);
