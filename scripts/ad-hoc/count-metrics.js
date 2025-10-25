require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function getMetricDetails() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Get unique metric IDs with 2025 data
  const { data: metricsData } = await supabaseAdmin
    .from('metrics_data')
    .select('metric_id, metrics_catalog(code, name, scope)')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lte('period_start', '2025-12-31');

  const uniqueMetrics = new Map();
  metricsData?.forEach(item => {
    if (item.metrics_catalog && !uniqueMetrics.has(item.metric_id)) {
      uniqueMetrics.set(item.metric_id, {
        code: item.metrics_catalog.code,
        name: item.metrics_catalog.name,
        scope: item.metrics_catalog.scope
      });
    }
  });

  console.log('\n📊 Active Metrics in 2025: ' + uniqueMetrics.size);
  console.log('\nBreakdown by Scope:');

  const byScope = { 'Scope 1': 0, 'Scope 2': 0, 'Scope 3': 0 };
  uniqueMetrics.forEach(metric => {
    byScope[metric.scope] = (byScope[metric.scope] || 0) + 1;
  });

  console.log('  Scope 1:', byScope['Scope 1'] || 0, 'metrics');
  console.log('  Scope 2:', byScope['Scope 2'] || 0, 'metrics');
  console.log('  Scope 3:', byScope['Scope 3'] || 0, 'metrics');

  // Get total catalog
  const { data: catalog } = await supabaseAdmin
    .from('metrics_catalog')
    .select('scope');

  const catalogByScope = { 'Scope 1': 0, 'Scope 2': 0, 'Scope 3': 0 };
  catalog?.forEach(m => {
    catalogByScope[m.scope] = (catalogByScope[m.scope] || 0) + 1;
  });

  console.log('\n📚 Available in Catalog: ' + (catalog?.length || 0));
  console.log('  Scope 1:', catalogByScope['Scope 1'] || 0, 'metrics');
  console.log('  Scope 2:', catalogByScope['Scope 2'] || 0, 'metrics');
  console.log('  Scope 3:', catalogByScope['Scope 3'] || 0, 'metrics');

  console.log('\n📈 Coverage: ' + ((uniqueMetrics.size / catalog.length * 100).toFixed(1)) + '%');
}

getMetricDetails().catch(console.error);
