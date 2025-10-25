import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkOctDecForecast() {
  console.log('🔍 CHECKING OCTOBER-DECEMBER 2025 FORECAST STATUS\n');
  console.log('='.repeat(120));

  // Get all metrics with ANY 2025 data
  const { data: allData } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      metric_id,
      period_start,
      co2e_emissions,
      data_quality,
      created_at,
      metadata,
      metrics_catalog!inner(code, name, scope)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start', { ascending: true });

  // Group by metric
  const metricMap = new Map<string, any[]>();
  allData?.forEach(d => {
    const metricId = d.metric_id;
    if (!metricMap.has(metricId)) {
      metricMap.set(metricId, []);
    }
    metricMap.get(metricId)!.push(d);
  });

  console.log(`\n📊 Checking ${metricMap.size} metrics\n`);
  console.log('─'.repeat(120));
  console.log('Metric                          Jan-Sep  Oct  Nov  Dec  Oct-Dec Status      Data Quality');
  console.log('─'.repeat(120));

  const results: any[] = [];

  for (const [metricId, records] of metricMap.entries()) {
    const metric = records[0].metrics_catalog;
    const name = metric.name;
    const code = metric.code;
    const scope = metric.scope;

    // Count months by period
    const janSep = records.filter(d => {
      const month = d.period_start?.substring(5, 7);
      return month && parseInt(month) >= 1 && parseInt(month) <= 9;
    }).length;

    const hasOct = records.some(d => d.period_start?.startsWith('2025-10'));
    const hasNov = records.some(d => d.period_start?.startsWith('2025-11'));
    const hasDec = records.some(d => d.period_start?.startsWith('2025-12'));

    const octDecCount = (hasOct ? 1 : 0) + (hasNov ? 1 : 0) + (hasDec ? 1 : 0);

    // Check data quality for Oct-Dec
    const octRec = records.find(d => d.period_start?.startsWith('2025-10'));
    const novRec = records.find(d => d.period_start?.startsWith('2025-11'));
    const decRec = records.find(d => d.period_start?.startsWith('2025-12'));

    const octQuality = octRec?.data_quality || 'missing';
    const novQuality = novRec?.data_quality || 'missing';
    const decQuality = decRec?.data_quality || 'missing';

    const octDecStatus = octDecCount === 3 ? '✅ Complete' :
                         octDecCount > 0 ? '⚠️  Partial' :
                         '❌ Missing';

    const dataQualitySummary = octDecCount === 3 ? `${octQuality}/${novQuality}/${decQuality}` :
                               octDecCount > 0 ? 'partial' :
                               'none';

    const nameDisplay = name.substring(0, 30).padEnd(30);

    console.log(
      `${nameDisplay}  ${janSep.toString().padStart(7)}  ` +
      `${(hasOct ? '✅' : '❌').padStart(3)}  ${(hasNov ? '✅' : '❌').padStart(3)}  ${(hasDec ? '✅' : '❌').padStart(3)}  ` +
      `${octDecStatus.padEnd(15)}  ${dataQualitySummary}`
    );

    results.push({
      name,
      code,
      scope,
      janSep,
      octDecCount,
      octQuality,
      novQuality,
      decQuality,
      octDecStatus
    });
  }

  console.log('\n\n📊 SUMMARY');
  console.log('═'.repeat(120));

  const withFullYear = results.filter(r => r.janSep === 9 && r.octDecCount === 3);
  const withJanSepOnly = results.filter(r => r.janSep > 0 && r.octDecCount === 0);
  const withPartialOctDec = results.filter(r => r.octDecCount > 0 && r.octDecCount < 3);

  console.log(`\n✅ Metrics with full year (Jan-Dec): ${withFullYear.length}`);
  console.log(`⚠️  Metrics with Jan-Sep only: ${withJanSepOnly.length}`);
  console.log(`⚠️  Metrics with partial Oct-Dec: ${withPartialOctDec.length}`);

  // Check if Oct-Dec were from our ML replacement script
  console.log('\n\n🔍 CHECKING IF OCT-DEC ARE ML FORECASTS');
  console.log('═'.repeat(120));

  let mlForecastCount = 0;
  let originalDataCount = 0;

  for (const result of results) {
    if (result.octDecCount > 0) {
      const records = metricMap.get(
        Array.from(metricMap.keys()).find(k => {
          const recs = metricMap.get(k)!;
          return recs[0].metrics_catalog.code === result.code;
        })!
      )!;

      const octRec = records.find(d => d.period_start?.startsWith('2025-10'));

      if (octRec) {
        const isMLForecast = octRec.data_quality === 'calculated' &&
                           octRec.metadata?.forecast_model === 'EnterpriseForecast';

        if (isMLForecast) {
          mlForecastCount++;
          console.log(`   ✅ ${result.name}: ML Forecast (${octRec.metadata.forecast_method})`);
        } else {
          originalDataCount++;
          console.log(`   ⚠️  ${result.name}: Original data (quality: ${octRec.data_quality})`);
        }
      }
    }
  }

  console.log('\n\n📈 OCT-DEC DATA SOURCE BREAKDOWN');
  console.log('═'.repeat(120));
  console.log(`\n✅ ML Forecasts: ${mlForecastCount} metrics`);
  console.log(`⚠️  Original/Other: ${originalDataCount} metrics`);
  console.log(`❌ No Oct-Dec data: ${results.length - mlForecastCount - originalDataCount} metrics`);

  // Show which metrics are missing Oct-Dec
  if (withJanSepOnly.length > 0) {
    console.log('\n\n❌ METRICS MISSING OCT-DEC 2025 DATA');
    console.log('═'.repeat(120));
    withJanSepOnly.forEach(r => {
      console.log(`   • ${r.name} (${r.scope.replace('scope_', 'Scope ')}) - Has Jan-Sep (${r.janSep} months) but missing Oct-Dec`);
    });
  }

  // Check if our replacement script created Oct-Dec for all metrics
  console.log('\n\n💡 ANALYSIS');
  console.log('═'.repeat(120));

  if (withJanSepOnly.length > 0) {
    console.log('\n⚠️  WARNING: Some metrics have Jan-Sep data but NO Oct-Dec forecast!');
    console.log('    This means our ML replacement script only updated Jan-Sep, not Oct-Dec.');
    console.log(`    ${withJanSepOnly.length} metrics are missing Q4 2025 projections.`);
  }

  if (mlForecastCount === results.length) {
    console.log('\n✅ All metrics have ML forecasts for Oct-Dec!');
  } else if (mlForecastCount > 0) {
    console.log(`\n⚠️  Only ${mlForecastCount} out of ${results.length} metrics have ML forecasts for Oct-Dec.`);
    console.log(`    ${results.length - mlForecastCount} metrics are missing ML forecasts for Q4.`);
  } else {
    console.log('\n❌ NO metrics have ML forecasts for Oct-Dec!');
    console.log('    The replacement script may not have created Oct-Dec records.');
  }

  console.log('\n' + '═'.repeat(120));
}

checkOctDecForecast().catch(console.error);
