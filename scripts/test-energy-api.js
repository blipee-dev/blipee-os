const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  console.log('=== TESTING ENERGY API LOGIC ===\n');

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'; // PLMJ

  // Get energy metrics from metrics_catalog
  const { data: energyMetrics } = await supabaseAdmin
    .from('metrics_catalog')
    .select('*')
    .in('category', ['Purchased Energy', 'Electricity']);

  console.log('Energy metrics found:', energyMetrics.length, '\n');

  // Get energy data from metrics_data
  const metricIds = energyMetrics.map(m => m.id);
  const { data: energyData } = await supabaseAdmin
    .from('metrics_data')
    .select('*')
    .eq('organization_id', organizationId)
    .in('metric_id', metricIds)
    .order('period_start', { ascending: false });

  console.log('Energy data records:', energyData.length, '\n');

  // Group by source type and aggregate
  const sourcesByType = (energyData || []).reduce((acc, record) => {
    const metric = energyMetrics.find(m => m.id === record.metric_id);
    const metricCode = metric?.code || '';

    const typeMapping = {
      'scope2_electricity_grid': { name: 'Grid Electricity', type: 'grid_electricity', renewable: false },
      'scope2_electricity_renewable': { name: 'Renewable Electricity', type: 'renewable_electricity', renewable: true },
      'scope2_electricity_solar': { name: 'Solar Power', type: 'solar', renewable: true },
      'scope2_electricity_wind': { name: 'Wind Power', type: 'wind', renewable: true },
      'scope2_ev_charging': { name: 'EV Charging', type: 'ev_charging', renewable: false },
      'scope2_purchased_heating': { name: 'Purchased Heating', type: 'purchased_heating', renewable: false },
      'scope2_purchased_cooling': { name: 'Purchased Cooling', type: 'purchased_cooling', renewable: false },
      'scope2_purchased_steam': { name: 'Steam', type: 'steam', renewable: false },
      'scope2_district_heating': { name: 'District Heating', type: 'district_heating', renewable: false },
      'scope2_district_cooling': { name: 'District Cooling', type: 'district_cooling', renewable: false },
    };

    const sourceInfo = typeMapping[metricCode] || { name: metric?.name || 'Other', type: 'other', renewable: false };

    if (!acc[sourceInfo.type]) {
      acc[sourceInfo.type] = {
        name: sourceInfo.name,
        type: sourceInfo.type,
        consumption: 0,
        unit: metric?.unit || 'kWh',
        emissions: 0,
        cost: 0,
        renewable: sourceInfo.renewable,
        trend: 0
      };
    }

    acc[sourceInfo.type].consumption += parseFloat(record.value) || 0;
    acc[sourceInfo.type].emissions += (parseFloat(record.co2e_emissions) || 0) / 1000; // Convert kgCO2e to tCO2e
    acc[sourceInfo.type].cost += parseFloat(record.cost) || 0;

    return acc;
  }, {});

  const sources = Object.values(sourcesByType);

  console.log('📊 ENERGY SOURCES:\n');
  sources.forEach(s => {
    console.log(`${s.name.padEnd(25)} ${s.consumption.toFixed(0).padStart(10)} ${s.unit.padEnd(5)} → ${s.emissions.toFixed(1).padStart(8)} tCO2e ${s.renewable ? '🌱' : ''}`);
  });

  // Calculate totals
  const totalConsumption = sources.reduce((sum, s) => sum + s.consumption, 0);
  const totalEmissions = sources.reduce((sum, s) => sum + s.emissions, 0);
  const totalCost = sources.reduce((sum, s) => sum + s.cost, 0);

  const renewableConsumption = sources
    .filter(s => s.renewable)
    .reduce((sum, s) => sum + s.consumption, 0);

  const renewablePercentage = totalConsumption > 0
    ? (renewableConsumption / totalConsumption * 100)
    : 0;

  console.log('\n📈 TOTALS:');
  console.log('  Total Consumption:', (totalConsumption / 1000).toFixed(1), 'MWh');
  console.log('  Total Emissions:  ', totalEmissions.toFixed(1), 'tCO2e');
  console.log('  Total Cost:       ', '$' + (totalCost / 1000).toFixed(1) + 'k');
  console.log('  Renewable %:      ', renewablePercentage.toFixed(1) + '%');
})();
