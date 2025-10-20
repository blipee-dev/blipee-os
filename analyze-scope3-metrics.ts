import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function analyzeScope3Metrics() {
  console.log('🔍 Analyzing Scope 3 Metrics for Recalculation\n');
  console.log('='.repeat(80));

  // Fetch Scope 3 data with full metric details
  const { data, error } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      id,
      period_start,
      value,
      unit,
      co2e_emissions,
      data_quality,
      metadata,
      metrics_catalog!inner(
        id,
        code,
        name,
        category,
        scope,
        unit
      )
    `)
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.scope', 'scope_3')
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2025-10-01')
    .order('period_start', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`\n📊 Total Scope 3 Records: ${data.length}`);

  // Group by metric (category + name)
  const metricGroups = new Map<string, any[]>();

  data.forEach(d => {
    const catalog = d.metrics_catalog as any;
    const key = `${catalog.category} > ${catalog.name}`;
    if (!metricGroups.has(key)) {
      metricGroups.set(key, []);
    }
    metricGroups.get(key)!.push(d);
  });

  console.log(`\n📋 Found ${metricGroups.size} unique Scope 3 metrics:\n`);
  console.log('─'.repeat(80));

  // Analyze each metric
  metricGroups.forEach((records, metricName) => {
    const catalog = (records[0].metrics_catalog as any);

    // Check if we have actual activity data (value field)
    const hasActivityData = records.some(r => r.value && r.value > 0);

    // Check data quality
    const dataQualities = new Set(records.map(r => r.data_quality).filter(Boolean));
    const qualityInfo = dataQualities.size > 0 ? Array.from(dataQualities).join(', ') : 'unknown';

    // Calculate current emissions
    const totalEmissions = records.reduce((sum, r) => sum + ((r.co2e_emissions || 0) / 1000), 0);
    const totalActivity = records.reduce((sum, r) => sum + (r.value || 0), 0);

    console.log(`\n${metricName}`);
    console.log(`   Code: ${catalog.code}`);
    console.log(`   Unit: ${catalog.unit || 'N/A'}`);
    console.log(`   Records: ${records.length} months`);
    console.log(`   Total Activity: ${totalActivity.toFixed(2)} ${catalog.unit || ''}`);
    console.log(`   Current Total Emissions: ${totalEmissions.toFixed(2)} tCO2e`);
    console.log(`   Has Activity Data: ${hasActivityData ? '✅' : '❌'}`);
    console.log(`   Data Quality: ${qualityInfo}`);

    // Show monthly pattern
    const monthlyData = new Map<string, { value: number; emissions: number }>();
    records.forEach(r => {
      const month = r.period_start?.substring(0, 7);
      if (!month) return;
      monthlyData.set(month, {
        value: r.value || 0,
        emissions: (r.co2e_emissions || 0) / 1000
      });
    });

    // Check if activity data varies month-to-month
    const activityValues = Array.from(monthlyData.values()).map(d => d.value);
    const uniqueActivityValues = new Set(activityValues);

    if (uniqueActivityValues.size === 1 && activityValues[0] === 0) {
      console.log(`   ⚠️  NO ACTIVITY DATA - All months have 0 value`);
    } else if (uniqueActivityValues.size === 1) {
      console.log(`   ⚠️  STATIC ACTIVITY - Same value (${activityValues[0]}) every month`);
    } else if (uniqueActivityValues.size > 1) {
      console.log(`   ✅ VARIABLE ACTIVITY - ${uniqueActivityValues.size} different values across months`);
      console.log(`      Range: ${Math.min(...activityValues).toFixed(2)} to ${Math.max(...activityValues).toFixed(2)}`);
    }

    // Sample first 3 months
    const sortedMonths = Array.from(monthlyData.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    if (sortedMonths.length > 0) {
      console.log(`   Sample months:`);
      sortedMonths.slice(0, 3).forEach(([month, data]) => {
        console.log(`      ${month}: ${data.value.toFixed(2)} ${catalog.unit || ''} = ${data.emissions.toFixed(4)} tCO2e`);
      });
    }
  });

  // Summary: What can be recalculated?
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RECALCULATION SUMMARY');
  console.log('='.repeat(80));

  let canRecalc = 0;
  let needsData = 0;
  let needsFactor = 0;

  metricGroups.forEach((records, metricName) => {
    const hasActivityData = records.some(r => r.value && r.value > 0);
    const hasEmissions = records.some(r => r.co2e_emissions && r.co2e_emissions > 0);

    if (hasActivityData && hasEmissions) {
      canRecalc++;
    } else if (!hasActivityData) {
      needsData++;
    } else {
      needsFactor++;
    }
  });

  console.log(`\n✅ Can recalculate: ${canRecalc} metrics (have activity data with current emissions)`);
  console.log(`⚠️  Need activity data: ${needsData} metrics (no value field)`);
  console.log(`⚠️  Need emission calculation: ${needsFactor} metrics (have data but no emissions)`);

  console.log('\n' + '='.repeat(80));
}

analyzeScope3Metrics().catch(console.error);
