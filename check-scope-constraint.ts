import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // Get existing scope values
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('scope')
    .not('scope', 'is', null)
    .limit(20);

  const uniqueScopes = [...new Set(metrics?.map(m => m.scope))];
  
  console.log('📋 Existing scope values in database:\n');
  uniqueScopes.forEach(scope => {
    console.log(`  - "${scope}"`);
  });
}

check();
