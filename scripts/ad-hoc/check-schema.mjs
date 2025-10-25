import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSitesSchema() {
  console.log('🔍 Checking sites table schema...\n');

  // Try to get one site with all fields
  const { data: site, error } = await supabase
    .from('sites')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('📊 Sites table columns:\n');
  Object.keys(site).forEach(key => {
    const value = site[key];
    const type = typeof value;
    console.log(`   ${key.padEnd(30)} ${type.padEnd(10)} ${value !== null ? `(e.g., ${value})` : '(null)'}`);
  });

  console.log('\n✅ All column names listed above');
}

checkSitesSchema();
