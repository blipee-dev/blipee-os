import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableStructure() {
  console.log('🔍 Checking sustainability_targets table structure...\n');

  try {
    // Check if table exists and get its structure
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', {
        table_name: 'sustainability_targets'
      });

    if (error) {
      // Try alternative approach - query information_schema
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.columns' as any)
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_schema', 'public')
        .eq('table_name', 'sustainability_targets');

      if (schemaError) {
        // Try direct query to check if table exists
        const { data: testData, error: testError } = await supabase
          .from('sustainability_targets')
          .select('*')
          .limit(1);

        if (testError) {
          console.log('❌ Table does not exist or error accessing it:', testError.message);
          console.log('\n📝 Table needs to be created first.');
        } else {
          console.log('✅ Table exists. Sample data structure:');
          if (testData && testData.length > 0) {
            console.log('Columns found:', Object.keys(testData[0]));
            console.log('\nColumn details:');
            Object.entries(testData[0]).forEach(([key, value]) => {
              console.log(`  - ${key}: ${typeof value} (sample: ${value})`);
            });
          } else {
            console.log('Table is empty. Checking structure via raw SQL...');

            // Get column info via raw SQL
            const { data: colData, error: colError } = await supabase.rpc('get_column_info', {
              p_table_name: 'sustainability_targets'
            });

            if (!colError && colData) {
              console.log('Columns:', colData);
            }
          }
        }
      } else {
        console.log('✅ Table structure from information_schema:');
        schemaData?.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });
      }
    } else {
      console.log('✅ Table columns:', columns);
    }

    // Try to get actual data to see the structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('sustainability_targets')
      .select('*')
      .limit(1);

    if (!sampleError && sampleData && sampleData.length > 0) {
      console.log('\n📊 Actual columns in table:');
      Object.keys(sampleData[0]).forEach(key => {
        console.log(`  - ${key}`);
      });
    }

  } catch (err) {
    console.error('Error checking table:', err);
  }
}

// Create RPC function if it doesn't exist
async function createHelperFunctions() {
  const createColumnInfoFunction = `
    CREATE OR REPLACE FUNCTION get_column_info(p_table_name text)
    RETURNS TABLE(
      column_name text,
      data_type text,
      is_nullable text,
      column_default text
    ) AS $$
    BEGIN
      RETURN QUERY
      SELECT
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::text,
        c.column_default::text
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
      AND c.table_name = p_table_name
      ORDER BY c.ordinal_position;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `;

  try {
    await supabase.rpc('exec_sql', { sql: createColumnInfoFunction });
  } catch (e) {
    // Function might already exist
  }
}

async function main() {
  await createHelperFunctions();
  await checkTableStructure();
}

main().catch(console.error);