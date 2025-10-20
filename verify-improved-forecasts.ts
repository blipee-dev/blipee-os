import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function verifyForecasts() {
  console.log('🔍 Verifying New Improved Forecasts\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Get 2025 data
  const { data: data2025, error } = await supabase
    .from('metrics_data')
    .select('metric_id, site_id, period_start, co2e_emissions, metadata')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lte('period_start', '2025-12-31')
    .order('period_start', { ascending: true });

  if (error || !data2025) {
    console.error('Error:', error);
    return;
  }

  // Deduplicate
  const seen = new Set<string>();
  const uniqueData = data2025.filter(r => {
    const key = `${r.metric_id}|${r.period_start}|${r.site_id || 'null'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Group by month
  const byMonth = new Map<string, {total: number, records: number, improved: number}>();
  uniqueData.forEach(r => {
    const month = r.period_start.substring(0, 7);
    if (!byMonth.has(month)) {
      byMonth.set(month, {total: 0, records: 0, improved: 0});
    }
    const monthData = byMonth.get(month)!;
    monthData.total += r.co2e_emissions || 0;
    monthData.records++;
    if (r.metadata?.improved_model) {
      monthData.improved++;
    }
  });

  console.log('📅 2025 Monthly Emissions (with New Improved Forecasts):\n');

  const months = Array.from(byMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  let actualTotal = 0;
  let forecastTotal = 0;

  months.forEach(([month, data]) => {
    const tCO2e = (data.total / 1000).toFixed(1);
    const isImproved = data.improved > 0;
    const indicator = isImproved ? '🤖 IMPROVED' : '📊 Actual';

    console.log(`  ${month}: ${tCO2e} tCO2e (${data.records} records) ${indicator}`);

    if (month >= '2025-10') {
      forecastTotal += data.total;
    } else {
      actualTotal += data.total;
    }
  });

  const total2025 = actualTotal + forecastTotal;

  console.log('\n📊 2025 Summary:');
  console.log(`  Jan-Sep (actual): ${(actualTotal / 1000).toFixed(1)} tCO2e`);
  console.log(`  Oct-Dec (forecast): ${(forecastTotal / 1000).toFixed(1)} tCO2e`);
  console.log(`  Total 2025: ${(total2025 / 1000).toFixed(1)} tCO2e\n`);

  // Compare with historical years
  console.log('📈 Comparison with Previous Years:');
  console.log(`  2022: 416.7 tCO2e (baseline)`);
  console.log(`  2023: 412.9 tCO2e (-0.9%)`);
  console.log(`  2024: 607.8 tCO2e (+47.2%)`);
  console.log(`  2025: ${(total2025 / 1000).toFixed(1)} tCO2e (${((total2025 / 1000 - 607.8) / 607.8 * 100).toFixed(1)}% vs 2024)\n`);

  // Check for improved model metadata
  const improvedRecords = uniqueData.filter(r => r.metadata?.improved_model);
  console.log('✅ Model Verification:');
  console.log(`  Total Oct-Dec records: ${uniqueData.filter(r => r.period_start >= '2025-10-01').length}`);
  console.log(`  Records with improved_model=true: ${improvedRecords.length}`);
  console.log(`  Outlier detection enabled: ${improvedRecords.some(r => r.metadata?.outlier_detection)}`);
  console.log(`  Dampening factor: ${improvedRecords[0]?.metadata?.dampening || 'N/A'}`);
  console.log(`  R² values: ${improvedRecords.slice(0, 3).map(r => r.metadata?.r2?.toFixed(3) || 'N/A').join(', ')}`);
}

verifyForecasts().catch(console.error);
