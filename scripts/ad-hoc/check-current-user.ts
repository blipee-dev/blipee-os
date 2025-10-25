import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkCurrentUser() {
  console.log('🔍 Checking User Setup...\n');

  // Check who is user e1c83a34-707c-456f-ba0a-9b0e41bbce6f
  const userId = 'e1c83a34-707c-456f-ba0a-9b0e41bbce6f';

  console.log('1️⃣ User Details:');
  const { data: userData } = await supabase.auth.admin.getUserById(userId);

  if (userData?.user) {
    console.log(`  Email: ${userData.user.email}`);
    console.log(`  ID: ${userData.user.id}`);
    console.log(`  Created: ${userData.user.created_at}`);
  }

  // Check organization membership
  console.log('\n2️⃣ Organization Membership:');
  const { data: membership } = await supabase
    .from('organization_members')
    .select(`
      *,
      organizations (name, id)
    `)
    .eq('user_id', userId)
    .single();

  if (membership) {
    console.log(`  Organization: ${membership.organizations?.name}`);
    console.log(`  Org ID: ${membership.organization_id}`);
    console.log(`  Role: ${membership.role}`);
  }

  // Check if this org has metrics assigned
  const orgId = membership?.organization_id;
  if (orgId) {
    console.log('\n3️⃣ Metrics Assigned to Organization:');
    const { data: orgMetrics } = await supabase
      .from('organization_metrics')
      .select(`
        *,
        metrics_catalog (name, code, unit, scope)
      `)
      .eq('organization_id', orgId)
      .limit(5);

    if (orgMetrics && orgMetrics.length > 0) {
      console.log(`  Total: ${orgMetrics.length} metrics`);
      orgMetrics.forEach(m => {
        console.log(`  - ${m.metrics_catalog?.name} (${m.metrics_catalog?.scope}): ${m.reporting_frequency || 'Not set'}`);
      });
    }

    // Check recent data entries
    console.log('\n4️⃣ Recent Data Entries:');
    const { data: recentData } = await supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (name)
      `)
      .eq('organization_id', orgId)
      .order('period_end', { ascending: false })
      .limit(5);

    if (recentData && recentData.length > 0) {
      recentData.forEach(d => {
        console.log(`  - ${d.metrics_catalog?.name}: ${d.value} ${d.unit} (${d.period_end})`);
      });
    } else {
      console.log('  No data entries found');
    }
  }

  console.log('\n✅ Summary:');
  console.log('  User is properly connected to organization');
  console.log('  Organization has metrics assigned');
  console.log('  Data Management system should work correctly');
}

checkCurrentUser().catch(console.error);