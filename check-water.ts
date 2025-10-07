import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkWater() {
  console.log('\n🔍 Searching for ALL categories in metrics_catalog...\n');

  // Get all unique categories
  const { data: allMetrics } = await supabase
    .from('metrics_catalog')
    .select('category, subcategory, code, name')
    .order('category')
    .order('subcategory');

  if (allMetrics) {
    // Group by category
    const categories = new Map<string, any[]>();
    allMetrics.forEach(m => {
      if (!categories.has(m.category)) {
        categories.set(m.category, []);
      }
      categories.get(m.category)!.push(m);
    });

    console.log('📊 All Categories Found:');
    for (const [category, metrics] of categories.entries()) {
      console.log(`\n${category}: ${metrics.length} metrics`);
      if (category.toLowerCase().includes('water') || metrics.some(m => m.name?.toLowerCase().includes('water'))) {
        console.log('  WATER-RELATED CATEGORY FOUND! 💧');
        console.table(metrics.slice(0, 5));
      }
    }

    console.log('\n🔍 Searching for water-related metrics by name/code...\n');
    const waterRelated = allMetrics.filter(m =>
      m.name?.toLowerCase().includes('water') ||
      m.code?.toLowerCase().includes('water') ||
      m.subcategory?.toLowerCase().includes('water')
    );

    if (waterRelated.length > 0) {
      console.log(`Found ${waterRelated.length} water-related metrics:`);
      console.table(waterRelated);

      // Check for actual data
      console.log('\n📊 Checking for actual data in metrics_data...');
      const waterIds = waterRelated.map(m => m.code);

      // First, get the full metric records with IDs
      const { data: fullMetrics } = await supabase
        .from('metrics_catalog')
        .select('id, code, name, category')
        .in('code', waterRelated.map(m => m.code));

      if (fullMetrics && fullMetrics.length > 0) {
        const metricIds = fullMetrics.map(m => m.id);
        const { data: waterData, count } = await supabase
          .from('metrics_data')
          .select('metric_id, value, period_start, co2e_emissions', { count: 'exact' })
          .in('metric_id', metricIds)
          .limit(10);

        console.log(`Found ${count || 0} total water data records (showing first 10)`);
        if (waterData && waterData.length > 0) {
          const dataWithNames = waterData.map(d => {
            const metric = fullMetrics.find(m => m.id === d.metric_id);
            return {
              metric_name: metric?.name || 'Unknown',
              category: metric?.category || 'Unknown',
              value: d.value,
              emissions_kg: d.co2e_emissions,
              period: d.period_start
            };
          });
          console.table(dataWithNames);
        }
      }
    } else {
      console.log('⚠️  No water-related metrics found');
    }
  }

  // Also check metrics_data directly for any water patterns
  console.log('\n🔍 Checking metrics_data table for water patterns...\n');
  const { data: sampleData } = await supabase
    .from('metrics_data')
    .select(`
      metric_id,
      value,
      period_start,
      metrics_catalog!inner(code, name, category, subcategory)
    `)
    .limit(1000);

  if (sampleData) {
    const waterData = sampleData.filter((d: any) => {
      const metric = d.metrics_catalog;
      return metric?.name?.toLowerCase().includes('water') ||
             metric?.code?.toLowerCase().includes('water') ||
             metric?.category?.toLowerCase().includes('water') ||
             metric?.subcategory?.toLowerCase().includes('water');
    });

    console.log(`Found ${waterData.length} water-related data records in sample of 1000:`);
    if (waterData.length > 0) {
      console.table(waterData.slice(0, 10).map((d: any) => ({
        metric_name: d.metrics_catalog.name,
        category: d.metrics_catalog.category,
        subcategory: d.metrics_catalog.subcategory,
        value: d.value,
        period: d.period_start
      })));
    }
  }
}

checkWater().catch(console.error);
