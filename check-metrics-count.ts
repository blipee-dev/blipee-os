import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMetricsCount() {
  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Get total count
  const { count, error } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  console.log('Total metrics count for PLMJ:', count);
  console.log('Error:', error);
}

checkMetricsCount();