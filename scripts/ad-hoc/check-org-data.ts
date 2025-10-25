import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrgData() {
  console.log('🔍 Checking organization data\n');

  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Direct query for organization
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  console.log('Organization query:');
  console.log('  Data:', org);
  console.log('  Error:', orgError);

  // Query sites
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .eq('organization_id', orgId);

  console.log('\nSites query:');
  console.log('  Count:', sites?.length || 0);
  console.log('  Error:', sitesError);
  if (sites) {
    sites.forEach(site => console.log('  - ', site.name, '(ID:', site.id, ')'));
  }

  // Query app_users
  const { data: users, error: usersError } = await supabase
    .from('app_users')
    .select('*')
    .eq('organization_id', orgId);

  console.log('\nTeam members query:');
  console.log('  Count:', users?.length || 0);
  console.log('  Error:', usersError);
  if (users) {
    users.forEach(user => console.log('  - ', user.name || user.email));
  }

  // Try to find any organization
  const { data: allOrgs, error: allOrgsError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(5);

  console.log('\nAll organizations:');
  console.log('  Count:', allOrgs?.length || 0);
  if (allOrgs) {
    allOrgs.forEach(o => console.log('  - ', o.name, '(ID:', o.id, ')'));
  }
}

checkOrgData().catch(console.error);