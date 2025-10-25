import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function calculateDashboardValues() {
  // Get 2025 Jan-Aug data for each category
  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  const { data: metrics2025 } = await supabase
    .from('metrics_data')
    .select('metric_id, value, co2e_emissions, unit')
    .eq('organization_id', orgId)
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-08-31');

  const { data: metricDefs } = await supabase
    .from('metrics')
    .select('id, name, category');

  // Calculate totals by category
  const categories: any = {
    emissions: 0,
    energy: 0,
    water: 0,
    waste: 0
  };

  metrics2025?.forEach(m => {
    const metric = metricDefs?.find(d => d.id === m.metric_id);
    if (!metric) return;

    const emissions = (m.co2e_emissions || 0) / 1000; // to tonnes
    categories.emissions += emissions;

    if (metric.category === 'Electricity' || metric.category === 'Purchased Energy') {
      categories.energy += (m.value || 0) / 1000; // kWh to MWh
    } else if (metric.name?.includes('Water') || metric.name?.includes('water')) {
      categories.water += m.value || 0; // m³
    } else if (metric.category === 'Waste') {
      categories.waste += m.value || 0; // tons
    }
  });

  // Get 2024 Jan-Aug for comparison
  const { data: metrics2024 } = await supabase
    .from('metrics_data')
    .select('metric_id, value, co2e_emissions')
    .eq('organization_id', orgId)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-08-31');

  const categories2024: any = {
    emissions: 0,
    energy: 0,
    water: 0,
    waste: 0
  };

  metrics2024?.forEach(m => {
    const metric = metricDefs?.find(d => d.id === m.metric_id);
    if (!metric) return;

    const emissions = (m.co2e_emissions || 0) / 1000;
    categories2024.emissions += emissions;

    if (metric.category === 'Electricity' || metric.category === 'Purchased Energy') {
      categories2024.energy += (m.value || 0) / 1000;
    } else if (metric.name?.includes('Water') || metric.name?.includes('water')) {
      categories2024.water += m.value || 0;
    } else if (metric.category === 'Waste') {
      categories2024.waste += m.value || 0;
    }
  });

  console.log('=== CORRECT CARD VALUES FOR 2025 (Jan-Aug) ===\n');

  console.log('EMISSIONS CARD:');
  console.log(`  Value: ${categories.emissions.toFixed(1)} tCO2e`);
  const emissionsChange = ((categories.emissions - categories2024.emissions) / categories2024.emissions * 100);
  console.log(`  Trend: ${emissionsChange > 0 ? '↑' : '↓'} ${Math.abs(emissionsChange).toFixed(0)}%\n`);

  console.log('ENERGY CARD:');
  console.log(`  Value: ${categories.energy.toFixed(1)} MWh`);
  const energyChange = categories2024.energy > 0 ?
    ((categories.energy - categories2024.energy) / categories2024.energy * 100) : 0;
  console.log(`  Trend: ${energyChange > 0 ? '↑' : '↓'} ${Math.abs(energyChange).toFixed(0)}%\n`);

  console.log('WATER CARD:');
  console.log(`  Value: ${categories.water.toFixed(0)} m³`);
  const waterChange = categories2024.water > 0 ?
    ((categories.water - categories2024.water) / categories2024.water * 100) : 0;
  console.log(`  Trend: ${waterChange > 0 ? '↑' : '↓'} ${Math.abs(waterChange).toFixed(0)}%\n`);

  console.log('WASTE CARD:');
  console.log(`  Value: ${categories.waste.toFixed(1)} tons`);
  const wasteChange = categories2024.waste > 0 ?
    ((categories.waste - categories2024.waste) / categories2024.waste * 100) : 0;
  console.log(`  Trend: ${wasteChange > 0 ? '↑' : '↓'} ${Math.abs(wasteChange).toFixed(0)}%\n`);

  console.log('MIDDAY CHECK-IN:');
  console.log(`  ${metrics2025?.length} metrics tracked today\n`);

  console.log('=== CURRENT DISPLAYED VALUES (INCORRECT) ===\n');
  console.log('Emissions: 314.3 tCO2e (should be ' + categories.emissions.toFixed(1) + ')');
  console.log('Energy: 775.5 MWh (should be ' + categories.energy.toFixed(1) + ')');
  console.log('Water: 940 m³ (should be ' + categories.water.toFixed(0) + ')');
  console.log('Waste: 16.0 tons (should be ' + categories.waste.toFixed(1) + ')');
}

calculateDashboardValues();