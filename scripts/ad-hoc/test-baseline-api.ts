import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBaselineData() {
  console.log('Testing baseline data calculation...\n');

  // 1. Get organization
  const { data: orgData } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('name', 'PLMJ')
    .single();

  console.log('Organization:', orgData?.name, '(ID:', orgData?.id, ')');

  // 2. Get metrics data with emissions
  const { data: metricsData, error } = await supabase
    .from('metrics_data')
    .select(`
      co2e_emissions,
      value,
      unit,
      period_end,
      metrics_catalog (
        name,
        scope,
        category
      )
    `)
    .eq('organization_id', orgData?.id)
    .not('co2e_emissions', 'is', null)
    .gt('co2e_emissions', 0);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\nFound', metricsData?.length, 'entries with emissions data');

  // 3. Calculate total
  let total = 0;
  let sampleEntries: any[] = [];

  metricsData?.forEach((item, index) => {
    total += item.co2e_emissions || 0;
    if (index < 5) {
      sampleEntries.push({
        metric: item.metrics_catalog?.name,
        emissions: item.co2e_emissions,
        scope: item.metrics_catalog?.scope || 'unscoped'
      });
    }
  });

  console.log('\nSample entries:');
  sampleEntries.forEach(e => {
    console.log(`- ${e.metric}: ${e.emissions} kgCO2e (${e.scope})`);
  });

  console.log('\n📊 TOTALS:');
  console.log('Total emissions (kg):', total.toFixed(2), 'kgCO2e');
  console.log('Total emissions (tonnes):', (total / 1000).toFixed(2), 'tCO2e');
  console.log('\nThis should be the baseline value shown in the wizard!');

  // 4. Test the actual API endpoint
  console.log('\n🔗 Testing API endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/sustainability/targets/current-emissions', {
      headers: {
        'Cookie': 'your-auth-cookie-here' // You'd need the actual auth cookie
      }
    });

    if (!response.ok) {
      console.log('API Response status:', response.status);
    } else {
      const data = await response.json();
      console.log('API Response:', data);
    }
  } catch (err) {
    console.log('Note: API test requires authentication');
  }
}

testBaselineData().catch(console.error);