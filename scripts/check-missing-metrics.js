const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

// Expected metrics based on user's data
const expectedMetrics = {
  'Lisboa': [
    'Electricity',
    'Water',
    'Waste',
    'Natural Gas',
    'Paper',
    'Plane Travel',
    'Car Travel',
    'Train Travel',
    'Uber/Taxi',
    'Hotel Stays',
    'Purchased Cooling',
    'Purchased Heating',
    'E-Waste'
  ],
  'Porto': [
    'Electricity',
    'Water',
    'Waste',
    'Natural Gas',
    'Paper',
    'Plane Travel',
    'Car Travel',
    'Train Travel'
  ],
  'Faro': [
    'Electricity',
    'Water',
    'Waste',
    'Natural Gas',
    'Paper'
  ]
};

async function checkMissingMetrics() {
  console.log('🔍 CHECKING MISSING METRICS PER SITE\n');
  console.log('=' .repeat(80));

  try {
    // Get all sites
    const { data: sites } = await supabase
      .from('sites')
      .select('*')
      .order('name');

    // Get all available metrics from catalog
    const { data: metricsCatalog } = await supabase
      .from('metrics_catalog')
      .select('*')
      .order('category, name');

    console.log(`📚 Total metrics in catalog: ${metricsCatalog?.length || 0}\n`);

    // For each site, check what metrics they have data for
    for (const site of sites || []) {
      const siteName = site.name.includes('Lisboa') ? 'Lisboa' :
                       site.name.includes('Porto') ? 'Porto' :
                       site.name;

      console.log(`\n${'='.repeat(80)}`);
      console.log(`📍 ${site.name.toUpperCase()}`);
      console.log(`${'='.repeat(80)}`);

      // Get unique metrics for this site in 2024
      const { data: siteMetrics2024 } = await supabase
        .from('metrics_data')
        .select(`
          metric_id,
          metrics_catalog (
            name, category, code
          )
        `)
        .eq('site_id', site.id)
        .gte('period_start', '2024-01-01')
        .lte('period_end', '2024-12-31');

      // Get unique metrics
      const uniqueMetrics = new Map();
      siteMetrics2024?.forEach(record => {
        if (record.metrics_catalog) {
          uniqueMetrics.set(record.metric_id, record.metrics_catalog);
        }
      });

      console.log(`\n📊 Metrics with 2024 data (${uniqueMetrics.size} unique):`);
      const metricsByCategory = {};
      uniqueMetrics.forEach(metric => {
        const category = metric.category || 'Other';
        if (!metricsByCategory[category]) {
          metricsByCategory[category] = [];
        }
        metricsByCategory[category].push(metric.name);
      });

      Object.entries(metricsByCategory)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([category, metrics]) => {
          console.log(`\n  ${category}:`);
          metrics.forEach(name => {
            console.log(`    ✓ ${name}`);
          });
        });

      // Check against expected metrics
      const expected = expectedMetrics[siteName] || [];
      console.log(`\n📋 Expected metrics for ${siteName}: ${expected.length}`);
      console.log(`📈 Actual metrics with data: ${uniqueMetrics.size}`);

      // Find missing metrics
      console.log(`\n❌ MISSING EXPECTED METRICS:`);
      const foundMetricNames = Array.from(uniqueMetrics.values()).map(m => m.name.toLowerCase());

      const missing = [];
      expected.forEach(expectedMetric => {
        const found = foundMetricNames.some(name =>
          name.includes(expectedMetric.toLowerCase()) ||
          expectedMetric.toLowerCase().includes(name)
        );

        if (!found) {
          missing.push(expectedMetric);
        }
      });

      if (missing.length > 0) {
        missing.forEach(metric => {
          // Try to find it in the catalog
          const catalogMatch = metricsCatalog?.find(m =>
            m.name.toLowerCase().includes(metric.toLowerCase()) ||
            m.category?.toLowerCase().includes(metric.toLowerCase())
          );

          if (catalogMatch) {
            console.log(`  • ${metric} - EXISTS in catalog as "${catalogMatch.name}" (${catalogMatch.code})`);
          } else {
            console.log(`  • ${metric} - NOT FOUND in catalog`);
          }
        });
      } else {
        console.log(`  None - all expected metrics have data`);
      }

      // Additional metrics not in expected list
      console.log(`\n➕ ADDITIONAL METRICS (not in expected list):`);
      const additional = [];
      uniqueMetrics.forEach(metric => {
        const isExpected = expected.some(exp =>
          metric.name.toLowerCase().includes(exp.toLowerCase()) ||
          exp.toLowerCase().includes(metric.name.toLowerCase())
        );

        if (!isExpected) {
          additional.push(metric.name);
        }
      });

      if (additional.length > 0) {
        additional.forEach(metric => {
          console.log(`  • ${metric}`);
        });
      } else {
        console.log(`  None`);
      }
    }

    // Summary of what needs to be added
    console.log(`\n\n${'='.repeat(80)}`);
    console.log('📝 METRICS TO ADD TO DATABASE');
    console.log(`${'='.repeat(80)}`);

    // Check which expected metrics exist in catalog but have no data
    const metricsToAdd = {
      'Natural Gas': 'scope1_natural_gas',
      'Paper': null, // Need to find in catalog
      'Car Travel': 'scope3_business_travel_road',
      'Hotel Stays': 'scope3_hotel_nights',
      'Uber/Taxi': null // May need to use road travel
    };

    console.log('\nMetrics that exist in catalog but need data:');
    Object.entries(metricsToAdd).forEach(([name, code]) => {
      if (code) {
        const catalogEntry = metricsCatalog?.find(m => m.code === code);
        if (catalogEntry) {
          console.log(`  ✓ ${name}: Use "${catalogEntry.name}" (${code})`);
          console.log(`    Emission Factor: ${catalogEntry.emission_factor} ${catalogEntry.emission_factor_unit}`);
        }
      } else {
        console.log(`  ? ${name}: Need to identify correct catalog entry`);
      }
    });

    // Look for paper-related metrics
    console.log('\n🔍 Searching for Paper metrics in catalog:');
    const paperMetrics = metricsCatalog?.filter(m =>
      m.name.toLowerCase().includes('paper') ||
      m.category?.toLowerCase().includes('paper')
    );

    if (paperMetrics && paperMetrics.length > 0) {
      paperMetrics.forEach(metric => {
        console.log(`  • ${metric.name} (${metric.code}) - ${metric.category}`);
      });
    } else {
      console.log('  No paper-related metrics found in catalog');
    }

    // Look for taxi/uber metrics
    console.log('\n🔍 Searching for Taxi/Uber metrics in catalog:');
    const taxiMetrics = metricsCatalog?.filter(m =>
      m.name.toLowerCase().includes('taxi') ||
      m.name.toLowerCase().includes('uber') ||
      (m.category === 'Business Travel' && m.name.toLowerCase().includes('road'))
    );

    if (taxiMetrics && taxiMetrics.length > 0) {
      taxiMetrics.forEach(metric => {
        console.log(`  • ${metric.name} (${metric.code}) - ${metric.category}`);
      });
    } else {
      console.log('  Use "Road Travel" for taxi/uber');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkMissingMetrics();