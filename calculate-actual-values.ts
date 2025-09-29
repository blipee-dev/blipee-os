import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function calculateActualValues() {
  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Get 2025 data
  const { data: data2025 } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', orgId)
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31');

  // Get metrics definitions
  const { data: metricDefs } = await supabase
    .from('metrics_catalog')
    .select('*');

  // Join the data
  const metricsWithDefs = data2025?.map(m => ({
    ...m,
    definition: metricDefs?.find(def => def.id === m.metric_id)
  }));

  // Calculate totals by category
  let totalEmissions = 0;
  let totalEnergy = 0;
  let totalWater = 0;
  let totalWaste = 0;

  const energyMetrics: any[] = [];
  const waterMetrics: any[] = [];
  const wasteMetrics: any[] = [];

  metricsWithDefs?.forEach(m => {
    const category = m.definition?.category;
    const name = m.definition?.name;

    // All contribute to emissions
    totalEmissions += (m.co2e_emissions || 0) / 1000;

    // Energy (Electricity + Purchased Energy)
    if (category === 'Electricity' || category === 'Purchased Energy') {
      energyMetrics.push(m);
      totalEnergy += (m.value || 0) / 1000; // Convert kWh to MWh
    }

    // Water (Water + Wastewater)
    if (category === 'Purchased Goods & Services' &&
        (name === 'Water' || name === 'Wastewater')) {
      waterMetrics.push(m);
      totalWater += m.value || 0; // Already in m³
    }

    // Waste (all waste types)
    if (category === 'Waste') {
      wasteMetrics.push(m);
      totalWaste += m.value || 0; // Already in tons
    }
  });

  // Get 2024 data for trend calculation
  const { data: data2024 } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', orgId)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31');

  const metrics2024WithDefs = data2024?.map(m => ({
    ...m,
    definition: metricDefs?.find(def => def.id === m.metric_id)
  }));

  let emissions2024 = 0;
  let energy2024 = 0;
  let water2024 = 0;
  let waste2024 = 0;

  metrics2024WithDefs?.forEach(m => {
    const category = m.definition?.category;
    const name = m.definition?.name;

    emissions2024 += (m.co2e_emissions || 0) / 1000;

    if (category === 'Electricity' || category === 'Purchased Energy') {
      energy2024 += (m.value || 0) / 1000;
    }
    if (category === 'Purchased Goods & Services' &&
        (name === 'Water' || name === 'Wastewater')) {
      water2024 += m.value || 0;
    }
    if (category === 'Waste') {
      waste2024 += m.value || 0;
    }
  });

  // Calculate trends
  const emissionsTrend = emissions2024 > 0 ? ((totalEmissions - emissions2024) / emissions2024 * 100) : 0;
  const energyTrend = energy2024 > 0 ? ((totalEnergy - energy2024) / energy2024 * 100) : 0;
  const waterTrend = water2024 > 0 ? ((totalWater - water2024) / water2024 * 100) : 0;
  const wasteTrend = waste2024 > 0 ? ((totalWaste - waste2024) / waste2024 * 100) : 0;

  console.log('=== DASHBOARD VALUES FOR 2025 ===\n');

  console.log('EMISSIONS CARD:');
  console.log(`  Value: ${totalEmissions.toFixed(1)} tCO2e`);
  console.log(`  Trend: ${emissionsTrend > 0 ? '↑' : '↓'} ${Math.abs(emissionsTrend).toFixed(0)}%`);
  console.log(`  Details: Total from ${data2025?.length} data points`);

  console.log('\nENERGY CARD:');
  console.log(`  Value: ${totalEnergy.toFixed(1)} MWh`);
  console.log(`  Trend: ${energyTrend > 0 ? '↑' : '↓'} ${Math.abs(energyTrend).toFixed(0)}%`);
  console.log(`  From: ${energyMetrics.length} energy records`);

  // Show breakdown
  const energyByType: any = {};
  energyMetrics.forEach(m => {
    const name = m.definition?.name || 'Unknown';
    if (!energyByType[name]) energyByType[name] = 0;
    energyByType[name] += (m.value || 0) / 1000;
  });
  Object.entries(energyByType).forEach(([type, value]) => {
    console.log(`    - ${type}: ${(value as number).toFixed(1)} MWh`);
  });

  console.log('\nWATER CARD:');
  console.log(`  Value: ${totalWater.toFixed(0)} m³`);
  console.log(`  Trend: ${waterTrend > 0 ? '↑' : '↓'} ${Math.abs(waterTrend).toFixed(0)}%`);
  console.log(`  From: ${waterMetrics.length} water records`);

  console.log('\nWASTE CARD:');
  console.log(`  Value: ${totalWaste.toFixed(1)} tons`);
  console.log(`  Trend: ${wasteTrend > 0 ? '↑' : '↓'} ${Math.abs(wasteTrend).toFixed(0)}%`);
  console.log(`  From: ${wasteMetrics.length} waste records`);

  // Show breakdown
  const wasteByType: any = {};
  wasteMetrics.forEach(m => {
    const name = m.definition?.name || 'Unknown';
    if (!wasteByType[name]) wasteByType[name] = 0;
    wasteByType[name] += m.value || 0;
  });
  Object.entries(wasteByType).forEach(([type, value]) => {
    console.log(`    - ${type}: ${(value as number).toFixed(1)} tons`);
  });

  console.log('\n=== COMPARISON ===');
  console.log(`2024 Total: ${emissions2024.toFixed(1)} tCO2e`);
  console.log(`2025 Total: ${totalEmissions.toFixed(1)} tCO2e`);
  console.log(`Difference: ${(totalEmissions - emissions2024).toFixed(1)} tCO2e`);
}

calculateActualValues();