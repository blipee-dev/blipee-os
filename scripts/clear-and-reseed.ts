import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function clearAndReseed() {
  console.log('🗑️  Clearing all emissions, water, and waste data...\n');

  try {
    // Clear data in order to avoid foreign key constraints
    await supabase.from('emissions_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Cleared emissions_data');
    
    await supabase.from('water_usage').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Cleared water_usage');
    
    await supabase.from('waste_data').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Cleared waste_data');
    
    console.log('\n✨ All data cleared. Ready for fresh seeding!');
    console.log('\nRun these commands to seed with comprehensive data:');
    console.log('1. npx tsx scripts/seed-data-batch.ts (basic data)');
    console.log('2. npx tsx scripts/seed-comprehensive-emissions.ts (full GHG Protocol data)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

clearAndReseed();