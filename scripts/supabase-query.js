const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== METRICS_DATA TABLE STRUCTURE ===\n');
  
  const { data: sample } = await supabase
    .from('metrics_data')
    .select('*')
    .limit(1);
  
  if (sample && sample.length > 0) {
    console.log('Columns in metrics_data:');
    Object.keys(sample[0]).sort().forEach(col => {
      console.log('  -', col);
    });
  }
  
  console.log('\n=== ALL METRICS IN CATALOG ===\n');
  
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .order('scope')
    .order('category')
    .order('code');
  
  console.log('Total metrics:', metrics.length, '\n');
  
  const byScope = {};
  metrics.forEach(m => {
    if (!byScope[m.scope]) byScope[m.scope] = [];
    byScope[m.scope].push(m);
  });
  
  Object.keys(byScope).forEach(scope => {
    console.log('='.repeat(70));
    console.log(scope.toUpperCase(), '(' + byScope[scope].length + ' metrics)');
    console.log('='.repeat(70));
    
    const byCategory = {};
    byScope[scope].forEach(m => {
      if (!byCategory[m.category]) byCategory[m.category] = [];
      byCategory[m.category].push(m);
    });
    
    Object.keys(byCategory).forEach(category => {
      console.log('\n' + category + ':');
      byCategory[category].forEach(m => {
        console.log('  ' + (m.is_active ? '✓' : '✗'), m.code);
        console.log('    ID:', m.id);
        console.log('    Name:', m.name);
        console.log('    Unit:', m.unit, '| EF:', m.emission_factor || 'N/A', m.emission_factor_unit || '');
        if (m.subcategory) console.log('    Subcategory:', m.subcategory);
      });
    });
    console.log('');
  });
  
  console.log('\n=== DATA COUNTS ===\n');
  const { count } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact', head: true });
  
  console.log('Total rows in metrics_data:', count);
  
  const { data: dataCounts } = await supabase
    .from('metrics_data')
    .select('metric_id');
  
  const countByMetric = {};
  dataCounts.forEach(row => {
    countByMetric[row.metric_id] = (countByMetric[row.metric_id] || 0) + 1;
  });
  
  console.log('\nRows per metric (top 10):');
  Object.entries(countByMetric)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([metricId, count]) => {
      const metric = metrics.find(m => m.id === metricId);
      console.log('  ' + count, 'rows -', metric?.code || metricId);
    });
})();
