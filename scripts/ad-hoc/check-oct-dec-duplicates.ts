import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkDuplicates() {
  console.log('🔍 Checking for Duplicates in Oct-Dec 2025 Forecasts\n');
  console.log('=' + '='.repeat(79) + '\n');

  const { data, error } = await supabase
    .from('metrics_data')
    .select('id, metric_id, site_id, period_start, value, co2e_emissions')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-10-01')
    .lte('period_start', '2025-12-31');

  if (error || !data) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total records: ${data.length}\n`);

  // Group by unique key
  const groups = new Map<string, any[]>();
  data.forEach(record => {
    const key = `${record.metric_id}|${record.period_start}|${record.site_id || 'null'}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  });

  console.log(`Unique combinations: ${groups.size}\n`);

  // Find duplicates
  const duplicates: any[] = [];
  groups.forEach((records, key) => {
    if (records.length > 1) {
      duplicates.push({ key, count: records.length, records });
    }
  });

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!\n');
  } else {
    console.log(`⚠️  Found ${duplicates.length} duplicate sets:\n`);

    duplicates.slice(0, 10).forEach((dup, i) => {
      const [metricId, periodStart, siteId] = dup.key.split('|');
      console.log(`${i + 1}. ${periodStart} - Metric: ${metricId.substring(0, 8)}... Site: ${siteId.substring(0, 8)}...`);
      console.log(`   Count: ${dup.count} duplicates`);
      console.log(`   IDs: ${dup.records.map((r: any) => r.id.substring(0, 8)).join(', ')}...`);
      console.log(`   Values: ${dup.records.map((r: any) => `${(r.co2e_emissions / 1000).toFixed(3)} tCO2e`).join(', ')}`);
      console.log('');
    });
  }

  // Calculate total with and without duplicates
  const totalWithDuplicates = data.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);
  const seen = new Set<string>();
  const uniqueRecords = data.filter(r => {
    const key = `${r.metric_id}|${r.period_start}|${r.site_id || 'null'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const totalWithoutDuplicates = uniqueRecords.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);

  console.log('📊 Summary:');
  console.log(`  Total records: ${data.length}`);
  console.log(`  Unique records: ${uniqueRecords.length}`);
  console.log(`  Duplicate records: ${data.length - uniqueRecords.length}`);
  console.log(`  Total emissions (with duplicates): ${(totalWithDuplicates / 1000).toFixed(1)} tCO2e`);
  console.log(`  Total emissions (without duplicates): ${(totalWithoutDuplicates / 1000).toFixed(1)} tCO2e`);
  console.log(`  Inflation factor: ${(totalWithDuplicates / totalWithoutDuplicates).toFixed(2)}x`);
}

checkDuplicates().catch(console.error);
