const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWaterMetrics() {
  console.log('🔍 Checking water metrics in catalog...\n');
  
  const { data: metrics, error } = await supabase
    .from('metrics_catalog')
    .select('*')
    .in('category', ['Water Withdrawal', 'Water Discharge', 'Water Consumption'])
    .order('category', { ascending: true });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Found ' + metrics.length + ' water metrics:\n');
  metrics.forEach(m => {
    console.log('- ' + m.name);
    console.log('  Category: ' + m.category);
    console.log('  Code: ' + m.code);
    console.log('  Scope: ' + (m.scope || 'N/A'));
    console.log('  Unit: ' + m.unit);
    console.log('  ID: ' + m.id + '\n');
  });
}

checkWaterMetrics().catch(console.error);
