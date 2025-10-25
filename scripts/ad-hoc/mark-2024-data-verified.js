const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function mark2024DataAsVerified() {
  console.log('✅ Marking 2024 Data as Primary & Verified\n');
  console.log('='.repeat(70));

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // First, check current status
  const { data: before, error: beforeError } = await supabase
    .from('metrics_data')
    .select('data_quality, verification_status')
    .eq('organization_id', organizationId)
    .gte('period_start', '2024-01-01')
    .lt('period_start', '2025-01-01');

  if (beforeError) {
    console.error('❌ Error fetching data:', beforeError);
    return;
  }

  console.log(`\n📊 2024 Records: ${before.length}`);

  const measuredCount = before.filter(r => r.data_quality === 'measured').length;
  const calculatedCount = before.filter(r => r.data_quality === 'calculated').length;
  const estimatedCount = before.filter(r => r.data_quality === 'estimated').length;
  const verifiedCount = before.filter(r => r.verification_status === 'verified').length;
  const pendingCount = before.filter(r => r.verification_status === 'pending').length;

  console.log(`\nCurrent Status:`);
  console.log(`  Data Quality:`);
  console.log(`    Measured: ${measuredCount}`);
  console.log(`    Calculated: ${calculatedCount}`);
  console.log(`    Estimated: ${estimatedCount}`);
  console.log(`  Verification:`);
  console.log(`    Verified: ${verifiedCount}`);
  console.log(`    Pending: ${pendingCount}`);

  // Update all 2024 records to measured (real data) and verified
  const { data: updated, error: updateError } = await supabase
    .from('metrics_data')
    .update({
      data_quality: 'measured',
      verification_status: 'verified',
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('organization_id', organizationId)
    .gte('period_start', '2024-01-01')
    .lt('period_start', '2025-01-01')
    .select('id');

  if (updateError) {
    console.error('❌ Error updating data:', updateError);
    return;
  }

  console.log('\n' + '='.repeat(70));
  console.log(`\n✅ Successfully updated ${updated.length} records!`);
  console.log('\nAll 2024 data is now:');
  console.log('  ✓ Data Quality: MEASURED (real/confirmed data)');
  console.log('  ✓ Verification Status: VERIFIED');
  console.log('\n💡 Refresh the Overview Dashboard to see updated Data Quality metrics.\n');
}

mark2024DataAsVerified();
