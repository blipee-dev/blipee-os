const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function checkDataYears() {
  console.log('📅 Checking Data Availability by Year and Site\n');
  console.log('=' .repeat(80));

  try {
    // Get all sites
    const { data: sites } = await supabase
      .from('sites')
      .select('*')
      .order('name');

    console.log(`Found ${sites?.length || 0} sites\n`);

    // For each site, check what years have data
    for (const site of sites || []) {
      console.log(`\n📍 ${site.name} (${site.id})`);
      console.log('-'.repeat(40));

      // Get all data for this site
      const { data: siteData } = await supabase
        .from('metrics_data')
        .select('period_start, period_end, co2e_emissions')
        .eq('site_id', site.id)
        .order('period_start');

      if (!siteData || siteData.length === 0) {
        console.log('  No data found');
        continue;
      }

      // Group by year
      const yearlyData = {};
      siteData.forEach(record => {
        const year = new Date(record.period_start).getFullYear();
        if (!yearlyData[year]) {
          yearlyData[year] = {
            count: 0,
            emissions: 0
          };
        }
        yearlyData[year].count++;
        yearlyData[year].emissions += (record.co2e_emissions || 0) / 1000; // Convert to tons
      });

      // Display yearly summary
      Object.entries(yearlyData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([year, data]) => {
          console.log(`  ${year}: ${data.count} records, ${data.emissions.toFixed(3)} tCO2e`);
        });
    }

    // Overall summary
    console.log('\n\n📊 OVERALL SUMMARY:');
    console.log('=' .repeat(80));

    // Get all data grouped by year
    const { data: allData } = await supabase
      .from('metrics_data')
      .select('period_start, co2e_emissions, site_id');

    const yearlyTotals = {};
    const siteYearlyTotals = {};

    allData?.forEach(record => {
      const year = new Date(record.period_start).getFullYear();

      if (!yearlyTotals[year]) {
        yearlyTotals[year] = 0;
      }
      yearlyTotals[year] += (record.co2e_emissions || 0) / 1000;

      // Track by site and year
      const site = sites?.find(s => s.id === record.site_id);
      if (site) {
        const key = `${site.name}_${year}`;
        if (!siteYearlyTotals[key]) {
          siteYearlyTotals[key] = 0;
        }
        siteYearlyTotals[key] += (record.co2e_emissions || 0) / 1000;
      }
    });

    console.log('\nTotal Emissions by Year:');
    Object.entries(yearlyTotals)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([year, total]) => {
        console.log(`  ${year}: ${total.toFixed(3)} tCO2e`);
      });

    // Check specific 2024 data
    console.log('\n\n🎯 2024 DATA DETAIL:');
    console.log('-'.repeat(40));

    for (const site of sites || []) {
      const key = `${site.name}_2024`;
      if (siteYearlyTotals[key]) {
        console.log(`  ${site.name}: ${siteYearlyTotals[key].toFixed(3)} tCO2e`);
      }
    }

    // Check for any data anomalies
    console.log('\n\n⚠️  DATA QUALITY CHECK:');
    console.log('-'.repeat(40));

    // Find records with very high emissions (>100 tCO2e per record)
    const { data: highEmitters } = await supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          name, category, emission_factor, emission_factor_unit
        ),
        sites (
          name
        )
      `)
      .gt('co2e_emissions', 100000) // 100 tons in kg
      .order('co2e_emissions', { ascending: false })
      .limit(10);

    if (highEmitters && highEmitters.length > 0) {
      console.log('\nRecords with emissions > 100 tCO2e:');
      highEmitters.forEach(record => {
        const emissions = (record.co2e_emissions / 1000).toFixed(1);
        console.log(`  ${record.sites?.name} - ${record.metrics_catalog?.name}: ${emissions} tCO2e`);
        console.log(`    Value: ${record.value} ${record.unit}`);
        console.log(`    Period: ${record.period_start}`);
      });
    } else {
      console.log('  No anomalous high-emission records found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkDataYears();