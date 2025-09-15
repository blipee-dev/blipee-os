const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

// Expected data from user's tables
const expectedData = {
  'Faro': {
    '2024': {
      'Electricity': { value: 5858.78, unit: 'kWh', emissions: 1.52 },
      'Water': { value: 1193, unit: 'm³', emissions: 0.381 },
      'Waste': { value: 1.26, unit: 'tons', emissions: 0.604 },
      'Natural Gas': { value: 10512, unit: 'kWh', emissions: 2.103 },
      'Paper': { value: 0.875, unit: 'tons', emissions: 0.84 },
      'Plane Travel': { value: 16500, unit: 'km', emissions: 1.815 },
      'Car Travel': { value: 35900, unit: 'km', emissions: 5.744 },
      'Train Travel': { value: 1200, unit: 'km', emissions: 0.024 },
      'Uber/Taxi': { value: 850, unit: 'km', emissions: 0.153 },
      'Hotel Stays': { value: 120, unit: 'nights', emissions: 1.2 },
      'total': 18.166
    }
  },
  'Lisboa': {
    '2024': {
      'Electricity': { value: 589045, unit: 'kWh', emissions: 153.152 },
      'Water': { value: 8456, unit: 'm³', emissions: 2.702 },
      'Waste': { value: 45.8, unit: 'tons', emissions: 21.984 },
      'Natural Gas': { value: 156789, unit: 'kWh', emissions: 31.358 },
      'Paper': { value: 12.5, unit: 'tons', emissions: 12 },
      'Plane Travel': { value: 2285000, unit: 'km', emissions: 251.35 },
      'Car Travel': { value: 125600, unit: 'km', emissions: 20.096 },
      'Train Travel': { value: 8900, unit: 'km', emissions: 0.178 },
      'Uber/Taxi': { value: 4580, unit: 'km', emissions: 0.824 },
      'Hotel Stays': { value: 890, unit: 'nights', emissions: 8.9 },
      'total': 502.544
    }
  },
  'Porto': {
    '2024': {
      'Electricity': { value: 85460, unit: 'kWh', emissions: 22.22 },
      'Water': { value: 3250, unit: 'm³', emissions: 1.04 },
      'Waste': { value: 8.9, unit: 'tons', emissions: 4.272 },
      'Natural Gas': { value: 45678, unit: 'kWh', emissions: 9.136 },
      'Paper': { value: 3.2, unit: 'tons', emissions: 3.072 },
      'Plane Travel': { value: 145000, unit: 'km', emissions: 15.95 },
      'Car Travel': { value: 78900, unit: 'km', emissions: 12.624 },
      'Train Travel': { value: 3400, unit: 'km', emissions: 0.068 },
      'Uber/Taxi': { value: 2100, unit: 'km', emissions: 0.378 },
      'Hotel Stays': { value: 234, unit: 'nights', emissions: 2.34 },
      'total': 71.128
    }
  }
};

async function analyzeDiscrepancy() {
  console.log('🔍 Analyzing Emissions Data Discrepancy\n');
  console.log('=' .repeat(80));

  try {
    // Get all sites
    const { data: sites } = await supabase
      .from('sites')
      .select('*')
      .in('name', ['Lisboa', 'Porto', 'Faro']);

    const siteMap = new Map(sites?.map(s => [s.name, s.id]) || []);

    // Analyze each site
    for (const [siteName, siteData] of Object.entries(expectedData)) {
      const siteId = siteMap.get(siteName);
      if (!siteId) continue;

      console.log(`\n📍 ${siteName.toUpperCase()}\n${'-'.repeat(40)}`);

      for (const [year, yearData] of Object.entries(siteData)) {
        console.log(`\n📅 Year: ${year}`);

        const startDate = new Date(`${year}-01-01`);
        const endDate = new Date(`${year}-12-31`);

        // Get actual data from database
        const { data: actualData } = await supabase
          .from('metrics_data')
          .select(`
            *,
            metrics_catalog (
              name, category, subcategory, unit
            )
          `)
          .eq('site_id', siteId)
          .gte('period_start', startDate.toISOString())
          .lte('period_end', endDate.toISOString());

        // Group actual data by category
        const actualByCategory = {};
        let actualTotal = 0;

        actualData?.forEach(record => {
          const category = mapMetricToCategory(record.metrics_catalog?.name || record.metrics_catalog?.category);
          if (!actualByCategory[category]) {
            actualByCategory[category] = { value: 0, emissions: 0, unit: record.unit };
          }
          actualByCategory[category].value += record.value || 0;
          actualByCategory[category].emissions += (record.co2e_emissions || 0) / 1000; // Convert kg to tons
          actualTotal += (record.co2e_emissions || 0) / 1000;
        });

        // Compare expected vs actual
        console.log('\n📊 Comparison (Expected vs Actual):');
        console.log('Category'.padEnd(20) + 'Expected (tCO2e)'.padEnd(18) + 'Actual (tCO2e)'.padEnd(18) + 'Difference');
        console.log('-'.repeat(75));

        const expectedTotal = yearData.total;

        for (const [category, expected] of Object.entries(yearData)) {
          if (category === 'total') continue;

          const actual = actualByCategory[category] || { emissions: 0 };
          const diff = actual.emissions - expected.emissions;
          const diffStr = diff > 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3);

          console.log(
            category.padEnd(20) +
            expected.emissions.toFixed(3).padEnd(18) +
            actual.emissions.toFixed(3).padEnd(18) +
            diffStr
          );
        }

        console.log('-'.repeat(75));
        console.log(
          'TOTAL'.padEnd(20) +
          expectedTotal.toFixed(3).padEnd(18) +
          actualTotal.toFixed(3).padEnd(18) +
          (actualTotal - expectedTotal).toFixed(3)
        );

        // Check for anomalies
        if (Math.abs(actualTotal - expectedTotal) > 1000) {
          console.log('\n⚠️  MAJOR DISCREPANCY DETECTED!');
          console.log(`   Expected: ${expectedTotal.toFixed(3)} tCO2e`);
          console.log(`   Actual: ${actualTotal.toFixed(3)} tCO2e`);
          console.log(`   Difference: ${(actualTotal - expectedTotal).toFixed(3)} tCO2e`);

          // Find the biggest contributors
          const biggestDiffs = Object.entries(actualByCategory)
            .map(([cat, data]) => ({
              category: cat,
              emissions: data.emissions,
              expected: yearData[cat]?.emissions || 0,
              diff: data.emissions - (yearData[cat]?.emissions || 0)
            }))
            .filter(d => Math.abs(d.diff) > 10)
            .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

          if (biggestDiffs.length > 0) {
            console.log('\n   Biggest contributors to discrepancy:');
            biggestDiffs.forEach(d => {
              console.log(`   - ${d.category}: ${d.diff > 0 ? '+' : ''}${d.diff.toFixed(1)} tCO2e`);
            });
          }
        }

        // Sample problematic records
        if (actualTotal > expectedTotal * 10) {
          console.log('\n🔍 Sample High-Emission Records:');
          const highEmitters = actualData
            ?.filter(r => r.co2e_emissions > 1000000) // More than 1000 tons
            ?.slice(0, 3);

          highEmitters?.forEach(record => {
            console.log(`   ${record.metrics_catalog?.name}:`);
            console.log(`     Value: ${record.value} ${record.unit}`);
            console.log(`     Emissions: ${(record.co2e_emissions / 1000).toFixed(1)} tCO2e`);
            console.log(`     Emission Factor: ${record.emission_factor}`);
          });
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📋 SUMMARY OF FINDINGS:\n');

    // Calculate overall totals
    const { data: allData } = await supabase
      .from('metrics_data')
      .select('co2e_emissions')
      .gte('period_start', '2024-01-01')
      .lte('period_end', '2024-12-31');

    const totalActual = allData?.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) / 1000 || 0;
    const totalExpected = Object.values(expectedData).reduce((sum, site) =>
      sum + (site['2024']?.total || 0), 0);

    console.log(`Expected Total (2024): ${totalExpected.toFixed(3)} tCO2e`);
    console.log(`Actual Total (2024): ${totalActual.toFixed(3)} tCO2e`);
    console.log(`Discrepancy: ${(totalActual - totalExpected).toFixed(3)} tCO2e (${((totalActual / totalExpected - 1) * 100).toFixed(1)}%)`);

    if (totalActual > totalExpected * 100) {
      console.log('\n⚠️  CRITICAL: Emissions are inflated by more than 100x!');
      console.log('   Likely causes:');
      console.log('   1. Emission factors in wrong units (e.g., gCO2/kWh instead of kgCO2/kWh)');
      console.log('   2. Value units mismatched (e.g., Wh stored as kWh)');
      console.log('   3. Emission factor multiplication error');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

function mapMetricToCategory(metricName) {
  const mapping = {
    'electricity': 'Electricity',
    'water': 'Water',
    'waste': 'Waste',
    'natural_gas': 'Natural Gas',
    'paper': 'Paper',
    'plane': 'Plane Travel',
    'car': 'Car Travel',
    'train': 'Train Travel',
    'uber': 'Uber/Taxi',
    'taxi': 'Uber/Taxi',
    'hotel': 'Hotel Stays',
    'energy': 'Electricity'
  };

  const lowerName = metricName.toLowerCase();
  for (const [key, value] of Object.entries(mapping)) {
    if (lowerName.includes(key)) return value;
  }
  return metricName;
}

analyzeDiscrepancy();