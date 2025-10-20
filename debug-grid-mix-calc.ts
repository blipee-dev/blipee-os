import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function debugGridMixCalc() {
  console.log('🔍 Debugging Grid Mix Calculation\n');
  console.log('='.repeat(80));

  // Get electricity metric
  const { data: electricityMetric } = await supabase
    .from('metrics_catalog')
    .select('id')
    .eq('code', 'scope2_electricity_grid')
    .single();

  // Get one forecast record
  const { data: forecast } = await supabase
    .from('metrics_data')
    .select('value, metadata')
    .eq('organization_id', organizationId)
    .eq('metric_id', electricityMetric.id)
    .eq('period_start', '2025-01-01')
    .limit(1)
    .single();

  if (!forecast) {
    console.log('No forecast found');
    return;
  }

  const gridMix = forecast.metadata.grid_mix;
  const forecastValue = parseFloat(forecast.value);

  console.log('\n📊 Forecast Data:');
  console.log('Value:', forecastValue, 'kWh');
  console.log('\n🔌 Grid Mix Template:');
  console.log('renewable_percentage:', gridMix.renewable_percentage);
  console.log('non_renewable_percentage:', gridMix.non_renewable_percentage);
  console.log('renewable_kwh:', gridMix.renewable_kwh);
  console.log('non_renewable_kwh:', gridMix.non_renewable_kwh);

  console.log('\n📐 Calculations:');
  console.log('Expected renewable_kwh:', forecastValue * (gridMix.renewable_percentage / 100));
  console.log('Actual renewable_kwh:', gridMix.renewable_kwh);
  console.log('Expected non_renewable_kwh:', forecastValue * ((100 - gridMix.renewable_percentage) / 100));
  console.log('Actual non_renewable_kwh:', gridMix.non_renewable_kwh);

  console.log('\n✅ Verification:');
  console.log('renewable_kwh + non_renewable_kwh =', (gridMix.renewable_kwh || 0) + (gridMix.non_renewable_kwh || 0));
  console.log('Should equal forecast value:', forecastValue);
  console.log('Match:', Math.abs(((gridMix.renewable_kwh || 0) + (gridMix.non_renewable_kwh || 0)) - forecastValue) < 0.01 ? '✅' : '❌');
}

debugGridMixCalc();
