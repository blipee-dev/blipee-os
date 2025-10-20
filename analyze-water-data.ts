import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function analyzeWaterData() {
  console.log('💧 Analyzing Water & Effluents Data\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Get water metrics
  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('category.ilike.%water%,category.ilike.%discharge%,category.ilike.%effluent%');

  console.log(`Found ${waterMetrics?.length || 0} water metrics:\n`);
  waterMetrics?.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.name} (${m.category}) - ${m.unit}`);
  });

  const waterMetricIds = waterMetrics?.map(m => m.id) || [];

  if (waterMetricIds.length === 0) {
    console.log('\n❌ No water metrics found');
    return;
  }

  // Fetch all water data with pagination
  console.log('\n📥 Fetching all water records...\n');

  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch } = await supabase
      .from('metrics_data')
      .select('period_start, value, co2e_emissions, metric_id, site_id')
      .eq('organization_id', organizationId)
      .in('metric_id', waterMetricIds)
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

  console.log(`Total water records: ${allData.length}\n`);

  if (allData.length === 0) {
    console.log('❌ No water data found in database');
    return;
  }

  // Analyze by year
  const byYear = new Map<string, Set<string>>();

  allData.forEach(record => {
    const year = record.period_start.substring(0, 4);
    if (!byYear.has(year)) {
      byYear.set(year, new Set());
    }
    byYear.get(year)!.add(record.period_start.substring(0, 7));
  });

  console.log('📊 Water Data by Year:\n');
  console.log('Year  Records  Months');
  console.log('-'.repeat(30));

  const years = Array.from(byYear.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  years.forEach(([year, months]) => {
    const recordCount = allData.filter(r => r.period_start.startsWith(year)).length;
    console.log(`${year}  ${String(recordCount).padStart(7)}  ${String(months.size).padStart(6)}`);
  });

  // Analyze by metric and site
  console.log('\n\n📊 Water Data by Metric and Site:\n');

  for (const metric of waterMetrics || []) {
    console.log(`\n${metric.name}:`);

    const metricData = allData.filter(r => r.metric_id === metric.id);

    if (metricData.length === 0) {
      console.log('  No data');
      continue;
    }

    // Group by site
    const bySite = new Map<string, any[]>();
    metricData.forEach(r => {
      const siteKey = r.site_id || 'null';
      if (!bySite.has(siteKey)) {
        bySite.set(siteKey, []);
      }
      bySite.get(siteKey)!.push(r);
    });

    bySite.forEach((siteData, siteId) => {
      const months = new Set(siteData.map(r => r.period_start.substring(0, 7)));
      const years2022to2024 = siteData.filter(r => {
        const year = r.period_start.substring(0, 4);
        return year >= '2022' && year < '2025';
      });

      console.log(`  Site ${siteId.substring(0, 8)}: ${siteData.length} records, ${months.size} months`);
      console.log(`    2022-2024: ${years2022to2024.length} records`);

      // Show date range
      const sortedDates = siteData.map(r => r.period_start).sort();
      console.log(`    Range: ${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`);
    });
  }

  // Check if we have enough data for forecasting
  console.log('\n\n🔍 Forecasting Feasibility:\n');

  for (const metric of waterMetrics || []) {
    const metricData = allData.filter(r => r.metric_id === metric.id);

    if (metricData.length === 0) continue;

    // Group by site
    const bySite = new Map<string, any[]>();
    metricData.forEach(r => {
      const siteKey = r.site_id || 'null';
      if (!bySite.has(siteKey)) {
        bySite.set(siteKey, []);
      }
      bySite.get(siteKey)!.push(r);
    });

    console.log(`${metric.name}:`);

    let canForecast = false;
    bySite.forEach((siteData, siteId) => {
      const data2022to2024 = siteData.filter(r => {
        const year = r.period_start.substring(0, 4);
        return year >= '2022' && year < '2025';
      });

      const uniqueMonths = new Set(data2022to2024.map(r => r.period_start.substring(0, 7)));

      if (uniqueMonths.size >= 12) {
        console.log(`  ✅ Site ${siteId.substring(0, 8)}: ${uniqueMonths.size} months (CAN forecast)`);
        canForecast = true;
      } else {
        console.log(`  ❌ Site ${siteId.substring(0, 8)}: ${uniqueMonths.size} months (CANNOT forecast - need 12+)`);
      }
    });

    if (!canForecast) {
      console.log(`  ⚠️  No sites have enough data for forecasting`);
    }
  }
}

analyzeWaterData().catch(console.error);
