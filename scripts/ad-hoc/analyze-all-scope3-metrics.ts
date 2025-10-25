import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function analyzeAllScope3() {
  console.log('🔍 ANALYZING ALL SCOPE 3 METRICS FOR LINEAR PATTERNS\n');
  console.log('='.repeat(120));

  // Fetch all Scope 3 metrics with 2025 data
  const { data: scope3Data, error } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      id,
      period_start,
      value,
      co2e_emissions,
      data_quality,
      created_at,
      metrics_catalog!inner(
        id,
        code,
        name,
        category,
        scope
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

  // Group by metric
  const metricGroups = new Map<string, any[]>();
  scope3Data.forEach(d => {
    const code = d.metrics_catalog.code;
    if (!metricGroups.has(code)) {
      metricGroups.set(code, []);
    }
    metricGroups.get(code)!.push(d);
  });

  console.log(`\n📊 Found ${metricGroups.size} unique Scope 3 metrics with 2025 data\n`);

  const metricsToReplace: Array<{
    code: string;
    name: string;
    category: string;
    totalEmissions: number;
    isLinear: boolean;
    variability: number;
    monthCount: number;
  }> = [];

  console.log('Metric Analysis:');
  console.log('─'.repeat(120));
  console.log('Code                                      Name                              Months  Total (tCO2e)  Linear?  Variability');
  console.log('─'.repeat(120));

  for (const [code, records] of metricGroups.entries()) {
    if (records.length < 3) continue; // Need at least 3 months to detect pattern

    const name = records[0].metrics_catalog.name;
    const category = records[0].metrics_catalog.category;
    const totalEmissions = records.reduce((sum, r) => sum + ((r.co2e_emissions || 0) / 1000), 0);

    // Analyze pattern
    const values = records.map(r => r.value || 0);
    const differences: number[] = [];
    for (let i = 1; i < values.length; i++) {
      differences.push(values[i] - values[i - 1]);
    }

    const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    const maxDeviation = Math.max(...differences.map(d => Math.abs(d - avgDiff)));
    const variability = avgDiff !== 0 ? (maxDeviation / Math.abs(avgDiff)) * 100 : 0;

    const isLinear = variability < 10; // Less than 10% variability = linear

    const displayCode = code.substring(0, 40).padEnd(40);
    const displayName = name.substring(0, 35).padEnd(35);
    const linearStatus = isLinear ? '⚠️  YES' : '✅ NO';

    console.log(
      `${displayCode}  ${displayName}  ${records.length.toString().padStart(6)}  ` +
      `${totalEmissions.toFixed(2).padStart(13)}  ${linearStatus.padStart(8)}  ${variability.toFixed(1)}%`
    );

    if (isLinear && totalEmissions > 0.1) { // Only flag metrics with significant emissions
      metricsToReplace.push({
        code,
        name,
        category,
        totalEmissions,
        isLinear,
        variability,
        monthCount: records.length
      });
    }
  }

  console.log('\n\n📋 METRICS WITH LINEAR PATTERNS (CANDIDATES FOR ML REPLACEMENT)');
  console.log('═'.repeat(120));

  if (metricsToReplace.length === 0) {
    console.log('\n✅ No linear patterns detected! All metrics show realistic variation.');
  } else {
    console.log(`\n⚠️  Found ${metricsToReplace.length} metrics with linear patterns:\n`);

    let totalLinearEmissions = 0;
    metricsToReplace.forEach((m, index) => {
      totalLinearEmissions += m.totalEmissions;
      console.log(`${(index + 1).toString().padStart(2)}. ${m.name}`);
      console.log(`    Code: ${m.code}`);
      console.log(`    Category: ${m.category}`);
      console.log(`    Total 2025 emissions: ${m.totalEmissions.toFixed(2)} tCO2e (${m.monthCount} months)`);
      console.log(`    Variability: ${m.variability.toFixed(1)}% (linear threshold: <10%)`);
      console.log('');
    });

    console.log(`📊 Total emissions in linear patterns: ${totalLinearEmissions.toFixed(2)} tCO2e`);

    // Check historical data availability for each metric
    console.log('\n\n📚 CHECKING HISTORICAL DATA AVAILABILITY');
    console.log('═'.repeat(120));

    for (const metric of metricsToReplace) {
      const { data: historical } = await supabaseAdmin
        .from('metrics_data')
        .select('period_start, co2e_emissions, metrics_catalog!inner(code)')
        .eq('organization_id', organizationId)
        .eq('metrics_catalog.code', metric.code)
        .gte('period_start', '2022-01-01')
        .lt('period_start', '2025-01-01')
        .order('period_start', { ascending: true });

      const monthCount = historical?.length || 0;
      const avgEmissions = monthCount > 0
        ? historical!.reduce((sum, d) => sum + ((d.co2e_emissions || 0) / 1000), 0) / monthCount
        : 0;

      const canUseSeasonal = monthCount >= 36;
      const modelType = canUseSeasonal ? 'seasonal-decomposition' : monthCount >= 12 ? 'exponential-smoothing' : 'insufficient-data';

      console.log(`\n${metric.name} (${metric.code})`);
      console.log(`  Historical months: ${monthCount}`);
      console.log(`  Historical avg: ${avgEmissions.toFixed(2)} tCO2e/month`);
      console.log(`  ML Model: ${modelType}`);
      console.log(`  Can replace: ${monthCount >= 12 ? '✅ YES' : '❌ NO (need 12+ months)'}`);
    }

    console.log('\n\n🎯 RECOMMENDATION');
    console.log('═'.repeat(120));
    console.log('\nWe can replace the linear patterns with ML forecasts for metrics that have:');
    console.log('  • At least 12 months of historical data (for exponential-smoothing)');
    console.log('  • Or 36+ months of historical data (for seasonal-decomposition)');
    console.log('\nThis will:');
    console.log('  ✅ Remove unrealistic linear patterns from Scope 3 trend lines');
    console.log('  ✅ Use ML models trained on actual historical behavior');
    console.log('  ✅ Preserve original data in metadata for audit trail');
    console.log('  ✅ Mark data_quality as "calculated" (ML-generated)');
  }

  console.log('\n' + '═'.repeat(120));
}

analyzeAllScope3().catch(console.error);
