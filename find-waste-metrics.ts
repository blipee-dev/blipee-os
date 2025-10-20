import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function findWasteMetrics() {
  console.log('🗑️  Finding ALL Waste-Related Metrics\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Get ALL metrics
  const { data: allMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .order('category', { ascending: true });

  if (!allMetrics) {
    console.log('❌ Error fetching metrics');
    return;
  }

  console.log(`Total metrics in catalog: ${allMetrics.length}\n`);

  // Find waste-related metrics by name or category
  const wasteRelated = allMetrics.filter(m => {
    const nameLC = (m.name || '').toLowerCase();
    const categoryLC = (m.category || '').toLowerCase();

    return nameLC.includes('waste') ||
           nameLC.includes('recycl') ||
           nameLC.includes('landfill') ||
           nameLC.includes('incinerat') ||
           nameLC.includes('compost') ||
           categoryLC.includes('waste');
  });

  console.log(`\n\n🗑️  Waste-Related Metrics Found: ${wasteRelated.length}\n`);

  wasteRelated.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.name}`);
    console.log(`     Category: ${m.category}`);
    console.log(`     Unit: ${m.unit}`);
    console.log(`     ID: ${m.id}\n`);
  });

  // Now check if these metrics have data
  if (wasteRelated.length > 0) {
    console.log('\n📊 Checking for actual data...\n');

    const wasteMetricIds = wasteRelated.map(m => m.id);

    let allData: any[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: batch } = await supabase
        .from('metrics_data')
        .select('period_start, value, co2e_emissions, metric_id')
        .eq('organization_id', organizationId)
        .in('metric_id', wasteMetricIds)
        .order('period_start', { ascending: true })
        .range(from, from + batchSize - 1);

      if (batch && batch.length > 0) {
        allData = allData.concat(batch);
        from += batchSize;
        if (batch.length < batchSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`Total waste data records: ${allData.length}\n`);

    if (allData.length > 0) {
      // Group by metric
      const byMetric = new Map<string, any[]>();
      allData.forEach(r => {
        if (!byMetric.has(r.metric_id)) {
          byMetric.set(r.metric_id, []);
        }
        byMetric.get(r.metric_id)!.push(r);
      });

      console.log('Data by metric:\n');

      byMetric.forEach((records, metricId) => {
        const metric = wasteRelated.find(m => m.id === metricId);
        const years = new Set(records.map(r => r.period_start.substring(0, 4)));
        const months = new Set(records.map(r => r.period_start.substring(0, 7)));

        console.log(`${metric?.name || 'Unknown'}:`);
        console.log(`  Records: ${records.length}`);
        console.log(`  Years: ${Array.from(years).sort().join(', ')}`);
        console.log(`  Unique months: ${months.size}`);
        console.log(`  Date range: ${records[0].period_start} to ${records[records.length - 1].period_start}\n`);
      });
    }
  }
}

findWasteMetrics().catch(console.error);
