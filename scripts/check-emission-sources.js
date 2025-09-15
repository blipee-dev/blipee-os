const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function checkEmissionSources() {
  console.log('🔍 Checking Emission Factor Sources in Metrics Catalog\n');
  console.log('=' .repeat(80));

  try {
    // Get all metrics from catalog with their sources
    const { data: metrics, error } = await supabase
      .from('metrics_catalog')
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching metrics catalog:', error);
      return;
    }

    console.log(`Found ${metrics?.length || 0} metrics in catalog\n`);

    // Group by source for analysis
    const bySources = {};
    metrics?.forEach(metric => {
      const source = metric.emission_factor_source || 'No source specified';
      if (!bySources[source]) {
        bySources[source] = [];
      }
      bySources[source].push(metric);
    });

    // Display metrics grouped by source
    console.log('\n📚 EMISSION FACTORS BY SOURCE:\n');
    Object.entries(bySources).forEach(([source, sourceMetrics]) => {
      console.log(`\n${source} (${sourceMetrics.length} metrics)`);
      console.log('-'.repeat(60));

      // Show first few examples from each source
      sourceMetrics.slice(0, 5).forEach(metric => {
        console.log(`  • ${metric.name} (${metric.category})`);
        console.log(`    Factor: ${metric.emission_factor || 'NULL'} ${metric.emission_factor_unit || ''}`);
      });

      if (sourceMetrics.length > 5) {
        console.log(`  ... and ${sourceMetrics.length - 5} more`);
      }
    });

    // Check for key metrics relevant to the user's data
    console.log('\n\n🎯 KEY METRICS FOR VERIFICATION:\n');
    console.log('-'.repeat(60));

    const keyMetrics = [
      { name: 'electricity', category: 'Electricity' },
      { name: 'water', category: 'Purchased Goods & Services' },
      { name: 'waste', category: 'Waste' },
      { name: 'natural gas', category: 'Stationary Combustion' },
      { name: 'air travel', category: 'Business Travel' },
      { name: 'road travel', category: 'Business Travel' },
      { name: 'rail travel', category: 'Business Travel' },
      { name: 'hotel', category: 'Business Travel' }
    ];

    keyMetrics.forEach(({ name, category }) => {
      const metric = metrics?.find(m =>
        m.category === category &&
        m.name.toLowerCase().includes(name.toLowerCase())
      );

      if (metric) {
        console.log(`\n${metric.name}`);
        console.log(`  Category: ${metric.category}`);
        console.log(`  Code: ${metric.code}`);
        console.log(`  Unit: ${metric.unit}`);
        console.log(`  Emission Factor: ${metric.emission_factor} ${metric.emission_factor_unit || ''}`);
        console.log(`  Source: ${metric.emission_factor_source || 'Not specified'}`);
        console.log(`  Last Updated: ${metric.last_updated || 'Unknown'}`);
      }
    });

    // Check for Portugal-specific factors
    console.log('\n\n🇵🇹 PORTUGAL-SPECIFIC FACTORS:\n');
    console.log('-'.repeat(60));

    // For Portugal, electricity emission factor should be around 0.26 kgCO2/kWh (2024)
    const electricityMetrics = metrics?.filter(m =>
      m.category === 'Electricity' &&
      m.emission_factor !== null
    );

    electricityMetrics?.forEach(metric => {
      console.log(`\n${metric.name}`);
      console.log(`  Factor: ${metric.emission_factor} ${metric.emission_factor_unit}`);
      console.log(`  Source: ${metric.emission_factor_source || 'Not specified'}`);

      // Check if it's appropriate for Portugal
      if (metric.name.includes('Grid')) {
        if (metric.emission_factor === 0.4) {
          console.log(`  ⚠️  Note: 0.4 kgCO2/kWh is EU average. Portugal 2024 is ~0.26 kgCO2/kWh`);
        }
      }
    });

    // Summary of sources used
    console.log('\n\n📊 SUMMARY OF SOURCES:\n');
    console.log('-'.repeat(60));
    Object.entries(bySources).forEach(([source, sourceMetrics]) => {
      console.log(`${source}: ${sourceMetrics.length} metrics`);
    });

    // Check for missing sources
    const missingSource = metrics?.filter(m => !m.emission_factor_source && m.emission_factor !== null) || [];
    if (missingSource.length > 0) {
      console.log(`\n⚠️  ${missingSource.length} metrics have emission factors but no source specified`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkEmissionSources();