import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function testAPIRenewablePercentage() {
  console.log('🧪 Testing API Renewable Percentage Calculation\n');
  console.log('='.repeat(80));

  // Simulate what the API does

  // 1. Get energy metrics
  const { data: energyMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, unit, is_renewable, energy_type, cost_per_ton')
    .in('category', ['Purchased Energy', 'Electricity']);

  console.log('\n📊 Energy Metrics:', energyMetrics.length);

  // 2. Get energy data for 2025
  const metricIds = energyMetrics.map(m => m.id);
  const { data: energyData } = await supabase
    .from('metrics_data')
    .select('metric_id, value, co2e_emissions, period_start, unit, metadata')
    .eq('organization_id', organizationId)
    .in('metric_id', metricIds)
    .gte('period_start', '2025-01-01')
    .lte('period_start', '2025-12-31')
    .order('period_start', { ascending: false });

  console.log('📅 Energy Data Records (2025):', energyData.length);

  // 3. Calculate pureRenewableConsumption (100% renewable sources like solar, wind)
  const sourcesByType = (energyData || []).reduce((acc: any, record: any) => {
    const metric = energyMetrics.find(m => m.id === record.metric_id);
    const metricCode = metric?.code || '';

    const typeMapping: { [key: string]: { name: string, type: string } } = {
      'scope2_electricity_grid': { name: 'Grid Electricity', type: 'grid_electricity' },
      'scope2_electricity_renewable': { name: 'Renewable Electricity', type: 'renewable_electricity' },
      'scope2_electricity_solar': { name: 'Solar Power', type: 'solar' },
      'scope2_electricity_wind': { name: 'Wind Power', type: 'wind' },
      'scope2_ev_charging': { name: 'EV Charging', type: 'ev_charging' },
    };

    const sourceInfo = typeMapping[metricCode] || { name: metric?.name || 'Other', type: 'other' };
    const isRenewable = metric?.is_renewable || false;

    if (!acc[sourceInfo.type]) {
      acc[sourceInfo.type] = {
        name: sourceInfo.name,
        type: sourceInfo.type,
        consumption: 0,
        renewable: isRenewable,
      };
    }

    acc[sourceInfo.type].consumption += parseFloat(record.value) || 0;
    return acc;
  }, {});

  const sources = Object.values(sourcesByType);

  const pureRenewableConsumption = sources
    .filter((s: any) => s.renewable)
    .reduce((sum: number, s: any) => sum + s.consumption, 0);

  console.log('\n🌱 Pure Renewable Consumption (solar, wind, etc):', pureRenewableConsumption.toFixed(2), 'kWh');

  // 4. Calculate grid mix renewable
  let totalRenewableFromGrid = 0;
  let totalNonRenewableFromGrid = 0;

  (energyData || []).forEach((record: any) => {
    const metric = energyMetrics.find(m => m.id === record.metric_id);
    const metricCode = metric?.code || '';

    if (metricCode.includes('electricity') || metricCode.includes('ev')) {
      const gridMix = record.metadata?.grid_mix;
      if (gridMix) {
        totalRenewableFromGrid += gridMix.renewable_kwh || 0;
        totalNonRenewableFromGrid += gridMix.non_renewable_kwh || 0;
      }
    }
  });

  console.log('\n🔌 Grid Mix Renewable:', totalRenewableFromGrid.toFixed(2), 'kWh');
  console.log('🔌 Grid Mix Non-Renewable:', totalNonRenewableFromGrid.toFixed(2), 'kWh');
  console.log('🔌 Total Grid Electricity:', (totalRenewableFromGrid + totalNonRenewableFromGrid).toFixed(2), 'kWh');

  const gridRenewablePercentage = totalRenewableFromGrid + totalNonRenewableFromGrid > 0
    ? (totalRenewableFromGrid / (totalRenewableFromGrid + totalNonRenewableFromGrid) * 100)
    : 0;

  console.log('🔌 Grid Renewable Percentage:', gridRenewablePercentage.toFixed(1) + '%');

  // 5. Calculate total consumption
  const totalConsumption = sources.reduce((sum: number, s: any) => sum + s.consumption, 0);
  console.log('\n📊 Total Consumption:', totalConsumption.toFixed(2), 'kWh');

  // 6. Calculate OVERALL renewable percentage
  const totalRenewableEnergy = pureRenewableConsumption + totalRenewableFromGrid;
  const renewablePercentage = totalConsumption > 0
    ? (totalRenewableEnergy / totalConsumption * 100)
    : 0;

  console.log('\n' + '='.repeat(80));
  console.log('🎯 FINAL CALCULATION');
  console.log('='.repeat(80));
  console.log('Total Renewable Energy:', totalRenewableEnergy.toFixed(2), 'kWh');
  console.log('  = Pure Renewable:', pureRenewableConsumption.toFixed(2), 'kWh');
  console.log('  + Grid Renewable:', totalRenewableFromGrid.toFixed(2), 'kWh');
  console.log('\nTotal Consumption:', totalConsumption.toFixed(2), 'kWh');
  console.log('\n✅ Overall Renewable Percentage:', Math.round(renewablePercentage * 10) / 10 + '%');
  console.log('='.repeat(80));

  // 7. Check energy_mixes array
  console.log('\n🔍 Checking energy_mixes array calculation...\n');

  const energyMixesByType: { [key: string]: any } = {};

  (energyData || []).forEach((record: any) => {
    const metric = energyMetrics.find(m => m.id === record.metric_id);
    const energyType = metric?.energy_type || 'electricity';

    if (!energyMixesByType[energyType]) {
      energyMixesByType[energyType] = {
        energy_type: energyType,
        renewable_kwh: 0,
        non_renewable_kwh: 0,
      };
    }

    const gridMix = record.metadata?.grid_mix;
    if (gridMix) {
      energyMixesByType[energyType].renewable_kwh += gridMix.renewable_kwh || 0;
      energyMixesByType[energyType].non_renewable_kwh += gridMix.non_renewable_kwh || 0;
    }
  });

  Object.values(energyMixesByType).forEach((mix: any) => {
    const totalEnergy = mix.renewable_kwh + mix.non_renewable_kwh;
    const renewablePercentage = totalEnergy > 0
      ? (mix.renewable_kwh / totalEnergy * 100)
      : 0;

    console.log(`Energy Type: ${mix.energy_type}`);
    console.log(`  Renewable kWh: ${mix.renewable_kwh.toFixed(2)}`);
    console.log(`  Non-Renewable kWh: ${mix.non_renewable_kwh.toFixed(2)}`);
    console.log(`  Total: ${totalEnergy.toFixed(2)}`);
    console.log(`  Renewable %: ${renewablePercentage.toFixed(1)}%`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('✅ This should match what the API returns in energy_mixes[0].renewable_percentage');
  console.log('='.repeat(80));
}

testAPIRenewablePercentage();
