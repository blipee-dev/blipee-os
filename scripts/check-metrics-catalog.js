const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function checkMetricsCatalog() {
  console.log('🔍 Checking Metrics Catalog Emission Factors\n');
  console.log('=' .repeat(80));

  try {
    // Get all metrics from catalog
    const { data: metrics, error } = await supabase
      .from('metrics_catalog')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching metrics catalog:', error);
      return;
    }

    console.log(`Found ${metrics?.length || 0} metrics in catalog\n`);

    // Group by category for better display
    const byCategory = {};
    metrics?.forEach(metric => {
      const category = metric.category || 'Uncategorized';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(metric);
    });

    // Display emission factors by category
    Object.entries(byCategory).forEach(([category, categoryMetrics]) => {
      console.log(`\n📊 ${category.toUpperCase()}`);
      console.log('-'.repeat(60));

      categoryMetrics.forEach(metric => {
        console.log(`\n  ${metric.name} (${metric.code})`);
        console.log(`    Unit: ${metric.unit}`);
        console.log(`    Scope: ${metric.scope}`);
        console.log(`    Emission Factor: ${metric.emission_factor || 'NULL'} ${metric.emission_factor_unit || ''}`);

        if (metric.emission_factor) {
          // Calculate what 1 unit would produce in CO2
          const co2PerUnit = metric.emission_factor;
          console.log(`    → 1 ${metric.unit} = ${co2PerUnit} kg CO2e`);
        }
      });
    });

    // Check for metrics with very high emission factors
    console.log('\n\n⚠️  METRICS WITH HIGH EMISSION FACTORS (>1000 kg CO2/unit):');
    console.log('-'.repeat(60));

    const highEmitters = metrics?.filter(m => m.emission_factor > 1000) || [];
    if (highEmitters.length > 0) {
      highEmitters.forEach(metric => {
        console.log(`  ${metric.name}: ${metric.emission_factor} ${metric.emission_factor_unit || 'kg CO2'} per ${metric.unit}`);
      });
    } else {
      console.log('  None found');
    }

    // Check for metrics with missing emission factors
    console.log('\n\n❓ METRICS WITH MISSING EMISSION FACTORS:');
    console.log('-'.repeat(60));

    const missingFactors = metrics?.filter(m => !m.emission_factor) || [];
    if (missingFactors.length > 0) {
      missingFactors.forEach(metric => {
        console.log(`  ${metric.name} (${metric.category})`);
      });
    } else {
      console.log('  All metrics have emission factors');
    }

    // Sample check: What emission factor is being used for waste?
    console.log('\n\n🔍 DETAILED CHECK - WASTE METRICS:');
    console.log('-'.repeat(60));

    const wasteMetrics = metrics?.filter(m =>
      m.category?.toLowerCase().includes('waste') ||
      m.name?.toLowerCase().includes('waste')
    ) || [];

    wasteMetrics.forEach(metric => {
      console.log(`\n  ${metric.name}`);
      console.log(`    Code: ${metric.code}`);
      console.log(`    Unit: ${metric.unit}`);
      console.log(`    Emission Factor: ${metric.emission_factor}`);
      console.log(`    Emission Factor Unit: ${metric.emission_factor_unit || 'kg CO2/unit'}`);

      // Check against expected value
      const expectedWasteEF = 480; // kg CO2 per ton from user's data
      if (metric.unit === 'tons' && metric.emission_factor) {
        const diff = metric.emission_factor - expectedWasteEF;
        if (Math.abs(diff) > 100) {
          console.log(`    ⚠️  DISCREPANCY: Expected ~${expectedWasteEF} kg CO2/ton, got ${metric.emission_factor}`);
        }
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkMetricsCatalog();