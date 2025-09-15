const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

// Correct emission factors based on user's data
const correctEmissionFactors = {
  // Electricity: 0.26 kgCO2/kWh (from user's data: 1.52 tCO2 / 5858.78 kWh)
  'electricity': 0.26,

  // Water: 0.32 kgCO2/m³ (from user's data: 0.381 tCO2 / 1193 m³)
  'water': 0.32,

  // Waste: 480 kgCO2/ton (from user's data: 0.604 tCO2 / 1.26 tons)
  'waste': 480,

  // Natural Gas: 0.2 kgCO2/kWh (from user's data: 2.103 tCO2 / 10512 kWh)
  'natural_gas': 0.2,

  // Paper: 960 kgCO2/ton (from user's data: 0.84 tCO2 / 0.875 tons)
  'paper': 960,

  // Plane Travel: 0.11 kgCO2/km (from user's data: 1.815 tCO2 / 16500 km)
  'plane_travel': 0.11,

  // Car Travel: 0.16 kgCO2/km (from user's data: 5.744 tCO2 / 35900 km)
  'car_travel': 0.16,

  // Train Travel: 0.02 kgCO2/km (from user's data: 0.024 tCO2 / 1200 km)
  'train_travel': 0.02,

  // Uber/Taxi: 0.18 kgCO2/km (from user's data: 0.153 tCO2 / 850 km)
  'uber_taxi': 0.18,

  // Hotel Stays: 10 kgCO2/night (from user's data: 1.2 tCO2 / 120 nights)
  'hotel_stays': 10
};

async function fixEmissionFactors() {
  console.log('🔧 Fixing Emission Factors and Recalculating Emissions\n');
  console.log('=' .repeat(80));

  try {
    // First, check current emission factors in metrics_data
    const { data: currentData } = await supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          name, code, category, subcategory
        )
      `)
      .limit(100);

    console.log('\n📊 Sample Current Emission Factors:');
    const samplesByCategory = {};

    currentData?.forEach(record => {
      const category = record.metrics_catalog?.category?.toLowerCase() || 'unknown';
      if (!samplesByCategory[category]) {
        samplesByCategory[category] = record;
      }
    });

    Object.entries(samplesByCategory).forEach(([category, record]) => {
      console.log(`  ${category}: ${record.emission_factor} ${record.emission_factor_unit || 'kgCO2/' + record.unit}`);
    });

    // Now let's fix the emission factors and recalculate
    console.log('\n🔄 Updating Emission Factors...\n');

    // Get all metrics data
    const { data: allMetrics } = await supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          name, code, category, subcategory
        )
      `);

    console.log(`Found ${allMetrics?.length || 0} records to update`);

    let updateCount = 0;
    const updates = [];

    for (const record of allMetrics || []) {
      const category = record.metrics_catalog?.category?.toLowerCase() || '';
      const name = record.metrics_catalog?.name?.toLowerCase() || '';

      let newEmissionFactor = null;
      let newCO2e = null;

      // Determine correct emission factor
      if (category.includes('energy') || name.includes('electricity')) {
        newEmissionFactor = correctEmissionFactors.electricity;
        newCO2e = record.value * newEmissionFactor; // kWh * kgCO2/kWh
      } else if (category.includes('water') || name.includes('water')) {
        newEmissionFactor = correctEmissionFactors.water;
        newCO2e = record.value * newEmissionFactor; // m³ * kgCO2/m³
      } else if (category.includes('waste') || name.includes('waste')) {
        newEmissionFactor = correctEmissionFactors.waste;
        newCO2e = record.value * newEmissionFactor; // tons * kgCO2/ton
      } else if (name.includes('natural') && name.includes('gas')) {
        newEmissionFactor = correctEmissionFactors.natural_gas;
        newCO2e = record.value * newEmissionFactor; // kWh * kgCO2/kWh
      } else if (name.includes('paper')) {
        newEmissionFactor = correctEmissionFactors.paper;
        newCO2e = record.value * newEmissionFactor; // tons * kgCO2/ton
      } else if (name.includes('plane') || name.includes('flight')) {
        newEmissionFactor = correctEmissionFactors.plane_travel;
        newCO2e = record.value * newEmissionFactor; // km * kgCO2/km
      } else if (name.includes('car') || name.includes('vehicle')) {
        newEmissionFactor = correctEmissionFactors.car_travel;
        newCO2e = record.value * newEmissionFactor; // km * kgCO2/km
      } else if (name.includes('train') || name.includes('rail')) {
        newEmissionFactor = correctEmissionFactors.train_travel;
        newCO2e = record.value * newEmissionFactor; // km * kgCO2/km
      } else if (name.includes('uber') || name.includes('taxi')) {
        newEmissionFactor = correctEmissionFactors.uber_taxi;
        newCO2e = record.value * newEmissionFactor; // km * kgCO2/km
      } else if (name.includes('hotel') || name.includes('accommodation')) {
        newEmissionFactor = correctEmissionFactors.hotel_stays;
        newCO2e = record.value * newEmissionFactor; // nights * kgCO2/night
      }

      if (newEmissionFactor !== null && newCO2e !== null) {
        updates.push({
          id: record.id,
          emission_factor: newEmissionFactor,
          co2e_emissions: newCO2e,
          category: record.metrics_catalog?.category,
          value: record.value,
          unit: record.unit
        });
      }
    }

    console.log(`\n📝 Updating ${updates.length} records with corrected emission factors...`);

    // Update in batches of 100
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);

      for (const update of batch) {
        const { error } = await supabase
          .from('metrics_data')
          .update({
            emission_factor: update.emission_factor,
            co2e_emissions: update.co2e_emissions
          })
          .eq('id', update.id);

        if (error) {
          console.error(`Error updating record ${update.id}:`, error);
        } else {
          updateCount++;
        }
      }

      console.log(`  Updated ${Math.min(i + batchSize, updates.length)} / ${updates.length} records`);
    }

    console.log(`\n✅ Successfully updated ${updateCount} records`);

    // Verify the fix
    console.log('\n🔍 Verifying Fixed Data for Faro 2024:\n');

    const { data: faroSite } = await supabase
      .from('sites')
      .select('id')
      .eq('name', 'Faro')
      .single();

    if (faroSite) {
      const { data: fixedData } = await supabase
        .from('metrics_data')
        .select(`
          *,
          metrics_catalog (
            name, category
          )
        `)
        .eq('site_id', faroSite.id)
        .gte('period_start', '2024-01-01')
        .lte('period_end', '2024-12-31');

      const categorySummary = {};
      let totalEmissions = 0;

      fixedData?.forEach(record => {
        const category = record.metrics_catalog?.category || 'Other';
        if (!categorySummary[category]) {
          categorySummary[category] = { value: 0, emissions: 0, count: 0 };
        }
        categorySummary[category].value += record.value || 0;
        categorySummary[category].emissions += (record.co2e_emissions || 0) / 1000; // Convert to tons
        categorySummary[category].count++;
        totalEmissions += (record.co2e_emissions || 0) / 1000;
      });

      console.log('Category Summary:');
      Object.entries(categorySummary).forEach(([category, data]) => {
        console.log(`  ${category}: ${data.emissions.toFixed(3)} tCO2e (${data.count} records)`);
      });
      console.log(`  TOTAL: ${totalEmissions.toFixed(3)} tCO2e`);

      if (Math.abs(totalEmissions - 18.166) < 1) {
        console.log('\n✅ SUCCESS! Emissions now match expected value of 18.166 tCO2e');
      } else {
        console.log(`\n⚠️  Still have discrepancy: Expected 18.166 tCO2e, got ${totalEmissions.toFixed(3)} tCO2e`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

fixEmissionFactors();