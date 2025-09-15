const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function debugDashboard() {
  console.log('🔍 Debugging Dashboard Data Flow...\n');

  try {
    // 1. Check PLMJ organization
    const { data: plmjOrg } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', 'PLMJ')
      .single();

    console.log('📊 PLMJ Organization:');
    console.log(`  ID: ${plmjOrg?.id}`);
    console.log(`  Name: ${plmjOrg?.name}`);

    if (!plmjOrg) {
      console.log('❌ PLMJ organization not found!');
      return;
    }

    // 2. Check sites for PLMJ
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .eq('organization_id', plmjOrg.id);

    console.log(`\n🏭 Sites for PLMJ: ${sites?.length || 0}`);
    sites?.forEach(s => console.log(`  - ${s.name} (${s.id})`));

    // 3. Check metrics_data for PLMJ
    const now = new Date();
    const startDate = new Date();
    startDate.setFullYear(now.getFullYear() - 1); // Last year

    console.log(`\n📅 Date Range: ${startDate.toISOString()} to ${now.toISOString()}`);

    const { data: metricsData, count } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact' })
      .eq('organization_id', plmjOrg.id)
      .gte('period_start', startDate.toISOString())
      .lte('period_end', now.toISOString());

    console.log(`\n📈 Metrics data in date range: ${count} records`);

    // 4. Check ALL metrics_data for PLMJ (no date filter)
    const { data: allMetrics, count: allCount } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact' })
      .eq('organization_id', plmjOrg.id);

    console.log(`📈 Total metrics data for PLMJ: ${allCount} records`);

    // 5. Check date range of data
    if (allMetrics && allMetrics.length > 0) {
      const dates = allMetrics.map(d => new Date(d.period_start));
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      console.log(`\n📅 Actual Data Range: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);

      // Sample some records
      console.log('\n📊 Sample Records:');
      allMetrics.slice(0, 3).forEach(m => {
        console.log(`  - Period: ${m.period_start} to ${m.period_end}`);
        console.log(`    Value: ${m.value} ${m.unit}`);
        console.log(`    CO2e: ${m.co2e_emissions}`);
        console.log(`    Site: ${m.site_id}`);
      });
    }

    // 6. Check user_access for any test user
    const { data: userAccess } = await supabase
      .from('user_access')
      .select('*')
      .eq('resource_type', 'organization')
      .eq('resource_id', plmjOrg.id);

    console.log(`\n👥 User Access Records for PLMJ: ${userAccess?.length || 0}`);
    userAccess?.forEach(ua => {
      console.log(`  - User: ${ua.user_id.slice(0, 8)}... Role: ${ua.role}`);
    });

    // 7. Check super_admins
    const { data: superAdmins } = await supabase
      .from('super_admins')
      .select('*');

    console.log(`\n🔑 Super Admins: ${superAdmins?.length || 0}`);
    superAdmins?.forEach(sa => {
      console.log(`  - User: ${sa.user_id.slice(0, 8)}...`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

debugDashboard();