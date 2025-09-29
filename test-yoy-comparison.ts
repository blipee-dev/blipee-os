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

async function testYearOverYearComparison() {
  console.log('📊 Year-over-Year Monthly Comparison\n');
  console.log('=====================================\n');

  // Get PLMJ organization
  const { data: plmj } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'PLMJ')
    .single();

  const organizationId = plmj!.id;

  // Test for 2025 vs 2024
  const currentYear = 2025;
  const previousYear = 2024;

  // Get current year data (2025)
  const { data: currentData } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, period_start')
    .eq('organization_id', organizationId)
    .gte('period_start', `${currentYear}-01-01`)
    .lte('period_end', `${currentYear}-12-31`)
    .not('co2e_emissions', 'is', null);

  // Get previous year data (2024)
  const { data: previousData } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, period_start')
    .eq('organization_id', organizationId)
    .gte('period_start', `${previousYear}-01-01`)
    .lte('period_end', `${previousYear}-12-31`)
    .not('co2e_emissions', 'is', null);

  // Group by month for current year
  const currentByMonth: { [key: number]: number } = {};
  currentData?.forEach(d => {
    const date = new Date(d.period_start);
    const month = date.getMonth();
    currentByMonth[month] = (currentByMonth[month] || 0) + (d.co2e_emissions || 0);
  });

  // Group by month for previous year
  const previousByMonth: { [key: number]: number } = {};
  previousData?.forEach(d => {
    const date = new Date(d.period_start);
    const month = date.getMonth();
    previousByMonth[month] = (previousByMonth[month] || 0) + (d.co2e_emissions || 0);
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  console.log(`Comparing ${currentYear} vs ${previousYear}:\n`);
  console.log('Month\t\t2025\t\t2024\t\tChange\t\tYoY %');
  console.log('-----\t\t----\t\t----\t\t------\t\t-----');

  let total2025 = 0;
  let total2024 = 0;

  months.forEach((month, i) => {
    const current = currentByMonth[i] || 0;
    const previous = previousByMonth[i] || 0;
    const currentTons = current / 1000;
    const previousTons = previous / 1000;

    total2025 += currentTons;
    total2024 += previousTons;

    let change = currentTons - previousTons;
    let changePercent = 0;

    if (previousTons > 0) {
      changePercent = ((currentTons - previousTons) / previousTons) * 100;
    } else if (currentTons > 0) {
      changePercent = 100;
    }

    const currentStr = currentTons > 0 ? `${currentTons.toFixed(1)} t` : '-';
    const previousStr = previousTons > 0 ? `${previousTons.toFixed(1)} t` : '-';
    const changeStr = (current > 0 || previous > 0) ?
      `${change > 0 ? '+' : ''}${change.toFixed(1)} t` : '-';
    const percentStr = (current > 0 || previous > 0) ?
      `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%` : '-';

    console.log(`${month}\t\t${currentStr}\t\t${previousStr}\t\t${changeStr}\t\t${percentStr}`);
  });

  console.log('\n-----\t\t----\t\t----\t\t------\t\t-----');
  const totalChange = total2025 - total2024;
  const totalChangePercent = total2024 > 0 ? ((total2025 - total2024) / total2024) * 100 : 0;

  console.log(`Total\t\t${total2025.toFixed(1)} t\t\t${total2024.toFixed(1)} t\t\t${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)} t\t\t${totalChangePercent > 0 ? '+' : ''}${totalChangePercent.toFixed(1)}%`);

  // Summary
  console.log('\n📈 Summary:');
  console.log(`- ${currentYear} Total: ${total2025.toFixed(1)} tCO2e`);
  console.log(`- ${previousYear} Total: ${total2024.toFixed(1)} tCO2e`);
  console.log(`- Overall Change: ${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)} tCO2e (${totalChangePercent > 0 ? '+' : ''}${totalChangePercent.toFixed(1)}%)`);

  // Find biggest changes
  const changes = months.map((month, i) => {
    const current = (currentByMonth[i] || 0) / 1000;
    const previous = (previousByMonth[i] || 0) / 1000;
    let changePercent = 0;

    if (previous > 0) {
      changePercent = ((current - previous) / previous) * 100;
    } else if (current > 0) {
      changePercent = 100;
    }

    return { month, changePercent, hasData: current > 0 || previous > 0 };
  }).filter(m => m.hasData);

  const sorted = changes.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  if (sorted.length > 0) {
    console.log(`\n📊 Biggest Changes:`);
    sorted.slice(0, 3).forEach(m => {
      const direction = m.changePercent > 0 ? '📈 increase' : '📉 decrease';
      console.log(`- ${m.month}: ${m.changePercent > 0 ? '+' : ''}${m.changePercent.toFixed(1)}% ${direction}`);
    });
  }

  process.exit(0);
}

testYearOverYearComparison().catch(console.error);