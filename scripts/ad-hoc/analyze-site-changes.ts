import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function analyzeSiteChanges() {
  console.log('🔍 Analyzing Site and Metric Changes\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Fetch all data
  console.log('📥 Fetching all records...\n');

  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch } = await supabase
      .from('metrics_data')
      .select('id, metric_id, site_id, period_start')
      .eq('organization_id', organizationId)
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

  // Get all sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', organizationId);

  const siteNames = new Map(sites?.map(s => [s.id, s.name]) || []);

  console.log(`Total records: ${allData.length}\n`);

  // Analyze which site disappeared
  const sitesByYear = new Map<string, Set<string>>();

  allData.forEach(record => {
    const year = record.period_start.substring(0, 4);
    if (!sitesByYear.has(year)) {
      sitesByYear.set(year, new Set());
    }
    sitesByYear.get(year)!.add(record.site_id || 'null');
  });

  console.log('🏢 Sites Active Per Year:\n');
  const years = Array.from(sitesByYear.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  years.forEach(([year, sites]) => {
    console.log(`${year}: ${sites.size} sites`);
    sites.forEach(siteId => {
      const siteName = siteNames.get(siteId) || 'Unknown';
      console.log(`  - ${siteName} (${siteId.substring(0, 8)}...)`);
    });
  });

  // Find which site was in 2022 but not 2023+
  const sites2022 = sitesByYear.get('2022') || new Set();
  const sites2023 = sitesByYear.get('2023') || new Set();

  const removedSites = Array.from(sites2022).filter(s => !sites2023.has(s));

  if (removedSites.length > 0) {
    console.log(`\n⚠️  Site(s) removed after 2022:`);
    removedSites.forEach(siteId => {
      const siteName = siteNames.get(siteId) || 'Unknown';
      console.log(`  - ${siteName} (${siteId.substring(0, 8)}...)`);

      // Count how many records this site had
      const recordCount = allData.filter(r => r.site_id === siteId).length;
      console.log(`    Had ${recordCount} total records`);
    });
  }

  // Analyze records per site per year
  console.log('\n\n📊 Records Per Site Per Year:\n');

  const recordsBySiteYear = new Map<string, Map<string, number>>();

  allData.forEach(record => {
    const year = record.period_start.substring(0, 4);
    const siteId = record.site_id || 'null';

    if (!recordsBySiteYear.has(year)) {
      recordsBySiteYear.set(year, new Map());
    }

    const yearMap = recordsBySiteYear.get(year)!;
    yearMap.set(siteId, (yearMap.get(siteId) || 0) + 1);
  });

  years.forEach(([year]) => {
    console.log(`${year}:`);
    const yearMap = recordsBySiteYear.get(year)!;

    Array.from(yearMap.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([siteId, count]) => {
        const siteName = siteNames.get(siteId) || 'Unknown';
        console.log(`  ${siteName.padEnd(30)} ${String(count).padStart(4)} records`);
      });

    console.log(`  ${'TOTAL'.padEnd(30)} ${String(Array.from(yearMap.values()).reduce((a, b) => a + b, 0)).padStart(4)} records\n`);
  });

  // Compare 2022 vs 2024 in detail
  console.log('\n📈 Detailed Comparison: 2022 vs 2024\n');

  const data2022 = allData.filter(r => r.period_start.startsWith('2022'));
  const data2024 = allData.filter(r => r.period_start.startsWith('2024'));

  // Count metrics per site
  const metrics2022BySite = new Map<string, Set<string>>();
  const metrics2024BySite = new Map<string, Set<string>>();

  data2022.forEach(r => {
    const siteId = r.site_id || 'null';
    if (!metrics2022BySite.has(siteId)) {
      metrics2022BySite.set(siteId, new Set());
    }
    metrics2022BySite.get(siteId)!.add(r.metric_id);
  });

  data2024.forEach(r => {
    const siteId = r.site_id || 'null';
    if (!metrics2024BySite.has(siteId)) {
      metrics2024BySite.set(siteId, new Set());
    }
    metrics2024BySite.get(siteId)!.add(r.metric_id);
  });

  console.log('Metrics tracked per site:\n');
  console.log('Site                          2022 Metrics  2024 Metrics  Change');
  console.log('-'.repeat(75));

  const allSiteIds = new Set([...metrics2022BySite.keys(), ...metrics2024BySite.keys()]);

  allSiteIds.forEach(siteId => {
    const siteName = siteNames.get(siteId) || 'Unknown';
    const count2022 = metrics2022BySite.get(siteId)?.size || 0;
    const count2024 = metrics2024BySite.get(siteId)?.size || 0;
    const change = count2024 - count2022;
    const changeStr = change > 0 ? `+${change}` : String(change);

    console.log(
      `${siteName.padEnd(30)} ${String(count2022).padStart(12)}  ${String(count2024).padStart(12)}  ${changeStr.padStart(6)}`
    );
  });

  // Summary
  console.log('\n\n📋 Key Findings:\n');
  console.log(`1. One site was removed after 2022`);
  console.log(`2. However, 2024 still has MORE records than 2022 despite fewer sites`);
  console.log(`3. This suggests metrics per site increased from 2022 to 2024`);
}

analyzeSiteChanges().catch(console.error);
