import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fix() {
  console.log('🔧 Fixing toilet wastewater discharge for recycling...\n');

  const { data: wasteMetric } = await supabase
    .from('metrics_catalog')
    .select('id')
    .eq('code', 'scope3_wastewater_toilet')
    .single();

  const { data: records } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('metric_id', wasteMetric?.id);

  console.log(`📊 Found ${records?.length || 0} toilet discharge records\n`);

  const updates = [];

  for (const record of records || []) {
    const originalValue = parseFloat(record.value);
    const reducedDischarge = originalValue * 0.50;  // 50% less discharge (recycled portion)

    updates.push(
      supabase
        .from('metrics_data')
        .update({
          value: reducedDischarge.toFixed(2),
          co2e_emissions: (reducedDischarge * 0.70 / 1000).toFixed(3)
        })
        .eq('id', record.id)
    );
  }

  await Promise.all(updates);

  console.log(`✅ Updated ${records?.length || 0} discharge records\n`);

  // Verify
  const { data: verify } = await supabase
    .from('metrics_data')
    .select('value')
    .eq('metric_id', wasteMetric?.id)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  const total = verify?.reduce((sum, r) => sum + parseFloat(r.value), 0) || 0;

  console.log('📊 2025 Toilet Wastewater Discharge:');
  console.log(`  Total: ${(total / 1000).toFixed(3)} ML`);
  console.log('');
  console.log('✅ Fixed! Toilet discharge now reflects 50% recycling');
}

fix();
