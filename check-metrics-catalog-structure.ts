import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get table structure
const { data, error } = await supabase
  .from('metrics_catalog')
  .select('*')
  .limit(1);

if (data && data.length > 0) {
  console.log('📋 metrics_catalog columns:');
  console.log(Object.keys(data[0]).join(', '));
  console.log('\n📊 Sample record:');
  console.log(JSON.stringify(data[0], null, 2));
}
