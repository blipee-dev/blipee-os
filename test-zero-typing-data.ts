import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testZeroTypingData() {
  console.log('🔍 Testing Zero-Typing Data Fetching\n');

  // Get user's organization
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error('Error fetching users:', userError);
    return;
  }

  const user = userData.users.find(u => u.email?.includes('jose') || u.email?.includes('pinto'));
  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('✅ User found:', user.email);

  // Get organization from app_users
  const { data: appUser } = await supabase
    .from('app_users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const organizationId = appUser?.organization_id;
  console.log('📦 Organization ID:', organizationId || 'NOT FOUND');

  if (!organizationId) {
    console.log('\n❌ No organization found for user');
    return;
  }

  // Fetch sites
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name, city, country')
    .eq('organization_id', organizationId);

  console.log('\n📍 SITES:', sites?.length || 0);
  if (sites && sites.length > 0) {
    sites.forEach(site => {
      console.log(`  - ${site.name} (${site.city}, ${site.country})`);
    });
  } else {
    console.log('  No sites found for this organization');
    console.log('  Sites error:', sitesError);
  }

  // Fetch team members
  const { data: teamMembers, error: teamError } = await supabase
    .from('app_users')
    .select('id, name, email, role')
    .eq('organization_id', organizationId);

  console.log('\n👥 TEAM MEMBERS:', teamMembers?.length || 0);
  if (teamMembers && teamMembers.length > 0) {
    teamMembers.forEach(member => {
      console.log(`  - ${member.name || member.email} (${member.role})`);
    });
  } else {
    console.log('  Team error:', teamError);
  }

  // Fetch alerts
  const { data: alerts, error: alertsError } = await supabase
    .from('alerts')
    .select('id, severity, message, resolved')
    .eq('organization_id', organizationId)
    .eq('resolved', false);

  console.log('\n🚨 ACTIVE ALERTS:', alerts?.length || 0);
  if (alerts && alerts.length > 0) {
    alerts.forEach(alert => {
      console.log(`  - [${alert.severity}] ${alert.message}`);
    });
  } else {
    console.log('  No active alerts');
    console.log('  Alerts error:', alertsError);
  }

  // Fetch devices (if sites exist)
  if (sites && sites.length > 0) {
    const siteIds = sites.map(s => s.id);
    const { count: devicesCount, error: devicesError } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .in('site_id', siteIds);

    console.log('\n⚙️ DEVICES:', devicesCount || 0);
    if (devicesError) {
      console.log('  Devices error:', devicesError);
    }
  }

  // Fetch metrics data
  const { data: metrics, error: metricsError } = await supabase
    .from('metrics_data')
    .select('id, value, created_at')
    .eq('organization_id', organizationId)
    .limit(5);

  console.log('\n📊 METRICS DATA POINTS:', metrics?.length || 0);
  if (metricsError) {
    console.log('  Metrics error:', metricsError);
  }

  // Check if organization exists
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('id', organizationId)
    .single();

  console.log('\n🏢 ORGANIZATION:', org?.name || 'NOT FOUND');

  console.log('\n✅ Test complete!');
}

testZeroTypingData().catch(console.error);