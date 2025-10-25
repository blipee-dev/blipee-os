// Quick script to check emissions by year
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEmissions() {
  // Get org ID
  const { data: member } = await supabase
    .from('organization_members')
    .select('organization_id')
    .limit(1)
    .single();

  if (!member) {
    console.log('No organization found');
    return;
  }

  const orgId = member.organization_id;
  console.log('Organization ID:', orgId);

  // Check emissions for each year
  for (const year of [2023, 2024, 2025]) {
    const { data: metrics } = await supabase
      .from('metrics_data')
      .select('co2e_emissions, period_start')
      .eq('organization_id', orgId)
      .gte('period_start', `${year}-01-01`)
      .lt('period_start', `${year + 1}-01-01`)
      .order('period_start', { ascending: true });

    if (metrics && metrics.length > 0) {
      const total = metrics.reduce((sum, m) => sum + (m.co2e_emissions || 0), 0) / 1000;
      const uniqueMonths = new Set(metrics.map(m => m.period_start?.substring(0, 7)));

      console.log(`\n${year}:`);
      console.log(`  Records: ${metrics.length}`);
      console.log(`  Unique months: ${uniqueMonths.size}`);
      console.log(`  Total emissions: ${total.toFixed(1)} tCO2e`);
      console.log(`  Months: ${Array.from(uniqueMonths).sort().join(', ')}`);
    } else {
      console.log(`\n${year}: No data`);
    }
  }
}

checkEmissions().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
