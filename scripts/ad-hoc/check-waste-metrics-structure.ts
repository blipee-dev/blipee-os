import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkWasteMetrics() {
  console.log('🔍 Checking waste metrics structure...\n');

  // Get all waste metrics
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('subcategory.eq.Waste,code.ilike.%waste%')
    .order('code');

  console.log(`📊 Found ${metrics?.length || 0} waste metrics:\n`);

  // Group by disposal method/type
  const byDisposalMethod: any = {};

  metrics?.forEach((metric: any) => {
    console.log(`${metric.code}`);
    console.log(`  Name: ${metric.name}`);
    console.log(`  Category: ${metric.category}`);
    console.log(`  Subcategory: ${metric.subcategory}`);
    console.log(`  Unit: ${metric.unit}`);
    console.log(`  Description: ${metric.description || 'N/A'}`);
    console.log('');

    // Try to determine disposal method from code
    if (metric.code.includes('recycl')) {
      if (!byDisposalMethod.recycling) byDisposalMethod.recycling = [];
      byDisposalMethod.recycling.push(metric);
    } else if (metric.code.includes('compost')) {
      if (!byDisposalMethod.composting) byDisposalMethod.composting = [];
      byDisposalMethod.composting.push(metric);
    } else if (metric.code.includes('incinerat')) {
      if (!byDisposalMethod.incineration) byDisposalMethod.incineration = [];
      byDisposalMethod.incineration.push(metric);
    } else if (metric.code.includes('landfill')) {
      if (!byDisposalMethod.landfill) byDisposalMethod.landfill = [];
      byDisposalMethod.landfill.push(metric);
    } else if (metric.code.includes('hazardous')) {
      if (!byDisposalMethod.hazardous) byDisposalMethod.hazardous = [];
      byDisposalMethod.hazardous.push(metric);
    } else {
      if (!byDisposalMethod.other) byDisposalMethod.other = [];
      byDisposalMethod.other.push(metric);
    }
  });

  console.log('\n📋 Grouped by disposal method:');
  Object.keys(byDisposalMethod).forEach(method => {
    console.log(`\n${method.toUpperCase()} (${byDisposalMethod[method].length} metrics):`);
    byDisposalMethod[method].forEach((m: any) => {
      console.log(`  - ${m.code}: ${m.name}`);
    });
  });

  // Check actual data
  const { data: wasteData, count } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact' })
    .in('metric_id', metrics?.map((m: any) => m.id) || [])
    .limit(10);

  console.log(`\n💾 Sample waste data records: ${count} total records`);
  wasteData?.slice(0, 5).forEach((record: any) => {
    const metric = metrics?.find((m: any) => m.id === record.metric_id);
    console.log(`  ${metric?.code}: ${record.value} ${metric?.unit} (${new Date(record.period_start).toISOString().split('T')[0]})`);
  });
}

checkWasteMetrics();
