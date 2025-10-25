import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function checkDataPeriods() {
  // Get all PLMJ metrics with period dates
  const { data: metrics } = await supabase
    .from('metrics_data')
    .select('period_start, period_end, co2e_emissions')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .order('period_start', { ascending: true });

  if (!metrics || metrics.length === 0) {
    console.log('No data found');
    return;
  }

  // Group by year
  const byYear: any = {};

  metrics.forEach(m => {
    const year = new Date(m.period_start).getFullYear();
    if (!byYear[year]) {
      byYear[year] = {
        count: 0,
        emissions: 0,
        firstDate: m.period_start,
        lastDate: m.period_end,
        months: new Set()
      };
    }
    byYear[year].count += 1;
    byYear[year].emissions += (m.co2e_emissions || 0) / 1000; // Convert to tonnes
    byYear[year].lastDate = m.period_end; // Update to latest end date

    // Track which months have data
    const month = m.period_start.substring(0, 7);
    byYear[year].months.add(month);
  });

  console.log('\n=== PLMJ DATA BY YEAR ===\n');

  let totalEmissions = 0;
  Object.entries(byYear)
    .sort((a: any, b: any) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([year, data]: any) => {
      console.log(`Year ${year}:`);
      console.log(`  Records: ${data.count}`);
      console.log(`  Emissions: ${Math.round(data.emissions).toLocaleString()} tCO2e`);
      console.log(`  Months with data: ${data.months.size}`);
      console.log(`  Period: ${data.firstDate} to ${data.lastDate}`);
      console.log('');
      totalEmissions += data.emissions;
    });

  console.log(`TOTAL ACROSS ALL YEARS: ${Math.round(totalEmissions).toLocaleString()} tCO2e`);
  console.log(`Total Records: ${metrics.length}`);

  // Get earliest and latest dates
  const firstRecord = metrics[0];
  const lastRecord = metrics[metrics.length - 1];

  console.log('\n=== DATA COVERAGE ===');
  console.log(`Earliest data: ${firstRecord.period_start}`);
  console.log(`Latest data: ${lastRecord.period_end}`);

  // Find latest actual data (not future)
  const now = new Date();
  const recentMetrics = metrics.filter(m => new Date(m.period_end) <= now);
  if (recentMetrics.length > 0) {
    const mostRecent = recentMetrics[recentMetrics.length - 1];
    console.log(`Most recent completed period: ${mostRecent.period_end}`);
  }

  // Check for monthly coverage
  const monthlyData: any = {};
  metrics.forEach(m => {
    const month = m.period_start.substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) monthlyData[month] = 0;
    monthlyData[month] += 1;
  });

  console.log(`\nTotal months with data: ${Object.keys(monthlyData).length}`);

  // Show coverage by year
  const yearCoverage: any = {};
  Object.keys(monthlyData).forEach(month => {
    const year = month.substring(0, 4);
    if (!yearCoverage[year]) yearCoverage[year] = [];
    yearCoverage[year].push(month.substring(5, 7));
  });

  console.log('\n=== MONTHLY COVERAGE BY YEAR ===');
  Object.entries(yearCoverage).sort().forEach(([year, months]: any) => {
    console.log(`${year}: ${months.sort().join(', ')} (${months.length} months)`);
  });
}

checkDataPeriods().catch(console.error);