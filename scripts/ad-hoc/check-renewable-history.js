const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkRenewableHistory() {
  console.log('🔍 Investigating renewable energy historical data...\n');

  // Get all energy metrics
  const { data: energyMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .in('category', ['Purchased Energy', 'Electricity']);

  console.log('📊 Energy metrics found:', energyMetrics?.length);
  console.log('📊 Metrics details:');
  energyMetrics?.forEach(m => {
    console.log(`  - ${m.name} (${m.code}): renewable=${m.is_renewable}, category=${m.category}`);
  });

  const metricIds = energyMetrics?.map(m => m.id) || [];

  // Fetch historical data for the last 3 years
  const { data: historicalData } = await supabase
    .from('metrics_data')
    .select('*, metrics_catalog(*)')
    .eq('organization_id', ORG_ID)
    .in('metric_id', metricIds)
    .gte('period_start', '2022-01-01')
    .order('period_start', { ascending: true })
    .limit(1000);

  console.log('\n📈 Total historical energy records:', historicalData?.length);

  // Group by month and calculate renewable vs fossil
  const monthlyData = {};

  historicalData?.forEach(record => {
    const date = new Date(record.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { total: 0, renewable: 0, fossil: 0, records: 0 };
    }

    const consumption = parseFloat(record.value) || 0;
    const isRenewable = record.metrics_catalog?.is_renewable || false;

    monthlyData[monthKey].total += consumption;
    if (isRenewable) {
      monthlyData[monthKey].renewable += consumption;
    } else {
      monthlyData[monthKey].fossil += consumption;
    }
    monthlyData[monthKey].records++;
  });

  // Sort and display
  const months = Object.keys(monthlyData).sort();

  console.log('\n📊 Monthly Renewable vs Fossil Energy (kWh):');
  console.log('Month       | Total    | Renewable | Fossil   | Renewable % | Records');
  console.log('------------|----------|-----------|----------|-------------|--------');

  months.forEach(month => {
    const d = monthlyData[month];
    const renewablePct = d.total > 0 ? (d.renewable / d.total * 100).toFixed(1) : '0.0';
    console.log(
      `${month} | ${(d.total / 1000).toFixed(1).padStart(8)} | ` +
      `${(d.renewable / 1000).toFixed(1).padStart(9)} | ` +
      `${(d.fossil / 1000).toFixed(1).padStart(8)} | ` +
      `${renewablePct.padStart(11)}% | ${d.records}`
    );
  });

  // Calculate trends
  console.log('\n📈 Renewable Energy Trend Analysis:');
  const recentMonths = months.slice(-12); // Last 12 months
  const renewableValues = recentMonths.map(m => monthlyData[m].renewable);
  const avgRenewable = renewableValues.reduce((a, b) => a + b, 0) / renewableValues.length;
  const maxRenewable = Math.max(...renewableValues);
  const minRenewable = Math.min(...renewableValues);

  console.log(`  Last 12 months average: ${(avgRenewable / 1000).toFixed(1)} MWh`);
  console.log(`  Maximum: ${(maxRenewable / 1000).toFixed(1)} MWh`);
  console.log(`  Minimum: ${(minRenewable / 1000).toFixed(1)} MWh`);
  console.log(`  Range: ${((maxRenewable - minRenewable) / 1000).toFixed(1)} MWh`);

  // Check which metrics are marked as renewable
  const renewableMetrics = energyMetrics?.filter(m => m.is_renewable);
  const fossilMetrics = energyMetrics?.filter(m => !m.is_renewable);

  console.log('\n🌱 Renewable Energy Sources:');
  if (renewableMetrics && renewableMetrics.length > 0) {
    renewableMetrics.forEach(m => console.log(`  ✅ ${m.name} (${m.code})`));
  } else {
    console.log('  ⚠️ NO RENEWABLE METRICS FOUND!');
  }

  console.log('\n⚫ Fossil Energy Sources:');
  fossilMetrics?.forEach(m => console.log(`  ⚫ ${m.name} (${m.code})`));

  // Check if there are any records with renewable=true but zero consumption
  const { data: zeroRenewable } = await supabase
    .from('metrics_data')
    .select('*, metrics_catalog(*)')
    .eq('organization_id', ORG_ID)
    .gte('period_start', '2024-01-01')
    .limit(100);

  const renewableRecords = zeroRenewable?.filter(r => r.metrics_catalog?.is_renewable) || [];

  console.log(`\n🔍 Sample renewable energy records (2024-2025): ${renewableRecords.length} records`);
  if (renewableRecords.length > 0) {
    console.log('Sample records:');
    renewableRecords.slice(0, 5).forEach(r => {
      console.log(`  ${r.period_start}: ${r.metrics_catalog.name} = ${r.value} kWh`);
    });
  } else {
    console.log('  ⚠️ NO RENEWABLE RECORDS FOUND IN 2024-2025!');
  }
}

checkRenewableHistory();
