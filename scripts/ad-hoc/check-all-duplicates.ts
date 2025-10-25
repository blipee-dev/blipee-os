import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkAllDuplicates() {
  console.log('🔍 Checking for Duplicate Records Across All Data\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Get all data - Supabase has a default 1000 record limit, so we need to fetch in batches
  console.log('📥 Fetching all records (may take a moment)...\n');

  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error } = await supabase
      .from('metrics_data')
      .select('id, metric_id, site_id, period_start, value, co2e_emissions, created_at')
      .eq('organization_id', organizationId)
      .order('period_start', { ascending: true })
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('❌ Error fetching data:', error);
      return;
    }

    if (batch && batch.length > 0) {
      allData = allData.concat(batch);
      from += batchSize;
      console.log(`   Fetched ${allData.length} records so far...`);

      if (batch.length < batchSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`\n📊 Total records in database: ${allData.length}\n`);

  // Group by unique key (metric_id + period_start + site_id)
  const groups = new Map<string, any[]>();
  allData.forEach(record => {
    const key = `${record.metric_id}|${record.period_start}|${record.site_id || 'null'}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  });

  console.log(`📊 Unique combinations: ${groups.size}\n`);

  // Find duplicates
  const duplicates: any[] = [];
  groups.forEach((records, key) => {
    if (records.length > 1) {
      duplicates.push({ key, count: records.length, records });
    }
  });

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!\n');
    return;
  }

  console.log(`⚠️  Found ${duplicates.length} duplicate sets\n`);

  // Calculate duplicate count by year
  const duplicatesByYear = new Map<string, { total: number, duplicates: number }>();

  allData.forEach(record => {
    const year = record.period_start.substring(0, 4);
    const key = `${record.metric_id}|${record.period_start}|${record.site_id || 'null'}`;
    const isDuplicate = groups.get(key)!.length > 1;

    if (!duplicatesByYear.has(year)) {
      duplicatesByYear.set(year, { total: 0, duplicates: 0 });
    }

    const yearData = duplicatesByYear.get(year)!;
    yearData.total++;
    if (isDuplicate) {
      yearData.duplicates++;
    }
  });

  console.log('📊 Duplicates by Year:\n');
  console.log('Year    Total Records  Duplicate Records  Percentage');
  console.log('-'.repeat(60));

  const years = Array.from(duplicatesByYear.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  years.forEach(([year, data]) => {
    const pct = (data.duplicates / data.total * 100).toFixed(1);
    console.log(
      `${year}    ${String(data.total).padStart(13)}  ${String(data.duplicates).padStart(17)}  ${pct.padStart(9)}%`
    );
  });

  // Show sample duplicates
  console.log('\n📋 Sample Duplicate Sets (first 10):\n');

  duplicates.slice(0, 10).forEach((dup, i) => {
    const [metricId, periodStart, siteId] = dup.key.split('|');
    console.log(`${i + 1}. Period: ${periodStart} | Metric: ${metricId.substring(0, 8)}... | Site: ${siteId.substring(0, 8)}...`);
    console.log(`   Duplicates: ${dup.count}`);

    // Show all IDs and values
    dup.records.forEach((r: any, idx: number) => {
      console.log(
        `   [${idx + 1}] ID: ${r.id.substring(0, 8)}... | ` +
        `Value: ${r.value || 0} | ` +
        `CO2e: ${(r.co2e_emissions || 0).toFixed(2)} | ` +
        `Created: ${r.created_at?.substring(0, 10) || 'unknown'}`
      );
    });
    console.log('');
  });

  // Calculate inflation from duplicates
  const totalWithDuplicates = allData.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);

  const seen = new Set<string>();
  const uniqueRecords = allData.filter(r => {
    const key = `${r.metric_id}|${r.period_start}|${r.site_id || 'null'}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const totalWithoutDuplicates = uniqueRecords.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);

  console.log('📈 Impact of Duplicates:\n');
  console.log(`   Total records: ${allData.length}`);
  console.log(`   Unique records: ${uniqueRecords.length}`);
  console.log(`   Duplicate records: ${allData.length - uniqueRecords.length}`);
  console.log(`   Duplicate percentage: ${((allData.length - uniqueRecords.length) / allData.length * 100).toFixed(1)}%`);
  console.log(`\n   Total emissions (with duplicates): ${(totalWithDuplicates / 1000).toFixed(1)} tCO2e`);
  console.log(`   Total emissions (without duplicates): ${(totalWithoutDuplicates / 1000).toFixed(1)} tCO2e`);
  console.log(`   Inflation factor: ${(totalWithDuplicates / totalWithoutDuplicates).toFixed(2)}x`);
  console.log(`   Excess emissions from duplicates: ${((totalWithDuplicates - totalWithoutDuplicates) / 1000).toFixed(1)} tCO2e`);

  // Identify which records to delete
  console.log('\n💡 Recommendations:\n');
  if (duplicates.length > 0) {
    const recordsToDelete = allData.length - uniqueRecords.length;
    console.log(`   Should delete ${recordsToDelete} duplicate records`);
    console.log(`   This would reduce total emissions by ${((totalWithDuplicates - totalWithoutDuplicates) / 1000).toFixed(1)} tCO2e`);
    console.log(`\n   Strategy: Keep the OLDEST record (earliest created_at) for each duplicate set`);
  }
}

checkAllDuplicates().catch(console.error);
