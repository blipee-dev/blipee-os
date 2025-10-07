import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllMetrics() {
  console.log('=== All Metrics in metrics_catalog ===\n');

  const { data: metrics, error } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, scope, category, subcategory, unit, emission_factor, is_active')
    .order('scope', { ascending: true })
    .order('category', { ascending: true })
    .order('code', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!metrics || metrics.length === 0) {
    console.log('No metrics found');
    return;
  }

  console.log(`Total metrics: ${metrics.length}\n`);

  // Group by scope
  const byScope = metrics.reduce((acc: any, m: any) => {
    if (!acc[m.scope]) acc[m.scope] = [];
    acc[m.scope].push(m);
    return acc;
  }, {});

  Object.keys(byScope).sort().forEach(scope => {
    console.log(`\n=== ${scope.toUpperCase()} (${byScope[scope].length} metrics) ===\n`);
    
    // Group by category within scope
    const byCategory = byScope[scope].reduce((acc: any, m: any) => {
      if (!acc[m.category]) acc[m.category] = [];
      acc[m.category].push(m);
      return acc;
    }, {});

    Object.keys(byCategory).sort().forEach(category => {
      console.log(`  ${category} (${byCategory[category].length}):`);
      byCategory[category].forEach((m: any) => {
        const active = m.is_active ? '✓' : '✗';
        const subcategory = m.subcategory ? ` [${m.subcategory}]` : '';
        console.log(`    ${active} ${m.code.padEnd(35)} ${m.name}${subcategory}`);
        console.log(`      ID: ${m.id}`);
        console.log(`      Unit: ${m.unit}, EF: ${m.emission_factor || 'N/A'}`);
      });
      console.log('');
    });
  });
}

listAllMetrics().catch(console.error);
