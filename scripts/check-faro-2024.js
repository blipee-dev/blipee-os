const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function checkFaro2024() {
  console.log('🔍 Checking Faro site data for 2024...\n');

  try {
    // Get Faro site ID
    const { data: faroSite } = await supabase
      .from('sites')
      .select('*')
      .eq('name', 'Faro')
      .single();

    if (!faroSite) {
      console.log('❌ Faro site not found');
      return;
    }

    console.log('📍 Faro Site Details:');
    console.log(`  ID: ${faroSite.id}`);
    console.log(`  Name: ${faroSite.name}`);
    console.log(`  Type: ${faroSite.type}`);
    console.log(`  Organization: ${faroSite.organization_id}`);

    // Get 2024 data for Faro
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    const { data: metricsData, error } = await supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          name, code, scope, category, subcategory, unit
        )
      `)
      .eq('site_id', faroSite.id)
      .gte('period_start', startDate.toISOString())
      .lte('period_end', endDate.toISOString())
      .order('period_start');

    if (error) {
      console.error('Error fetching data:', error);
      return;
    }

    console.log(`\n📊 2024 Metrics Data for Faro: ${metricsData?.length || 0} records\n`);

    if (metricsData && metricsData.length > 0) {
      // Calculate totals by scope
      const scopeTotals = {
        scope_1: 0,
        scope_2: 0,
        scope_3: 0
      };

      // Calculate totals by category
      const categoryTotals = {};

      // Monthly breakdown
      const monthlyData = {};

      metricsData.forEach(record => {
        const emissions = record.co2e_emissions || 0;
        const scope = record.metrics_catalog?.scope;
        const category = record.metrics_catalog?.category;
        const month = new Date(record.period_start).toISOString().slice(0, 7); // YYYY-MM

        // Add to scope totals
        if (scope) {
          scopeTotals[scope] = (scopeTotals[scope] || 0) + emissions;
        }

        // Add to category totals
        if (category) {
          categoryTotals[category] = (categoryTotals[category] || 0) + emissions;
        }

        // Add to monthly totals
        if (!monthlyData[month]) {
          monthlyData[month] = { total: 0, records: 0 };
        }
        monthlyData[month].total += emissions;
        monthlyData[month].records += 1;
      });

      console.log('📈 EMISSIONS BY SCOPE (tCO2e):');
      console.log(`  Scope 1: ${(scopeTotals.scope_1 / 1000).toFixed(2)} tCO2e`);
      console.log(`  Scope 2: ${(scopeTotals.scope_2 / 1000).toFixed(2)} tCO2e`);
      console.log(`  Scope 3: ${(scopeTotals.scope_3 / 1000).toFixed(2)} tCO2e`);
      console.log(`  TOTAL: ${((scopeTotals.scope_1 + scopeTotals.scope_2 + scopeTotals.scope_3) / 1000).toFixed(2)} tCO2e`);

      console.log('\n📊 EMISSIONS BY CATEGORY (tCO2e):');
      Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10) // Top 10 categories
        .forEach(([category, total]) => {
          console.log(`  ${category}: ${(total / 1000).toFixed(2)} tCO2e`);
        });

      console.log('\n📅 MONTHLY BREAKDOWN:');
      Object.entries(monthlyData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([month, data]) => {
          console.log(`  ${month}: ${(data.total / 1000).toFixed(2)} tCO2e (${data.records} records)`);
        });

      // Sample detailed records
      console.log('\n📋 SAMPLE DETAILED RECORDS (first 5):');
      metricsData.slice(0, 5).forEach(record => {
        console.log(`\n  Metric: ${record.metrics_catalog?.name}`);
        console.log(`  Category: ${record.metrics_catalog?.category}`);
        console.log(`  Scope: ${record.metrics_catalog?.scope}`);
        console.log(`  Period: ${record.period_start} to ${record.period_end}`);
        console.log(`  Value: ${record.value} ${record.unit}`);
        console.log(`  CO2e: ${record.co2e_emissions} kg (${(record.co2e_emissions / 1000).toFixed(3)} tons)`);
      });

      // Check for any unusually high values
      const highEmitters = metricsData
        .filter(r => r.co2e_emissions > 1000000) // More than 1000 tons
        .sort((a, b) => b.co2e_emissions - a.co2e_emissions);

      if (highEmitters.length > 0) {
        console.log('\n⚠️  HIGH EMISSION RECORDS (>1000 tCO2e):');
        highEmitters.forEach(record => {
          console.log(`  ${record.metrics_catalog?.name}: ${(record.co2e_emissions / 1000).toFixed(0)} tCO2e`);
          console.log(`    Value: ${record.value} ${record.unit}`);
          console.log(`    Period: ${record.period_start}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkFaro2024();