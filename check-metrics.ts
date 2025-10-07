import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkMetrics() {
  console.log('\n🔍 Checking Water and Waste metrics in Supabase...\n');

  // Query Water metrics
  const { data: waterMetrics, error: waterError } = await supabase
    .from('metrics_catalog')
    .select('code, name, category, subcategory, unit, emission_factor')
    .eq('category', 'Water')
    .order('subcategory')
    .order('name');

  // Query Waste metrics
  const { data: wasteMetrics, error: wasteError } = await supabase
    .from('metrics_catalog')
    .select('code, name, category, subcategory, unit, emission_factor')
    .eq('category', 'Waste')
    .order('subcategory')
    .order('name');

  if (waterError) {
    console.error('❌ Error fetching Water metrics:', waterError);
  } else {
    console.log('💧 WATER METRICS:');
    console.log('Total Water metrics:', waterMetrics?.length || 0);
    if (waterMetrics && waterMetrics.length > 0) {
      console.table(waterMetrics);
    } else {
      console.log('⚠️  No Water metrics found in database');
    }
  }

  console.log('\n');

  if (wasteError) {
    console.error('❌ Error fetching Waste metrics:', wasteError);
  } else {
    console.log('🗑️  WASTE METRICS:');
    console.log('Total Waste metrics:', wasteMetrics?.length || 0);
    if (wasteMetrics && wasteMetrics.length > 0) {
      console.table(wasteMetrics);
    } else {
      console.log('⚠️  No Waste metrics found in database');
    }
  }

  // Get full metric info to get IDs
  const { data: fullWaterMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name')
    .eq('category', 'Water');

  const { data: fullWasteMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name')
    .eq('category', 'Waste');

  // Also check if there's any actual data
  console.log('\n📊 Checking for actual Water data in metrics_data...');
  if (fullWaterMetrics && fullWaterMetrics.length > 0) {
    const waterMetricIds = fullWaterMetrics.map(m => m.id);
    const { data: waterData, error: waterDataError, count } = await supabase
      .from('metrics_data')
      .select('metric_id, value, period_start', { count: 'exact' })
      .in('metric_id', waterMetricIds)
      .limit(5);

    if (!waterDataError && waterData) {
      console.log(`Found ${count || 0} total water data records (showing first 5)`);
      if (waterData.length > 0) {
        console.table(waterData);
      }
    } else {
      console.error('Error fetching water data:', waterDataError);
    }
  } else {
    console.log('⚠️  No water metrics defined, skipping data check');
  }

  console.log('\n📊 Checking for actual Waste data in metrics_data...');
  if (fullWasteMetrics && fullWasteMetrics.length > 0) {
    const wasteMetricIds = fullWasteMetrics.map(m => m.id);
    const { data: wasteData, error: wasteDataError, count } = await supabase
      .from('metrics_data')
      .select('metric_id, value, period_start, co2e_emissions', { count: 'exact' })
      .in('metric_id', wasteMetricIds)
      .limit(10);

    if (!wasteDataError && wasteData) {
      console.log(`Found ${count || 0} total waste data records (showing first 10)`);
      if (wasteData.length > 0) {
        console.table(wasteData);

        // Join with metric names
        console.log('\n📋 Waste data with metric names:');
        const dataWithNames = wasteData.map(d => {
          const metric = fullWasteMetrics.find(m => m.id === d.metric_id);
          return {
            metric_name: metric?.name || 'Unknown',
            value: d.value,
            emissions_kg: d.co2e_emissions,
            period: d.period_start
          };
        });
        console.table(dataWithNames);
      }
    } else {
      console.error('Error fetching waste data:', wasteDataError);
    }
  } else {
    console.log('⚠️  No waste metrics defined, skipping data check');
  }
}

checkMetrics().catch(console.error);
