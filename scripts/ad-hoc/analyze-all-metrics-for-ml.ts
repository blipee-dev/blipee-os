import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function analyzeAllMetrics() {
  console.log('🔍 ANALYZING ALL METRICS FOR ML FORECAST REPLACEMENT\n');
  console.log('='.repeat(120));

  // Fetch all metrics with 2025 data (all scopes)
  const { data: data2025, error } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      metric_id,
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
        scope,
        unit
      )
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`\n📊 Found ${data2025.length} records with 2025 data\n`);

  // Group by metric_id
  const metricGroups = new Map<string, any[]>();
  data2025.forEach(d => {
    const metricId = d.metric_id;
    if (!metricGroups.has(metricId)) {
      metricGroups.set(metricId, []);
    }
    metricGroups.get(metricId)!.push(d);
  });

  console.log(`📊 Unique metrics: ${metricGroups.size}\n`);

  const metricsForML: Array<{
    metricId: string;
    code: string;
    name: string;
    category: string;
    scope: string;
    months2025: number;
    totalEmissions: number;
    historicalMonths: number;
    mlModel: string;
    canReplace: boolean;
    dataQuality: string;
  }> = [];

  console.log('Analyzing each metric...\n');
  console.log('─'.repeat(120));

  for (const [metricId, records] of metricGroups.entries()) {
    const metric = records[0].metrics_catalog;
    const code = metric.code;
    const name = metric.name;
    const category = metric.category;
    const scope = metric.scope;
    const months2025 = records.length;
    const dataQuality = records[0].data_quality;

    const totalEmissions = records.reduce((sum, r) => sum + ((r.co2e_emissions || 0) / 1000), 0);

    // Skip metrics with zero emissions
    if (totalEmissions === 0) {
      continue;
    }

    // Fetch historical data
    const { data: historical } = await supabaseAdmin
      .from('metrics_data')
      .select('period_start, co2e_emissions')
      .eq('organization_id', organizationId)
      .eq('metric_id', metricId)
      .gte('period_start', '2022-01-01')
      .lt('period_start', '2025-01-01')
      .order('period_start', { ascending: true });

    const historicalMonths = historical?.length || 0;
    const canReplace = historicalMonths >= 12; // Need at least 12 months for ML
    const mlModel = historicalMonths >= 36 ? 'seasonal-decomposition' :
                    historicalMonths >= 12 ? 'exponential-smoothing' :
                    'insufficient-data';

    metricsForML.push({
      metricId,
      code,
      name,
      category,
      scope,
      months2025,
      totalEmissions,
      historicalMonths,
      mlModel,
      canReplace,
      dataQuality
    });
  }

  // Sort by scope and total emissions
  metricsForML.sort((a, b) => {
    const scopeOrder = { 'scope_1': 1, 'scope_2': 2, 'scope_3': 3 };
    const scopeA = scopeOrder[a.scope as keyof typeof scopeOrder] || 4;
    const scopeB = scopeOrder[b.scope as keyof typeof scopeOrder] || 4;

    if (scopeA !== scopeB) return scopeA - scopeB;
    return b.totalEmissions - a.totalEmissions;
  });

  console.log('\n📋 ALL METRICS WITH 2025 DATA (> 0 tCO2e)');
  console.log('═'.repeat(120));
  console.log('Scope    Code                           Name                          2025 (tCO2e)  Hist.Months  ML Model              Status');
  console.log('═'.repeat(120));

  let totalScope1 = 0;
  let totalScope2 = 0;
  let totalScope3 = 0;
  let canReplaceCount = 0;
  let cannotReplaceCount = 0;

  metricsForML.forEach(m => {
    const scopeDisplay = m.scope.replace('scope_', 'S').toUpperCase().padStart(8);
    const codeDisplay = m.code.substring(0, 30).padEnd(30);
    const nameDisplay = m.name.substring(0, 28).padEnd(28);
    const emissionsDisplay = m.totalEmissions.toFixed(2).padStart(13);
    const histMonthsDisplay = m.historicalMonths.toString().padStart(12);
    const mlModelDisplay = m.mlModel.padEnd(20);
    const status = m.canReplace ? '✅ Can replace' : '❌ Need 12+ months';

    console.log(
      `${scopeDisplay}  ${codeDisplay}  ${nameDisplay}  ${emissionsDisplay}  ${histMonthsDisplay}  ${mlModelDisplay}  ${status}`
    );

    if (m.scope === 'scope_1') totalScope1 += m.totalEmissions;
    if (m.scope === 'scope_2') totalScope2 += m.totalEmissions;
    if (m.scope === 'scope_3') totalScope3 += m.totalEmissions;

    if (m.canReplace) {
      canReplaceCount++;
    } else {
      cannotReplaceCount++;
    }
  });

  console.log('─'.repeat(120));
  console.log(`TOTAL S1: ${totalScope1.toFixed(2)} tCO2e | S2: ${totalScope2.toFixed(2)} tCO2e | S3: ${totalScope3.toFixed(2)} tCO2e | GRAND TOTAL: ${(totalScope1 + totalScope2 + totalScope3).toFixed(2)} tCO2e`);

  console.log('\n\n📊 SUMMARY BY SCOPE');
  console.log('═'.repeat(120));

  const byScope = {
    scope_1: metricsForML.filter(m => m.scope === 'scope_1'),
    scope_2: metricsForML.filter(m => m.scope === 'scope_2'),
    scope_3: metricsForML.filter(m => m.scope === 'scope_3')
  };

  Object.entries(byScope).forEach(([scope, metrics]) => {
    const total = metrics.reduce((sum, m) => sum + m.totalEmissions, 0);
    const canReplace = metrics.filter(m => m.canReplace).length;
    const cannotReplace = metrics.filter(m => !m.canReplace).length;

    console.log(`\n${scope.toUpperCase().replace('_', ' ')}: ${metrics.length} metrics, ${total.toFixed(2)} tCO2e`);
    console.log(`  ✅ Can apply ML forecast: ${canReplace} metrics`);
    console.log(`  ❌ Insufficient historical data: ${cannotReplace} metrics`);
  });

  console.log('\n\n🎯 RECOMMENDATION');
  console.log('═'.repeat(120));
  console.log(`\nWe can apply ML forecasts to ${canReplaceCount} out of ${metricsForML.length} metrics with 2025 data.`);
  console.log('\nBreakdown by ML model:');

  const bySeasonal = metricsForML.filter(m => m.mlModel === 'seasonal-decomposition');
  const byExponential = metricsForML.filter(m => m.mlModel === 'exponential-smoothing');
  const byInsufficient = metricsForML.filter(m => m.mlModel === 'insufficient-data');

  console.log(`  • Seasonal Decomposition (36+ months): ${bySeasonal.length} metrics`);
  console.log(`  • Exponential Smoothing (12-35 months): ${byExponential.length} metrics`);
  console.log(`  • Insufficient Data (<12 months): ${byInsufficient.length} metrics`);

  const totalMLEmissions = metricsForML
    .filter(m => m.canReplace)
    .reduce((sum, m) => sum + m.totalEmissions, 0);

  console.log(`\nTotal emissions covered by ML forecasts: ${totalMLEmissions.toFixed(2)} tCO2e`);
  console.log(`Percentage of total: ${((totalMLEmissions / (totalScope1 + totalScope2 + totalScope3)) * 100).toFixed(1)}%`);

  // Check which have already been replaced
  const alreadyReplaced = metricsForML.filter(m => m.dataQuality === 'calculated');
  console.log(`\n✅ Already replaced with ML: ${alreadyReplaced.length} metrics`);
  console.log(`⏳ Still need replacement: ${canReplaceCount - alreadyReplaced.length} metrics`);

  if (canReplaceCount - alreadyReplaced.length > 0) {
    console.log('\n📝 Metrics still needing ML replacement:');
    metricsForML
      .filter(m => m.canReplace && m.dataQuality !== 'calculated')
      .forEach(m => {
        console.log(`   • ${m.name} (${m.scope.replace('scope_', 'Scope ')}) - ${m.totalEmissions.toFixed(2)} tCO2e`);
      });
  }

  console.log('\n' + '═'.repeat(120));

  // Save list to use in replacement script
  return metricsForML.filter(m => m.canReplace && m.dataQuality !== 'calculated');
}

analyzeAllMetrics().catch(console.error);
