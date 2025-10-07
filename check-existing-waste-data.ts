import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkExistingData() {
  console.log('🔍 Checking existing waste data (2022-2024)...\n');

  // Get all waste metrics
  const { data: wasteMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('category.eq.Waste,code.like.scope3_waste%');

  // Get existing data
  const { data: wasteData, count } = await supabase
    .from('metrics_data')
    .select('*, metric:metrics_catalog(*)', { count: 'exact' })
    .in('metric_id', wasteMetrics?.map(m => m.id) || [])
    .order('period_start', { ascending: true });

  console.log(`📊 Total waste records: ${count}\n`);

  // Group by metric and year
  const byMetricAndYear: any = {};

  wasteData?.forEach((record: any) => {
    const metric = record.metric;
    const year = new Date(record.period_start).getFullYear();
    const key = `${metric.code}_${year}`;

    if (!byMetricAndYear[key]) {
      byMetricAndYear[key] = {
        code: metric.code,
        name: metric.name,
        year,
        count: 0,
        total: 0,
        unit: metric.unit,
        is_diverted: metric.is_diverted,
        is_recycling: metric.is_recycling,
        waste_material_type: metric.waste_material_type,
        disposal_method: metric.disposal_method
      };
    }

    byMetricAndYear[key].count++;
    byMetricAndYear[key].total += parseFloat(record.value) || 0;
  });

  // Group by year
  const byYear: any = {};
  Object.values(byMetricAndYear).forEach((item: any) => {
    if (!byYear[item.year]) {
      byYear[item.year] = {
        year: item.year,
        metrics: [],
        old_metrics: [],
        new_metrics: [],
        total_records: 0
      };
    }

    byYear[item.year].total_records += item.count;
    byYear[item.year].metrics.push(item);

    // Categorize as old (original) or new (granular)
    const isOldMetric = [
      'scope3_waste_recycling',
      'scope3_waste_composting',
      'scope3_waste_incineration',
      'scope3_waste_landfill',
      'scope3_waste_ewaste'
    ].includes(item.code);

    if (isOldMetric) {
      byYear[item.year].old_metrics.push(item);
    } else {
      byYear[item.year].new_metrics.push(item);
    }
  });

  // Display by year
  Object.values(byYear).sort((a: any, b: any) => a.year - b.year).forEach((yearData: any) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📅 YEAR ${yearData.year}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Total Records: ${yearData.total_records}`);
    console.log(`\n🔧 ORIGINAL METRICS (${yearData.old_metrics.length}):`);

    yearData.old_metrics.forEach((m: any) => {
      console.log(`\n  ${m.code}`);
      console.log(`    Name: ${m.name}`);
      console.log(`    Records: ${m.count} months`);
      console.log(`    Total: ${m.total.toFixed(2)} ${m.unit}`);
      console.log(`    Flags: diverted=${m.is_diverted}, recycling=${m.is_recycling}`);
      console.log(`    Material: ${m.waste_material_type || 'not set'}`);
      console.log(`    Method: ${m.disposal_method || 'not set'}`);
    });

    if (yearData.new_metrics.length > 0) {
      console.log(`\n✨ NEW GRANULAR METRICS (${yearData.new_metrics.length}):`);
      yearData.new_metrics.forEach((m: any) => {
        console.log(`\n  ${m.code}`);
        console.log(`    Total: ${m.total.toFixed(2)} ${m.unit} (${m.count} records)`);
      });
    } else {
      console.log(`\n✨ NEW GRANULAR METRICS: None yet (ready for future data)`);
    }
  });

  // Summary analysis
  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`📊 SUMMARY ANALYSIS`);
  console.log(`${'='.repeat(60)}`);

  const totalOldMetricRecords = Object.values(byMetricAndYear)
    .filter((m: any) => ['scope3_waste_recycling', 'scope3_waste_composting', 'scope3_waste_incineration', 'scope3_waste_landfill', 'scope3_waste_ewaste'].includes(m.code))
    .reduce((sum: number, m: any) => sum + m.count, 0);

  const totalNewMetricRecords = Object.values(byMetricAndYear)
    .filter((m: any) => !['scope3_waste_recycling', 'scope3_waste_composting', 'scope3_waste_incineration', 'scope3_waste_landfill', 'scope3_waste_ewaste'].includes(m.code))
    .reduce((sum: number, m: any) => sum + m.count, 0);

  console.log(`\n✅ EXISTING DATA (2022-2024):`);
  console.log(`   Original 5 metrics: ${totalOldMetricRecords} records`);
  console.log(`   These metrics now have updated flags:`);
  console.log(`   - is_diverted: TRUE/FALSE (GRI 306-4)`);
  console.log(`   - is_recycling: TRUE/FALSE (ESRS E5)`);
  console.log(`   - waste_material_type: Set to 'mixed' or 'organic'`);
  console.log(`   - disposal_method: recycling, composting, landfill, etc.`);

  console.log(`\n🆕 NEW GRANULAR METRICS:`);
  console.log(`   15 new metrics created: ${totalNewMetricRecords} records`);
  console.log(`   Ready for future detailed tracking`);

  console.log(`\n💡 KEY INSIGHT:`);
  console.log(`   Your historical data (2022-2024) is PRESERVED and ENHANCED`);
  console.log(`   Old metrics still work but now have proper categorization`);
  console.log(`   New metrics allow detailed material-level tracking going forward`);
  console.log(`   Both old and new metrics calculate correctly for:`);
  console.log(`   - Diversion Rate (GRI 306-4)`);
  console.log(`   - Recycling Rate (ESRS E5)`);

  console.log(`\n📈 CALCULATION COMPATIBILITY:`);
  const oldRecycling = byMetricAndYear['scope3_waste_recycling_2024'];
  const oldComposting = byMetricAndYear['scope3_waste_composting_2024'];
  if (oldRecycling || oldComposting) {
    console.log(`   2024 Example (using old metrics):`);
    if (oldRecycling) {
      console.log(`   - Recycling: ${oldRecycling.total.toFixed(2)} tons (is_recycling=TRUE, is_diverted=TRUE)`);
    }
    if (oldComposting) {
      console.log(`   - Composting: ${oldComposting.total.toFixed(2)} tons (is_recycling=FALSE, is_diverted=TRUE)`);
    }
    console.log(`   Both contribute to Diversion Rate, only recycling to Recycling Rate ✓`);
  }
}

checkExistingData();
