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

async function checkOrgStructure() {
  console.log('🔍 Checking Organization Structure...\n');

  // Get organization with all fields
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
  } else if (orgs && orgs.length > 0) {
    console.log('Organization columns:');
    console.log(Object.keys(orgs[0]));
    console.log('\nSample organization:');
    console.log(orgs[0]);
  }

  // Check which user is e1c83a34
  console.log('\n🔍 Checking User e1c83a34...');
  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', 'e1c83a34-707c-456f-ba0a-9b0e41bbce6f')
    .single();

  if (userData) {
    console.log('User:', userData.email || userData.name || 'Unknown');
  }

  // Get PLMJ organization specifically
  console.log('\n🔍 Checking PLMJ organization...');
  const { data: plmj } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', 'PLMJ')
    .single();

  if (plmj) {
    console.log('PLMJ org ID:', plmj.id);
    console.log('PLMJ data:', plmj);
  }
}

checkOrgStructure().catch(console.error);