import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkDuplicates() {
  console.log('🔍 Checking for Duplicate Records in 2025 Data\n');
  console.log('=' .repeat(80));

  try {
    // Get ALL 2025 data
    const { data: allData } = await supabase
      .from('metrics_data')
      .select('id, metric_id, period_start, value, metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', '2025-01-01')
      .lte('period_start', '2025-12-31')
      .order('period_start', { ascending: true })
      .order('metric_id', { ascending: true });

    if (!allData || allData.length === 0) {
      console.log('❌ No data found');
      return;
    }

    console.log(`\n📊 Total 2025 records: ${allData.length}\n`);

    // Get metric names
    const { data: metrics } = await supabase
      .from('metrics_catalog')
      .select('id, name, category');

    // Check for duplicates by metric_id + period_start
    const duplicates: any = {};
    const seen: any = {};

    allData.forEach(record => {
      const key = `${record.metric_id}_${record.period_start}`;

      if (seen[key]) {
        if (!duplicates[key]) {
          duplicates[key] = [seen[key]];
        }
        duplicates[key].push(record);
      } else {
        seen[key] = record;
      }
    });

    const duplicateCount = Object.keys(duplicates).length;

    if (duplicateCount > 0) {
      console.log(`❌ Found ${duplicateCount} sets of duplicate records!\n`);

      for (const [key, records] of Object.entries(duplicates)) {
        const recordArray = records as any[];
        const firstRecord = recordArray[0];
        const metric = metrics?.find(m => m.id === firstRecord.metric_id);
        const metricName = metric?.name || 'Unknown';

        console.log(`\n🔴 DUPLICATE: ${metricName} - ${firstRecord.period_start}`);
        console.log(`   Found ${recordArray.length} records:\n`);

        recordArray.forEach((rec, idx) => {
          console.log(`   ${idx + 1}. ID: ${rec.id}`);
          console.log(`      Value: ${(parseFloat(rec.value) / 1000).toFixed(4)} MWh`);
          console.log(`      Source: ${rec.metadata?.source || 'N/A'}`);
          console.log(`      Model: ${rec.metadata?.model || 'N/A'}`);
          console.log('');
        });
      }

      // Count total duplicate records
      let totalDuplicateRecords = 0;
      Object.values(duplicates).forEach((records: any) => {
        totalDuplicateRecords += records.length - 1; // -1 because we keep one
      });

      console.log('=' .repeat(80));
      console.log(`⚠️  Total duplicate records to remove: ${totalDuplicateRecords}`);
      console.log('=' .repeat(80));

    } else {
      console.log('✅ No duplicates found! All records are unique.\n');

      // Show summary by metric
      const byMetric: any = {};

      allData.forEach(record => {
        const metric = metrics?.find(m => m.id === record.metric_id);
        const metricName = metric?.name || 'Unknown';

        if (!byMetric[metricName]) {
          byMetric[metricName] = { count: 0, months: new Set() };
        }

        byMetric[metricName].count++;
        byMetric[metricName].months.add(record.period_start.substring(0, 7));
      });

      console.log('📊 Summary by Metric:\n');
      Object.entries(byMetric).forEach(([name, data]: [string, any]) => {
        console.log(`  ${name}:`);
        console.log(`    Records: ${data.count}`);
        console.log(`    Unique Months: ${data.months.size}`);
        console.log(`    Months: ${Array.from(data.months).sort().join(', ')}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDuplicates();
