import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSuspiciousData() {
  console.log('🔍 Checking for suspicious waste data...\n');

  // Get all waste metrics
  const { data: wasteMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .eq('category', 'Waste');

  // Get all waste data
  const { data: wasteData } = await supabase
    .from('metrics_data')
    .select('*')
    .in('metric_id', wasteMetrics?.map(m => m.id) || [])
    .order('period_start');

  console.log(`📊 Total waste records: ${wasteData?.length}\n`);

  // Check for suspicious patterns
  const issues: any[] = [];

  // 1. Very small values (< 0.001 tons)
  const tinyValues = wasteData?.filter(r => {
    const value = parseFloat(r.value);
    return value > 0 && value < 0.001;
  }) || [];

  if (tinyValues.length > 0) {
    console.log(`⚠️  Found ${tinyValues.length} records with tiny values (< 0.001 tons):`);
    tinyValues.slice(0, 5).forEach(r => {
      const metric = wasteMetrics?.find(m => m.id === r.metric_id);
      console.log(`  - ${metric?.code}: ${r.value} tons on ${r.period_start}`);
    });
    console.log('');
    issues.push({
      type: 'tiny_values',
      count: tinyValues.length,
      records: tinyValues
    });
  }

  // 2. Negative values
  const negativeValues = wasteData?.filter(r => parseFloat(r.value) < 0) || [];

  if (negativeValues.length > 0) {
    console.log(`❌ Found ${negativeValues.length} records with NEGATIVE values:`);
    negativeValues.forEach(r => {
      const metric = wasteMetrics?.find(m => m.id === r.metric_id);
      console.log(`  - ${metric?.code}: ${r.value} tons on ${r.period_start}`);
    });
    console.log('');
    issues.push({
      type: 'negative_values',
      count: negativeValues.length,
      records: negativeValues
    });
  }

  // 3. Zero values
  const zeroValues = wasteData?.filter(r => parseFloat(r.value) === 0) || [];

  if (zeroValues.length > 0) {
    console.log(`⚪ Found ${zeroValues.length} records with ZERO values`);
    const byMetric = zeroValues.reduce((acc: any, r) => {
      const metric = wasteMetrics?.find(m => m.id === r.metric_id);
      const code = metric?.code || 'unknown';
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {});

    Object.entries(byMetric).forEach(([code, count]) => {
      console.log(`  - ${code}: ${count} zero records`);
    });
    console.log('');
    issues.push({
      type: 'zero_values',
      count: zeroValues.length,
      records: zeroValues
    });
  }

  // 4. Extremely high values (> 1000 tons per month for a single metric)
  const highValues = wasteData?.filter(r => parseFloat(r.value) > 1000) || [];

  if (highValues.length > 0) {
    console.log(`🔥 Found ${highValues.length} records with very HIGH values (> 1000 tons):`);
    highValues.forEach(r => {
      const metric = wasteMetrics?.find(m => m.id === r.metric_id);
      console.log(`  - ${metric?.code}: ${r.value} tons on ${r.period_start}`);
    });
    console.log('');
    issues.push({
      type: 'high_values',
      count: highValues.length,
      records: highValues
    });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMMARY:');
  console.log('='.repeat(60));
  console.log(`Total records: ${wasteData?.length}`);
  console.log(`Issues found: ${issues.length} types\n`);

  issues.forEach(issue => {
    console.log(`${issue.type}: ${issue.count} records`);
  });

  console.log('\n💡 RECOMMENDATION:');
  console.log('  - Keep zero values (valid for months with no e-waste, etc.)');
  console.log('  - Delete negative values (data errors)');
  console.log('  - Review tiny values (may be unit conversion errors)');
  console.log('  - Review high values (may be legitimate for large facilities)');

  return issues;
}

checkSuspiciousData();
