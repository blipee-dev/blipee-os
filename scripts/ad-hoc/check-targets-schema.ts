import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking sustainability_targets schema...\n');

  const { data, error } = await supabase
    .from('sustainability_targets')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in sustainability_targets:');
    console.log(Object.keys(data[0]).join(', '));
    console.log('\nFirst record:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No records found');
  }
}

checkSchema();
