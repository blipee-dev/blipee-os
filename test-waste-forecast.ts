import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testWasteForecast() {
  console.log('🔍 Testing Waste Forecast API Logic\n');

  // Check if waste_streams table exists and has data
  const { data: wasteData, error, count } = await supabase
    .from('waste_streams')
    .select('*', { count: 'exact' })
    .eq('organization_id', ORG_ID)
    .limit(5);

  if (error) {
    console.error('❌ Error querying waste_streams:', error);
    return;
  }

  console.log(`📊 Waste streams found: ${count || 0} total records`);

  if (wasteData && wasteData.length > 0) {
    console.log('\n📋 Sample records:');
    wasteData.forEach((record, i) => {
      console.log(`\n${i + 1}. Date: ${record.date}`);
      console.log(`   Quantity: ${record.quantity}`);
      console.log(`   Diverted: ${record.diverted}`);
      console.log(`   Emissions: ${record.emissions || 0}`);
    });
  } else {
    console.log('\n⚠️ No waste data found. Checking if table structure is correct...');

    // Try to get table schema
    const { data: schemaData } = await supabase
      .from('waste_streams')
      .select('*')
      .limit(1);

    console.log('Schema sample:', schemaData);
  }

  // Check date range
  const { data: dateRange } = await supabase
    .from('waste_streams')
    .select('date')
    .eq('organization_id', ORG_ID)
    .order('date', { ascending: true })
    .limit(1);

  const { data: dateRangeEnd } = await supabase
    .from('waste_streams')
    .select('date')
    .eq('organization_id', ORG_ID)
    .order('date', { ascending: false })
    .limit(1);

  if (dateRange && dateRange.length > 0 && dateRangeEnd && dateRangeEnd.length > 0) {
    console.log(`\n📅 Date range: ${dateRange[0].date} to ${dateRangeEnd[0].date}`);
  }
}

testWasteForecast().catch(console.error);
