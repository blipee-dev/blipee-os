/**
 * Script to check business tables in Supabase
 * These are the tables the dashboard uses
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkBusinessTables() {
  console.log('🔍 Checking business tables in Supabase...\n');

  const tables = [
    'organizations',
    'sites',
    'metrics_catalog',
    'metrics_data',
    'super_admins',
    'user_accesses'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: false })
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Found (${count || 0} records)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err}`);
    }
  }

  // Check metrics_data structure
  console.log('\n📊 Checking metrics_data structure...');
  try {
    const { data: sample } = await supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          id, name, code, unit, scope, category, subcategory,
          emission_factor, emission_factor_unit
        )
      `)
      .limit(5);

    if (sample && sample.length > 0) {
      console.log(`Found ${sample.length} sample records`);
      console.log('\nSample metrics_data record:');
      const record = sample[0];
      console.log({
        metric_id: record.metric_id,
        value: record.value,
        period_start: record.period_start,
        period_end: record.period_end,
        site_id: record.site_id,
        metric_name: record.metrics_catalog?.name,
        scope: record.metrics_catalog?.scope,
        unit: record.metrics_catalog?.unit
      });
    } else {
      console.log('No metrics_data records found');
    }
  } catch (err) {
    console.log('Error checking metrics_data:', err);
  }

  // Check metrics by scope
  console.log('\n🔬 Checking metrics by scope...');
  try {
    const { data: metrics } = await supabase
      .from('metrics_catalog')
      .select('scope, category, count', { count: 'exact' })
      .order('scope');

    const scopeGroups = new Map();
    metrics?.forEach(m => {
      const key = `Scope ${m.scope || 'N/A'}`;
      scopeGroups.set(key, (scopeGroups.get(key) || 0) + 1);
    });

    scopeGroups.forEach((count, scope) => {
      console.log(`  ${scope}: ${count} metrics`);
    });
  } catch (err) {
    console.log('Error checking scopes:', err);
  }
}

// Run the check
checkBusinessTables().then(() => {
  console.log('\n✅ Check complete!');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});