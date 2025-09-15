const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function recalculateEmissions() {
  console.log('🔧 Recalculating Emissions with Correct Factors\n');
  console.log('=' .repeat(80));

  try {
    // First get all metrics data with their catalog entries
    const { data: metricsData, error } = await supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          id, name, code, category, subcategory,
          emission_factor, emission_factor_unit, unit
        )
      `);

    if (error) {
      console.error('Error fetching metrics data:', error);
      return;
    }

    console.log(`Found ${metricsData?.length || 0} records to recalculate\n`);

    // Group by metric catalog ID to see what we're dealing with
    const byMetricType = {};
    metricsData?.forEach(record => {
      const metricId = record.metric_id;
      if (!byMetricType[metricId]) {
        byMetricType[metricId] = {
          metric: record.metrics_catalog,
          records: []
        };
      }
      byMetricType[metricId].records.push(record);
    });

    console.log('📊 Metrics Overview:');
    Object.values(byMetricType).forEach(({ metric, records }) => {
      if (metric) {
        console.log(`  ${metric.name}: ${records.length} records`);
        console.log(`    Emission Factor: ${metric.emission_factor} ${metric.emission_factor_unit || 'kgCO2e/' + metric.unit}`);
      }
    });

    // Recalculate emissions for each record
    console.log('\n🔄 Recalculating emissions...\n');

    let updateCount = 0;
    let errorCount = 0;
    const updates = [];

    for (const record of metricsData || []) {
      if (!record.metrics_catalog?.emission_factor) {
        continue; // Skip if no emission factor
      }

      const emissionFactor = record.metrics_catalog.emission_factor;
      const value = record.value || 0;
      let newCO2e = 0;

      // Calculate based on the unit matching
      if (record.metrics_catalog.emission_factor_unit?.includes('tCO2e')) {
        // Factor is in tons, convert to kg
        newCO2e = value * emissionFactor * 1000;
      } else {
        // Factor is already in kg
        newCO2e = value * emissionFactor;
      }

      // Only update if the value has changed significantly (more than 1kg difference)
      if (Math.abs(record.co2e_emissions - newCO2e) > 1) {
        updates.push({
          id: record.id,
          old_co2e: record.co2e_emissions,
          new_co2e: newCO2e,
          metric_name: record.metrics_catalog.name,
          value: value,
          unit: record.unit,
          emission_factor: emissionFactor
        });
      }
    }

    console.log(`Found ${updates.length} records that need updating\n`);

    // Show sample of what will be updated
    if (updates.length > 0) {
      console.log('📋 Sample of updates (first 10):');
      updates.slice(0, 10).forEach(update => {
        const oldTons = (update.old_co2e / 1000).toFixed(3);
        const newTons = (update.new_co2e / 1000).toFixed(3);
        console.log(`  ${update.metric_name}: ${oldTons} → ${newTons} tCO2e`);
        console.log(`    (${update.value} ${update.unit} × ${update.emission_factor} = ${update.new_co2e.toFixed(1)} kgCO2e)`);
      });
    }

    // Apply updates in batches
    console.log('\n📝 Applying updates...');
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      for (const update of batch) {
        const { error: updateError } = await supabase
          .from('metrics_data')
          .update({ co2e_emissions: update.new_co2e })
          .eq('id', update.id);

        if (updateError) {
          console.error(`Error updating record ${update.id}:`, updateError);
          errorCount++;
        } else {
          updateCount++;
        }
      }

      console.log(`  Progress: ${Math.min(i + batchSize, updates.length)} / ${updates.length}`);
    }

    console.log(`\n✅ Successfully updated ${updateCount} records`);
    if (errorCount > 0) {
      console.log(`❌ Failed to update ${errorCount} records`);
    }

    // Verify totals for 2024
    console.log('\n🔍 Verifying 2024 Totals:\n');

    const { data: sites } = await supabase
      .from('sites')
      .select('*')
      .in('name', ['Lisboa', 'Porto', 'Faro']);

    for (const site of sites || []) {
      const { data: siteData } = await supabase
        .from('metrics_data')
        .select('co2e_emissions')
        .eq('site_id', site.id)
        .gte('period_start', '2024-01-01')
        .lte('period_end', '2024-12-31');

      const total = siteData?.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) / 1000 || 0;
      console.log(`  ${site.name}: ${total.toFixed(3)} tCO2e`);
    }

    // Calculate grand total
    const { data: allData2024 } = await supabase
      .from('metrics_data')
      .select('co2e_emissions')
      .gte('period_start', '2024-01-01')
      .lte('period_end', '2024-12-31');

    const grandTotal = allData2024?.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) / 1000 || 0;
    console.log(`\n  TOTAL 2024: ${grandTotal.toFixed(3)} tCO2e`);

    // Expected totals from user data
    console.log('\n  Expected values:');
    console.log('  Lisboa: 502.544 tCO2e');
    console.log('  Porto: 71.128 tCO2e');
    console.log('  Faro: 18.166 tCO2e');
    console.log('  TOTAL: 591.838 tCO2e');

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

recalculateEmissions();