#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function checkSchema() {
  console.log('🔍 Checking access_audit_log table schema...\n');

  // Query information_schema to get table columns
  const { data, error } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable, column_default')
    .eq('table_schema', 'public')
    .eq('table_name', 'access_audit_log')
    .order('ordinal_position');

  if (error) {
    console.log('⚠️  Cannot query information_schema directly');
    console.log('   Trying alternative approach with RPC...\n');

    // Try using a sample query to see what columns exist
    const { data: sample, error: sampleError } = await supabase
      .from('access_audit_log')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Error:', sampleError.message);
      process.exit(1);
    }

    if (sample && sample.length > 0) {
      console.log('✅ Table exists. Columns found in sample row:');
      console.log('='.repeat(80));
      Object.keys(sample[0]).forEach(col => {
        console.log(`  • ${col}: ${typeof sample[0][col]}`);
      });
    } else {
      console.log('ℹ️  Table exists but is empty. Checking table structure differently...\n');

      // Try inserting and deleting to discover required columns
      console.log('Attempting to discover columns via API metadata...');
      const { error: insertError } = await supabase
        .from('access_audit_log')
        .insert({});

      if (insertError) {
        console.log('\n📋 Error reveals required/existing columns:');
        console.log(insertError.message);
      }
    }
  } else if (data) {
    console.log('✅ Table schema:');
    console.log('='.repeat(80));
    console.log('Column Name'.padEnd(30), 'Data Type'.padEnd(20), 'Nullable');
    console.log('-'.repeat(80));
    data.forEach(col => {
      console.log(
        col.column_name.padEnd(30),
        col.data_type.padEnd(20),
        col.is_nullable
      );
    });
  }

  console.log('\n' + '='.repeat(80));
}

checkSchema().catch(console.error);
