import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function analyzeRecordsByYear() {
  console.log('🔍 Analyzing Why Record Counts Differ By Year\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Fetch all data with pagination
  console.log('📥 Fetching all records...\n');

  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch } = await supabase
      .from('metrics_data')
      .select('id, metric_id, site_id, period_start, value, co2e_emissions')
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

  console.log(`Total records: ${allData.length}\n`);

  // Analyze by year
  const byYear = new Map<string, {
    records: number;
    uniqueMetrics: Set<string>;
    uniqueSites: Set<string>;
    months: Set<string>;
    recordsByMonth: Map<string, number>;
  }>();

  allData.forEach(record => {
    const year = record.period_start.substring(0, 4);

    if (!byYear.has(year)) {
      byYear.set(year, {
        records: 0,
        uniqueMetrics: new Set(),
        uniqueSites: new Set(),
        months: new Set(),
        recordsByMonth: new Map()
      });
    }

    const yearData = byYear.get(year)!;
    yearData.records++;
    yearData.uniqueMetrics.add(record.metric_id);
    yearData.uniqueSites.add(record.site_id || 'null');

    const month = record.period_start.substring(0, 7);
    yearData.months.add(month);
    yearData.recordsByMonth.set(month, (yearData.recordsByMonth.get(month) || 0) + 1);
  });

  console.log('📊 Records By Year:\n');
  console.log('Year  Records  Metrics  Sites  Months  Avg/Month  Explanation');
  console.log('-'.repeat(90));

  const years = Array.from(byYear.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  years.forEach(([year, data]) => {
    const avgPerMonth = data.records / data.months.size;

    console.log(
      `${year}  ${String(data.records).padStart(7)}  ${String(data.uniqueMetrics.size).padStart(7)}  ` +
      `${String(data.uniqueSites.size).padStart(5)}  ${String(data.months.size).padStart(6)}  ` +
      `${avgPerMonth.toFixed(1).padStart(9)}`
    );
  });

  // Detailed monthly breakdown
  console.log('\n📅 Monthly Record Counts:\n');

  years.forEach(([year, data]) => {
    console.log(`\n${year}:`);
    const monthsSorted = Array.from(data.recordsByMonth.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    monthsSorted.forEach(([month, count]) => {
      console.log(`  ${month}: ${count} records`);
    });

    console.log(`  Total months with data: ${data.months.size}`);
    console.log(`  Avg records/month: ${(data.records / data.months.size).toFixed(1)}`);
  });

  // Compare metrics tracked per year
  console.log('\n\n📈 Metrics Tracked Per Year:\n');
  console.log('Year  Total Metrics  New This Year');
  console.log('-'.repeat(45));

  let cumulativeMetrics = new Set<string>();
  years.forEach(([year, data]) => {
    const newMetrics = Array.from(data.uniqueMetrics).filter(m => !cumulativeMetrics.has(m));
    cumulativeMetrics = new Set([...cumulativeMetrics, ...data.uniqueMetrics]);

    console.log(`${year}  ${String(data.uniqueMetrics.size).padStart(13)}  ${String(newMetrics.length).padStart(13)}`);
  });

  // Check for specific differences
  console.log('\n\n🔍 Investigating Differences:\n');

  // Compare 2022 vs 2024
  const metrics2022 = byYear.get('2022')?.uniqueMetrics || new Set();
  const metrics2024 = byYear.get('2024')?.uniqueMetrics || new Set();

  const onlyIn2024 = Array.from(metrics2024).filter(m => !metrics2022.has(m));
  const onlyIn2022 = Array.from(metrics2022).filter(m => !metrics2024.has(m));

  console.log(`Metrics only in 2024 (not in 2022): ${onlyIn2024.length}`);
  console.log(`Metrics only in 2022 (not in 2024): ${onlyIn2022.length}`);

  // Get metric names for the new ones
  if (onlyIn2024.length > 0) {
    console.log('\nSample metrics added in 2024:');

    const { data: sampleMetrics } = await supabase
      .from('metrics_catalog')
      .select('id, name, category')
      .in('id', onlyIn2024.slice(0, 10));

    sampleMetrics?.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.name} (${m.category})`);
    });
  }

  // Check if 2022/2023 are missing months
  console.log('\n\n📅 Checking for Missing Months:\n');

  years.forEach(([year, data]) => {
    const expectedMonths = year === '2025' ? 12 : 12; // 2025 has Jan-Dec forecasts
    const actualMonths = data.months.size;
    const missingMonths = expectedMonths - actualMonths;

    if (missingMonths > 0) {
      console.log(`${year}: Missing ${missingMonths} month(s) - only ${actualMonths}/12 months`);

      // Show which months exist
      const months = Array.from(data.months).sort();
      const allMonths = Array.from({length: 12}, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
      const missing = allMonths.filter(m => !months.includes(m));

      if (missing.length > 0 && missing.length <= 5) {
        console.log(`  Missing: ${missing.join(', ')}`);
      }
    }
  });

  // Summary
  console.log('\n\n📋 Summary:\n');

  const records2022 = byYear.get('2022')?.records || 0;
  const records2024 = byYear.get('2024')?.records || 0;
  const increase = records2024 - records2022;
  const percentIncrease = (increase / records2022 * 100).toFixed(1);

  console.log(`2022 had ${records2022} records`);
  console.log(`2024 had ${records2024} records`);
  console.log(`Increase: ${increase} records (+${percentIncrease}%)\n`);

  console.log('Likely reasons for the difference:');
  console.log(`  1. More metrics tracked: ${metrics2024.size} vs ${metrics2022.size} (+${metrics2024.size - metrics2022.size})`);
  console.log(`  2. Missing months in 2022: ${12 - (byYear.get('2022')?.months.size || 0)} months`);
  console.log(`  3. Data collection improvements over time`);
}

analyzeRecordsByYear().catch(console.error);
