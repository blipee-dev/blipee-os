import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
);

async function checkData() {
  // Get PLMJ organization
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('slug', 'plmj')
    .single();

  if (org) {
    console.log('Organization found:', org.name, 'ID:', org.id);

    // Check metrics data
    const { data: metrics, error } = await supabase
      .from('metrics_data')
      .select('*, metrics_catalog(*)')
      .eq('organization_id', org.id)
      .order('date', { ascending: false })
      .limit(10);

    console.log('\nRecent metrics data:');
    if (metrics && metrics.length > 0) {
      console.log('Found', metrics.length, 'recent records');
      metrics.forEach(m => {
        console.log(`- ${m.date} | ${m.metrics_catalog?.name}: ${m.value} ${m.metrics_catalog?.unit} (${m.co2e_emissions?.toFixed(2) || 0} tCO2e)`);
      });

      // Get total count
      const { count } = await supabase
        .from('metrics_data')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', org.id);

      console.log('\nTotal records for PLMJ:', count);

      // Check date range
      const { data: dateRange } = await supabase
        .from('metrics_data')
        .select('date')
        .eq('organization_id', org.id)
        .order('date', { ascending: true })
        .limit(1);

      const { data: latestDate } = await supabase
        .from('metrics_data')
        .select('date')
        .eq('organization_id', org.id)
        .order('date', { ascending: false })
        .limit(1);

      if (dateRange && latestDate) {
        console.log('\nDate range:', dateRange[0].date, 'to', latestDate[0].date);
      }
    } else {
      console.log('No metrics data found for this organization');
      console.log('Error:', error);
    }
  } else {
    console.log('PLMJ organization not found');
  }
}

checkData().catch(console.error);