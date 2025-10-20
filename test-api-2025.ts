import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testAPI2025() {
  console.log('🧪 Testing what the API should return for 2025...\n');

  // Simulate exactly what the API does
  const { data: wasteMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .eq('category', 'Waste');

  const { data: wasteData } = await supabase
    .from('metrics_data')
    .select('*')
    .in('metric_id', wasteMetrics?.map(m => m.id) || [])
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31');

  console.log(`📊 Found ${wasteData?.length} records for 2025\n`);

  // Group by material type and disposal method (exactly like API)
  const streamsByType = (wasteData || []).reduce((acc: any, record: any) => {
    const metric = wasteMetrics?.find(m => m.id === record.metric_id);
    if (!metric) return acc;

    const materialType = metric.waste_material_type || 'mixed';
    const disposalMethod = metric.disposal_method || 'other';
    const key = `${materialType}-${disposalMethod}`;

    if (!acc[key]) {
      acc[key] = {
        material_type: materialType,
        disposal_method: disposalMethod,
        quantity: 0,
        is_diverted: metric.is_diverted || false,
        is_recycling: metric.is_recycling || false
      };
    }

    const value = parseFloat(record.value) || 0;
    acc[key].quantity += value;

    return acc;
  }, {});

  const streams = Object.values(streamsByType);

  const totalGenerated = streams.reduce((sum: number, s: any) => sum + s.quantity, 0);
  const totalDiverted = streams.filter((s: any) => s.is_diverted).reduce((sum: number, s: any) => sum + s.quantity, 0);
  const totalRecycling = streams.filter((s: any) => s.is_recycling).reduce((sum: number, s: any) => sum + s.quantity, 0);
  const totalDisposal = streams.filter((s: any) => !s.is_diverted).reduce((sum: number, s: any) => sum + s.quantity, 0);

  const diversionRate = totalGenerated > 0 ? (totalDiverted / totalGenerated * 100) : 0;
  const recyclingRate = totalGenerated > 0 ? (totalRecycling / totalGenerated * 100) : 0;

  console.log('✅ API Should Return:');
  console.log(`   total_generated: ${totalGenerated.toFixed(2)} tons`);
  console.log(`   total_diverted: ${totalDiverted.toFixed(2)} tons`);
  console.log(`   total_recycling: ${totalRecycling.toFixed(2)} tons`);
  console.log(`   total_disposal: ${totalDisposal.toFixed(2)} tons`);
  console.log(`   diversion_rate: ${diversionRate.toFixed(1)}%`);
  console.log(`   recycling_rate: ${recyclingRate.toFixed(1)}%\n`);

  console.log('📋 Stream breakdown:');
  streams.forEach((s: any) => {
    console.log(`  ${s.material_type}-${s.disposal_method}: ${s.quantity.toFixed(2)} tons`);
  });

  console.log('\n❓ Dashboard shows 851.9 tons');
  console.log(`   But API should return ${totalGenerated.toFixed(2)} tons`);
  console.log(`   Multiplier: ${(851.9 / totalGenerated).toFixed(2)}x\n`);
}

testAPI2025();
