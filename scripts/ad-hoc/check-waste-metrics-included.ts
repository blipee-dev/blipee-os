import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkWasteMetricsIncluded() {
  console.log('🔍 Checking which metrics are being selected by the API...\n');

  // This is what the API does:
  const { data: wasteMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('category.eq.Waste,code.like.scope3_waste%');

  console.log(`📊 API query matches ${wasteMetrics?.length} metrics:\n`);

  wasteMetrics?.forEach(m => {
    console.log(`${m.code}`);
    console.log(`  Category: ${m.category}`);
    console.log(`  Unit: ${m.unit}`);
  });

  // Now check if there are metrics with category != 'Waste' but code starting with scope3_waste
  const nonWasteCategoryButWasteCode = wasteMetrics?.filter(m =>
    m.category !== 'Waste' && m.code.startsWith('scope3_waste')
  );

  if (nonWasteCategoryButWasteCode && nonWasteCategoryButWasteCode.length > 0) {
    console.log(`\n⚠️  Found ${nonWasteCategoryButWasteCode.length} metrics with waste code but NOT Waste category:`);
    nonWasteCategoryButWasteCode.forEach(m => {
      console.log(`  ${m.code} - Category: ${m.category}`);
    });
  }

  // Check for wastewater
  const wastewaterMetrics = wasteMetrics?.filter(m =>
    m.code.includes('wastewater') || m.name.toLowerCase().includes('wastewater')
  );

  if (wastewaterMetrics && wastewaterMetrics.length > 0) {
    console.log(`\n🚰 Found ${wastewaterMetrics.length} WASTEWATER metrics (should NOT be in waste totals):`);
    wastewaterMetrics.forEach(m => {
      console.log(`  ${m.code} - ${m.name}`);
    });
  }

  // Check 2025 data for these wastewater metrics
  if (wastewaterMetrics && wastewaterMetrics.length > 0) {
    const { data: wastewaterData } = await supabase
      .from('metrics_data')
      .select('value')
      .in('metric_id', wastewaterMetrics.map(m => m.id))
      .gte('period_start', '2025-01-01')
      .lte('period_end', '2025-12-31');

    const wastewaterTotal = wastewaterData?.reduce((sum, r) => sum + parseFloat(r.value), 0) || 0;

    console.log(`\n💧 Total WASTEWATER in 2025: ${wastewaterTotal.toFixed(2)}`);
    console.log(`🗑️  Total WASTE in 2025: 13.01`);
    console.log(`❓ WASTEWATER + WASTE = ${(wastewaterTotal + 13.01).toFixed(2)}`);
    console.log(`📊 API returns: 851.86\n`);

    if (Math.abs((wastewaterTotal + 13.01) - 851.86) < 1) {
      console.log('✅ FOUND THE ISSUE! Wastewater is being included in waste totals!');
    }
  }
}

checkWasteMetricsIncluded();
