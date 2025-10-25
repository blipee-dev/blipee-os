require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyzeScope2Details() {
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('name', 'PLMJ')
    .single();

  // Get all Scope 2 metrics for 2024
  const { data: scope2Metrics } = await supabase
    .from('metrics_data')
    .select(`
      value,
      unit,
      co2e_emissions,
      period_start,
      period_end,
      metrics_catalog (
        name,
        scope,
        category,
        subcategory,
        description,
        unit
      )
    `)
    .eq('organization_id', org?.id)
    .eq('metrics_catalog.scope', 'scope_2')
    .not('co2e_emissions', 'is', null)
    .gt('co2e_emissions', 0)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31')
    .order('co2e_emissions', { ascending: false });

  console.log('📊 Scope 2 Emissions Breakdown (2024):');
  console.log('========================================');
  console.log('Total Scope 2 metrics found:', scope2Metrics?.length || 0);

  // Group by metric name
  const metricGroups = {};
  let totalEmissions = 0;

  scope2Metrics?.forEach(item => {
    const name = item.metrics_catalog?.name || 'Unknown';
    const emissions = item.co2e_emissions || 0;

    if (!metricGroups[name]) {
      metricGroups[name] = {
        emissions: 0,
        count: 0,
        category: item.metrics_catalog?.category,
        subcategory: item.metrics_catalog?.subcategory,
        unit: item.unit || item.metrics_catalog?.unit,
        totalValue: 0,
        description: item.metrics_catalog?.description
      };
    }

    metricGroups[name].emissions += emissions;
    metricGroups[name].count += 1;
    metricGroups[name].totalValue += item.value || 0;
    totalEmissions += emissions;
  });

  console.log('\n🔌 Scope 2 Components:');
  console.log('------------------------');

  // Sort by emissions and display
  Object.entries(metricGroups)
    .sort(([,a], [,b]) => b.emissions - a.emissions)
    .forEach(([name, data]) => {
      const percentage = ((data.emissions / totalEmissions) * 100).toFixed(1);
      console.log(`\n• ${name}`);
      console.log(`  Emissions: ${(data.emissions/1000).toFixed(2)} tCO2e (${percentage}%)`);
      console.log(`  Category: ${data.category || 'N/A'}`);
      if (data.subcategory) console.log(`  Subcategory: ${data.subcategory}`);
      if (data.description) console.log(`  Description: ${data.description}`);
      console.log(`  Data points: ${data.count}`);
      if (data.totalValue > 0) {
        console.log(`  Total consumption: ${Math.round(data.totalValue).toLocaleString()} ${data.unit || 'units'}`);
      }
    });

  console.log('\n📈 Summary:');
  console.log('Total Scope 2 emissions:', (totalEmissions/1000).toFixed(2), 'tCO2e');
  console.log('Estimated total electricity:', Math.round(totalEmissions/0.4).toLocaleString(), 'kWh');

  // Sample some actual data points
  console.log('\n📝 Sample monthly data (first 5):');
  scope2Metrics?.slice(0, 5).forEach(item => {
    const period = `${item.period_start?.substring(0,7)}`;
    console.log(`- ${period}: ${item.metrics_catalog?.name}`);
    console.log(`  ${item.value} ${item.unit || item.metrics_catalog?.unit} → ${(item.co2e_emissions/1000).toFixed(3)} tCO2e`);
  });
}

analyzeScope2Details().catch(console.error);