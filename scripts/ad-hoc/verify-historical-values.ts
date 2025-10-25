import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function verifyHistoricalValues() {
  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Get metrics definitions
  const { data: metricDefs } = await supabase
    .from('metrics_catalog')
    .select('*');

  // Check each year
  const years = [2022, 2023, 2024];

  for (const year of years) {
    console.log(`\n=== YEAR ${year} ===\n`);

    // Get data for the year
    const { data: yearData } = await supabase
      .from('metrics_data')
      .select('*')
      .eq('organization_id', orgId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`);

    // Join with definitions
    const metricsWithDefs = yearData?.map(m => ({
      ...m,
      definition: metricDefs?.find(def => def.id === m.metric_id)
    }));

    // Calculate totals
    let totalEmissions = 0;
    let totalEnergy = 0;
    let totalWater = 0;
    let totalWaste = 0;

    const categoryCounts: any = {};

    metricsWithDefs?.forEach(m => {
      const category = m.definition?.category;
      const name = m.definition?.name;

      // Track what we have
      if (!categoryCounts[category || 'Unknown']) {
        categoryCounts[category || 'Unknown'] = { count: 0, emissions: 0, value: 0, metrics: new Set() };
      }
      categoryCounts[category || 'Unknown'].count++;
      categoryCounts[category || 'Unknown'].emissions += (m.co2e_emissions || 0) / 1000;
      categoryCounts[category || 'Unknown'].value += m.value || 0;
      categoryCounts[category || 'Unknown'].metrics.add(name);

      // Calculate totals
      totalEmissions += (m.co2e_emissions || 0) / 1000;

      if (category === 'Electricity' || category === 'Purchased Energy') {
        totalEnergy += (m.value || 0) / 1000; // kWh to MWh
      }
      if (category === 'Purchased Goods & Services' &&
          (name === 'Water' || name === 'Wastewater')) {
        totalWater += m.value || 0;
      }
      if (category === 'Waste') {
        totalWaste += m.value || 0;
      }
    });

    console.log('TOTALS:');
    console.log(`  Emissions: ${totalEmissions.toFixed(1)} tCO2e`);
    console.log(`  Energy: ${totalEnergy.toFixed(1)} MWh`);
    console.log(`  Water: ${totalWater.toFixed(0)} m³`);
    console.log(`  Waste: ${totalWaste.toFixed(1)} tons`);
    console.log(`  Total records: ${yearData?.length}`);

    console.log('\nBY CATEGORY:');
    Object.entries(categoryCounts).forEach(([cat, data]: any) => {
      console.log(`  ${cat}:`);
      console.log(`    Records: ${data.count}`);
      console.log(`    Emissions: ${data.emissions.toFixed(1)} tCO2e`);
      console.log(`    Metrics: ${Array.from(data.metrics).join(', ')}`);
    });

    // Check for data issues
    console.log('\nDATA QUALITY CHECK:');

    // Check for zero values
    const zeroValueRecords = yearData?.filter(d => d.value === 0 || d.value === null);
    console.log(`  Records with zero/null value: ${zeroValueRecords?.length} of ${yearData?.length}`);

    // Check units
    const units = new Set(yearData?.map(d => d.unit));
    console.log(`  Units found: ${Array.from(units).join(', ')}`);

    // Check if we have actual consumption values
    const energyRecords = metricsWithDefs?.filter(m =>
      m.definition?.category === 'Electricity' || m.definition?.category === 'Purchased Energy'
    );
    const energyWithValues = energyRecords?.filter(r => r.value && r.value > 0);
    console.log(`  Energy records with values: ${energyWithValues?.length} of ${energyRecords?.length}`);

    const waterRecords = metricsWithDefs?.filter(m =>
      m.definition?.category === 'Purchased Goods & Services' &&
      (m.definition?.name === 'Water' || m.definition?.name === 'Wastewater')
    );
    const waterWithValues = waterRecords?.filter(r => r.value && r.value > 0);
    console.log(`  Water records with values: ${waterWithValues?.length} of ${waterRecords?.length}`);

    const wasteRecords = metricsWithDefs?.filter(m => m.definition?.category === 'Waste');
    const wasteWithValues = wasteRecords?.filter(r => r.value && r.value > 0);
    console.log(`  Waste records with values: ${wasteWithValues?.length} of ${wasteRecords?.length}`);
  }
}

verifyHistoricalValues();