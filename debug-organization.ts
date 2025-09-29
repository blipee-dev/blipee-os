import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOrganization() {
  console.log('🔍 Debugging Organization Data\n');

  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Check if organization exists
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  console.log('Organization query result:');
  console.log('  - Data:', org);
  console.log('  - Error:', orgError);

  if (!org && !orgError) {
    // Try to find any PLMJ organization
    const { data: plmjOrg, error: plmjError } = await supabase
      .from('organizations')
      .select('*')
      .or('name.ilike.%PLMJ%,slug.eq.plmj')
      .single();

    console.log('\nPLMJ organization search:');
    console.log('  - Data:', plmjOrg);
    console.log('  - Error:', plmjError);

    if (plmjOrg) {
      console.log('\n⚠️ PLMJ org exists but with different ID:', plmjOrg.id);
    }
  }

  // Check sites for the org ID
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .eq('organization_id', orgId);

  console.log('\nSites for org', orgId);
  console.log('  - Count:', sites?.length || 0);
  console.log('  - Error:', sitesError);
  if (sites && sites.length > 0) {
    sites.forEach(site => {
      console.log(`  - ${site.name} (ID: ${site.id})`);
    });
  }

  // Check if there are ANY sites with different org IDs
  const { data: allSites } = await supabase
    .from('sites')
    .select('organization_id, name')
    .limit(10);

  console.log('\nSample of all sites in database:');
  allSites?.forEach(site => {
    console.log(`  - ${site.name} -> Org: ${site.organization_id}`);
  });

  // Check José Pinto's app_user record
  const { data: jose } = await supabase
    .from('app_users')
    .select('*')
    .eq('email', 'jose.pinto@plmj.pt')
    .single();

  console.log('\nJosé Pinto app_user:');
  console.log('  - Organization ID:', jose?.organization_id);
  console.log('  - Role:', jose?.role);
  console.log('  - ID:', jose?.id);

  console.log('\n✅ Debug complete!');
}

debugOrganization().catch(console.error);