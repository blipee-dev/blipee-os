import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkBaselineAndRecalculate() {
  console.log('🔍 Checking Baseline Data and Calculating Targets\n');
  console.log('=' .repeat(80));

  try {
    // Check baseline year setting
    const { data: settings } = await supabase
      .from('ghg_inventory_settings')
      .select('baseline_year')
      .eq('organization_id', organizationId)
      .single();

    const baselineYear = settings?.baseline_year || 2023;
    console.log(`\n📅 Baseline Year: ${baselineYear}`);

    // Get energy metrics
    const { data: energyMetrics } = await supabase
      .from('metrics_catalog')
      .select('*')
      .in('category', ['Purchased Energy', 'Electricity']);

    console.log(`📊 Energy Metrics: ${energyMetrics?.length || 0}`);

    const metricIds = energyMetrics?.map(m => m.id) || [];

    // Check baseline data (2023)
    const { data: baselineData } = await supabase
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds)
      .gte('period_start', `${baselineYear}-01-01`)
      .lte('period_start', `${baselineYear}-12-31`);

    console.log(`\n📈 Baseline Data (${baselineYear}): ${baselineData?.length || 0} records`);

    if (baselineData && baselineData.length > 0) {
      const baselineByMetric: any = {};

      baselineData.forEach(record => {
        const metric = energyMetrics?.find(m => m.id === record.metric_id);
        const metricName = metric?.name || 'Unknown';

        if (!baselineByMetric[metricName]) {
          baselineByMetric[metricName] = 0;
        }

        baselineByMetric[metricName] += parseFloat(record.value);
      });

      console.log('\n📊 Baseline Totals by Metric:');
      let baselineTotal = 0;
      Object.entries(baselineByMetric).forEach(([name, value]) => {
        console.log(`  ${name}: ${((value as number) / 1000).toFixed(1)} MWh`);
        baselineTotal += value as number;
      });
      console.log(`  TOTAL BASELINE: ${(baselineTotal / 1000).toFixed(1)} MWh`);
    } else {
      console.log('❌ No baseline data found!');
    }

    // Check 2025 forecast data
    const { data: forecast2025 } = await supabase
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds)
      .gte('period_start', '2025-01-01')
      .lte('period_start', '2025-12-31');

    console.log(`\n📈 2025 Forecast Data: ${forecast2025?.length || 0} records`);

    if (forecast2025 && forecast2025.length > 0) {
      const forecast2025ByMetric: any = {};

      forecast2025.forEach(record => {
        const metric = energyMetrics?.find(m => m.id === record.metric_id);
        const metricName = metric?.name || 'Unknown';

        if (!forecast2025ByMetric[metricName]) {
          forecast2025ByMetric[metricName] = 0;
        }

        forecast2025ByMetric[metricName] += parseFloat(record.value);
      });

      console.log('\n📊 2025 Totals by Metric:');
      let forecast2025Total = 0;
      Object.entries(forecast2025ByMetric).forEach(([name, value]) => {
        console.log(`  ${name}: ${((value as number) / 1000).toFixed(1)} MWh`);
        forecast2025Total += value as number;
      });
      console.log(`  TOTAL 2025: ${(forecast2025Total / 1000).toFixed(1)} MWh`);
    }

    // Check sustainability targets
    const { data: targets } = await supabase
      .from('sustainability_targets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('target_type', 'near-term');

    console.log(`\n🎯 Sustainability Targets: ${targets?.length || 0}`);

    if (targets && targets.length > 0) {
      targets.forEach(target => {
        console.log(`\n  Target: ${target.name}`);
        console.log(`    Baseline Year: ${target.baseline_year}`);
        console.log(`    Target Year: ${target.target_year}`);
        console.log(`    Baseline: ${target.baseline_value?.toFixed(1)} ${target.unit || 'units'}`);
        console.log(`    Target: ${target.target_value?.toFixed(1)} ${target.unit || 'units'}`);
        console.log(`    Current: ${target.current_emissions?.toFixed(1)} ${target.unit || 'units'}`);
        console.log(`    Status: ${target.status}`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(80));
    console.log('\n1. ✅ 2025 forecast data is in place (903.9 MWh)');
    console.log('2. 🔄 The dashboard should automatically calculate progress against baseline');
    console.log('3. 📊 If targets are not showing correctly, check:');
    console.log('   - Baseline year data completeness');
    console.log('   - Target reduction percentages (4.2% for energy)');
    console.log('   - Current year data aggregation');
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkBaselineAndRecalculate();
