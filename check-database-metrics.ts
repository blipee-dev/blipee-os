import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database...\n');

  // 1. Check metrics_catalog table
  console.log('1️⃣ Checking metrics_catalog table...');
  const { data: metricsData, error: metricsError } = await supabase
    .from('metrics_catalog')
    .select('*')
    .limit(10);

  if (metricsError) {
    console.error('❌ Error fetching metrics_catalog:', metricsError);
  } else {
    console.log(`✅ Found ${metricsData?.length || 0} metrics in catalog`);
    if (metricsData && metricsData.length > 0) {
      console.log('Sample metrics:');
      metricsData.slice(0, 3).forEach(m => {
        console.log(`  - ${m.name} (${m.code}): ${m.unit} - Scope ${m.scope}`);
      });
    }
  }

  // 2. Check organizations table
  console.log('\n2️⃣ Checking organizations table...');
  const { data: orgsData, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, industry')
    .limit(5);

  if (orgsError) {
    console.error('❌ Error fetching organizations:', orgsError);
  } else {
    console.log(`✅ Found ${orgsData?.length || 0} organizations`);
    if (orgsData && orgsData.length > 0) {
      console.log('Organizations:');
      orgsData.forEach(o => {
        console.log(`  - ${o.name} (${o.id}) - Industry: ${o.industry || 'N/A'}`);
      });
    }
  }

  // 3. Check organization_metrics table (metrics selected by orgs)
  console.log('\n3️⃣ Checking organization_metrics table...');
  const { data: orgMetricsData, error: orgMetricsError } = await supabase
    .from('organization_metrics')
    .select(`
      organization_id,
      metric_id,
      reporting_frequency,
      organizations (name),
      metrics_catalog (name, code)
    `)
    .limit(10);

  if (orgMetricsError) {
    console.error('❌ Error fetching organization_metrics:', orgMetricsError);
  } else {
    console.log(`✅ Found ${orgMetricsData?.length || 0} organization-metric assignments`);
    if (orgMetricsData && orgMetricsData.length > 0) {
      console.log('Sample assignments:');
      orgMetricsData.slice(0, 3).forEach(om => {
        console.log(`  - ${om.organizations?.name} tracks ${om.metrics_catalog?.name} (${om.reporting_frequency})`);
      });
    }
  }

  // 4. Check metrics_data table (actual measurements)
  console.log('\n4️⃣ Checking metrics_data table...');
  const { data: dataEntries, error: dataError } = await supabase
    .from('metrics_data')
    .select(`
      id,
      organization_id,
      metric_id,
      value,
      unit,
      period_start,
      period_end,
      co2e_emissions,
      metrics_catalog (name, code)
    `)
    .order('created_at', { ascending: false })
    .limit(10);

  if (dataError) {
    console.error('❌ Error fetching metrics_data:', dataError);
  } else {
    console.log(`✅ Found ${dataEntries?.length || 0} data entries`);
    if (dataEntries && dataEntries.length > 0) {
      console.log('Recent data entries:');
      dataEntries.slice(0, 3).forEach(d => {
        console.log(`  - ${d.metrics_catalog?.name}: ${d.value} ${d.unit} (${d.period_start} to ${d.period_end}) = ${d.co2e_emissions} tCO2e`);
      });
    }
  }

  // 5. Check organization_members to see user-org links
  console.log('\n5️⃣ Checking organization_members table...');
  const { data: membersData, error: membersError } = await supabase
    .from('organization_members')
    .select('user_id, organization_id, role')
    .limit(10);

  if (membersError) {
    console.error('❌ Error fetching organization_members:', membersError);
  } else {
    console.log(`✅ Found ${membersData?.length || 0} organization members`);
    if (membersData && membersData.length > 0) {
      console.log('Sample members:');
      membersData.slice(0, 3).forEach(m => {
        console.log(`  - User ${m.user_id.substring(0, 8)}... in org ${m.organization_id.substring(0, 8)}... as ${m.role}`);
      });
    }
  }

  // 6. Check if tables exist but are empty
  console.log('\n6️⃣ Summary:');
  const { count: metricsCount } = await supabase
    .from('metrics_catalog')
    .select('*', { count: 'exact', head: true });

  const { count: orgCount } = await supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true });

  const { count: orgMetricsCount } = await supabase
    .from('organization_metrics')
    .select('*', { count: 'exact', head: true });

  const { count: dataCount } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact', head: true });

  console.log(`
📊 Database Status:
  - metrics_catalog: ${metricsCount || 0} total metrics
  - organizations: ${orgCount || 0} total organizations
  - organization_metrics: ${orgMetricsCount || 0} metric assignments
  - metrics_data: ${dataCount || 0} data entries
  `);

  if ((metricsCount || 0) === 0) {
    console.log('⚠️  No metrics in catalog - need to populate metrics_catalog table');
  }
  if ((orgMetricsCount || 0) === 0) {
    console.log('⚠️  No metrics assigned to organizations - need to assign metrics');
  }
  if ((dataCount || 0) === 0) {
    console.log('⚠️  No data entries - system is ready but no data has been entered');
  }
}

checkDatabase().catch(console.error);