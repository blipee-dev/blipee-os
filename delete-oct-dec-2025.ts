import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function deleteOctDec2025() {
  console.log('🗑️  DELETING OCTOBER-DECEMBER 2025 CALCULATED DATA\n');
  console.log('='.repeat(120));

  // First, check what we're about to delete
  const { data: toDelete } = await supabaseAdmin
    .from('metrics_data')
    .select('period_start, co2e_emissions, metrics_catalog!inner(name)')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-10-01')
    .lt('period_start', '2026-01-01')
    .eq('data_quality', 'calculated');

  console.log(`Found ${toDelete?.length || 0} records to delete (Oct-Dec 2025)\n`);

  const byMonth = new Map<string, number>();
  toDelete?.forEach(d => {
    const month = d.period_start?.substring(0, 7);
    if (month) {
      byMonth.set(month, (byMonth.get(month) || 0) + 1);
    }
  });

  console.log('Records by month:');
  for (const [month, count] of byMonth.entries()) {
    console.log(`  ${month}: ${count} records`);
  }

  const totalEmissions = toDelete?.reduce((sum, d) => sum + ((d.co2e_emissions || 0) / 1000), 0) || 0;
  console.log(`\nTotal emissions to be deleted: ${totalEmissions.toFixed(2)} tCO2e`);

  console.log('\n⚠️  Are you sure you want to delete these records?');
  console.log('Proceeding with deletion in 2 seconds...\n');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Delete the records
  const { error, count } = await supabaseAdmin
    .from('metrics_data')
    .delete()
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-10-01')
    .lt('period_start', '2026-01-01')
    .eq('data_quality', 'calculated');

  if (error) {
    console.error('❌ Error deleting records:', error);
    return;
  }

  console.log('✅ Successfully deleted Oct-Dec 2025 calculated data');
  console.log(`   Deleted ${count} records\n`);

  // Verify deletion
  const { data: remaining } = await supabaseAdmin
    .from('metrics_data')
    .select('period_start')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .eq('data_quality', 'calculated');

  console.log('Remaining 2025 calculated records:', remaining?.length || 0);

  const remainingByMonth = new Map<string, number>();
  remaining?.forEach(d => {
    const month = d.period_start?.substring(0, 7);
    if (month) {
      remainingByMonth.set(month, (remainingByMonth.get(month) || 0) + 1);
    }
  });

  console.log('\nRemaining records by month:');
  for (const month of ['2025-01','2025-02','2025-03','2025-04','2025-05','2025-06',
                       '2025-07','2025-08','2025-09','2025-10','2025-11','2025-12']) {
    const count = remainingByMonth.get(month) || 0;
    console.log(`  ${month}: ${count.toString().padStart(3)} records ${count > 0 ? '✅' : '❌'}`);
  }

  console.log('\n✅ DELETION COMPLETE');
  console.log('='.repeat(120));
  console.log('\nYour dashboards will now show:');
  console.log('  • Jan-Sep 2025: ML forecasts using seasonal-decomposition');
  console.log('  • Oct-Dec 2025: No data (will appear as gaps in charts)');
}

deleteOctDec2025().catch(console.error);
