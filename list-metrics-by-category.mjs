import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listMetricsByCategory() {
  console.log('📊 Fetching all metrics from catalog...\n');

  const { data: metrics, error } = await supabase
    .from('metrics_catalog')
    .select('id, name, category, unit, scope, calculation_method')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('❌ Error fetching metrics:', error);
    return;
  }

  if (!metrics || metrics.length === 0) {
    console.log('❌ No metrics found');
    return;
  }

  // Group by category
  const categorized = metrics.reduce((acc, metric) => {
    const category = metric.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(metric);
    return acc;
  }, {});

  // Print by category
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TOTAL METRICS: ${metrics.length}`);
  console.log(`CATEGORIES: ${Object.keys(categorized).length}`);
  console.log(`${'='.repeat(80)}\n`);

  for (const [category, categoryMetrics] of Object.entries(categorized).sort()) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📁 ${category.toUpperCase()} (${categoryMetrics.length} metrics)`);
    console.log(`${'─'.repeat(80)}`);

    categoryMetrics.forEach((metric, index) => {
      console.log(`\n${index + 1}. ${metric.name}`);
      console.log(`   ID: ${metric.id}`);
      console.log(`   Unit: ${metric.unit || 'N/A'}`);
      console.log(`   Scope: ${metric.scope || 'N/A'}`);
      console.log(`   Calculation: ${metric.calculation_method || 'N/A'}`);
    });
  }

  console.log(`\n${'='.repeat(80)}\n`);

  // Summary by category
  console.log('\n📊 SUMMARY BY CATEGORY:\n');
  Object.entries(categorized)
    .sort((a, b) => b[1].length - a[1].length)
    .forEach(([category, categoryMetrics]) => {
      console.log(`  ${category.padEnd(40)} ${categoryMetrics.length.toString().padStart(3)} metrics`);
    });
}

listMetricsByCategory();
