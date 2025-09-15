const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function fixWasteUnits() {
  console.log('🔧 Fixing Waste Unit Conversion Issues\n');
  console.log('=' .repeat(80));

  try {
    // Get all waste-related metrics
    const { data: wasteMetrics } = await supabase
      .from('metrics_catalog')
      .select('*')
      .eq('category', 'Waste');

    console.log('📊 Waste Metrics in Catalog:');
    wasteMetrics?.forEach(metric => {
      console.log(`  ${metric.name}: ${metric.emission_factor} ${metric.emission_factor_unit} per ${metric.unit}`);
    });

    // Get all waste data that has wrong units
    const { data: wasteData } = await supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          name, emission_factor, unit
        )
      `)
      .in('metric_id', wasteMetrics?.map(m => m.id) || [])
      .order('co2e_emissions', { ascending: false });

    console.log(`\nFound ${wasteData?.length || 0} waste records to check\n`);

    // Identify records with unit mismatches
    const fixes = [];

    wasteData?.forEach(record => {
      const catalogUnit = record.metrics_catalog?.unit;
      const recordUnit = record.unit;
      const emissionFactor = record.metrics_catalog?.emission_factor;

      // Check if there's a unit mismatch
      if (catalogUnit === 'tons' && recordUnit === 'kg') {
        // Value is in kg but emission factor expects tons
        const correctValue = record.value / 1000; // Convert kg to tons
        const correctCO2e = correctValue * emissionFactor;

        fixes.push({
          id: record.id,
          name: record.metrics_catalog?.name,
          old_value: record.value,
          old_unit: recordUnit,
          new_value: correctValue,
          new_unit: 'tons',
          old_co2e: record.co2e_emissions,
          new_co2e: correctCO2e
        });
      } else if (catalogUnit === 'kg' && recordUnit === 'tons') {
        // Value is in tons but emission factor expects kg
        const correctValue = record.value * 1000; // Convert tons to kg
        const correctCO2e = correctValue * emissionFactor;

        fixes.push({
          id: record.id,
          name: record.metrics_catalog?.name,
          old_value: record.value,
          old_unit: recordUnit,
          new_value: correctValue,
          new_unit: 'kg',
          old_co2e: record.co2e_emissions,
          new_co2e: correctCO2e
        });
      }
    });

    console.log(`📋 Found ${fixes.length} records with unit mismatches\n`);

    if (fixes.length > 0) {
      // Show sample of fixes
      console.log('Sample fixes (first 5):');
      fixes.slice(0, 5).forEach(fix => {
        const oldTons = (fix.old_co2e / 1000).toFixed(3);
        const newTons = (fix.new_co2e / 1000).toFixed(3);
        console.log(`\n  ${fix.name}:`);
        console.log(`    Value: ${fix.old_value} ${fix.old_unit} → ${fix.new_value} ${fix.new_unit}`);
        console.log(`    CO2e: ${oldTons} tCO2e → ${newTons} tCO2e`);
      });

      // Calculate impact
      const totalOldEmissions = fixes.reduce((sum, f) => sum + f.old_co2e, 0) / 1000;
      const totalNewEmissions = fixes.reduce((sum, f) => sum + f.new_co2e, 0) / 1000;
      console.log(`\n📊 Total Impact:`);
      console.log(`  Current emissions: ${totalOldEmissions.toFixed(1)} tCO2e`);
      console.log(`  Corrected emissions: ${totalNewEmissions.toFixed(1)} tCO2e`);
      console.log(`  Reduction: ${(totalOldEmissions - totalNewEmissions).toFixed(1)} tCO2e`);

      // Apply fixes
      console.log('\n📝 Applying corrections...');
      let updateCount = 0;

      for (const fix of fixes) {
        const { error } = await supabase
          .from('metrics_data')
          .update({
            value: fix.new_value,
            unit: fix.new_unit,
            co2e_emissions: fix.new_co2e
          })
          .eq('id', fix.id);

        if (error) {
          console.error(`Error updating record ${fix.id}:`, error);
        } else {
          updateCount++;
        }

        // Show progress every 10 records
        if (updateCount % 10 === 0) {
          console.log(`  Updated ${updateCount} / ${fixes.length} records`);
        }
      }

      console.log(`\n✅ Successfully updated ${updateCount} records`);
    }

    // Verify the fix
    console.log('\n🔍 Verifying corrected totals:\n');

    const { data: sites } = await supabase
      .from('sites')
      .select('*')
      .order('name');

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

    // Total for 2024
    const { data: all2024 } = await supabase
      .from('metrics_data')
      .select('co2e_emissions')
      .gte('period_start', '2024-01-01')
      .lte('period_end', '2024-12-31');

    const total2024 = all2024?.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) / 1000 || 0;
    console.log(`\n  TOTAL 2024: ${total2024.toFixed(3)} tCO2e`);
    console.log(`  Expected: 591.838 tCO2e`);

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

fixWasteUnits();