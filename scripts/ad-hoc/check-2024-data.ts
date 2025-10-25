import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function check2024Data() {
  console.log('🔍 Checking 2024 Data Coverage\n');
  console.log('='.repeat(80));

  try {
    // Get all 2024 data
    const { data: data2024 } = await supabase
      .from('metrics_data')
      .select('metric_id, period_start, value')
      .eq('organization_id', organizationId)
      .gte('period_start', '2024-01-01')
      .lte('period_start', '2024-12-31')
      .order('period_start', { ascending: true });

    if (!data2024 || data2024.length === 0) {
      console.log('❌ No 2024 data found');
      return;
    }

    console.log(`✅ Found ${data2024.length} records in 2024\n`);

    // Get metric details
    const { data: metricsInfo } = await supabase
      .from('metrics_catalog')
      .select('id, code, name, category, unit, scope');

    if (!metricsInfo) {
      console.log('❌ No metrics catalog found');
      return;
    }

    // Group by metric
    const metricMap = new Map();

    data2024.forEach(d => {
      const metric = metricsInfo.find(m => m.id === d.metric_id);
      if (!metric) return;

      if (!metricMap.has(d.metric_id)) {
        metricMap.set(d.metric_id, {
          id: d.metric_id,
          name: metric.name,
          category: metric.category,
          unit: metric.unit,
          scope: metric.scope,
          count: 0,
          months: []
        });
      }

      const info = metricMap.get(d.metric_id);
      info.count++;
      info.months.push(d.period_start.substring(0, 7));
    });

    // Check 2025 data
    const { data: data2025 } = await supabase
      .from('metrics_data')
      .select('metric_id, period_start')
      .eq('organization_id', organizationId)
      .gte('period_start', '2025-01-01')
      .lte('period_start', '2025-12-31');

    const metrics2025 = new Set((data2025 || []).map(d => d.metric_id));

    console.log('📊 METRICS WITH 2024 DATA:\n');

    const byCategory = new Map();
    metricMap.forEach((info, id) => {
      if (!byCategory.has(info.category)) {
        byCategory.set(info.category, []);
      }
      byCategory.get(info.category).push({ ...info, has2025: metrics2025.has(id) });
    });

    byCategory.forEach((metrics, category) => {
      console.log(`\n📂 ${category}:`);
      console.log('─'.repeat(80));

      metrics.forEach(m => {
        const status = m.has2025 ? '✅' : '⚠️ ';
        console.log(`${status} ${m.name}`);
        console.log(`   ${m.count} months in 2024 | Unit: ${m.unit} | Scope: ${m.scope}`);
        console.log(`   Months: ${m.months.slice(0, 3).join(', ')}...${m.months.slice(-2).join(', ')}`);
        if (!m.has2025) {
          console.log(`   ⚠️  NEEDS 2025 FORECAST`);
        }
        console.log('');
      });
    });

    console.log('='.repeat(80));
    console.log('📝 SUMMARY:');
    console.log('='.repeat(80));

    const totalWith2024 = metricMap.size;
    const totalWith2025 = Array.from(metricMap.values()).filter(m => metrics2025.has(m.id)).length;
    const needsForecast = totalWith2024 - totalWith2025;

    console.log(`Metrics with 2024 data: ${totalWith2024}`);
    console.log(`Metrics with 2025 data: ${totalWith2025}`);
    console.log(`⚠️  Need 2025 forecast: ${needsForecast}`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

check2024Data();
