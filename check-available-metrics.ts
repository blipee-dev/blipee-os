import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkAvailableMetrics() {
  console.log('🔍 Checking Available Metrics and Data Coverage\n');
  console.log('='.repeat(80));

  try {
    // Get all metrics that have data for this organization
    const { data: metricsData } = await supabase
      .from('metrics_data')
      .select('metric_id, period_start, value')
      .eq('organization_id', organizationId)
      .order('period_start', { ascending: true });

    if (!metricsData || metricsData.length === 0) {
      console.log('❌ No metrics data found');
      return;
    }

    // Get metric details
    const { data: metricsInfo } = await supabase
      .from('metrics_catalog')
      .select('id, code, name, category, unit, scope');

    if (!metricsInfo) {
      console.log('❌ No metrics catalog found');
      return;
    }

    // Group data by metric
    const metricGroups = new Map<string, {
      name: string;
      category: string;
      unit: string;
      scope: string;
      data2023: number;
      data2024: number;
      data2025: number;
      firstDate: string;
      lastDate: string;
    }>();

    metricsData.forEach(d => {
      const metric = metricsInfo.find(m => m.id === d.metric_id);
      if (!metric) return;

      const year = d.period_start.substring(0, 4);

      if (!metricGroups.has(d.metric_id)) {
        metricGroups.set(d.metric_id, {
          name: metric.name,
          category: metric.category,
          unit: metric.unit,
          scope: metric.scope || 'N/A',
          data2023: 0,
          data2024: 0,
          data2025: 0,
          firstDate: d.period_start,
          lastDate: d.period_start
        });
      }

      const group = metricGroups.get(d.metric_id)!;
      if (year === '2023') group.data2023++;
      if (year === '2024') group.data2024++;
      if (year === '2025') group.data2025++;

      if (d.period_start < group.firstDate) group.firstDate = d.period_start;
      if (d.period_start > group.lastDate) group.lastDate = d.period_start;
    });

    console.log('\n📊 METRICS DATA COVERAGE:\n');

    const categories = new Map<string, any[]>();

    metricGroups.forEach((info, metricId) => {
      if (!categories.has(info.category)) {
        categories.set(info.category, []);
      }
      categories.get(info.category)!.push({ metricId, ...info });
    });

    categories.forEach((metrics, category) => {
      console.log(`\n📂 ${category}:`);
      console.log('─'.repeat(80));

      metrics.forEach(m => {
        const needs2025 = m.data2024 > 0 && m.data2025 === 0;
        const statusIcon = needs2025 ? '⚠️ ' : m.data2025 > 0 ? '✅' : '  ';

        console.log(`${statusIcon} ${m.name}`);
        console.log(`   Scope: ${m.scope} | Unit: ${m.unit}`);
        console.log(`   Data: 2023=${m.data2023} months, 2024=${m.data2024} months, 2025=${m.data2025} months`);
        console.log(`   Range: ${m.firstDate.substring(0, 7)} to ${m.lastDate.substring(0, 7)}`);

        if (needs2025) {
          console.log(`   ⚠️  NEEDS 2025 FORECAST (has 2024 data but no 2025)`);
        }
        console.log('');
      });
    });

    console.log('='.repeat(80));
    console.log('📝 SUMMARY:');
    console.log('='.repeat(80));

    const totalMetrics = metricGroups.size;
    const with2024 = Array.from(metricGroups.values()).filter(m => m.data2024 > 0).length;
    const with2025 = Array.from(metricGroups.values()).filter(m => m.data2025 > 0).length;
    const needsForecast = Array.from(metricGroups.values()).filter(m => m.data2024 > 0 && m.data2025 === 0).length;

    console.log(`Total metrics: ${totalMetrics}`);
    console.log(`With 2024 data: ${with2024}`);
    console.log(`With 2025 data: ${with2025}`);
    console.log(`⚠️  Need 2025 forecast: ${needsForecast}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAvailableMetrics();
