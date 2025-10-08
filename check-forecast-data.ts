import { supabaseAdmin } from './src/lib/supabase/admin';

async function checkForecastData() {
  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  console.log('🔍 Checking emissions data for forecast...\n');

  // Get all data
  const { data: allData } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      period_start,
      co2e_emissions,
      metrics_catalog!inner(scope)
    `)
    .eq('organization_id', orgId)
    .order('period_start', { ascending: true });

  if (!allData || allData.length === 0) {
    console.log('❌ No data found');
    return;
  }

  console.log(`📊 Total records: ${allData.length}`);
  console.log(`📊 Date range: ${allData[0].period_start} to ${allData[allData.length - 1].period_start}\n`);

  // Group by month
  const monthlyData: { [key: string]: { total: number; count: number } } = {};

  allData.forEach((record: any) => {
    const date = new Date(record.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { total: 0, count: 0 };
    }

    const emissions = parseFloat(record.co2e_emissions) || 0;
    monthlyData[monthKey].total += emissions;
    monthlyData[monthKey].count++;
  });

  const months = Object.keys(monthlyData).sort();

  console.log(`📊 Monthly aggregation: ${months.length} months\n`);
  console.log('Month       | Records | Total Emissions (kg)');
  console.log('------------|---------|--------------------');

  months.forEach(month => {
    const data = monthlyData[month];
    console.log(`${month}     | ${String(data.count).padStart(7)} | ${data.total.toFixed(2)}`);
  });

  console.log(`\n✅ First month: ${months[0]}`);
  console.log(`✅ Last month: ${months[months.length - 1]}`);
}

checkForecastData().catch(console.error);
