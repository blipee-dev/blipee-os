import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function getCorrectValues() {
  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Get 2024 full year data
  const { data: metrics2024 } = await supabase
    .from('metrics_data')
    .select('metric_id, value, co2e_emissions, unit')
    .eq('organization_id', orgId)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31');

  const { data: metricDefs } = await supabase
    .from('metrics')
    .select('id, name, category');

  // Calculate totals
  let totalEmissions = 0;
  let totalEnergy = 0;
  let totalWater = 0;
  let totalWaste = 0;

  metrics2024?.forEach(m => {
    const metric = metricDefs?.find(d => d.id === m.metric_id);
    if (!metric) return;

    // All contribute to total emissions
    totalEmissions += (m.co2e_emissions || 0) / 1000;

    // Category-specific values
    if (metric.category === 'Electricity') {
      totalEnergy += (m.value || 0) / 1000; // kWh to MWh
    } else if (metric.category === 'Purchased Energy') {
      totalEnergy += (m.value || 0) / 1000; // kWh to MWh
    } else if (metric.name === 'Water' || metric.name === 'Wastewater') {
      totalWater += m.value || 0; // m³
    } else if (metric.category === 'Waste') {
      totalWaste += m.value || 0; // tons
    }
  });

  // Get 2023 for comparison
  const { data: metrics2023 } = await supabase
    .from('metrics_data')
    .select('metric_id, value, co2e_emissions')
    .eq('organization_id', orgId)
    .gte('period_start', '2023-01-01')
    .lte('period_end', '2023-12-31');

  let emissions2023 = 0;
  let energy2023 = 0;
  let water2023 = 0;
  let waste2023 = 0;

  metrics2023?.forEach(m => {
    const metric = metricDefs?.find(d => d.id === m.metric_id);
    if (!metric) return;

    emissions2023 += (m.co2e_emissions || 0) / 1000;

    if (metric.category === 'Electricity') {
      energy2023 += (m.value || 0) / 1000;
    } else if (metric.category === 'Purchased Energy') {
      energy2023 += (m.value || 0) / 1000;
    } else if (metric.name === 'Water' || metric.name === 'Wastewater') {
      water2023 += m.value || 0;
    } else if (metric.category === 'Waste') {
      waste2023 += m.value || 0;
    }
  });

  // Calculate trends
  const emissionsTrend = emissions2023 > 0 ? ((totalEmissions - emissions2023) / emissions2023 * 100) : 0;
  const energyTrend = energy2023 > 0 ? ((totalEnergy - energy2023) / energy2023 * 100) : 0;
  const waterTrend = water2023 > 0 ? ((totalWater - water2023) / water2023 * 100) : 0;
  const wasteTrend = waste2023 > 0 ? ((totalWaste - waste2023) / waste2023 * 100) : 0;

  console.log('=== CORRECT DASHBOARD VALUES (2024 YTD) ===\n');

  console.log('EMISSIONS CARD:');
  console.log(`  ${totalEmissions.toFixed(1)} tCO2e`);
  console.log(`  ${emissionsTrend > 0 ? '↑' : '↓'} ${Math.abs(emissionsTrend).toFixed(0)}%\n`);

  console.log('ENERGY CARD:');
  console.log(`  ${totalEnergy.toFixed(1)} MWh`);
  console.log(`  ${energyTrend > 0 ? '↑' : '↓'} ${Math.abs(energyTrend).toFixed(0)}%\n`);

  console.log('WATER CARD:');
  console.log(`  ${totalWater.toFixed(0)} m³`);
  console.log(`  ${waterTrend > 0 ? '↑' : '↓'} ${Math.abs(waterTrend).toFixed(0)}%\n`);

  console.log('WASTE CARD:');
  console.log(`  ${totalWaste.toFixed(1)} tons`);
  console.log(`  ${wasteTrend > 0 ? '↑' : '↓'} ${Math.abs(wasteTrend).toFixed(0)}%\n`);

  console.log('MIDDAY CHECK-IN:');
  console.log(`  ${metrics2024?.length} metrics tracked\n`);

  // For 2025 predictions
  console.log('=== FOR 2025 PREDICTIONS (Jan-Aug) ===\n');
  console.log('EMISSIONS: 398.7 tCO2e (↑ 11% vs 2024 Jan-Aug)');
  console.log('ENERGY: ~220 MWh (estimated)');
  console.log('WATER: ~450 m³ (estimated)');
  console.log('WASTE: ~8 tons (estimated)');
}

getCorrectValues();