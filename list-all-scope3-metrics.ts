import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function listAllScope3() {
  console.log('📋 ALL SCOPE 3 EMISSIONS CATEGORIES\n');
  console.log('='.repeat(120));

  // Fetch all Scope 3 metrics from catalog
  const { data: catalogData, error: catalogError } = await supabaseAdmin
    .from('metrics_catalog')
    .select('id, code, name, category, unit, scope')
    .eq('scope', 'scope_3')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (catalogError) {
    console.error('❌ Error:', catalogError);
    return;
  }

  console.log(`\n📊 Found ${catalogData.length} Scope 3 metrics in catalog\n`);

  // Fetch 2025 data to see which metrics have data
  const { data: data2025, error: error2025 } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      metric_id,
      period_start,
      co2e_emissions,
      data_quality,
      metrics_catalog!inner(code, name, category)
    `)
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.scope', 'scope_3')
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  if (error2025) {
    console.error('❌ Error fetching 2025 data:', error2025);
    return;
  }

  // Group by metric_id to calculate totals
  const emissionsByMetric = new Map<string, { total: number; months: number }>();
  data2025?.forEach(d => {
    const metricId = d.metric_id;
    const emissions = (d.co2e_emissions || 0) / 1000;

    if (!emissionsByMetric.has(metricId)) {
      emissionsByMetric.set(metricId, { total: 0, months: 0 });
    }

    const current = emissionsByMetric.get(metricId)!;
    current.total += emissions;
    current.months++;
  });

  // Group by category
  const byCategory = new Map<string, any[]>();
  catalogData.forEach(metric => {
    const category = metric.category || 'Other';
    if (!byCategory.has(category)) {
      byCategory.set(category, []);
    }

    const metricData = emissionsByMetric.get(metric.id);
    byCategory.get(category)!.push({
      ...metric,
      total2025: metricData?.total || 0,
      months2025: metricData?.months || 0,
      hasData: (metricData?.total || 0) > 0
    });
  });

  // Sort categories by total emissions
  const sortedCategories = Array.from(byCategory.entries())
    .map(([category, metrics]) => ({
      category,
      metrics,
      totalEmissions: metrics.reduce((sum, m) => sum + m.total2025, 0)
    }))
    .sort((a, b) => b.totalEmissions - a.totalEmissions);

  let grandTotal = 0;
  let metricsWithData = 0;
  let metricsWithoutData = 0;

  sortedCategories.forEach(({ category, metrics, totalEmissions }) => {
    console.log(`\n${'▼'.repeat(60)}`);
    console.log(`📁 ${category.toUpperCase()} (${totalEmissions.toFixed(2)} tCO2e)`);
    console.log('─'.repeat(120));
    console.log('Code                                      Name                                   2025 Emissions    Months  Status');
    console.log('─'.repeat(120));

    metrics.forEach(m => {
      const code = m.code.substring(0, 40).padEnd(40);
      const name = m.name.substring(0, 40).padEnd(40);
      const emissions = m.total2025.toFixed(2).padStart(16);
      const months = m.months2025 > 0 ? m.months2025.toString().padStart(8) : 'N/A'.padStart(8);
      const status = m.hasData ? '✅ Has data' : '⚠️  No data';

      console.log(`${code}  ${name}  ${emissions}  ${months}  ${status}`);

      grandTotal += m.total2025;
      if (m.hasData) {
        metricsWithData++;
      } else {
        metricsWithoutData++;
      }
    });
  });

  console.log('\n\n📊 SUMMARY BY CATEGORY');
  console.log('═'.repeat(120));
  console.log('Category                          Total 2025 Emissions    % of Scope 3    Metrics Count    Metrics with Data');
  console.log('═'.repeat(120));

  sortedCategories.forEach(({ category, metrics, totalEmissions }) => {
    const percentage = grandTotal > 0 ? (totalEmissions / grandTotal) * 100 : 0;
    const metricsCount = metrics.length;
    const metricsActive = metrics.filter(m => m.hasData).length;

    console.log(
      `${category.padEnd(32)}  ${totalEmissions.toFixed(2).padStart(22)}  ` +
      `${percentage.toFixed(1).padStart(13)}%  ${metricsCount.toString().padStart(15)}  ` +
      `${metricsActive}/${metricsCount}`
    );
  });

  console.log('─'.repeat(120));
  console.log(
    `${'TOTAL SCOPE 3'.padEnd(32)}  ${grandTotal.toFixed(2).padStart(22)}  ` +
    `${'100.0'.padStart(13)}%  ${catalogData.length.toString().padStart(15)}  ` +
    `${metricsWithData}/${catalogData.length}`
  );

  console.log('\n\n🔍 KEY INSIGHTS');
  console.log('═'.repeat(120));

  const top5 = sortedCategories.slice(0, 5);
  const top5Total = top5.reduce((sum, c) => sum + c.totalEmissions, 0);
  const top5Percentage = (top5Total / grandTotal) * 100;

  console.log(`\n1️⃣  Top 5 Categories represent ${top5Percentage.toFixed(1)}% of total Scope 3 emissions:`);
  top5.forEach((c, i) => {
    const pct = (c.totalEmissions / grandTotal) * 100;
    console.log(`   ${i + 1}. ${c.category}: ${c.totalEmissions.toFixed(2)} tCO2e (${pct.toFixed(1)}%)`);
  });

  console.log(`\n2️⃣  Metrics Status:`);
  console.log(`   ✅ Metrics with 2025 data: ${metricsWithData}`);
  console.log(`   ⚠️  Metrics without data: ${metricsWithoutData}`);
  console.log(`   📊 Total metrics: ${catalogData.length}`);

  console.log(`\n3️⃣  Data Coverage: ${((metricsWithData / catalogData.length) * 100).toFixed(1)}%`);

  // Find categories with no data
  const emptyCategories = sortedCategories.filter(c => c.totalEmissions === 0);
  if (emptyCategories.length > 0) {
    console.log(`\n4️⃣  Categories with NO data (${emptyCategories.length}):`);
    emptyCategories.forEach(c => {
      console.log(`   • ${c.category} (${c.metrics.length} metrics)`);
    });
  }

  console.log('\n' + '═'.repeat(120));
}

listAllScope3().catch(console.error);
