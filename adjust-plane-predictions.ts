import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function adjustPredictions() {
  const planeId = '2fe49bc3-0f26-4597-a13d-54d89b1e08d9';
  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  console.log('=== ADJUSTING PLANE TRAVEL PREDICTIONS ===\n');

  // Get current 2025 predictions
  const { data: currentPredictions } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('metric_id', planeId)
    .eq('organization_id', orgId)
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-08-31')
    .order('period_start');

  console.log(`Found ${currentPredictions?.length} predictions to adjust\n`);

  // Calculate new values based on 10% growth over 2024
  const base2024Monthly = 336.3 / 12; // 28.03 tCO2e/month
  const growth2025 = 1.10; // 10% growth
  const new2025Monthly = base2024Monthly * growth2025; // 30.83 tCO2e/month

  // Seasonal adjustments (simplified from historical patterns)
  const seasonalIndex: any = {
    0: 0.20,  // Jan - very low
    1: 0.62,  // Feb - low
    2: 0.86,  // Mar - normal
    3: 0.87,  // Apr - normal
    4: 1.50,  // May - high (but not as extreme as predicted)
    5: 0.82,  // Jun - normal
    6: 0.52,  // Jul - low (vacation)
    7: 0.07,  // Aug - very low (vacation)
  };

  // Calculate total seasonal factor for normalization
  const totalSeasonalFactor = Object.values(seasonalIndex).reduce((a: any, b: any) => a + b, 0);
  const targetTotal = new2025Monthly * 8; // Total for 8 months

  let totalOldEmissions = 0;
  let totalNewEmissions = 0;
  const updates = [];

  currentPredictions?.forEach(pred => {
    const month = new Date(pred.period_start).getMonth();
    const seasonalFactor = seasonalIndex[month] || 1.0;

    // Calculate new emissions proportional to seasonal pattern
    const newEmissions = (targetTotal * seasonalFactor / totalSeasonalFactor) * 1000; // Convert to kg

    // Calculate new value (km traveled) based on emission factor
    const emissionFactor = 0.00015; // kg CO2e per km for plane travel
    const newValue = Math.round(newEmissions / emissionFactor);

    totalOldEmissions += (pred.co2e_emissions || 0) / 1000;
    totalNewEmissions += newEmissions / 1000;

    updates.push({
      id: pred.id,
      old_emissions: (pred.co2e_emissions || 0) / 1000,
      new_emissions: newEmissions / 1000,
      old_value: pred.value,
      new_value: newValue,
      period: pred.period_start
    });
  });

  console.log('=== ADJUSTMENT SUMMARY ===\n');
  console.log(`Current total: ${totalOldEmissions.toFixed(1)} tCO2e`);
  console.log(`Adjusted total: ${totalNewEmissions.toFixed(1)} tCO2e`);
  console.log(`Reduction: ${(totalOldEmissions - totalNewEmissions).toFixed(1)} tCO2e\n`);

  console.log('Monthly adjustments:');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  updates.forEach((u, idx) => {
    console.log(`  ${monthNames[idx]}: ${u.old_emissions.toFixed(1)} → ${u.new_emissions.toFixed(1)} tCO2e`);
  });

  // Ask for confirmation
  if (process.argv.includes('--update')) {
    console.log('\n=== UPDATING DATABASE ===\n');

    for (const update of updates) {
      const { error } = await supabase
        .from('metrics_data')
        .update({
          value: update.new_value,
          co2e_emissions: update.new_emissions * 1000 // Convert back to kg
        })
        .eq('id', update.id);

      if (error) {
        console.error(`Error updating ${update.period}:`, error.message);
      }
    }

    console.log('✅ Updated all plane travel predictions');

    // Verify the changes
    const { data: verified } = await supabase
      .from('metrics_data')
      .select('co2e_emissions')
      .eq('metric_id', planeId)
      .eq('organization_id', orgId)
      .gte('period_start', '2025-01-01')
      .lte('period_end', '2025-08-31');

    const newTotal = verified?.reduce((sum, d) => sum + (d.co2e_emissions || 0) / 1000, 0) || 0;
    console.log(`\nVerified new total: ${newTotal.toFixed(1)} tCO2e`);

  } else {
    console.log('\n⚠️  DRY RUN - No changes made');
    console.log('Run with --update to apply these changes');
  }
}

adjustPredictions();