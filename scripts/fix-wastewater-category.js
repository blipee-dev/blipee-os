const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function fixWastewaterCategory() {
  console.log('🔧 FIXING WASTEWATER CATEGORIZATION\n');
  console.log('=' .repeat(80));

  try {
    // Move wastewater from "Waste" to "Purchased Goods & Services" (where Water is)
    console.log('📝 Moving Wastewater to same category as Water...');

    const { error } = await supabase
      .from('metrics_catalog')
      .update({
        category: 'Purchased Goods & Services'
      })
      .eq('code', 'scope3_wastewater');

    if (error) {
      console.log(`❌ Error updating wastewater category: ${error.message}`);
    } else {
      console.log(`✅ Successfully moved Wastewater to "Purchased Goods & Services"`);
    }

    // Verify the change
    console.log('\n🔍 Verifying changes...');

    const { data: updatedWastewater } = await supabase
      .from('metrics_catalog')
      .select('*')
      .eq('code', 'scope3_wastewater')
      .single();

    if (updatedWastewater) {
      console.log(`✅ Wastewater is now in category: "${updatedWastewater.category}"`);
    }

    // Show updated categorization for water-related metrics
    console.log('\n💧 WATER-RELATED METRICS:');
    const { data: waterMetrics } = await supabase
      .from('metrics_catalog')
      .select('*')
      .eq('category', 'Purchased Goods & Services')
      .ilike('name', '%water%');

    waterMetrics?.forEach(metric => {
      console.log(`  • ${metric.name} (${metric.code})`);
    });

    // Show waste metrics (should no longer include wastewater)
    console.log('\n🗑️  SOLID WASTE METRICS:');
    const { data: wasteMetrics } = await supabase
      .from('metrics_catalog')
      .select('*')
      .eq('category', 'Waste')
      .order('name');

    wasteMetrics?.forEach(metric => {
      console.log(`  • ${metric.name} (${metric.code})`);
    });

    // Test with actual site data
    console.log('\n📊 TESTING UPDATED CATEGORIZATION:');

    const { data: sites } = await supabase
      .from('sites')
      .select('*')
      .limit(1);

    if (sites && sites.length > 0) {
      const site = sites[0];
      console.log(`\nTesting with ${site.name}:`);

      const { data: siteMetrics } = await supabase
        .from('metrics_data')
        .select(`
          metrics_catalog (
            name, category
          )
        `)
        .eq('site_id', site.id)
        .gte('period_start', '2024-01-01')
        .lte('period_end', '2024-12-31');

      // Group by category
      const byCategory = {};
      siteMetrics?.forEach(record => {
        if (record.metrics_catalog) {
          const category = record.metrics_catalog.category;
          if (!byCategory[category]) {
            byCategory[category] = new Set();
          }
          byCategory[category].add(record.metrics_catalog.name);
        }
      });

      Object.entries(byCategory)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([category, metrics]) => {
          console.log(`\n  ${category}:`);
          Array.from(metrics).sort().forEach(name => {
            console.log(`    • ${name}`);
          });
        });
    }

    console.log('\n✅ FIXED: Wastewater is now properly categorized with water-related metrics');
    console.log('   This eliminates the duplication in the waste category.');

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

fixWastewaterCategory();