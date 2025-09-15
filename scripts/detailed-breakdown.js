const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function detailedBreakdown() {
  console.log('📊 DETAILED EMISSIONS BREAKDOWN BY SITE AND METRIC\n');
  console.log('=' .repeat(80));

  try {
    // Get all sites
    const { data: sites } = await supabase
      .from('sites')
      .select('*')
      .order('name');

    // For each site, get detailed breakdown
    for (const site of sites || []) {
      console.log(`\n\n${'='.repeat(80)}`);
      console.log(`📍 ${site.name.toUpperCase()}`);
      console.log(`${'='.repeat(80)}`);

      // Get all years available for this site
      const { data: yearsData } = await supabase
        .from('metrics_data')
        .select('period_start')
        .eq('site_id', site.id);

      const years = [...new Set(yearsData?.map(d =>
        new Date(d.period_start).getFullYear()
      ) || [])].sort();

      for (const year of years) {
        console.log(`\n📅 Year: ${year}`);
        console.log('-'.repeat(60));

        // Get all data for this site and year
        const { data: metricsData } = await supabase
          .from('metrics_data')
          .select(`
            *,
            metrics_catalog (
              name, code, category, subcategory, scope,
              emission_factor, emission_factor_unit
            )
          `)
          .eq('site_id', site.id)
          .gte('period_start', `${year}-01-01`)
          .lte('period_end', `${year}-12-31`)
          .order('metrics_catalog(category)', { ascending: true });

        if (!metricsData || metricsData.length === 0) {
          console.log('  No data for this year');
          continue;
        }

        // Group by metric category and name
        const breakdown = {};
        let totalEmissions = 0;

        metricsData.forEach(record => {
          const category = record.metrics_catalog?.category || 'Other';
          const metricName = record.metrics_catalog?.name || 'Unknown';
          const scope = record.metrics_catalog?.scope || '';

          if (!breakdown[category]) {
            breakdown[category] = {};
          }

          if (!breakdown[category][metricName]) {
            breakdown[category][metricName] = {
              scope: scope,
              totalValue: 0,
              unit: record.unit,
              emissions: 0,
              emissionFactor: record.metrics_catalog?.emission_factor,
              emissionFactorUnit: record.metrics_catalog?.emission_factor_unit,
              months: 0
            };
          }

          breakdown[category][metricName].totalValue += record.value || 0;
          breakdown[category][metricName].emissions += (record.co2e_emissions || 0) / 1000; // Convert to tons
          breakdown[category][metricName].months++;
          totalEmissions += (record.co2e_emissions || 0) / 1000;
        });

        // Display breakdown
        console.log('\nMetric'.padEnd(35) + 'Scope'.padEnd(10) + 'Total Value'.padEnd(15) + 'Unit'.padEnd(10) + 'tCO2e'.padEnd(12) + 'EF');
        console.log('-'.repeat(95));

        Object.entries(breakdown)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .forEach(([category, metrics]) => {
            console.log(`\n${category}:`);

            Object.entries(metrics)
              .sort((a, b) => b[1].emissions - a[1].emissions) // Sort by emissions descending
              .forEach(([name, data]) => {
                const nameStr = `  ${name}`.padEnd(35);
                const scopeStr = data.scope.replace('scope_', 'S').padEnd(10);
                const valueStr = data.totalValue.toFixed(1).padEnd(15);
                const unitStr = data.unit.padEnd(10);
                const emissionsStr = data.emissions.toFixed(3).padEnd(12);
                const efStr = data.emissionFactor ?
                  `${data.emissionFactor} ${data.emissionFactorUnit || ''}` :
                  'N/A';

                console.log(nameStr + scopeStr + valueStr + unitStr + emissionsStr + efStr);
              });
          });

        console.log('\n' + '-'.repeat(95));
        console.log('TOTAL'.padEnd(35) + ''.padEnd(10) + ''.padEnd(15) + ''.padEnd(10) + totalEmissions.toFixed(3).padEnd(12));

        // Show percentage breakdown by scope
        const scopeTotals = { scope_1: 0, scope_2: 0, scope_3: 0 };
        Object.values(breakdown).forEach(metrics => {
          Object.values(metrics).forEach(data => {
            if (data.scope && scopeTotals.hasOwnProperty(data.scope)) {
              scopeTotals[data.scope] += data.emissions;
            }
          });
        });

        console.log('\n📊 Scope Breakdown:');
        console.log(`  Scope 1: ${scopeTotals.scope_1.toFixed(3)} tCO2e (${((scopeTotals.scope_1/totalEmissions)*100).toFixed(1)}%)`);
        console.log(`  Scope 2: ${scopeTotals.scope_2.toFixed(3)} tCO2e (${((scopeTotals.scope_2/totalEmissions)*100).toFixed(1)}%)`);
        console.log(`  Scope 3: ${scopeTotals.scope_3.toFixed(3)} tCO2e (${((scopeTotals.scope_3/totalEmissions)*100).toFixed(1)}%)`);

        // Top 5 contributors
        const allMetrics = [];
        Object.entries(breakdown).forEach(([category, metrics]) => {
          Object.entries(metrics).forEach(([name, data]) => {
            allMetrics.push({ name, category, emissions: data.emissions });
          });
        });

        console.log('\n🎯 Top 5 Emission Sources:');
        allMetrics
          .sort((a, b) => b.emissions - a.emissions)
          .slice(0, 5)
          .forEach((metric, index) => {
            const percentage = ((metric.emissions/totalEmissions)*100).toFixed(1);
            console.log(`  ${index + 1}. ${metric.name}: ${metric.emissions.toFixed(3)} tCO2e (${percentage}%)`);
          });
      }
    }

    // Overall summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📈 GRAND TOTAL SUMMARY');
    console.log('='.repeat(80));

    const { data: allData } = await supabase
      .from('metrics_data')
      .select(`
        co2e_emissions,
        period_start,
        site_id,
        metrics_catalog (
          scope
        )
      `);

    // Calculate totals by year
    const yearlyTotals = {};
    const siteTotals = {};
    const scopeTotals = { scope_1: 0, scope_2: 0, scope_3: 0 };

    allData?.forEach(record => {
      const year = new Date(record.period_start).getFullYear();
      const emissions = (record.co2e_emissions || 0) / 1000;

      if (!yearlyTotals[year]) yearlyTotals[year] = 0;
      yearlyTotals[year] += emissions;

      const site = sites?.find(s => s.id === record.site_id);
      if (site) {
        if (!siteTotals[site.name]) siteTotals[site.name] = 0;
        siteTotals[site.name] += emissions;
      }

      const scope = record.metrics_catalog?.scope;
      if (scope && scopeTotals.hasOwnProperty(scope)) {
        scopeTotals[scope] += emissions;
      }
    });

    console.log('\n📅 Emissions by Year:');
    Object.entries(yearlyTotals)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([year, total]) => {
        console.log(`  ${year}: ${total.toFixed(3)} tCO2e`);
      });

    console.log('\n📍 Emissions by Site (All Years):');
    Object.entries(siteTotals)
      .sort((a, b) => b[1] - a[1])
      .forEach(([site, total]) => {
        console.log(`  ${site}: ${total.toFixed(3)} tCO2e`);
      });

    const grandTotal = Object.values(scopeTotals).reduce((sum, val) => sum + val, 0);
    console.log('\n🌍 Total Emissions by Scope (All Years):');
    console.log(`  Scope 1: ${scopeTotals.scope_1.toFixed(3)} tCO2e (${((scopeTotals.scope_1/grandTotal)*100).toFixed(1)}%)`);
    console.log(`  Scope 2: ${scopeTotals.scope_2.toFixed(3)} tCO2e (${((scopeTotals.scope_2/grandTotal)*100).toFixed(1)}%)`);
    console.log(`  Scope 3: ${scopeTotals.scope_3.toFixed(3)} tCO2e (${((scopeTotals.scope_3/grandTotal)*100).toFixed(1)}%)`);
    console.log(`  TOTAL: ${grandTotal.toFixed(3)} tCO2e`);

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

detailedBreakdown();