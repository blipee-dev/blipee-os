import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkScopes() {
  const { data } = await supabase
    .from('metrics_catalog')
    .select('scope')
    .limit(10);

  const uniqueScopes = [...new Set(data?.map(d => d.scope))];
  console.log('Unique scope values:', uniqueScopes);

  // Check waste metrics specifically
  const { data: wasteData } = await supabase
    .from('metrics_catalog')
    .select('code, scope')
    .or('category.eq.Waste,code.like.scope3_waste%');

  console.log('\nWaste metrics scopes:');
  wasteData?.forEach(m => console.log(`  ${m.code}: ${m.scope}`));
}

checkScopes();
