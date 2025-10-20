import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkGridMixApplication() {
  console.log('🔍 Checking Grid Mix Application Across Energy Types (2025)');
  console.log('='.repeat(80));

  const { data: energyMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, name, code, energy_type, category')
    .in('category', ['Electricity', 'Purchased Energy']);

  for (const metric of energyMetrics) {
    const { data: records } = await supabase
      .from('metrics_data')
      .select('value, metadata, period_start')
      .eq('organization_id', organizationId)
      .eq('metric_id', metric.id)
      .gte('period_start', '2025-01-01')
      .lt('period_start', '2025-02-01')
      .limit(1);

    if (records && records.length > 0) {
      const record = records[0];
      const hasGridMix = record.metadata?.grid_mix ? true : false;
      const renewableKwh = record.metadata?.grid_mix?.renewable_kwh;

      console.log(`\nMetric: ${metric.name}`);
      console.log(`  Code: ${metric.code}`);
      console.log(`  Category: ${metric.category}`);
      console.log(`  Energy Type: ${metric.energy_type || 'N/A'}`);
      console.log(`  Consumption: ${parseFloat(record.value).toFixed(2)} kWh`);
      console.log(`  Has grid_mix: ${hasGridMix ? '✅ YES' : '❌ NO'}`);
      if (hasGridMix) {
        console.log(`  Renewable kWh: ${renewableKwh?.toFixed(2)}`);
        console.log(`  Renewable %: ${record.metadata.grid_mix.renewable_percentage?.toFixed(1)}%`);
      }
    } else {
      console.log(`\nMetric: ${metric.name}`);
      console.log(`  Code: ${metric.code}`);
      console.log(`  No 2025 forecast data`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('⚠️  IMPORTANT QUESTION:');
  console.log('Should non-electricity energy types (heating, cooling, etc.) have grid mix?');
  console.log('='.repeat(80));
}

checkGridMixApplication();
