import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMonthlyData() {
  console.log('🔍 Checking available monthly data in database...\n');

  // Get all energy metrics
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('id, name')
    .in('category', ['Purchased Energy', 'Electricity']);

  console.log('📊 Energy Metrics:', metrics?.length);

  if (!metrics) return;

  const metricIds = metrics.map(m => m.id);

  // Get data grouped by year and month
  const { data: records } = await supabase
    .from('metrics_data')
    .select('period_start, value, co2e_emissions')
    .in('metric_id', metricIds)
    .order('period_start', { ascending: true });

  console.log('📊 Total Records:', records?.length, '\n');

  // Group by year and month
  const byYearMonth: any = {};
  
  records?.forEach(record => {
    const date = new Date(record.period_start);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;
    
    if (!byYearMonth[key]) {
      byYearMonth[key] = {
        year,
        month,
        count: 0,
        totalEnergy: 0,
        totalEmissions: 0
      };
    }
    
    byYearMonth[key].count++;
    byYearMonth[key].totalEnergy += parseFloat(record.value) || 0;
    byYearMonth[key].totalEmissions += parseFloat(record.co2e_emissions) || 0;
  });

  // Sort and display
  const sorted = Object.entries(byYearMonth)
    .sort(([a], [b]) => a.localeCompare(b));

  console.log('📅 Monthly Data Summary:\n');
  console.log('Year-Month | Records | Energy (kWh) | Emissions (kgCO2e)');
  console.log('-----------|---------|--------------|-------------------');
  
  sorted.forEach(([key, data]: any) => {
    console.log(
      `${key}     |    ${String(data.count).padStart(3)}  | ${String(Math.round(data.totalEnergy)).padStart(12)} | ${String(Math.round(data.totalEmissions)).padStart(17)}`
    );
  });

  // Summary by year
  console.log('\n📊 Summary by Year:\n');
  const byYear: any = {};
  sorted.forEach(([key, data]: any) => {
    const year = data.year;
    if (!byYear[year]) {
      byYear[year] = { months: 0, records: 0, totalEnergy: 0 };
    }
    byYear[year].months++;
    byYear[year].records += data.count;
    byYear[year].totalEnergy += data.totalEnergy;
  });

  Object.entries(byYear).forEach(([year, data]: any) => {
    console.log(`${year}: ${data.months} months, ${data.records} records, ${(data.totalEnergy / 1000).toFixed(1)} MWh`);
  });
}

checkMonthlyData().catch(console.error);
