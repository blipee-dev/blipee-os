#!/usr/bin/env npx tsx

/**
 * Inspect Supabase Data Directly
 * Uses service role key to see all data
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
  console.log('🔍 INSPECTING SUPABASE DATA');
  console.log('=' .repeat(60));

  // 1. Check organizations
  console.log('\n📊 ORGANIZATIONS:');
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name, created_at')
    .limit(10);

  if (orgError) {
    console.error('Error fetching organizations:', orgError);
  } else {
    orgs?.forEach(org => {
      console.log(`  • ${org.name} (${org.id})`);
      console.log(`    Created: ${new Date(org.created_at).toLocaleDateString()}`);
    });
  }

  // 2. Check metrics data volume
  console.log('\n📈 METRICS DATA VOLUME:');
  const { count: totalMetrics } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact', head: true });

  console.log(`  Total records: ${totalMetrics || 0}`);

  // Get date range
  const { data: dateRange } = await supabase
    .from('metrics_data')
    .select('period_start')
    .order('period_start', { ascending: true })
    .limit(1);

  const { data: latestDate } = await supabase
    .from('metrics_data')
    .select('period_start')
    .order('period_start', { ascending: false })
    .limit(1);

  if (dateRange?.[0] && latestDate?.[0]) {
    console.log(`  Date range: ${dateRange[0].period_start} to ${latestDate[0].period_start}`);
  }

  // 3. Check metrics by year
  console.log('\n📅 METRICS BY YEAR:');
  const { data: metrics } = await supabase
    .from('metrics_data')
    .select('period_start, co2e_emissions')
    .order('period_start');

  const yearlyData = new Map<number, { count: number, total: number }>();

  metrics?.forEach(m => {
    const year = new Date(m.period_start).getFullYear();
    const current = yearlyData.get(year) || { count: 0, total: 0 };
    current.count++;
    current.total += m.co2e_emissions || 0;
    yearlyData.set(year, current);
  });

  Array.from(yearlyData.entries()).sort(([a], [b]) => a - b).forEach(([year, data]) => {
    console.log(`  ${year}: ${data.count} records, ${(data.total / 1000).toFixed(1)} tCO2e total`);
  });

  // 4. Check monthly aggregated emissions
  console.log('\n📊 MONTHLY EMISSIONS (Last 12 months):');
  const monthlyEmissions = new Map<string, number>();

  metrics?.forEach(record => {
    const date = new Date(record.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyEmissions.set(monthKey, (monthlyEmissions.get(monthKey) || 0) + (record.co2e_emissions || 0));
  });

  const sortedMonths = Array.from(monthlyEmissions.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  sortedMonths.forEach(([month, emissions]) => {
    const tons = emissions / 1000;
    const bar = '█'.repeat(Math.floor(tons / 5));
    console.log(`  ${month}: ${bar} ${tons.toFixed(1)} tCO2e`);
  });

  // 5. Check ML models table (if exists)
  console.log('\n🤖 ML MODELS:');
  const { data: mlModels, error: mlError } = await supabase
    .from('ml_models')
    .select('*')
    .limit(5);

  if (mlError) {
    console.log('  ❌ ml_models table error:', mlError.message);
  } else if (mlModels?.length === 0) {
    console.log('  ✅ Table exists but no models trained yet');
  } else {
    console.log(`  ✅ Found ${mlModels.length} models:`);
    mlModels?.forEach(model => {
      console.log(`    • ${model.model_type} (${model.architecture})`);
      console.log(`      Trained: ${new Date(model.trained_at || model.created_at).toLocaleDateString()}`);
      console.log(`      Org: ${model.organization_id}`);
    });
  }

  // Check ml_model_storage
  console.log('\n💾 ML MODEL STORAGE:');
  const { data: storage, error: storageError } = await supabase
    .from('ml_model_storage')
    .select('model_type, updated_at')
    .limit(5);

  if (storageError) {
    console.log('  ❌ ml_model_storage table error:', storageError.message);
  } else if (storage?.length === 0) {
    console.log('  ✅ Table exists but no models stored yet');
  } else {
    console.log(`  ✅ Found ${storage.length} stored models:`);
    storage?.forEach(s => {
      console.log(`    • ${s.model_type} - Updated: ${new Date(s.updated_at).toLocaleDateString()}`);
    });
  }

  // 6. Check sites
  console.log('\n🏢 SITES:');
  const { data: sites } = await supabase
    .from('sites')
    .select('name, city, country, total_area')
    .limit(10);

  sites?.forEach(site => {
    console.log(`  • ${site.name} - ${site.city}, ${site.country} (${site.total_area} m²)`);
  });

  // 7. Summary statistics
  console.log('\n📊 EMISSIONS SUMMARY:');
  const allEmissions = metrics?.map(m => m.co2e_emissions || 0) || [];
  if (allEmissions.length > 0) {
    const mean = allEmissions.reduce((a, b) => a + b, 0) / allEmissions.length;
    const max = Math.max(...allEmissions);
    const min = Math.min(...allEmissions);

    console.log(`  Mean: ${(mean / 1000).toFixed(2)} tCO2e`);
    console.log(`  Min: ${(min / 1000).toFixed(2)} tCO2e`);
    console.log(`  Max: ${(max / 1000).toFixed(2)} tCO2e`);
    console.log(`  Total data points: ${allEmissions.length}`);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('✅ Inspection complete!');
}

// Run inspection
inspectData().catch(console.error);