const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function test() {
  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const startDate = new Date('2020-01-01');
  const endDate = new Date('2025-09-15');

  console.log('Testing query with:');
  console.log('  org_id:', orgId);
  console.log('  period_start >=', startDate.toISOString());
  console.log('  period_end <=', endDate.toISOString());

  // Test the exact query from the API
  const { data, error, count } = await supabase
    .from('metrics_data')
    .select(`
      *,
      metrics_catalog (
        id, name, code, unit, scope, category, subcategory,
        emission_factor, emission_factor_unit
      )
    `, { count: 'exact' })
    .eq('organization_id', orgId)
    .gte('period_start', startDate.toISOString())
    .lte('period_end', endDate.toISOString());

  console.log('\nResult:', count, 'records');
  if (error) console.error('Error:', error);

  // Test without the period_end filter
  const { count: count2 } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId)
    .gte('period_start', startDate.toISOString());

  console.log('Without period_end filter:', count2, 'records');

  // Test with just org filter
  const { count: count3 } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact' })
    .eq('organization_id', orgId);

  console.log('With just org filter:', count3, 'records');

  process.exit(0);
}

test();
