import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testWaterForecast() {
  console.log('🔍 Testing Water Forecast API Logic\n');

  // Step 1: Check water metrics
  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('name.ilike.%water%,name.ilike.%wastewater%')
    .eq('category', 'Purchased Goods & Services');

  console.log(`📊 Water metrics found: ${waterMetrics?.length || 0}`);

  if (waterMetrics && waterMetrics.length > 0) {
    console.log('Water metrics:');
    waterMetrics.forEach(m => {
      console.log(`  - ${m.name} (${m.category})`);
    });
  } else {
    console.log('⚠️ No water metrics found with category "Water" or "Water Consumption"');

    // Check what categories exist
    const { data: allMetrics } = await supabase
      .from('metrics_catalog')
      .select('category')
      .ilike('category', '%water%');

    if (allMetrics && allMetrics.length > 0) {
      const uniqueCategories = [...new Set(allMetrics.map(m => m.category))];
      console.log('\n📋 Available water-related categories:');
      uniqueCategories.forEach(cat => console.log(`  - ${cat}`));
    }

    // Check what metrics exist
    const { data: waterLikeMetrics } = await supabase
      .from('metrics_catalog')
      .select('*')
      .or('name.ilike.%water%,category.ilike.%water%');

    if (waterLikeMetrics && waterLikeMetrics.length > 0) {
      console.log('\n📋 Metrics with "water" in name or category:');
      waterLikeMetrics.forEach(m => {
        console.log(`  - ${m.name} (category: ${m.category})`);
      });
    }
  }

  // Step 2: Check if we have any water data
  if (waterMetrics && waterMetrics.length > 0) {
    const metricIds = waterMetrics.map(m => m.id);

    const { data: waterData, count } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact' })
      .eq('organization_id', ORG_ID)
      .in('metric_id', metricIds)
      .limit(10);

    console.log(`\n💧 Water data records: ${count || 0}`);

    if (waterData && waterData.length > 0) {
      console.log('\nSample records:');
      waterData.slice(0, 3).forEach(d => {
        const metric = waterMetrics.find(m => m.id === d.metric_id);
        console.log(`  - ${d.period_start}: ${d.value} (${metric?.name})`);
      });
    }
  }
}

testWaterForecast().catch(console.error);
