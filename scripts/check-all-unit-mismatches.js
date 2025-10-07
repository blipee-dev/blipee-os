const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== CHECKING ALL METRICS DATA UNITS ===\n');

  // Get all metrics from catalog
  const { data: allMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, unit');

  console.log('Total metrics in catalog:', allMetrics.length);

  // Get all data records
  const { data: allData } = await supabase
    .from('metrics_data')
    .select('id, metric_id, unit, organization_id');

  console.log('Total data records:', allData.length);

  // Find mismatches
  const mismatches = allData.filter(d => {
    const metric = allMetrics.find(m => m.id === d.metric_id);
    return metric && d.unit !== metric.unit;
  });

  console.log('Records with wrong unit:', mismatches.length);
  console.log('Percentage:', ((mismatches.length / allData.length) * 100).toFixed(1) + '%\n');

  // Group by current wrong unit
  const byWrongUnit = {};
  mismatches.forEach(m => {
    byWrongUnit[m.unit] = (byWrongUnit[m.unit] || 0) + 1;
  });

  console.log('Wrong units breakdown:');
  Object.entries(byWrongUnit).sort((a, b) => b[1] - a[1]).forEach(([unit, count]) => {
    console.log('  ', unit, ':', count, 'records');
  });

  // Show which metrics have the most errors
  const byMetric = {};
  mismatches.forEach(m => {
    const metric = allMetrics.find(met => met.id === m.metric_id);
    if (metric) {
      if (!byMetric[metric.code]) {
        byMetric[metric.code] = { count: 0, correctUnit: metric.unit, wrongUnit: m.unit };
      }
      byMetric[metric.code].count++;
    }
  });

  console.log('\nTop 10 metrics with wrong units:');
  Object.entries(byMetric)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .forEach(([code, info]) => {
      console.log('  ', code, ':', info.count, 'records | Should be:', info.correctUnit, '| Currently:', info.wrongUnit);
    });

  // Check organizations affected
  const orgsAffected = new Set(mismatches.map(m => m.organization_id));
  console.log('\nOrganizations affected:', orgsAffected.size);
})();
