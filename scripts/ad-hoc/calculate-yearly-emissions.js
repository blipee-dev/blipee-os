const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function calculateYearlyEmissions() {
  console.log('📊 Calculating Yearly Total Emissions Since 2022\n');
  console.log('='.repeat(70));

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const startYear = 2022;
  const currentYear = new Date().getFullYear();

  // Fetch all emissions data from 2022 onwards
  const { data: metricsData, error } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, period_start, period_end')
    .eq('organization_id', organizationId)
    .gte('period_start', `${startYear}-01-01`)
    .order('period_start', { ascending: true });

  if (error) {
    console.error('❌ Error fetching emissions data:', error);
    return;
  }

  if (!metricsData || metricsData.length === 0) {
    console.log('⚠️  No emissions data found since 2022');
    return;
  }

  console.log(`\n✅ Found ${metricsData.length} emission records\n`);

  // Group emissions by year
  const yearlyEmissions = {};
  const yearlyMonths = {};

  metricsData.forEach(record => {
    if (!record.period_start || !record.co2e_emissions) return;

    const year = record.period_start.substring(0, 4);
    const month = record.period_start.substring(0, 7);

    if (!yearlyEmissions[year]) {
      yearlyEmissions[year] = 0;
      yearlyMonths[year] = new Set();
    }

    yearlyEmissions[year] += record.co2e_emissions;
    yearlyMonths[year].add(month);
  });

  // Display results
  console.log('Year-by-Year Emissions Summary:');
  console.log('='.repeat(70));

  const years = Object.keys(yearlyEmissions).sort();
  let previousYearEmissions = null;

  years.forEach(year => {
    const emissionsKg = yearlyEmissions[year];
    const emissionsTco2e = emissionsKg / 1000;
    const monthCount = yearlyMonths[year].size;
    const isComplete = monthCount === 12;
    const completionPercent = (monthCount / 12 * 100).toFixed(0);

    // Calculate YoY change
    let yoyChange = '';
    if (previousYearEmissions !== null) {
      const change = ((emissionsTco2e - previousYearEmissions) / previousYearEmissions) * 100;
      const arrow = change > 0 ? '📈' : '📉';
      const sign = change > 0 ? '+' : '';
      yoyChange = ` ${arrow} ${sign}${change.toFixed(1)}% YoY`;
    }

    console.log(`\n${year}:`);
    console.log(`  Total Emissions: ${emissionsTco2e.toFixed(2)} tCO2e (${emissionsKg.toFixed(0)} kg)`);
    console.log(`  Coverage: ${monthCount}/12 months (${completionPercent}%) ${isComplete ? '✅ Complete' : '⚠️  Partial'}`);
    if (yoyChange) {
      console.log(`  Change: ${yoyChange}`);
    }

    if (!isComplete) {
      const projectedAnnual = (emissionsTco2e / monthCount) * 12;
      console.log(`  Projected Annual: ${projectedAnnual.toFixed(2)} tCO2e (based on ${monthCount} months)`);
    }

    previousYearEmissions = emissionsTco2e;
  });

  // Summary statistics
  console.log('\n' + '='.repeat(70));
  console.log('📈 Summary Statistics:\n');

  const completeYears = years.filter(y => yearlyMonths[y].size === 12);
  if (completeYears.length > 0) {
    const avgEmissions = completeYears.reduce((sum, y) => sum + yearlyEmissions[y] / 1000, 0) / completeYears.length;
    console.log(`Average (complete years only): ${avgEmissions.toFixed(2)} tCO2e`);
  }

  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const firstYearEmissions = yearlyEmissions[firstYear] / 1000;
  const lastYearEmissions = yearlyEmissions[lastYear] / 1000;
  const totalChange = ((lastYearEmissions - firstYearEmissions) / firstYearEmissions) * 100;

  console.log(`Total change (${firstYear} → ${lastYear}): ${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)}%`);
  console.log(`Peak year: ${years.reduce((max, y) => yearlyEmissions[y] > yearlyEmissions[max] ? y : max, years[0])}`);
  console.log(`Lowest year: ${years.reduce((min, y) => yearlyEmissions[y] < yearlyEmissions[min] ? y : min, years[0])}`);

  // Monthly breakdown for current year
  const currentYearData = metricsData.filter(r => r.period_start && r.period_start.startsWith(currentYear.toString()));
  if (currentYearData.length > 0) {
    console.log(`\n📅 ${currentYear} Monthly Breakdown:`);
    console.log('='.repeat(70));

    const monthlyData = {};
    currentYearData.forEach(record => {
      const month = record.period_start.substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = 0;
      }
      monthlyData[month] += record.co2e_emissions;
    });

    Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, emissions]) => {
        const tco2e = emissions / 1000;
        console.log(`  ${month}: ${tco2e.toFixed(2)} tCO2e`);
      });
  }

  console.log('\n' + '='.repeat(70));
}

calculateYearlyEmissions();
