import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkElectricity2023() {
  console.log('\n🔍 Checking Electricity & Purchased Energy for 2023 (Jan-Jul)...\n');

  try {
    const { data: records, error: dataError } = await supabase
      .from('metrics_data')
      .select('*, metrics_catalog!inner(category, code, name)')
      .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
      .gte('period_start', '2023-01-01')
      .lte('period_start', '2023-07-31')
      .in('metrics_catalog.category', ['Electricity', 'Purchased Energy'])
      .order('period_start');

    if (dataError) {
      console.error('❌ Error fetching data:', dataError);
      return;
    }

    console.log(`📈 Found ${records?.length} records for 2023 Jan-Jul\n`);

    const byCategory = records?.reduce((acc: any, record: any) => {
      const category = record.metrics_catalog?.category || 'Unknown';
      if (!acc[category]) {
        acc[category] = {
          consumption: 0,
          emissions: 0,
          count: 0
        };
      }
      acc[category].consumption += parseFloat(record.value) || 0;
      acc[category].emissions += parseFloat(record.co2e_emissions) || 0;
      acc[category].count++;
      return acc;
    }, {});

    console.log('📊 2023 Jan-Jul Summary:\n');
    Object.entries(byCategory || {}).forEach(([category, data]: [string, any]) => {
      console.log(`${category}:`);
      console.log(`  Consumption: ${(data.consumption / 1000).toFixed(1)} MWh (${data.consumption.toFixed(0)} kWh)`);
      console.log(`  Emissions: ${(data.emissions / 1000).toFixed(2)} tCO2e (${data.emissions.toFixed(0)} kgCO2e)`);
      console.log(`  Records: ${data.count}`);
      console.log();
    });

    const totalConsumption = Object.values(byCategory || {}).reduce((sum: number, d: any) => sum + d.consumption, 0);
    const totalEmissions = Object.values(byCategory || {}).reduce((sum: number, d: any) => sum + d.emissions, 0);

    console.log(`Total: ${(totalConsumption / 1000).toFixed(1)} MWh, ${(totalEmissions / 1000).toFixed(2)} tCO2e\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkElectricity2023();
