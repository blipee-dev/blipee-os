import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkElectricity2025() {
  console.log('\n🔍 Checking Electricity & Purchased Energy for 2025...\n');

  try {
    // Get metrics catalog for Electricity and Purchased Energy
    const { data: metrics, error: metricsError } = await supabase
      .from('metrics_catalog')
      .select('*')
      .in('category', ['Electricity', 'Purchased Energy']);

    if (metricsError) {
      console.error('❌ Error fetching metrics:', metricsError);
      return;
    }

    console.log('📊 Found metrics:', metrics?.length);
    metrics?.forEach(m => {
      console.log(`  - ${m.category}: ${m.name} (${m.code})`);
    });

    // Get data for 2025 Jan-Jul
    const { data: records, error: dataError } = await supabase
      .from('metrics_data')
      .select('*, metrics_catalog!inner(category, code, name)')
      .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
      .gte('period_start', '2025-01-01')
      .lte('period_start', '2025-07-31')
      .in('metrics_catalog.category', ['Electricity', 'Purchased Energy'])
      .order('period_start');

    if (dataError) {
      console.error('❌ Error fetching data:', dataError);
      return;
    }

    console.log(`\n📈 Found ${records?.length} records for 2025 Jan-Jul\n`);

    // Aggregate by category
    const byCategory = records?.reduce((acc: any, record: any) => {
      const category = record.metrics_catalog?.category || 'Unknown';
      if (!acc[category]) {
        acc[category] = {
          consumption: 0,
          emissions: 0,
          count: 0,
          records: []
        };
      }
      acc[category].consumption += parseFloat(record.value) || 0;
      acc[category].emissions += parseFloat(record.co2e_emissions) || 0;
      acc[category].count++;
      acc[category].records.push({
        date: record.period_start,
        metric: record.metrics_catalog?.name,
        value: parseFloat(record.value),
        emissions: parseFloat(record.co2e_emissions)
      });
      return acc;
    }, {});

    console.log('📊 Summary by Category:\n');
    Object.entries(byCategory || {}).forEach(([category, data]: [string, any]) => {
      console.log(`${category}:`);
      console.log(`  Consumption: ${(data.consumption / 1000).toFixed(1)} MWh (${data.consumption.toFixed(0)} kWh)`);
      console.log(`  Emissions: ${(data.emissions / 1000).toFixed(2)} tCO2e (${data.emissions.toFixed(0)} kgCO2e)`);
      console.log(`  Records: ${data.count}`);
      console.log(`  Avg emission factor: ${(data.emissions / data.consumption).toFixed(4)} kgCO2e/kWh`);
      console.log();
    });

    // Show monthly breakdown for Electricity
    console.log('📅 Monthly Electricity Breakdown:\n');
    const electricityRecords = byCategory?.['Electricity']?.records || [];
    const byMonth = electricityRecords.reduce((acc: any, r: any) => {
      const month = r.date.substring(0, 7);
      if (!acc[month]) {
        acc[month] = { consumption: 0, emissions: 0, count: 0 };
      }
      acc[month].consumption += r.value;
      acc[month].emissions += r.emissions;
      acc[month].count++;
      return acc;
    }, {});

    Object.entries(byMonth).forEach(([month, data]: [string, any]) => {
      console.log(`${month}: ${(data.consumption / 1000).toFixed(1)} MWh, ${(data.emissions / 1000).toFixed(1)} tCO2e (${data.count} records)`);
    });

    console.log('\n✅ Done!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkElectricity2025();
