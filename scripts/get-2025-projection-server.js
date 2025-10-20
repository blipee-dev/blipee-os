// Server-side script to calculate 2025 projections using Supabase Admin
import { supabaseAdmin } from '../src/lib/supabase/admin.js';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function get2025Projections() {
  console.log('\n📊 2025 ENERGY CONSUMPTION PROJECTION\n');
  console.log('='.repeat(100));

  const energyCategories = [
    'Electricity', 'Purchased Energy', 'Purchased Heating', 'Purchased Cooling', 'Purchased Steam',
    'Natural Gas', 'Heating Oil', 'Diesel', 'Gasoline', 'Propane',
    'District Heating', 'District Cooling', 'Steam'
  ];

  // Get metrics
  const { data: metrics, error: metricsError } = await supabaseAdmin
    .from('metrics_catalog')
    .select('id, name, category, scope, unit')
    .in('category', energyCategories)
    .in('scope', ['scope_1', 'scope_2']);

  if (metricsError) {
    console.error('Error:', metricsError);
    return;
  }

  console.log(`\nFound ${metrics.length} energy metrics\n`);

  // Get 2025 data
  const metricIds = metrics.map(m => m.id);
  const { data: ytdData, error: ytdError } = await supabaseAdmin
    .from('metrics_data')
    .select('metric_id, value, co2e_emissions, period_start')
    .eq('organization_id', organizationId)
    .in('metric_id', metricIds)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  if (ytdError) {
    console.error('Error:', ytdError);
    return;
  }

  console.log(`Found ${ytdData.length} data records for 2025\n`);

  // Aggregate
  const metricMap = new Map();
  ytdData.forEach(record => {
    if (!metricMap.has(record.metric_id)) {
      metricMap.set(record.metric_id, {
        value: 0,
        emissions: 0,
        months: new Set()
      });
    }
    const m = metricMap.get(record.metric_id);
    m.value += parseFloat(record.value || 0);
    m.emissions += parseFloat(record.co2e_emissions || 0);
    m.months.add(record.period_start.substring(0, 7));
  });

  // Group by category
  const byCategory = new Map();
  metrics.forEach(metric => {
    const data = metricMap.get(metric.id);
    if (!data) return;

    const months = data.months.size;
    const ytd = data.value;
    const projected = months > 0 && months < 12 ? (ytd / months) * 12 : ytd;

    if (!byCategory.has(metric.category)) {
      byCategory.set(metric.category, {
        metrics: [],
        totalYtd: 0,
        totalProjected: 0
      });
    }

    const cat = byCategory.get(metric.category);
    cat.metrics.push({
      name: metric.name,
      unit: metric.unit,
      months,
      ytd: Math.round(ytd * 100) / 100,
      projected: Math.round(projected * 100) / 100
    });
    cat.totalYtd += ytd;
    cat.totalProjected += projected;
  });

  // Display
  Array.from(byCategory.entries()).forEach(([category, data]) => {
    console.log(`\n📁 ${category.toUpperCase()}`);
    console.log('-'.repeat(100));

    data.metrics.forEach(m => {
      console.log(`\n  ${m.name}`);
      console.log(`    Months: ${m.months}`);
      console.log(`    YTD: ${m.ytd} ${m.unit}`);
      console.log(`    Projected 2025: ${m.projected} ${m.unit}`);
    });

    console.log(`\n  📊 CATEGORY TOTAL:`);
    console.log(`    YTD: ${Math.round(data.totalYtd * 100) / 100}`);
    console.log(`    Projected: ${Math.round(data.totalProjected * 100) / 100}`);
  });

  console.log('\n' + '='.repeat(100) + '\n');
}

get2025Projections().catch(console.error).finally(() => process.exit(0));
