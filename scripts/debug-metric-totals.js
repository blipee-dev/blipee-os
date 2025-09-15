const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function debugMetricTotals() {
  console.log('🔍 DEBUGGING METRIC TOTALS (Energy, Water, Waste)\n');
  console.log('=' .repeat(60));

  try {
    // Get PLMJ organization ID
    const { data: plmjOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', 'PLMJ')
      .single();

    if (!plmjOrg) {
      console.log('❌ PLMJ organization not found');
      return;
    }

    console.log(`📍 PLMJ Organization ID: ${plmjOrg.id}\n`);

    // Get 2024 data for PLMJ with detailed breakdown
    const { data: metricsData } = await supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          name, category, unit, emission_factor, emission_factor_unit
        )
      `)
      .eq('organization_id', plmjOrg.id)
      .gte('period_start', '2024-01-01')
      .lte('period_end', '2024-12-31')
      .order('value', { ascending: false });

    console.log(`📊 Found ${metricsData?.length || 0} records for PLMJ 2024\n`);

    if (!metricsData || metricsData.length === 0) {
      console.log('❌ No data found for PLMJ 2024');
      return;
    }

    // Group by category
    const byCategory = {};

    metricsData.forEach(record => {
      const category = record.metrics_catalog?.category || 'Unknown';

      if (!byCategory[category]) {
        byCategory[category] = {
          records: [],
          totalValue: 0,
          totalEmissions: 0,
          units: new Set()
        };
      }

      byCategory[category].records.push(record);
      byCategory[category].totalValue += record.value || 0;
      byCategory[category].totalEmissions += record.co2e_emissions || 0;
      byCategory[category].units.add(record.unit || 'unknown');
    });

    console.log('📈 METRICS BY CATEGORY:\n');
    console.log('Category'.padEnd(30) + 'Records'.padEnd(10) + 'Total Value'.padEnd(15) + 'Units'.padEnd(15) + 'Emissions (kg)');
    console.log('-'.repeat(90));

    Object.entries(byCategory).forEach(([category, data]) => {
      const unitsStr = Array.from(data.units).join(', ');

      console.log(
        category.padEnd(30) +
        data.records.length.toString().padEnd(10) +
        data.totalValue.toFixed(2).padEnd(15) +
        unitsStr.padEnd(15) +
        data.totalEmissions.toFixed(2)
      );
    });

    console.log('\n🔍 TESTING METRIC CALCULATIONS:\n');

    // Test energy calculation (Electricity + Purchased Energy)
    const energyData = metricsData.filter(d => {
      const category = d.metrics_catalog?.category;
      return category === 'Electricity' || category === 'Purchased Energy';
    });
    const energyTotal = energyData.reduce((sum, d) => sum + (d.value || 0), 0);
    console.log(`Energy records found: ${energyData.length}`);
    console.log(`Energy total: ${energyTotal} (units: ${energyData.map(d => d.unit).join(', ')})`);

    // Test water calculation (Purchased Goods & Services with m³/m3 unit)
    const waterData = metricsData.filter(d => {
      const category = d.metrics_catalog?.category;
      const unit = d.unit?.toLowerCase();
      return category === 'Purchased Goods & Services' && (unit === 'm³' || unit === 'm3');
    });
    const waterTotal = waterData.reduce((sum, d) => sum + (d.value || 0), 0);
    console.log(`Water records found: ${waterData.length}`);
    console.log(`Water total: ${waterTotal} (units: ${waterData.map(d => d.unit).join(', ')})`);

    // Test waste calculation
    const wasteData = metricsData.filter(d => d.metrics_catalog?.category?.toLowerCase() === 'waste');
    const wasteTotal = wasteData.reduce((sum, d) => sum + (d.value || 0), 0);
    console.log(`Waste records found: ${wasteData.length}`);
    console.log(`Waste total: ${wasteTotal} (units: ${wasteData.map(d => d.unit).join(', ')})`);

    console.log('\n🎯 CATEGORY NAMES IN DATABASE:\n');
    const categoryNames = [...new Set(metricsData.map(d => d.metrics_catalog?.category).filter(Boolean))];
    categoryNames.forEach(name => {
      console.log(`- "${name}"`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

debugMetricTotals();