import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function analyzeMLvsActualTrends() {
  console.log('🔍 ANALYZING ML FORECASTS vs ACTUAL 2024 TRENDS\n');
  console.log('='.repeat(120));

  // Get all metrics with 2025 data
  const { data: data2025 } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      metric_id,
      period_start,
      co2e_emissions,
      data_quality,
      metadata,
      metrics_catalog!inner(code, name, scope)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start', { ascending: true });

  // Group by metric
  const metricMap = new Map<string, any[]>();
  data2025?.forEach(d => {
    const metricId = d.metric_id;
    if (!metricMap.has(metricId)) {
      metricMap.set(metricId, []);
    }
    metricMap.get(metricId)!.push(d);
  });

  console.log(`\n📊 Analyzing ${metricMap.size} metrics\n`);

  const results: any[] = [];

  for (const [metricId, records2025] of metricMap.entries()) {
    const metric = records2025[0].metrics_catalog;
    const code = metric.code;
    const name = metric.name;
    const scope = metric.scope;

    // Get 2024 actual data
    const { data: data2024 } = await supabaseAdmin
      .from('metrics_data')
      .select('period_start, co2e_emissions')
      .eq('organization_id', organizationId)
      .eq('metric_id', metricId)
      .gte('period_start', '2024-01-01')
      .lt('period_start', '2025-01-01')
      .order('period_start', { ascending: true });

    // Get 2023 actual data
    const { data: data2023 } = await supabaseAdmin
      .from('metrics_data')
      .select('period_start, co2e_emissions')
      .eq('organization_id', organizationId)
      .eq('metric_id', metricId)
      .gte('period_start', '2023-01-01')
      .lt('period_start', '2024-01-01')
      .order('period_start', { ascending: true });

    const total2023 = (data2023?.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) || 0) / 1000;
    const total2024 = (data2024?.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) || 0) / 1000;

    // Calculate 2025 forecast (new ML values)
    const total2025ML = records2025.reduce((sum, d) => sum + ((d.co2e_emissions || 0) / 1000), 0);

    // Get original 2025 values from metadata
    let total2025Original = 0;
    records2025.forEach(d => {
      if (d.metadata?.original_emissions) {
        total2025Original += d.metadata.original_emissions / 1000;
      } else {
        total2025Original += (d.co2e_emissions || 0) / 1000;
      }
    });

    // Calculate year-over-year changes
    const change2023to2024 = total2023 > 0 ? ((total2024 - total2023) / total2023) * 100 : 0;
    const change2024to2025ML = total2024 > 0 ? ((total2025ML - total2024) / total2024) * 100 : 0;
    const change2024to2025Original = total2024 > 0 ? ((total2025Original - total2024) / total2024) * 100 : 0;

    // Check if ML is predicting reduction when historical shows growth
    const historicalGrowing = change2023to2024 > 5; // Growing by more than 5%
    const mlPredictingReduction = change2024to2025ML < -5; // Reducing by more than 5%
    const warning = historicalGrowing && mlPredictingReduction;

    results.push({
      name,
      code,
      scope,
      total2023,
      total2024,
      total2025ML,
      total2025Original,
      change2023to2024,
      change2024to2025ML,
      change2024to2025Original,
      warning
    });
  }

  // Sort by total emissions (highest first)
  results.sort((a, b) => b.total2024 - a.total2024);

  console.log('📋 YEAR-OVER-YEAR COMPARISON');
  console.log('═'.repeat(120));
  console.log('Metric                          2023      2024      2025(ML)  2025(Orig) 23→24    24→25(ML)  24→25(Orig) Warning');
  console.log('═'.repeat(120));

  results.forEach(r => {
    const nameDisplay = r.name.substring(0, 30).padEnd(30);
    const warn = r.warning ? '⚠️  YES' : '';

    console.log(
      `${nameDisplay}  ${r.total2023.toFixed(2).padStart(8)}  ${r.total2024.toFixed(2).padStart(8)}  ` +
      `${r.total2025ML.toFixed(2).padStart(10)}  ${r.total2025Original.toFixed(2).padStart(10)}  ` +
      `${(r.change2023to2024 > 0 ? '+' : '') + r.change2023to2024.toFixed(1)}%`.padStart(7) + '  ' +
      `${(r.change2024to2025ML > 0 ? '+' : '') + r.change2024to2025ML.toFixed(1)}%`.padStart(10) + '  ' +
      `${(r.change2024to2025Original > 0 ? '+' : '') + r.change2024to2025Original.toFixed(1)}%`.padStart(11) + '  ' +
      warn
    );
  });

  console.log('\n\n⚠️  WARNINGS: ML PREDICTING REDUCTION WHEN HISTORICAL SHOWS GROWTH');
  console.log('═'.repeat(120));

  const warnings = results.filter(r => r.warning);
  if (warnings.length === 0) {
    console.log('\n✅ No concerning predictions found.');
  } else {
    console.log(`\nFound ${warnings.length} metrics where ML predicts reduction despite historical growth:\n`);

    warnings.forEach(w => {
      console.log(`\n📉 ${w.name} (${w.scope.replace('scope_', 'Scope ')})`);
      console.log(`   2023: ${w.total2023.toFixed(2)} tCO2e`);
      console.log(`   2024: ${w.total2024.toFixed(2)} tCO2e (${w.change2023to2024 > 0 ? '+' : ''}${w.change2023to2024.toFixed(1)}% growth)`);
      console.log(`   2025 ML Forecast: ${w.total2025ML.toFixed(2)} tCO2e (${w.change2024to2025ML > 0 ? '+' : ''}${w.change2024to2025ML.toFixed(1)}% change)`);
      console.log(`   2025 Original Data: ${w.total2025Original.toFixed(2)} tCO2e (${w.change2024to2025Original > 0 ? '+' : ''}${w.change2024to2025Original.toFixed(1)}% change)`);
      console.log(`   ⚠️  ML predicts ${Math.abs(w.change2024to2025ML).toFixed(1)}% reduction but 2023→2024 grew ${w.change2023to2024.toFixed(1)}%`);
    });
  }

  // Aggregate totals
  console.log('\n\n📊 AGGREGATE ANALYSIS');
  console.log('═'.repeat(120));

  const totalScope1_2023 = results.filter(r => r.scope === 'scope_1').reduce((sum, r) => sum + r.total2023, 0);
  const totalScope1_2024 = results.filter(r => r.scope === 'scope_1').reduce((sum, r) => sum + r.total2024, 0);
  const totalScope1_2025ML = results.filter(r => r.scope === 'scope_1').reduce((sum, r) => sum + r.total2025ML, 0);

  const totalScope2_2023 = results.filter(r => r.scope === 'scope_2').reduce((sum, r) => sum + r.total2023, 0);
  const totalScope2_2024 = results.filter(r => r.scope === 'scope_2').reduce((sum, r) => sum + r.total2024, 0);
  const totalScope2_2025ML = results.filter(r => r.scope === 'scope_2').reduce((sum, r) => sum + r.total2025ML, 0);

  const totalScope3_2023 = results.filter(r => r.scope === 'scope_3').reduce((sum, r) => sum + r.total2023, 0);
  const totalScope3_2024 = results.filter(r => r.scope === 'scope_3').reduce((sum, r) => sum + r.total2024, 0);
  const totalScope3_2025ML = results.filter(r => r.scope === 'scope_3').reduce((sum, r) => sum + r.total2025ML, 0);

  console.log('\nScope   2023 (tCO2e)   2024 (tCO2e)   2025 ML (tCO2e)   23→24      24→25(ML)');
  console.log('─'.repeat(120));

  if (totalScope1_2024 > 0) {
    const change1_23to24 = ((totalScope1_2024 - totalScope1_2023) / totalScope1_2023) * 100;
    const change1_24to25 = ((totalScope1_2025ML - totalScope1_2024) / totalScope1_2024) * 100;
    console.log(
      `Scope 1   ${totalScope1_2023.toFixed(2).padStart(12)}   ${totalScope1_2024.toFixed(2).padStart(12)}   ` +
      `${totalScope1_2025ML.toFixed(2).padStart(16)}   ${(change1_23to24 > 0 ? '+' : '') + change1_23to24.toFixed(1)}%`.padStart(9) + '   ' +
      `${(change1_24to25 > 0 ? '+' : '') + change1_24to25.toFixed(1)}%`.padStart(11)
    );
  }

  if (totalScope2_2024 > 0) {
    const change2_23to24 = ((totalScope2_2024 - totalScope2_2023) / totalScope2_2023) * 100;
    const change2_24to25 = ((totalScope2_2025ML - totalScope2_2024) / totalScope2_2024) * 100;
    console.log(
      `Scope 2   ${totalScope2_2023.toFixed(2).padStart(12)}   ${totalScope2_2024.toFixed(2).padStart(12)}   ` +
      `${totalScope2_2025ML.toFixed(2).padStart(16)}   ${(change2_23to24 > 0 ? '+' : '') + change2_23to24.toFixed(1)}%`.padStart(9) + '   ' +
      `${(change2_24to25 > 0 ? '+' : '') + change2_24to25.toFixed(1)}%`.padStart(11)
    );
  }

  if (totalScope3_2024 > 0) {
    const change3_23to24 = ((totalScope3_2024 - totalScope3_2023) / totalScope3_2023) * 100;
    const change3_24to25 = ((totalScope3_2025ML - totalScope3_2024) / totalScope3_2024) * 100;
    console.log(
      `Scope 3   ${totalScope3_2023.toFixed(2).padStart(12)}   ${totalScope3_2024.toFixed(2).padStart(12)}   ` +
      `${totalScope3_2025ML.toFixed(2).padStart(16)}   ${(change3_23to24 > 0 ? '+' : '') + change3_23to24.toFixed(1)}%`.padStart(9) + '   ' +
      `${(change3_24to25 > 0 ? '+' : '') + change3_24to25.toFixed(1)}%`.padStart(11)
    );
  }

  const grandTotal2023 = totalScope1_2023 + totalScope2_2023 + totalScope3_2023;
  const grandTotal2024 = totalScope1_2024 + totalScope2_2024 + totalScope3_2024;
  const grandTotal2025ML = totalScope1_2025ML + totalScope2_2025ML + totalScope3_2025ML;
  const changeGrand_23to24 = ((grandTotal2024 - grandTotal2023) / grandTotal2023) * 100;
  const changeGrand_24to25 = ((grandTotal2025ML - grandTotal2024) / grandTotal2024) * 100;

  console.log('─'.repeat(120));
  console.log(
    `TOTAL     ${grandTotal2023.toFixed(2).padStart(12)}   ${grandTotal2024.toFixed(2).padStart(12)}   ` +
    `${grandTotal2025ML.toFixed(2).padStart(16)}   ${(changeGrand_23to24 > 0 ? '+' : '') + changeGrand_23to24.toFixed(1)}%`.padStart(9) + '   ' +
    `${(changeGrand_24to25 > 0 ? '+' : '') + changeGrand_24to25.toFixed(1)}%`.padStart(11)
  );

  console.log('\n' + '═'.repeat(120));
}

analyzeMLvsActualTrends().catch(console.error);
