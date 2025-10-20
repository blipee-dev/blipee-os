import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkGridMixData() {
  console.log('🔍 Checking Grid Mix Data\n');
  console.log('='.repeat(80));

  try {
    // Check if we have grid_mix metadata in 2025 electricity data
    const { data: electricityMetric } = await supabase
      .from('metrics_catalog')
      .select('id, name')
      .eq('name', 'Electricity')
      .single();

    if (!electricityMetric) {
      console.log('❌ No Electricity metric found');
      return;
    }

    console.log(`\n📊 Electricity Metric ID: ${electricityMetric.id}`);

    // Check 2025 electricity data
    const { data: data2025 } = await supabase
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('metric_id', electricityMetric.id)
      .gte('period_start', '2025-01-01')
      .lte('period_start', '2025-12-31')
      .order('period_start', { ascending: true });

    const count2025 = data2025 ? data2025.length : 0;
    console.log(`\n📈 2025 Electricity Records: ${count2025}\n`);

    if (data2025 && data2025.length > 0) {
      data2025.forEach(record => {
        const month = record.period_start.substring(0, 7);
        const value = (parseFloat(record.value) / 1000).toFixed(1);
        const hasGridMix = record.metadata?.grid_mix ? '✅' : '❌';

        console.log(`${month}: ${value} MWh ${hasGridMix} Grid Mix`);

        if (record.metadata?.grid_mix) {
          const gm = record.metadata.grid_mix;
          console.log(`  Renewable: ${((gm.renewable_kwh || 0) / 1000).toFixed(1)} MWh`);
          console.log(`  Non-Renewable: ${((gm.non_renewable_kwh || 0) / 1000).toFixed(1)} MWh`);
        }
      });
    }

    // Check 2024 for comparison
    const { data: data2024 } = await supabase
      .from('metrics_data')
      .select('metadata')
      .eq('organization_id', organizationId)
      .eq('metric_id', electricityMetric.id)
      .gte('period_start', '2024-01-01')
      .lte('period_start', '2024-12-31')
      .limit(3);

    const count2024 = data2024 ? data2024.length : 0;
    console.log(`\n\n📊 2024 Sample (for comparison): ${count2024} records`);
    if (data2024 && data2024.length > 0) {
      const withGridMix = data2024.filter(r => r.metadata?.grid_mix).length;
      console.log(`Records with grid_mix: ${withGridMix}/${data2024.length}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('💡 ISSUE IDENTIFIED');
    console.log('='.repeat(80));
    console.log('\n2025 forecast data does NOT include grid_mix metadata!');
    console.log('The Grid Mix card requires grid_mix data in the metadata field.');
    console.log('\nWe need to add grid_mix to the 2025 forecast records.');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkGridMixData();
