const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function analyzeMetricsData() {
  // Get PLMJ org
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'PLMJ')
    .single();

  if (!org) {
    console.log('PLMJ organization not found');
    return;
  }

  // Get all metrics data for PLMJ
  const { data: metricsData } = await supabase
    .from('metrics_data')
    .select('site_id, metric_id, metrics_catalog!inner(name, code)')
    .eq('organization_id', org.id);

  // Get sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', org.id);

  // Group metrics by site
  const metricsBySite = {};
  sites?.forEach(site => {
    metricsBySite[site.name] = new Set();
  });

  metricsData?.forEach(data => {
    const site = sites?.find(s => s.id === data.site_id);
    if (site) {
      metricsBySite[site.name].add(data.metrics_catalog?.name || 'Unknown');
    }
  });

  console.log('\nCurrent metrics in metrics_data table by site:');
  Object.entries(metricsBySite).forEach(([site, metrics]) => {
    console.log('\n' + site + ':');
    if (metrics.size === 0) {
      console.log('  (no data)');
    } else {
      Array.from(metrics).forEach(m => console.log('  - ' + m));
    }
  });

  // Check site_metrics table
  const { data: siteMetrics } = await supabase
    .from('site_metrics')
    .select(`
      site_id,
      sites!inner(name),
      metrics_catalog!inner(name, code)
    `)
    .eq('organization_id', org.id);

  const siteMetricsGrouped = {};
  sites?.forEach(site => {
    siteMetricsGrouped[site.name] = new Set();
  });

  siteMetrics?.forEach(sm => {
    if (sm.sites?.name) {
      siteMetricsGrouped[sm.sites.name].add(sm.metrics_catalog?.name || 'Unknown');
    }
  });

  console.log('\n\nMetrics configured in site_metrics table:');
  Object.entries(siteMetricsGrouped).forEach(([site, metrics]) => {
    console.log('\n' + site + ':');
    if (metrics.size === 0) {
      console.log('  (none configured)');
    } else {
      Array.from(metrics).forEach(m => console.log('  - ' + m));
    }
  });

  // Based on the raw data you provided, here's what SHOULD be there
  console.log('\n\n=== MISSING METRICS ANALYSIS ===');

  const expectedMetrics = {
    'Lisboa - FPM41': [
      'Grid Electricity',
      'Purchased Cooling',
      'Purchased Heating',
      'EV Charging',
      'Air Travel',
      'Rail Travel',
      'Water Supply',
      'Wastewater',
      'Waste Recycled',
      'Waste Landfill',
      'Waste Composted',
      'Waste to Energy',
      'E-Waste'
    ],
    'Porto - POP': [
      'Grid Electricity',
      'Purchased Cooling',
      'Purchased Heating',
      'EV Charging',
      'Water Supply',
      'Wastewater',
      'Waste Recycled',
      'Waste Composted'
    ],
    'Faro': [
      'Grid Electricity',
      'Water Supply',
      'Wastewater',
      'Waste Recycled',
      'Waste Composted'
    ]
  };

  Object.entries(expectedMetrics).forEach(([site, expected]) => {
    const current = metricsBySite[site] || new Set();
    const missing = expected.filter(m => !current.has(m));

    if (missing.length > 0) {
      console.log(`\n${site} is missing:`);
      missing.forEach(m => console.log(`  - ${m}`));
    } else {
      console.log(`\n${site}: ✓ All expected metrics have data`);
    }
  });
}

analyzeMetricsData().catch(console.error);