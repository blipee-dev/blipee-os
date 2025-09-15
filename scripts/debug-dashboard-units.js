const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function debugDashboardUnits() {
  console.log('🔍 DEBUGGING DASHBOARD UNIT CONVERSION ISSUE\n');
  console.log('=' .repeat(80));

  try {
    // Get Faro site
    const { data: faroSite } = await supabase
      .from('sites')
      .select('*')
      .eq('name', 'Faro')
      .single();

    if (!faroSite) {
      console.log('❌ Faro site not found');
      return;
    }

    console.log(`📍 Faro Site ID: ${faroSite.id}`);

    // Get 2024 data for Faro with detailed breakdown
    const { data: faroData } = await supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          name, category, unit, emission_factor, emission_factor_unit
        )
      `)
      .eq('site_id', faroSite.id)
      .gte('period_start', '2024-01-01')
      .lte('period_end', '2024-12-31')
      .order('co2e_emissions', { ascending: false });

    console.log(`\n📊 Found ${faroData?.length || 0} records for Faro 2024\n`);

    if (!faroData || faroData.length === 0) {
      console.log('❌ No data found for Faro 2024');
      return;
    }

    // Analyze the data by category
    const byCategory = {};
    let totalEmissions = 0;

    faroData.forEach(record => {
      const category = record.metrics_catalog?.category || 'Unknown';
      const emissions = record.co2e_emissions || 0;

      if (!byCategory[category]) {
        byCategory[category] = {
          records: [],
          totalValue: 0,
          totalEmissions: 0
        };
      }

      byCategory[category].records.push(record);
      byCategory[category].totalValue += record.value || 0;
      byCategory[category].totalEmissions += emissions;
      totalEmissions += emissions;
    });

    console.log('📈 EMISSIONS BY CATEGORY:\n');
    console.log('Category'.padEnd(25) + 'Records'.padEnd(10) + 'Total Value'.padEnd(15) + 'Unit'.padEnd(10) + 'Emissions (kg)'.padEnd(15) + 'Emissions (t)');
    console.log('-'.repeat(90));

    Object.entries(byCategory).forEach(([category, data]) => {
      const sampleRecord = data.records[0];
      const unit = sampleRecord?.unit || '';
      const emissionsKg = data.totalEmissions;
      const emissionsTons = emissionsKg / 1000;

      console.log(
        category.padEnd(25) +
        data.records.length.toString().padEnd(10) +
        data.totalValue.toFixed(2).padEnd(15) +
        unit.padEnd(10) +
        emissionsKg.toFixed(2).padEnd(15) +
        emissionsTons.toFixed(3)
      );
    });

    console.log('-'.repeat(90));
    console.log(
      'TOTAL'.padEnd(25) +
      faroData.length.toString().padEnd(10) +
      ''.padEnd(15) +
      ''.padEnd(10) +
      totalEmissions.toFixed(2).padEnd(15) +
      (totalEmissions / 1000).toFixed(3)
    );

    // Check what the dashboard API returns
    console.log('\n🔍 TESTING DASHBOARD API CALCULATION:\n');

    // Simulate the dashboard calculation
    const dashboardTotal = faroData.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0);
    console.log(`Raw sum from database: ${dashboardTotal} kg CO2e`);
    console.log(`Converted to tons: ${dashboardTotal / 1000} tCO2e`);
    console.log(`Dashboard shows: 2562 tCO2e`);

    // Check if there's a unit issue
    if (Math.abs(dashboardTotal - 2562000) < 1000) {
      console.log('✅ FOUND THE ISSUE: Dashboard is treating kg as tons!');
      console.log('   The data in database is in kg, but dashboard multiplies by 1000 incorrectly');
    } else if (Math.abs(dashboardTotal / 1000 - 2.562) < 0.1) {
      console.log('✅ Database values are correct in kg');
      console.log('❌ Dashboard conversion logic is wrong');
    }

    // Check individual problematic records
    console.log('\n📋 HIGHEST EMISSION RECORDS:\n');
    const highestEmitters = faroData
      .sort((a, b) => (b.co2e_emissions || 0) - (a.co2e_emissions || 0))
      .slice(0, 5);

    highestEmitters.forEach((record, index) => {
      console.log(`${index + 1}. ${record.metrics_catalog?.name}:`);
      console.log(`   Value: ${record.value} ${record.unit}`);
      console.log(`   Emission Factor: ${record.metrics_catalog?.emission_factor} ${record.metrics_catalog?.emission_factor_unit || ''}`);
      console.log(`   CO2e: ${record.co2e_emissions} kg (${(record.co2e_emissions / 1000).toFixed(3)} tons)`);
      console.log(`   Period: ${record.period_start}`);
      console.log('');
    });

    // Expected vs Actual comparison
    console.log('\n📊 EXPECTED vs ACTUAL:\n');
    console.log(`Expected Faro 2024: 2.505 tCO2e`);
    console.log(`Database total: ${(totalEmissions / 1000).toFixed(3)} tCO2e`);
    console.log(`Dashboard shows: 2562 tCO2e`);
    console.log(`Difference factor: ${(2562 / (totalEmissions / 1000)).toFixed(0)}x`);

    if (Math.abs(2562 / (totalEmissions / 1000) - 1000) < 50) {
      console.log('\n🎯 DIAGNOSIS: Dashboard is multiplying by 1000 instead of dividing by 1000');
      console.log('   OR: Dashboard is treating kg values as if they were tons');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

debugDashboardUnits();