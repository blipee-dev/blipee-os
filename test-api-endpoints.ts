import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAPIs() {
  console.log('\n🧪 Testing Water and Waste API Data Accuracy\n');

  // Get an organization ID to test with
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);

  if (!orgs || orgs.length === 0) {
    console.error('❌ No organizations found');
    return;
  }

  const orgId = orgs[0].id;
  console.log(`📍 Testing with organization: ${orgs[0].name} (${orgId})\n`);

  // 1. Test Water Metrics Query
  console.log('💧 TESTING WATER METRICS QUERY:');
  console.log('=' .repeat(60));

  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, category, subcategory')
    .or('subcategory.eq.Water,code.ilike.%water%');

  console.log(`Found ${waterMetrics?.length || 0} water metrics:`);
  if (waterMetrics) {
    console.table(waterMetrics);
  }

  // 2. Test Water Data Query
  if (waterMetrics && waterMetrics.length > 0) {
    const waterMetricIds = waterMetrics.map(m => m.id);
    const { data: waterData, count } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
      .in('metric_id', waterMetricIds);

    console.log(`\n📊 Water data for this org: ${count || 0} records`);
    if (waterData && waterData.length > 0) {
      // Calculate totals
      const totalValue = waterData.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);
      const totalEmissions = waterData.reduce((sum, d) => sum + (parseFloat(d.co2e_emissions) || 0), 0);

      console.log(`   Total water consumption: ${totalValue.toFixed(2)} m³`);
      console.log(`   Total emissions: ${(totalEmissions / 1000).toFixed(2)} tCO2e`);

      console.log('\n   Sample records:');
      console.table(waterData.slice(0, 5).map(d => {
        const metric = waterMetrics.find(m => m.id === d.metric_id);
        return {
          metric: metric?.name,
          value: d.value,
          emissions_kg: d.co2e_emissions,
          period: d.period_start
        };
      }));
    }
  }

  // 3. Test Waste Metrics Query
  console.log('\n🗑️  TESTING WASTE METRICS QUERY:');
  console.log('=' .repeat(60));

  const { data: wasteMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, category, subcategory')
    .eq('category', 'Waste');

  console.log(`Found ${wasteMetrics?.length || 0} waste metrics:`);
  if (wasteMetrics) {
    console.table(wasteMetrics);
  }

  // 4. Test Waste Data Query
  if (wasteMetrics && wasteMetrics.length > 0) {
    const wasteMetricIds = wasteMetrics.map(m => m.id);
    const { data: wasteData, count } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
      .in('metric_id', wasteMetricIds);

    console.log(`\n📊 Waste data for this org: ${count || 0} records`);
    if (wasteData && wasteData.length > 0) {
      // Calculate totals
      const totalValue = wasteData.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);
      const totalEmissions = wasteData.reduce((sum, d) => sum + (parseFloat(d.co2e_emissions) || 0), 0);

      console.log(`   Total waste generated: ${totalValue.toFixed(2)} tons`);
      console.log(`   Total emissions: ${(totalEmissions / 1000).toFixed(2)} tCO2e`);

      console.log('\n   Sample records:');
      console.table(wasteData.slice(0, 5).map(d => {
        const metric = wasteMetrics.find(m => m.id === d.metric_id);
        return {
          metric: metric?.name,
          value: d.value,
          emissions_kg: d.co2e_emissions,
          period: d.period_start
        };
      }));

      // Group by disposal method
      console.log('\n   Breakdown by metric type:');
      const breakdown = wasteData.reduce((acc: any, d) => {
        const metric = wasteMetrics.find(m => m.id === d.metric_id);
        const metricName = metric?.name || 'Unknown';
        if (!acc[metricName]) {
          acc[metricName] = { quantity: 0, records: 0 };
        }
        acc[metricName].quantity += parseFloat(d.value) || 0;
        acc[metricName].records += 1;
        return acc;
      }, {});
      console.table(breakdown);
    }
  }

  // 5. Test with date filters
  console.log('\n📅 TESTING WITH DATE FILTERS (2024 data):');
  console.log('=' .repeat(60));

  if (waterMetrics && waterMetrics.length > 0) {
    const waterMetricIds = waterMetrics.map(m => m.id);
    const { data: water2024, count: waterCount2024 } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
      .in('metric_id', waterMetricIds)
      .gte('period_start', '2024-01-01')
      .lte('period_start', '2024-12-31');

    console.log(`💧 Water records in 2024: ${waterCount2024 || 0}`);
  }

  if (wasteMetrics && wasteMetrics.length > 0) {
    const wasteMetricIds = wasteMetrics.map(m => m.id);
    const { data: waste2024, count: wasteCount2024 } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact' })
      .eq('organization_id', orgId)
      .in('metric_id', wasteMetricIds)
      .gte('period_start', '2024-01-01')
      .lte('period_start', '2024-12-31');

    console.log(`🗑️  Waste records in 2024: ${wasteCount2024 || 0}`);
  }
}

testAPIs().catch(console.error);
