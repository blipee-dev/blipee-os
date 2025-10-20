import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkHistoricalMonths() {
  console.log('🔍 CHECKING HISTORICAL DATA MONTHS FOR ALL METRICS\n');
  console.log('='.repeat(120));

  // Get all metrics with 2025 data
  const { data: data2025 } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      metric_id,
      metrics_catalog!inner(code, name, scope)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  const uniqueMetrics = new Map<string, any>();
  data2025?.forEach(d => {
    if (!uniqueMetrics.has(d.metric_id)) {
      uniqueMetrics.set(d.metric_id, {
        metricId: d.metric_id,
        code: d.metrics_catalog.code,
        name: d.metrics_catalog.name,
        scope: d.metrics_catalog.scope
      });
    }
  });

  console.log(`\n📊 Checking ${uniqueMetrics.size} unique metrics\n`);
  console.log('─'.repeat(120));
  console.log('Code                           Name                          Scope    2022    2023    2024    Total   ML Model');
  console.log('─'.repeat(120));

  const results: any[] = [];

  for (const [metricId, metric] of uniqueMetrics.entries()) {
    // Fetch ALL historical data
    const { data: historical } = await supabaseAdmin
      .from('metrics_data')
      .select('period_start, co2e_emissions')
      .eq('organization_id', organizationId)
      .eq('metric_id', metricId)
      .gte('period_start', '2022-01-01')
      .lt('period_start', '2025-01-01')
      .order('period_start', { ascending: true });

    const months2022 = historical?.filter(d => d.period_start?.startsWith('2022')).length || 0;
    const months2023 = historical?.filter(d => d.period_start?.startsWith('2023')).length || 0;
    const months2024 = historical?.filter(d => d.period_start?.startsWith('2024')).length || 0;
    const totalMonths = historical?.length || 0;

    const mlModel = totalMonths >= 36 ? 'seasonal-decomposition' :
                    totalMonths >= 12 ? 'exponential-smoothing' :
                    'insufficient-data';

    const codeDisplay = metric.code.substring(0, 30).padEnd(30);
    const nameDisplay = metric.name.substring(0, 28).padEnd(28);
    const scopeDisplay = metric.scope.replace('scope_', 'S').toUpperCase().padStart(8);

    console.log(
      `${codeDisplay}  ${nameDisplay}  ${scopeDisplay}  ${months2022.toString().padStart(6)}  ` +
      `${months2023.toString().padStart(6)}  ${months2024.toString().padStart(6)}  ${totalMonths.toString().padStart(6)}  ${mlModel}`
    );

    results.push({
      ...metric,
      months2022,
      months2023,
      months2024,
      totalMonths,
      mlModel
    });
  }

  console.log('\n\n📊 SUMMARY BY ML MODEL');
  console.log('═'.repeat(120));

  const bySeasonal = results.filter(r => r.mlModel === 'seasonal-decomposition');
  const byExponential = results.filter(r => r.mlModel === 'exponential-smoothing');
  const byInsufficient = results.filter(r => r.mlModel === 'insufficient-data');

  console.log(`\n✅ Seasonal Decomposition (36+ months): ${bySeasonal.length} metrics`);
  console.log(`⚠️  Exponential Smoothing (12-35 months): ${byExponential.length} metrics`);
  console.log(`❌ Insufficient Data (<12 months): ${byInsufficient.length} metrics`);

  if (byExponential.length > 0) {
    console.log('\n\n⚠️  METRICS USING EXPONENTIAL SMOOTHING (should be seasonal if 36+ months)');
    console.log('─'.repeat(120));
    byExponential.forEach(r => {
      console.log(`   • ${r.name} (${r.code}): ${r.totalMonths} months (${r.months2022}+${r.months2023}+${r.months2024})`);
    });
  }

  // Check for gaps in data
  console.log('\n\n🔍 CHECKING FOR DATA GAPS');
  console.log('═'.repeat(120));

  for (const result of results) {
    if (result.totalMonths < 36 && result.totalMonths >= 12) {
      const { data: historical } = await supabaseAdmin
        .from('metrics_data')
        .select('period_start')
        .eq('organization_id', organizationId)
        .eq('metric_id', result.metricId)
        .gte('period_start', '2022-01-01')
        .lt('period_start', '2025-01-01')
        .order('period_start', { ascending: true });

      const expectedMonths = 36; // 2022-2024 = 36 months
      const actualMonths = historical?.length || 0;
      const missingMonths = expectedMonths - actualMonths;

      if (missingMonths > 0) {
        console.log(`\n⚠️  ${result.name} (${result.code})`);
        console.log(`   Missing ${missingMonths} months out of ${expectedMonths}`);

        // Find which months are missing
        const allMonths: string[] = [];
        for (let year = 2022; year <= 2024; year++) {
          for (let month = 1; month <= 12; month++) {
            allMonths.push(`${year}-${month.toString().padStart(2, '0')}`);
          }
        }

        const existingMonths = new Set(historical?.map(d => d.period_start?.substring(0, 7)) || []);
        const missingMonthsList = allMonths.filter(m => !existingMonths.has(m));

        console.log(`   Missing months: ${missingMonthsList.join(', ')}`);
      }
    }
  }

  console.log('\n' + '═'.repeat(120));
}

checkHistoricalMonths().catch(console.error);
