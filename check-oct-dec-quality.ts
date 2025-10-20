import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkOctDecQuality() {
  console.log('🔍 CHECKING OCT-DEC 2025 DATA QUALITY\n');
  console.log('='.repeat(120));

  // Get Jan-Sep data
  const { data: janSep } = await supabaseAdmin
    .from('metrics_data')
    .select('period_start, co2e_emissions, metrics_catalog!inner(name, code)')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2025-10-01')
    .eq('data_quality', 'calculated')
    .order('period_start');

  // Get Oct-Dec data
  const { data: octDec } = await supabaseAdmin
    .from('metrics_data')
    .select('period_start, co2e_emissions, metadata, metrics_catalog!inner(name, code)')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-10-01')
    .lt('period_start', '2026-01-01')
    .eq('data_quality', 'calculated')
    .order('period_start');

  console.log('Jan-Sep records:', janSep?.length || 0);
  console.log('Oct-Dec records:', octDec?.length || 0);

  // Compare totals by metric
  const metricTotals = new Map<string, any>();

  janSep?.forEach(d => {
    const metric = d.metrics_catalog.name;
    if (!metricTotals.has(metric)) {
      metricTotals.set(metric, { janSep: 0, octDec: 0, janSepCount: 0, octDecCount: 0 });
    }
    const totals = metricTotals.get(metric)!;
    totals.janSep += (d.co2e_emissions || 0) / 1000;
    totals.janSepCount++;
  });

  octDec?.forEach(d => {
    const metric = d.metrics_catalog.name;
    if (!metricTotals.has(metric)) {
      metricTotals.set(metric, { janSep: 0, octDec: 0, janSepCount: 0, octDecCount: 0 });
    }
    const totals = metricTotals.get(metric)!;
    totals.octDec += (d.co2e_emissions || 0) / 1000;
    totals.octDecCount++;
  });

  console.log('\n📊 JAN-SEP vs OCT-DEC COMPARISON (tCO2e)');
  console.log('='.repeat(120));
  console.log('Metric                              Jan-Sep (9mo)  Oct-Dec (3mo)  Expected (3mo)  Variance');
  console.log('-'.repeat(120));

  const sorted = Array.from(metricTotals.entries())
    .filter(([_, v]) => v.janSep > 0.01 || v.octDec > 0.01)
    .sort((a, b) => b[1].janSep - a[1].janSep);

  const issues: any[] = [];

  sorted.forEach(([metric, data]) => {
    const avgMonthly = data.janSep / data.janSepCount;
    const expected3Month = avgMonthly * 3;
    const variance = data.octDec > 0 ? ((data.octDec - expected3Month) / expected3Month) * 100 : 0;

    const warning = Math.abs(variance) > 50 ? '⚠️' : '';
    const metricDisplay = metric.substring(0, 35).padEnd(35);

    console.log(
      metricDisplay +
      data.janSep.toFixed(2).padStart(15) +
      data.octDec.toFixed(2).padStart(15) +
      expected3Month.toFixed(2).padStart(15) +
      (variance > 0 ? '+' : '') + variance.toFixed(1).padStart(9) + '%' +
      ' ' + warning
    );

    if (Math.abs(variance) > 50) {
      issues.push({ metric, variance, janSep: data.janSep, octDec: data.octDec });
    }
  });

  if (issues.length > 0) {
    console.log('\n\n⚠️  SIGNIFICANT VARIANCES DETECTED (>50%):');
    console.log('='.repeat(120));
    issues.forEach(issue => {
      console.log('\n• ' + issue.metric);
      console.log('  Jan-Sep avg/month: ' + (issue.janSep / 9).toFixed(4) + ' tCO2e');
      console.log('  Oct-Dec total: ' + issue.octDec.toFixed(4) + ' tCO2e');
      console.log('  Variance: ' + (issue.variance > 0 ? '+' : '') + issue.variance.toFixed(1) + '%');
    });
  } else {
    console.log('\n\n✅ No significant variances detected. Oct-Dec data looks consistent with Jan-Sep patterns.');
  }

  // Sample Oct-Dec records
  console.log('\n\n📋 SAMPLE OCT-DEC RECORDS:');
  console.log('='.repeat(120));
  octDec?.slice(0, 5).forEach(d => {
    console.log('Period:', d.period_start);
    console.log('Metric:', d.metrics_catalog.name);
    console.log('Emissions:', (d.co2e_emissions / 1000).toFixed(4), 'tCO2e');
    console.log('Method:', d.metadata?.forecast_method || 'unknown');
    console.log('Training months:', d.metadata?.training_months || 'unknown');
    console.log('-'.repeat(120));
  });

  console.log('\n='.repeat(120));
}

checkOctDecQuality().catch(console.error);
