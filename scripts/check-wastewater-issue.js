const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function checkWastewaterIssue() {
  console.log('🔍 INVESTIGATING WASTEWATER DUPLICATION ISSUE\n');
  console.log('=' .repeat(80));

  try {
    // Check all wastewater-related metrics in catalog
    const { data: wastewaterMetrics } = await supabase
      .from('metrics_catalog')
      .select('*')
      .ilike('name', '%wastewater%');

    console.log('💧 WASTEWATER METRICS IN CATALOG:');
    wastewaterMetrics?.forEach(metric => {
      console.log(`  • ${metric.name}`);
      console.log(`    Category: ${metric.category}`);
      console.log(`    Code: ${metric.code}`);
      console.log(`    Scope: ${metric.scope}`);
      console.log(`    Unit: ${metric.unit}`);
      console.log('');
    });

    // Check actual data usage
    console.log('📊 WASTEWATER DATA USAGE BY SITE:\n');

    const { data: sites } = await supabase
      .from('sites')
      .select('*');

    for (const site of sites || []) {
      console.log(`📍 ${site.name}:`);

      const { data: wastewaterData } = await supabase
        .from('metrics_data')
        .select(`
          *,
          metrics_catalog (
            name, category, code
          )
        `)
        .eq('site_id', site.id)
        .gte('period_start', '2024-01-01')
        .lte('period_end', '2024-12-31');

      // Filter for wastewater-related metrics
      const wastewaterRecords = wastewaterData?.filter(record =>
        record.metrics_catalog?.name?.toLowerCase().includes('wastewater')
      ) || [];

      if (wastewaterRecords.length > 0) {
        // Group by metric
        const byMetric = {};
        wastewaterRecords.forEach(record => {
          const key = `${record.metrics_catalog.name} (${record.metrics_catalog.category})`;
          if (!byMetric[key]) {
            byMetric[key] = [];
          }
          byMetric[key].push(record);
        });

        Object.entries(byMetric).forEach(([metricKey, records]) => {
          const totalValue = records.reduce((sum, r) => sum + (r.value || 0), 0);
          const totalEmissions = records.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0) / 1000;
          console.log(`  • ${metricKey}: ${records.length} records`);
          console.log(`    Total: ${totalValue.toFixed(1)} ${records[0].unit} = ${totalEmissions.toFixed(3)} tCO2e`);
        });
      } else {
        console.log(`  No wastewater data found`);
      }
      console.log('');
    }

    // The issue analysis
    console.log('🔍 ISSUE ANALYSIS:');
    console.log('=' .repeat(50));

    if (wastewaterMetrics && wastewaterMetrics.length > 1) {
      console.log('❌ PROBLEM: Multiple wastewater metrics in catalog');
      wastewaterMetrics.forEach((metric, index) => {
        console.log(`  ${index + 1}. "${metric.name}" in category "${metric.category}"`);
      });
    }

    // Check for incorrect categorization
    const wasteWastewaters = wastewaterMetrics?.filter(m => m.category === 'Waste') || [];
    if (wasteWastewaters.length > 0) {
      console.log('\n⚠️  CATEGORIZATION ISSUE:');
      console.log('   Wastewater is categorized as "Waste" but should probably be separate');

      wasteWastewaters.forEach(metric => {
        console.log(`   • "${metric.name}" (${metric.code}) is in "Waste" category`);
        console.log(`     Should this be in "Water" or separate "Wastewater" category?`);
      });
    }

    // Recommendation
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. Wastewater should be separate from solid waste categories');
    console.log('2. Consider moving wastewater to "Water" category or create separate "Wastewater" category');
    console.log('3. Wastewater treatment is different from solid waste management');

    // Show what the categories should be
    console.log('\n📋 SUGGESTED CATEGORIZATION:');
    console.log('Water-related:');
    console.log('  • Water consumption/supply');
    console.log('  • Wastewater treatment');
    console.log('');
    console.log('Waste-related (solid waste):');
    console.log('  • Waste to Landfill');
    console.log('  • Waste Incinerated');
    console.log('  • Waste Recycled');
    console.log('  • Waste Composted');
    console.log('  • E-Waste');

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkWastewaterIssue();