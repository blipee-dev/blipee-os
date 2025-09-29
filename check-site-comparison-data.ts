import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSiteComparisonData() {
  const orgId = 'c0e5d69f-ece9-4709-a71f-4db9e16a0c5d';

  // Check sites
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .eq('organization_id', orgId);

  if (sitesError) {
    console.error('Error fetching sites:', sitesError);
    return;
  }

  console.log('=== SITES ===');
  console.log('Found', sites?.length, 'sites:');
  sites?.forEach(site => {
    console.log(`- ${site.name} (ID: ${site.id}, Area: ${site.area_m2}m²)`);
  });

  // Check metrics_data with site_id
  const { data: metricsWithSite, error: metricsError } = await supabase
    .from('metrics_data')
    .select('site_id, metric_type, value, date')
    .eq('organization_id', orgId)
    .not('site_id', 'is', null)
    .order('date', { ascending: false })
    .limit(20);

  console.log('\n=== METRICS WITH SITE_ID ===');
  console.log('Found', metricsWithSite?.length, 'metrics with site_id:');

  // Group by site_id
  const metricsBySite = new Map();
  metricsWithSite?.forEach(m => {
    if (!metricsBySite.has(m.site_id)) {
      metricsBySite.set(m.site_id, []);
    }
    metricsBySite.get(m.site_id).push(m);
  });

  metricsBySite.forEach((metrics, siteId) => {
    const site = sites?.find(s => s.id === siteId);
    console.log(`\nSite: ${site?.name || 'Unknown'} (${siteId})`);
    metrics.slice(0, 3).forEach(m => {
      console.log(`  - ${m.metric_type}: ${m.value} (${m.date})`);
    });
  });

  // Check metrics without site_id
  const { data: metricsNoSite } = await supabase
    .from('metrics_data')
    .select('metric_type, value, date')
    .eq('organization_id', orgId)
    .is('site_id', null)
    .order('date', { ascending: false })
    .limit(10);

  console.log('\n=== METRICS WITHOUT SITE_ID ===');
  console.log('Found', metricsNoSite?.length, 'metrics without site_id:');
  metricsNoSite?.slice(0, 5).forEach(m => {
    console.log(`- ${m.metric_type}: ${m.value} (${m.date})`);
  });

  // Summary
  const siteIds = sites?.map(s => s.id) || [];
  const metricSiteIds = [...new Set(metricsWithSite?.map(m => m.site_id).filter(Boolean))];

  console.log('\n=== SUMMARY ===');
  console.log('Site IDs from sites table:', siteIds);
  console.log('Site IDs from metrics_data:', metricSiteIds);
  console.log('Matching site IDs:', siteIds.filter(id => metricSiteIds.includes(id)));

  if (metricSiteIds.length === 0) {
    console.log('\n⚠️  NO metrics have site_id values!');
    console.log('This explains why the site comparison chart is empty.');
    console.log('All metrics_data entries have null site_id.');
  }
}

checkSiteComparisonData().catch(console.error);