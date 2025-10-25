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

async function testDashboardMetrics() {
  console.log('🧪 Testing Dashboard Metrics Calculation\n');
  console.log('=========================================\n');

  // Get PLMJ organization
  const { data: plmj } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'PLMJ')
    .single();

  const ranges = ['2025', '2024', '2023', '2022', 'all'];

  for (const range of ranges) {
    console.log(`\n📊 Range: ${range}`);
    console.log('------------------------');

    // Define date ranges
    let startDate: string;
    let endDate: string;
    let previousStart: string;
    let previousEnd: string;

    switch (range) {
      case '2025':
        startDate = '2025-01-01';
        endDate = '2025-12-31';
        previousStart = '2024-01-01';
        previousEnd = '2024-12-31';
        break;
      case '2024':
        startDate = '2024-01-01';
        endDate = '2024-12-31';
        previousStart = '2023-01-01';
        previousEnd = '2023-12-31';
        break;
      case '2023':
        startDate = '2023-01-01';
        endDate = '2023-12-31';
        previousStart = '2022-01-01';
        previousEnd = '2022-12-31';
        break;
      case '2022':
        startDate = '2022-01-01';
        endDate = '2022-12-31';
        previousStart = '2021-01-01';
        previousEnd = '2021-12-31';
        break;
      case 'all':
      default:
        // All time - no date filter
        const { data: allData } = await supabase
          .from('metrics_data')
          .select('co2e_emissions')
          .eq('organization_id', plmj!.id)
          .not('site_id', 'is', null);

        const allTimeTotal = allData?.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) || 0;
        console.log(`All-time total: ${Math.round(allTimeTotal / 1000 * 10) / 10} tCO2e`);
        continue;
    }

    // Get current period data
    const { data: currentData } = await supabase
      .from('metrics_data')
      .select('co2e_emissions')
      .eq('organization_id', plmj!.id)
      .gte('period_start', startDate)
      .lte('period_end', endDate)
      .not('site_id', 'is', null);

    // Get previous period data
    const { data: previousData } = await supabase
      .from('metrics_data')
      .select('co2e_emissions')
      .eq('organization_id', plmj!.id)
      .gte('period_start', previousStart)
      .lte('period_end', previousEnd)
      .not('site_id', 'is', null);

    const currentTotal = currentData?.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) || 0;
    const previousTotal = previousData?.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) || 0;

    const currentTons = currentTotal / 1000;
    const previousTons = previousTotal / 1000;

    // Calculate percentage change
    let percentageChange = 0;
    if (previousTons > 0) {
      percentageChange = ((currentTons - previousTons) / previousTons) * 100;
    }

    console.log(`Current period: ${Math.round(currentTons * 10) / 10} tCO2e`);
    console.log(`Previous period: ${Math.round(previousTons * 10) / 10} tCO2e`);
    console.log(`Change: ${percentageChange > 0 ? '+' : ''}${Math.round(percentageChange * 10) / 10}%`);
    console.log(`Data points: ${currentData?.length || 0}`);
  }

  console.log('\n\n✅ Expected Values for Dashboard:\n');
  console.log('2025 (Jan-Aug):');
  console.log('  - Total: 398.7 tCO2e');
  console.log('  - vs 2024: -37.9%');
  console.log('\n2024:');
  console.log('  - Total: 642.1 tCO2e');
  console.log('  - vs 2023: +50.6%');
  console.log('\n2023:');
  console.log('  - Total: 426.3 tCO2e');
  console.log('  - vs 2022: -5.0%');
  console.log('\n2022:');
  console.log('  - Total: 448.6 tCO2e');
  console.log('  - vs 2021: N/A (no data)');

  process.exit(0);
}

testDashboardMetrics().catch(console.error);