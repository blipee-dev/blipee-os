import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkDuplicates() {
  console.log('🔍 Checking for duplicate metrics_data records...\n');

  // Fetch all data from 2022 onwards
  const { data, error } = await supabase
    .from('metrics_data')
    .select('id, metric_id, period_start, period_end, value, co2e_emissions, site_id')
    .eq('organization_id', organizationId)
    .gte('period_start', '2022-01-01')
    .order('period_start', { ascending: true });

  if (error) {
    console.error('❌ Error fetching data:', error);
    return;
  }

  console.log(`📊 Total records fetched: ${data.length}\n`);

  // Group by metric_id + period_start to find duplicates
  const groups = new Map<string, any[]>();

  data.forEach(record => {
    const key = `${record.metric_id}|${record.period_start}|${record.site_id || 'null'}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  });

  // Find duplicates
  const duplicates: any[] = [];
  groups.forEach((records, key) => {
    if (records.length > 1) {
      duplicates.push({
        key,
        count: records.length,
        records
      });
    }
  });

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found! All records are unique.\n');
    return;
  }

  console.log(`⚠️  Found ${duplicates.length} sets of duplicate records:\n`);

  // Show first 10 duplicate sets
  duplicates.slice(0, 10).forEach((dup, i) => {
    const [metricId, periodStart, siteId] = dup.key.split('|');
    console.log(`${i + 1}. Metric ID: ${metricId}, Period: ${periodStart}, Site: ${siteId}`);
    console.log(`   Count: ${dup.count} records`);
    console.log(`   Record IDs: ${dup.records.map((r: any) => r.id).join(', ')}`);
    console.log(`   Values: ${dup.records.map((r: any) => `${r.value || 0} (${r.co2e_emissions || 0} kg CO2e)`).join(', ')}`);
    console.log('');
  });

  if (duplicates.length > 10) {
    console.log(`... and ${duplicates.length - 10} more duplicate sets\n`);
  }

  // Summary by period
  const duplicatesByMonth = new Map<string, number>();
  duplicates.forEach(dup => {
    const month = dup.key.split('|')[1].substring(0, 7);
    duplicatesByMonth.set(month, (duplicatesByMonth.get(month) || 0) + dup.count);
  });

  console.log('📅 Duplicates by month:');
  Array.from(duplicatesByMonth.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .forEach(([month, count]) => {
      console.log(`   ${month}: ${count} duplicate records`);
    });
}

checkDuplicates().catch(console.error);
