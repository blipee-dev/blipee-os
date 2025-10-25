import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const problemSiteId = 'dccb2397-6731-4f4d-bd43-992c598bd0ce';
const metricId = 'b7f00fa1-6519-4a2c-b0f2-938019746889'; // Water - Other Uses

async function checkStoredForecast() {
  console.log('🔍 Checking Stored Forecast vs Expected\n');

  // What we expect (from the model)
  console.log('Expected forecast values:');
  console.log('  Oct 2025: 2.23 kg CO2e');
  console.log('  Nov 2025: 2.40 kg CO2e');
  console.log('  Dec 2025: 1.70 kg CO2e\n');

  // What's actually stored
  const { data } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('metric_id', metricId)
    .eq('site_id', problemSiteId)
    .gte('period_start', '2025-10-01')
    .lte('period_start', '2025-12-31')
    .order('period_start', { ascending: true });

  console.log('Actual stored values:');
  data?.forEach(r => {
    console.log(`  ${r.period_start}: ${r.co2e_emissions} kg CO2e (value: ${r.value} ${r.unit})`);
  });

  console.log(`\nRecords found: ${data?.length || 0}`);
  if (data && data.length > 3) {
    console.log('⚠️  WARNING: More than 3 records found! This should only have Oct/Nov/Dec.');
  }

  if (data && data.length === 3) {
    const total = data.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);
    console.log(`Total: ${total.toFixed(2)} kg CO2e`);
    console.log(`Expected: 6.33 kg CO2e`);
    console.log(`Match: ${Math.abs(total - 6.33) < 0.1 ? '✅ YES' : '❌ NO'}`);
  }
}

checkStoredForecast().catch(console.error);
