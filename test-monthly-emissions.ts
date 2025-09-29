import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testMonthlyEmissions() {
  console.log('📊 Monthly Emissions Breakdown for 2025\n');
  console.log('=========================================\n');

  // Get PLMJ organization
  const { data: plmj } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'PLMJ')
    .single();

  // Get emissions data for 2025
  const { data: emissions } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, period_start, period_end')
    .eq('organization_id', plmj!.id)
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31')
    .not('co2e_emissions', 'is', null);

  // Group by month
  const monthlyData: any = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  emissions?.forEach(record => {
    const date = new Date(record.period_start);
    const monthIndex = date.getMonth();
    const monthName = months[monthIndex];

    if (!monthlyData[monthName]) {
      monthlyData[monthName] = {
        emissions: 0,
        count: 0
      };
    }

    monthlyData[monthName].emissions += record.co2e_emissions || 0;
    monthlyData[monthName].count++;
  });

  console.log('Month\t\tEmissions (tCO2e)\tData Points');
  console.log('------\t\t-----------------\t-----------');

  let totalEmissions = 0;
  months.forEach(month => {
    if (monthlyData[month]) {
      const emissionsInTons = monthlyData[month].emissions / 1000;
      totalEmissions += emissionsInTons;
      console.log(`${month}\t\t${emissionsInTons.toFixed(1)}\t\t\t${monthlyData[month].count}`);
    } else {
      console.log(`${month}\t\t-\t\t\t0`);
    }
  });

  console.log('\n------\t\t-----------------\t-----------');
  console.log(`Total\t\t${totalEmissions.toFixed(1)}\t\t\t${emissions?.length || 0}`);

  // Calculate monthly average (for months with data)
  const monthsWithData = Object.keys(monthlyData).length;
  const avgMonthly = monthsWithData > 0 ? totalEmissions / monthsWithData : 0;
  console.log(`\nAverage per month (${monthsWithData} months): ${avgMonthly.toFixed(1)} tCO2e`);

  // Identify highest and lowest months
  const sortedMonths = Object.entries(monthlyData)
    .map(([month, data]: [string, any]) => ({
      month,
      emissions: data.emissions / 1000
    }))
    .sort((a, b) => b.emissions - a.emissions);

  if (sortedMonths.length > 0) {
    console.log(`\nHighest month: ${sortedMonths[0].month} (${sortedMonths[0].emissions.toFixed(1)} tCO2e)`);
    console.log(`Lowest month: ${sortedMonths[sortedMonths.length - 1].month} (${sortedMonths[sortedMonths.length - 1].emissions.toFixed(1)} tCO2e)`);
  }

  process.exit(0);
}

testMonthlyEmissions().catch(console.error);