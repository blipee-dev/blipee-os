import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkDecemberDrop() {
  console.log('🔍 CHECKING DECEMBER 2025 DROP TO ZERO\n');

  const { data } = await supabaseAdmin
    .from('metrics_data')
    .select('period_start, co2e_emissions, metrics_catalog!inner(name, scope)')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .eq('data_quality', 'calculated')
    .order('period_start');

  const byMonth = new Map<string, number>();
  const byScope = new Map<string, any>();

  data?.forEach(d => {
    const month = d.period_start?.substring(0, 7);
    const scope = d.metrics_catalog.scope;

    if (month) {
      byMonth.set(month, (byMonth.get(month) || 0) + ((d.co2e_emissions || 0) / 1000));

      if (!byScope.has(month)) {
        byScope.set(month, { scope_1: 0, scope_2: 0, scope_3: 0 });
      }
      const scopeData = byScope.get(month)!;
      scopeData[scope] = (scopeData[scope] || 0) + ((d.co2e_emissions || 0) / 1000);
    }
  });

  console.log('MONTHLY TOTALS (tCO2e):');
  console.log('Month       Total    Scope 1  Scope 2  Scope 3');
  console.log('-'.repeat(60));

  for (const month of ['2025-01','2025-02','2025-03','2025-04','2025-05','2025-06',
                       '2025-07','2025-08','2025-09','2025-10','2025-11','2025-12']) {
    const total = byMonth.get(month) || 0;
    const scopes = byScope.get(month) || { scope_1: 0, scope_2: 0, scope_3: 0 };
    console.log(
      month + '  ' +
      total.toFixed(2).padStart(8) + '  ' +
      (scopes.scope_1 || 0).toFixed(2).padStart(7) + '  ' +
      (scopes.scope_2 || 0).toFixed(2).padStart(7) + '  ' +
      (scopes.scope_3 || 0).toFixed(2).padStart(7)
    );
  }

  // Check Dec 2025 records in detail
  const { data: decData } = await supabaseAdmin
    .from('metrics_data')
    .select('co2e_emissions, value, metrics_catalog!inner(name, scope)')
    .eq('organization_id', organizationId)
    .eq('period_start', '2025-12-01')
    .eq('data_quality', 'calculated');

  console.log('\n\nDECEMBER 2025 RECORDS:');
  console.log('-'.repeat(80));
  console.log('Total records:', decData?.length || 0);
  console.log('\nTop 10 by emissions:');
  const sorted = (decData || [])
    .sort((a, b) => (b.co2e_emissions || 0) - (a.co2e_emissions || 0))
    .slice(0, 10);

  sorted.forEach(d => {
    console.log(
      `${d.metrics_catalog.name.substring(0, 35).padEnd(35)} | ` +
      `${((d.co2e_emissions || 0) / 1000).toFixed(4)} tCO2e`
    );
  });

  const decTotal = (decData || []).reduce((sum, d) => sum + ((d.co2e_emissions || 0) / 1000), 0);
  console.log('\nDecember total:', decTotal.toFixed(2), 'tCO2e');
}

checkDecemberDrop().catch(console.error);
