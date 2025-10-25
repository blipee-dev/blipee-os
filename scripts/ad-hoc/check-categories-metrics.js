import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function checkCategoriesAndMetrics() {
  console.log('\n📊 Checking Categories and Metrics in Database\n');

  // Get all unique categories by scope
  const { data: categories, error: catError } = await supabase
    .from('metrics_catalog')
    .select('category, scope')
    .order('scope', { ascending: true })
    .order('category', { ascending: true });

  if (catError) {
    console.error('Error fetching categories:', catError);
    return;
  }

  // Group by scope
  const byScope = {
    scope_1: new Set(),
    scope_2: new Set(),
    scope_3: new Set()
  };

  categories.forEach(c => {
    if (c.scope && c.category) {
      byScope[c.scope].add(c.category);
    }
  });

  console.log('🎯 CATEGORIES BY SCOPE:\n');
  console.log('Scope 1 Categories:');
  Array.from(byScope.scope_1).forEach(cat => console.log(`  - ${cat}`));

  console.log('\nScope 2 Categories:');
  Array.from(byScope.scope_2).forEach(cat => console.log(`  - ${cat}`));

  console.log('\nScope 3 Categories (15 GHG Protocol categories):');
  Array.from(byScope.scope_3).forEach(cat => console.log(`  - ${cat}`));

  // Get all unique metric names and units
  const { data: metrics, error: metError } = await supabase
    .from('metrics_catalog')
    .select('name, unit, category, scope')
    .order('name', { ascending: true });

  if (metError) {
    console.error('Error fetching metrics:', metError);
    return;
  }

  // Group metrics by type
  const metricsByType = {};
  metrics.forEach(m => {
    if (!metricsByType[m.name]) {
      metricsByType[m.name] = {
        unit: m.unit,
        categories: new Set(),
        scopes: new Set()
      };
    }
    if (m.category) metricsByType[m.name].categories.add(m.category);
    if (m.scope) metricsByType[m.name].scopes.add(m.scope);
  });

  console.log('\n\n📏 INDIVIDUAL METRICS:\n');
  Object.keys(metricsByType).slice(0, 20).forEach(name => {
    const metric = metricsByType[name];
    console.log(`${name} (${metric.unit})`);
    console.log(`  Categories: ${Array.from(metric.categories).join(', ')}`);
    console.log(`  Scopes: ${Array.from(metric.scopes).join(', ')}`);
  });

  console.log(`\n... and ${Object.keys(metricsByType).length - 20} more metrics`);

  console.log(`\n📊 SUMMARY:`);
  console.log(`Total unique categories: ${categories.length}`);
  console.log(`Total unique metrics: ${Object.keys(metricsByType).length}`);
  console.log(`Scope 1 categories: ${byScope.scope_1.size}`);
  console.log(`Scope 2 categories: ${byScope.scope_2.size}`);
  console.log(`Scope 3 categories: ${byScope.scope_3.size}`);
}

checkCategoriesAndMetrics();
