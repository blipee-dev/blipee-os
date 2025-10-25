import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function analyzeYearlyTrends() {
  console.log('📊 Analyzing yearly emissions trends (with deduplication)...\n');

  for (const year of [2022, 2023, 2024, 2025]) {
    const { data, error } = await supabase
      .from('metrics_data')
      .select('metric_id, site_id, period_start, co2e_emissions')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_start', `${year}-12-31`);

    if (error) {
      console.error(`Error fetching ${year}:`, error);
      continue;
    }

    // Deduplicate
    const seen = new Set<string>();
    const uniqueData = data.filter(r => {
      const key = `${r.metric_id}|${r.period_start}|${r.site_id || 'null'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Group by month
    const monthlyEmissions = new Map<string, number>();
    uniqueData.forEach(r => {
      const month = r.period_start.substring(0, 7);
      monthlyEmissions.set(month, (monthlyEmissions.get(month) || 0) + (r.co2e_emissions || 0));
    });

    const months = Array.from(monthlyEmissions.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    const totalEmissions = uniqueData.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);
    const avgMonthly = months.length > 0 ? totalEmissions / months.length : 0;

    console.log(`${year}:`);
    console.log(`  Total emissions: ${(totalEmissions / 1000).toFixed(1)} tCO2e`);
    console.log(`  Months with data: ${months.length}`);
    console.log(`  Avg per month: ${(avgMonthly / 1000).toFixed(1)} tCO2e`);
    console.log(`  Monthly breakdown:`);
    months.forEach(([month, emissions]) => {
      const tCO2e = (emissions / 1000).toFixed(1);
      const percentOfAvg = ((emissions / avgMonthly) * 100).toFixed(0);
      const indicator = emissions > avgMonthly * 1.2 ? '⚠️ HIGH' : emissions < avgMonthly * 0.8 ? '📉 LOW' : '';
      console.log(`    ${month}: ${tCO2e} tCO2e (${percentOfAvg}% of avg) ${indicator}`);
    });
    console.log('');
  }

  // Calculate trend
  console.log('📈 Year-over-Year Comparison:');
  const yearlyTotals = new Map<number, number>();

  for (const year of [2022, 2023, 2024, 2025]) {
    const { data } = await supabase
      .from('metrics_data')
      .select('metric_id, site_id, period_start, co2e_emissions')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_start', `${year}-12-31`);

    if (!data) continue;

    const seen = new Set<string>();
    const uniqueData = data.filter(r => {
      const key = `${r.metric_id}|${r.period_start}|${r.site_id || 'null'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const total = uniqueData.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);
    yearlyTotals.set(year, total);
  }

  const years = Array.from(yearlyTotals.entries()).sort((a, b) => a[0] - b[0]);
  years.forEach(([year, total], i) => {
    if (i === 0) {
      console.log(`  ${year}: ${(total / 1000).toFixed(1)} tCO2e (baseline)`);
    } else {
      const prevTotal = years[i - 1][1];
      const change = ((total - prevTotal) / prevTotal * 100).toFixed(1);
      const changeIndicator = total > prevTotal ? '📈 UP' : '📉 DOWN';
      console.log(`  ${year}: ${(total / 1000).toFixed(1)} tCO2e (${change > 0 ? '+' : ''}${change}% vs prev year) ${changeIndicator}`);
    }
  });
}

analyzeYearlyTrends().catch(console.error);
