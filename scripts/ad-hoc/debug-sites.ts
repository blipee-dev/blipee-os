import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSites() {
  // Try sites table
  const { data: sitesData, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .limit(5);

  console.log('Sites table:', sitesData?.length || 0, 'records', sitesError?.message || 'OK');
  if (sitesData && sitesData.length > 0) {
    console.log('Sample:', sitesData[0]);
  }

  // Try buildings table
  const { data: buildingsData, error: buildingsError } = await supabase
    .from('buildings')
    .select('*')
    .limit(5);

  console.log('Buildings table:', buildingsData?.length || 0, 'records', buildingsError?.message || 'OK');
  if (buildingsData && buildingsData.length > 0) {
    console.log('Sample:', buildingsData[0]);
  }
}

debugSites();
