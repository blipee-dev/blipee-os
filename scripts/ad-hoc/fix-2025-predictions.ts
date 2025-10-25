import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function fixPredictions() {
  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  console.log('=== FIXING 2025 PREDICTIONS ===\n');

  // Step 1: Delete all current 2025 predictions
  if (process.argv.includes('--fix')) {
    console.log('Step 1: Deleting incorrect 2025 predictions...');

    const { error: deleteError, count } = await supabase
      .from('metrics_data')
      .delete()
      .eq('organization_id', orgId)
      .gte('period_start', '2025-01-01')
      .lte('period_end', '2025-12-31');

    if (deleteError) {
      console.error('Error deleting:', deleteError);
      return;
    }

    console.log(`✅ Deleted ${count || 0} incorrect predictions\n`);

    // Step 2: Generate new realistic predictions
    console.log('Step 2: Generating realistic predictions (10% growth over 2024)...\n');

    // Get 2024 data grouped by metric and month
    const { data: data2024 } = await supabase
      .from('metrics_data')
      .select('*')
      .eq('organization_id', orgId)
      .gte('period_start', '2024-01-01')
      .lte('period_end', '2024-12-31')
      .order('period_start');

    // Group by metric and calculate monthly patterns
    const metricPatterns: any = {};

    data2024?.forEach(record => {
      const metricId = record.metric_id;
      const siteId = record.site_id;
      const month = new Date(record.period_start).getMonth();
      const key = `${metricId}-${siteId}`;

      if (!metricPatterns[key]) {
        metricPatterns[key] = {
          metric_id: metricId,
          site_id: siteId,
          monthlyData: {},
          yearTotal: 0
        };
      }

      if (!metricPatterns[key].monthlyData[month]) {
        metricPatterns[key].monthlyData[month] = [];
      }

      metricPatterns[key].monthlyData[month].push({
        value: record.value || 0,
        emissions: (record.co2e_emissions || 0) / 1000 // Convert to tonnes
      });

      metricPatterns[key].yearTotal += (record.co2e_emissions || 0) / 1000;
    });

    // Get unit mapping from metrics table
    const { data: metrics } = await supabase
      .from('metrics')
      .select('id, unit');

    const unitMap: any = {};
    metrics?.forEach(m => {
      unitMap[m.id] = m.unit;
    });

    // Generate 2025 predictions with 10% growth
    const predictions: any[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const growthFactor = 1.10; // 10% growth

    Object.entries(metricPatterns).forEach(([key, pattern]: any) => {
      // Only generate for metrics that had data in 2024
      if (pattern.yearTotal === 0) return;

      for (let month = 0; month < 8; month++) { // Jan-Aug only
        const monthData = pattern.monthlyData[month];

        if (monthData && monthData.length > 0) {
          // Average the values for this month
          const avgValue = monthData.reduce((sum: number, d: any) => sum + d.value, 0) / monthData.length;
          const avgEmissions = monthData.reduce((sum: number, d: any) => sum + d.emissions, 0) / monthData.length;

          // Apply growth factor
          const predictedValue = Math.round(avgValue * growthFactor);
          const predictedEmissions = avgEmissions * growthFactor * 1000; // Convert back to kg

          const startDate = new Date(2025, month, 1);
          const endDate = new Date(2025, month + 1, 0);

          predictions.push({
            metric_id: pattern.metric_id,
            site_id: pattern.site_id,
            organization_id: orgId,
            period_start: startDate.toISOString().split('T')[0],
            period_end: endDate.toISOString().split('T')[0],
            value: predictedValue,
            unit: unitMap[pattern.metric_id] || 'unit',
            co2e_emissions: predictedEmissions,
            data_quality: 'estimated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
    });

    // Insert new predictions
    console.log(`Inserting ${predictions.length} realistic predictions...\n`);

    // Insert in batches of 100
    for (let i = 0; i < predictions.length; i += 100) {
      const batch = predictions.slice(i, i + 100);
      const { error: insertError } = await supabase
        .from('metrics_data')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        return;
      }
      console.log(`Inserted batch ${Math.floor(i/100) + 1}: ${batch.length} records`);
    }

    console.log('\n✅ Successfully generated new predictions!\n');

    // Step 3: Verify the new totals
    console.log('Step 3: Verifying new totals...\n');

    const { data: new2025 } = await supabase
      .from('metrics_data')
      .select('co2e_emissions')
      .eq('organization_id', orgId)
      .gte('period_start', '2025-01-01')
      .lte('period_end', '2025-08-31');

    const { data: data2024Check } = await supabase
      .from('metrics_data')
      .select('co2e_emissions')
      .eq('organization_id', orgId)
      .gte('period_start', '2024-01-01')
      .lte('period_end', '2024-08-31');

    const new2025Total = new2025?.reduce((sum, d) => sum + (d.co2e_emissions || 0) / 1000, 0) || 0;
    const comparable2024 = data2024Check?.reduce((sum, d) => sum + (d.co2e_emissions || 0) / 1000, 0) || 0;

    console.log('=== FINAL COMPARISON ===\n');
    console.log(`2024 (Jan-Aug): ${comparable2024.toFixed(1)} tCO2e`);
    console.log(`2025 (Jan-Aug): ${new2025Total.toFixed(1)} tCO2e`);
    console.log(`Growth: ${((new2025Total / comparable2024 - 1) * 100).toFixed(1)}%`);

    if (new2025Total < comparable2024 * 1.5) {
      console.log('\n✅ New predictions look reasonable!');
    } else {
      console.log('\n⚠️ Still seems high, but better than before');
    }

  } else {
    // Dry run - show what would happen
    const { count } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('period_start', '2025-01-01')
      .lte('period_end', '2025-12-31');

    console.log(`Would delete ${count} incorrect predictions`);
    console.log('Would generate new predictions with 10% growth over 2024');
    console.log('\nRun with --fix to apply these changes');
  }
}

fixPredictions();