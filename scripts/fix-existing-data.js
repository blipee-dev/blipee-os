const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

// Your exact data for 2024
const exactData2024 = {
  'Faro': {
    'Electricity': { value: 5858.78, unit: 'kWh', emissions: 1.52 },
    'Water': { value: 1193, unit: 'm³', emissions: 0.381 },
    'Waste': { value: 1.26, unit: 'tons', emissions: 0.604 }
  },
  'Lisboa': {
    'Electricity': { value: 589045, unit: 'kWh', emissions: 153.152 },
    'Water': { value: 8456, unit: 'm³', emissions: 2.702 },
    'Waste': { value: 45.8, unit: 'tons', emissions: 21.984 }
  },
  'Porto': {
    'Electricity': { value: 85460, unit: 'kWh', emissions: 22.22 },
    'Water': { value: 3250, unit: 'm³', emissions: 1.04 },
    'Waste': { value: 8.9, unit: 'tons', emissions: 4.272 }
  }
};

async function fixExistingData() {
  console.log('🔧 FIXING EXISTING DATA TO MATCH PROVIDED VALUES\n');
  console.log('=' .repeat(80));

  try {
    // Get sites
    const { data: sites } = await supabase
      .from('sites')
      .select('*');

    const siteMap = {};
    sites?.forEach(site => {
      if (site.name.includes('Lisboa')) siteMap['Lisboa'] = site.id;
      else if (site.name.includes('Porto')) siteMap['Porto'] = site.id;
      else if (site.name.includes('Faro')) siteMap['Faro'] = site.id;
    });

    // Process each site
    for (const [siteName, siteData] of Object.entries(exactData2024)) {
      const siteId = siteMap[siteName];
      if (!siteId) {
        console.log(`❌ Site ${siteName} not found`);
        continue;
      }

      console.log(`\n📍 Processing ${siteName}`);
      console.log('-'.repeat(40));

      // Process each metric type
      for (const [metricType, targetData] of Object.entries(siteData)) {
        console.log(`\n  📊 ${metricType}:`);

        // Find the corresponding metric in the database
        let metricQuery = supabase
          .from('metrics_data')
          .select(`
            *,
            metrics_catalog (
              name, category, emission_factor
            )
          `)
          .eq('site_id', siteId)
          .gte('period_start', '2024-01-01')
          .lte('period_end', '2024-12-31');

        // Map metric types to actual categories/names in database
        if (metricType === 'Electricity') {
          metricQuery = metricQuery.eq('metrics_catalog.category', 'Electricity');
        } else if (metricType === 'Water') {
          metricQuery = metricQuery.ilike('metrics_catalog.name', '%water supply%');
        } else if (metricType === 'Waste') {
          // For waste, we need to handle multiple waste types
          metricQuery = metricQuery.in('metrics_catalog.category', ['Waste']);
        }

        const { data: metricData, error } = await metricQuery;

        if (error) {
          console.log(`    ❌ Error querying: ${error.message}`);
          continue;
        }

        if (!metricData || metricData.length === 0) {
          console.log(`    ❌ No data found for ${metricType}`);
          continue;
        }

        // Calculate current totals
        const currentTotal = metricData.reduce((sum, d) => sum + (d.value || 0), 0);
        const currentEmissions = metricData.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) / 1000;

        console.log(`    Current: ${currentTotal} ${targetData.unit} = ${currentEmissions.toFixed(3)} tCO2e`);
        console.log(`    Target:  ${targetData.value} ${targetData.unit} = ${targetData.emissions} tCO2e`);

        // For waste, we need special handling since it's split across multiple types
        if (metricType === 'Waste') {
          // Group waste data by type
          const wasteByType = {};
          metricData.forEach(record => {
            const wasteName = record.metrics_catalog?.name || 'Unknown';
            if (!wasteByType[wasteName]) {
              wasteByType[wasteName] = [];
            }
            wasteByType[wasteName].push(record);
          });

          // Calculate proportional distribution
          const totalWasteValue = targetData.value;
          const wasteTypes = Object.keys(wasteByType);

          // Distribute the total waste value proportionally
          if (wasteTypes.length > 0) {
            const valuePerType = totalWasteValue / wasteTypes.length;

            console.log(`    Distributing ${totalWasteValue} tons across ${wasteTypes.length} waste types`);

            for (const [wasteName, records] of Object.entries(wasteByType)) {
              const monthlyValue = valuePerType / records.length;

              // Update each record
              for (const record of records) {
                const emissionFactor = record.metrics_catalog?.emission_factor || 0;
                const newCO2e = monthlyValue * emissionFactor;

                const { error: updateError } = await supabase
                  .from('metrics_data')
                  .update({
                    value: monthlyValue,
                    co2e_emissions: newCO2e
                  })
                  .eq('id', record.id);

                if (updateError) {
                  console.log(`      ❌ Failed to update ${wasteName}: ${updateError.message}`);
                }
              }

              console.log(`      ✓ Updated ${wasteName}: ${records.length} records`);
            }
          }
        } else {
          // For electricity and water, distribute the value across months
          const monthCount = metricData.length;
          const monthlyValue = targetData.value / monthCount;

          console.log(`    Distributing ${targetData.value} ${targetData.unit} across ${monthCount} months`);

          let updateCount = 0;
          for (const record of metricData) {
            const emissionFactor = record.metrics_catalog?.emission_factor || 0;
            const newCO2e = monthlyValue * emissionFactor;

            const { error: updateError } = await supabase
              .from('metrics_data')
              .update({
                value: monthlyValue,
                co2e_emissions: newCO2e
              })
              .eq('id', record.id);

            if (!updateError) {
              updateCount++;
            }
          }

          console.log(`    ✓ Updated ${updateCount} records`);
        }
      }
    }

    // Verify the updates
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 VERIFICATION OF UPDATED DATA');
    console.log('='.repeat(80));

    for (const [siteName, siteId] of Object.entries(siteMap)) {
      console.log(`\n📍 ${siteName} (2024):`);

      // Get updated totals
      const { data: updatedData } = await supabase
        .from('metrics_data')
        .select(`
          co2e_emissions,
          value,
          unit,
          metrics_catalog (
            name, category
          )
        `)
        .eq('site_id', siteId)
        .gte('period_start', '2024-01-01')
        .lte('period_end', '2024-12-31');

      // Group by category
      const categoryTotals = {};
      updatedData?.forEach(record => {
        const category = record.metrics_catalog?.category || 'Other';
        if (!categoryTotals[category]) {
          categoryTotals[category] = { value: 0, emissions: 0, unit: record.unit };
        }
        categoryTotals[category].value += record.value || 0;
        categoryTotals[category].emissions += (record.co2e_emissions || 0) / 1000;
      });

      // Display totals
      Object.entries(categoryTotals).forEach(([category, data]) => {
        console.log(`  ${category}: ${data.value.toFixed(1)} ${data.unit} = ${data.emissions.toFixed(3)} tCO2e`);
      });

      const totalEmissions = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.emissions, 0);
      console.log(`  TOTAL: ${totalEmissions.toFixed(3)} tCO2e`);

      // Compare with expected
      const expected = exactData2024[siteName];
      if (expected) {
        const expectedTotal = Object.values(expected).reduce((sum, m) => sum + m.emissions, 0);
        console.log(`  Expected: ${expectedTotal.toFixed(3)} tCO2e`);

        if (Math.abs(totalEmissions - expectedTotal) > 0.1) {
          console.log(`  ⚠️  Difference: ${(totalEmissions - expectedTotal).toFixed(3)} tCO2e`);
        } else {
          console.log(`  ✅ Match!`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

fixExistingData();