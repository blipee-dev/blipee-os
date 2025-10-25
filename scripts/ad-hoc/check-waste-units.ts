import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkWasteUnits() {
  console.log('🔍 Checking waste data units...\n');

  const { data: wasteMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .eq('category', 'Waste');

  console.log('📋 Metrics catalog units:\n');
  wasteMetrics?.forEach(m => {
    console.log(`${m.code}: unit="${m.unit}"`);
  });

  console.log('\n📊 Sample data records:\n');

  for (const metric of wasteMetrics?.slice(0, 5) || []) {
    const { data: sampleRecords } = await supabase
      .from('metrics_data')
      .select('value, unit, period_start, notes')
      .eq('metric_id', metric.id)
      .limit(3);

    console.log(`${metric.code}:`);
    sampleRecords?.forEach(r => {
      console.log(`  ${r.period_start}: value=${r.value}, unit=${r.unit || 'NULL'}`);
      if (r.notes) console.log(`    notes: ${r.notes.substring(0, 60)}`);
    });
    console.log('');
  }

  // Check for kg values
  console.log('🔍 Looking for records with large values (might be kg instead of tons):\n');

  const { data: largeValues } = await supabase
    .from('metrics_data')
    .select('*, metric:metrics_catalog(code, name, unit)')
    .in('metric_id', wasteMetrics?.map(m => m.id) || [])
    .gte('period_start', '2025-01-01')
    .order('value', { ascending: false })
    .limit(10);

  largeValues?.forEach((r: any) => {
    console.log(`${r.metric.code}: ${r.value} (catalog says: ${r.metric.unit})`);
  });
}

checkWasteUnits();
