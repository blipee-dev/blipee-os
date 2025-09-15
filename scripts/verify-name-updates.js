const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function verifyNameUpdates() {
  console.log('🔍 VERIFYING METRIC NAME UPDATES\n');
  console.log('=' .repeat(80));

  try {
    // Check for travel-related metrics specifically
    const { data: travelMetrics } = await supabase
      .from('metrics_catalog')
      .select('*')
      .eq('category', 'Business Travel');

    console.log('📊 Current Business Travel Metrics:');
    travelMetrics?.forEach(metric => {
      console.log(`  • ${metric.name} (${metric.code})`);
    });

    // Check if old names still exist
    const oldNames = ['Air Travel', 'Rail Travel'];
    console.log('\n🔍 Checking for old names:');

    for (const oldName of oldNames) {
      const { data: found } = await supabase
        .from('metrics_catalog')
        .select('*')
        .eq('name', oldName);

      if (found && found.length > 0) {
        console.log(`  ❌ Found "${oldName}" - update failed`);

        // Try to update it now
        let newName = oldName;
        if (oldName === 'Air Travel') newName = 'Plane Travel';
        if (oldName === 'Rail Travel') newName = 'Train Travel';

        console.log(`    Attempting to update to "${newName}"...`);

        const { error } = await supabase
          .from('metrics_catalog')
          .update({ name: newName })
          .eq('name', oldName);

        if (error) {
          console.log(`    ❌ Update failed: ${error.message}`);
        } else {
          console.log(`    ✅ Successfully updated to "${newName}"`);
        }
      } else {
        console.log(`  ✅ "${oldName}" not found (already updated)`);
      }
    }

    // Check for new names
    const newNames = ['Plane Travel', 'Train Travel'];
    console.log('\n🔍 Checking for new names:');

    for (const newName of newNames) {
      const { data: found } = await supabase
        .from('metrics_catalog')
        .select('*')
        .eq('name', newName);

      if (found && found.length > 0) {
        console.log(`  ✅ Found "${newName}" - update successful`);
      } else {
        console.log(`  ❌ "${newName}" not found - update failed`);
      }
    }

    // Final check - show all Business Travel metrics
    const { data: finalTravelMetrics } = await supabase
      .from('metrics_catalog')
      .select('*')
      .eq('category', 'Business Travel');

    console.log('\n📊 Final Business Travel Metrics:');
    finalTravelMetrics?.forEach(metric => {
      console.log(`  • ${metric.name} (${metric.code})`);
    });

    // Also check what metrics are actually being used in the data
    console.log('\n📈 Metrics actually used in Lisboa 2024 data:');

    const { data: lisboaSite } = await supabase
      .from('sites')
      .select('id')
      .ilike('name', '%lisboa%')
      .single();

    if (lisboaSite) {
      const { data: usedMetrics } = await supabase
        .from('metrics_data')
        .select(`
          metrics_catalog (
            name, category
          )
        `)
        .eq('site_id', lisboaSite.id)
        .gte('period_start', '2024-01-01')
        .lte('period_end', '2024-12-31');

      const uniqueNames = new Set();
      usedMetrics?.forEach(record => {
        if (record.metrics_catalog?.name) {
          uniqueNames.add(`${record.metrics_catalog.name} (${record.metrics_catalog.category})`);
        }
      });

      Array.from(uniqueNames).sort().forEach(name => {
        console.log(`  • ${name}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

verifyNameUpdates();