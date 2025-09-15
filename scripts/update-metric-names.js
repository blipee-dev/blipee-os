const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

// Name mappings to fix
const nameUpdates = [
  { from: 'Grid Electricity', to: 'Electricity' },
  { from: 'Water Supply', to: 'Water' },
  { from: 'Air Travel', to: 'Plane Travel' },
  { from: 'Rail Travel', to: 'Train Travel' },
  { from: 'Road Travel', to: 'Car Travel' },
  { from: 'Hotel Nights', to: 'Hotel Stays' }
];

async function updateMetricNames() {
  console.log('🏷️  UPDATING METRIC NAMES\n');
  console.log('=' .repeat(80));

  try {
    for (const update of nameUpdates) {
      console.log(`\n📝 Updating "${update.from}" → "${update.to}"`);

      // Check if the metric exists
      const { data: existingMetrics } = await supabase
        .from('metrics_catalog')
        .select('*')
        .eq('name', update.from);

      if (existingMetrics && existingMetrics.length > 0) {
        // Update the name
        const { error } = await supabase
          .from('metrics_catalog')
          .update({ name: update.to })
          .eq('name', update.from);

        if (error) {
          console.log(`  ❌ Error: ${error.message}`);
        } else {
          console.log(`  ✅ Updated ${existingMetrics.length} metric(s)`);
        }
      } else {
        console.log(`  ⚠️  Metric "${update.from}" not found`);
      }
    }

    // Also check for waste naming
    console.log(`\n📝 Checking waste metric names...`);

    const { data: wasteMetrics } = await supabase
      .from('metrics_catalog')
      .select('*')
      .eq('category', 'Waste');

    console.log(`\nCurrent waste metrics:`);
    wasteMetrics?.forEach(metric => {
      console.log(`  • ${metric.name} (${metric.code})`);
    });

    // Update waste metrics to be more generic
    const wasteUpdates = [
      { from: 'Waste to Landfill', to: 'Waste' },
      { from: 'Waste Incinerated', to: 'Waste' },
      { from: 'Waste Recycled', to: 'Waste' },
      { from: 'Waste Composted', to: 'Waste' }
    ];

    console.log(`\n📝 Updating waste metric names to generic "Waste"...`);
    for (const update of wasteUpdates) {
      const { data: existing } = await supabase
        .from('metrics_catalog')
        .select('*')
        .eq('name', update.from);

      if (existing && existing.length > 0) {
        // Don't actually update - this would cause conflicts
        console.log(`  ⚠️  Found "${update.from}" - keeping distinct for now`);
      }
    }

    // Show final list of metrics
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 FINAL METRICS CATALOG');
    console.log('='.repeat(80));

    const { data: allMetrics } = await supabase
      .from('metrics_catalog')
      .select('*')
      .order('category, name');

    const byCategory = {};
    allMetrics?.forEach(metric => {
      const category = metric.category || 'Other';
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category].push(metric.name);
    });

    Object.entries(byCategory).forEach(([category, names]) => {
      console.log(`\n${category}:`);
      names.forEach(name => {
        console.log(`  • ${name}`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

updateMetricNames();