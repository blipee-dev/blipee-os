const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

// Your exact 2024 data with correct emission factors
const exactData2024 = {
  'Faro': {
    'Electricity': { value: 5858.78, unit: 'kWh', emissions: 1.52, emissionFactor: 0.26 },
    'Water': { value: 1193, unit: 'm³', emissions: 0.381, emissionFactor: 0.32 },
    'Waste': { value: 1.26, unit: 'tons', emissions: 0.604, emissionFactor: 480 }
  },
  'Lisboa': {
    'Electricity': { value: 589045, unit: 'kWh', emissions: 153.152, emissionFactor: 0.26 },
    'Water': { value: 8456, unit: 'm³', emissions: 2.702, emissionFactor: 0.32 },
    'Waste': { value: 45.8, unit: 'tons', emissions: 21.984, emissionFactor: 480 }
  },
  'Porto': {
    'Electricity': { value: 85460, unit: 'kWh', emissions: 22.22, emissionFactor: 0.26 },
    'Water': { value: 3250, unit: 'm³', emissions: 1.04, emissionFactor: 0.32 },
    'Waste': { value: 8.9, unit: 'tons', emissions: 4.272, emissionFactor: 480 }
  }
};

async function setExactValues() {
  console.log('🎯 SETTING EXACT VALUES TO MATCH PROVIDED DATA\n');
  console.log('=' .repeat(80));

  try {
    // Get sites
    const { data: sites } = await supabase.from('sites').select('*');
    const siteMap = {};
    sites?.forEach(site => {
      if (site.name.includes('Lisboa')) siteMap['Lisboa'] = site.id;
      else if (site.name.includes('Porto')) siteMap['Porto'] = site.id;
      else if (site.name.includes('Faro')) siteMap['Faro'] = site.id;
    });

    for (const [siteName, siteData] of Object.entries(exactData2024)) {
      const siteId = siteMap[siteName];
      console.log(`\n📍 ${siteName}`);
      console.log('-'.repeat(50));

      for (const [metricType, targetData] of Object.entries(siteData)) {
        console.log(`\n  📊 ${metricType}:`);

        // Get 2024 data for this metric type
        let query;
        if (metricType === 'Electricity') {
          query = supabase
            .from('metrics_data')
            .select('*')
            .eq('site_id', siteId)
            .ilike('metrics_catalog.name', '%electricity%')
            .gte('period_start', '2024-01-01')
            .lte('period_end', '2024-12-31');
        } else if (metricType === 'Water') {
          query = supabase
            .from('metrics_data')
            .select('*')
            .eq('site_id', siteId)
            .ilike('metrics_catalog.name', '%water%')
            .gte('period_start', '2024-01-01')
            .lte('period_end', '2024-12-31');
        } else if (metricType === 'Waste') {
          query = supabase
            .from('metrics_data')
            .select('*')
            .eq('site_id', siteId)
            .eq('metrics_catalog.category', 'Waste')
            .gte('period_start', '2024-01-01')
            .lte('period_end', '2024-12-31');
        }

        // First, let's use the RPC function to get the data with joins
        const { data: records } = await supabase.rpc('get_metrics_with_catalog', {
          site_id_param: siteId,
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        }).then(result => {
          if (result.error) {
            // Fallback to direct query
            return supabase
              .from('metrics_data')
              .select(`
                *,
                metrics_catalog!inner (
                  name, category
                )
              `)
              .eq('site_id', siteId)
              .gte('period_start', '2024-01-01')
              .lte('period_end', '2024-12-31');
          }
          return result;
        });

        if (!records || records.length === 0) {
          console.log(`    ❌ No records found`);
          continue;
        }

        // Filter records based on metric type
        let filteredRecords = [];
        if (metricType === 'Electricity') {
          filteredRecords = records.filter(r =>
            r.metrics_catalog?.name?.toLowerCase().includes('electricity') ||
            r.metrics_catalog?.category?.toLowerCase().includes('electricity')
          );
        } else if (metricType === 'Water') {
          filteredRecords = records.filter(r =>
            r.metrics_catalog?.name?.toLowerCase().includes('water')
          );
        } else if (metricType === 'Waste') {
          filteredRecords = records.filter(r =>
            r.metrics_catalog?.category?.toLowerCase().includes('waste')
          );
        }

        if (filteredRecords.length === 0) {
          console.log(`    ❌ No filtered records found for ${metricType}`);
          continue;
        }

        console.log(`    Found ${filteredRecords.length} records`);

        // Calculate monthly distribution
        const monthlyValue = targetData.value / filteredRecords.length;
        const monthlyEmissions = (targetData.emissions * 1000) / filteredRecords.length; // Convert to kg

        console.log(`    Monthly value: ${monthlyValue.toFixed(4)} ${targetData.unit}`);
        console.log(`    Monthly emissions: ${monthlyEmissions.toFixed(2)} kg CO2e`);

        // Update each record
        let updateCount = 0;
        for (const record of filteredRecords) {
          const { error } = await supabase
            .from('metrics_data')
            .update({
              value: monthlyValue,
              co2e_emissions: monthlyEmissions
            })
            .eq('id', record.id);

          if (!error) {
            updateCount++;
          } else {
            console.log(`      ❌ Update error: ${error.message}`);
          }
        }

        console.log(`    ✅ Updated ${updateCount}/${filteredRecords.length} records`);
      }
    }

    // Final verification
    console.log('\n\n' + '='.repeat(80));
    console.log('🔍 FINAL VERIFICATION');
    console.log('='.repeat(80));

    for (const [siteName, siteId] of Object.entries(siteMap)) {
      console.log(`\n📍 ${siteName}:`);

      // Get all 2024 data for this site
      const { data: allData } = await supabase
        .from('metrics_data')
        .select('co2e_emissions')
        .eq('site_id', siteId)
        .gte('period_start', '2024-01-01')
        .lte('period_end', '2024-12-31');

      const totalEmissions = allData?.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) / 1000 || 0;
      const expectedTotal = Object.values(exactData2024[siteName] || {}).reduce((sum, m) => sum + m.emissions, 0);

      console.log(`  Actual: ${totalEmissions.toFixed(3)} tCO2e`);
      console.log(`  Expected: ${expectedTotal.toFixed(3)} tCO2e`);

      if (Math.abs(totalEmissions - expectedTotal) < 0.1) {
        console.log(`  ✅ MATCH!`);
      } else {
        console.log(`  ⚠️  Difference: ${(totalEmissions - expectedTotal).toFixed(3)} tCO2e`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

setExactValues();