import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listMetricsDataColumns() {
  console.log('=== metrics_data Table Structure ===\n');

  const { data: sampleData, error: sampleError } = await supabase
    .from('metrics_data')
    .select('*')
    .limit(1);

  if (sampleError) {
    console.error('Error:', sampleError);
  } else if (sampleData && sampleData.length > 0) {
    console.log('Columns:\n');
    Object.keys(sampleData[0]).sort().forEach(col => {
      console.log(`  - ${col}`);
    });

    console.log('\n=== Sample Row ===\n');
    console.log(JSON.stringify(sampleData[0], null, 2));
  } else {
    console.log('No data found');
  }
}

listMetricsDataColumns().catch(console.error);
