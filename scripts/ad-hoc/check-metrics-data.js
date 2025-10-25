const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkMetricsData() {
  console.log('📊 Checking Metrics Data for ML Training\n');

  try {
    // 1. Check metrics_catalog structure
    console.log('📋 Checking metrics_catalog table structure:');
    const { data: catalogSample, error: catalogError } = await supabase
      .from('metrics_catalog')
      .select('*')
      .limit(5);

    if (catalogError) {
      console.error('   Error:', catalogError.message);
    } else if (catalogSample && catalogSample.length > 0) {
      console.log('   ✅ metrics_catalog columns:', Object.keys(catalogSample[0]).join(', '));
      console.log('   Sample metrics:');
      catalogSample.forEach(metric => {
        console.log(`      - ${metric.name} (${metric.category}, Scope ${metric.scope})`);
      });
    }

    // 2. Check metrics_data structure
    console.log('\n📋 Checking metrics_data table structure:');
    const { data: dataSample, error: dataError } = await supabase
      .from('metrics_data')
      .select('*')
      .limit(5)
      .order('period_start', { ascending: false });

    if (dataError) {
      console.error('   Error:', dataError.message);
    } else if (dataSample && dataSample.length > 0) {
      console.log('   ✅ metrics_data columns:', Object.keys(dataSample[0]).join(', '));
    }

    // 3. Check data range for PLMJ organization
    console.log('\n📅 Checking data range for PLMJ organization:');
    const plmjOrgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

    // Get earliest and latest data
    const { data: dateRange, error: rangeError } = await supabase
      .from('metrics_data')
      .select('period_start, period_end')
      .eq('organization_id', plmjOrgId)
      .order('period_start', { ascending: true });

    if (rangeError) {
      console.error('   Error:', rangeError.message);
    } else if (dateRange && dateRange.length > 0) {
      const earliestDate = new Date(dateRange[0].period_start);
      const latestDate = new Date(dateRange[dateRange.length - 1].period_end);

      console.log(`   ✅ Data available from: ${earliestDate.toLocaleDateString()} to ${latestDate.toLocaleDateString()}`);
      console.log(`   Total data points: ${dateRange.length}`);

      // Calculate months of data
      const monthsDiff = (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 +
                        (latestDate.getMonth() - earliestDate.getMonth());
      console.log(`   Approximately ${monthsDiff} months of data`);
    } else {
      console.log('   ❌ No data found for PLMJ organization');
    }

    // 4. Check data by year
    console.log('\n📊 Data points by year:');
    const years = [2022, 2023, 2024, 2025];

    for (const year of years) {
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;

      const { data: yearData, count, error: yearError } = await supabase
        .from('metrics_data')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', plmjOrgId)
        .gte('period_start', startDate)
        .lte('period_end', endDate);

      if (!yearError) {
        console.log(`   ${year}: ${count || 0} data points`);
      }
    }

    // 5. Check emissions data (co2e_emissions)
    console.log('\n🌍 Checking emissions data:');
    const { data: emissionsData, error: emissionsError } = await supabase
      .from('metrics_data')
      .select('co2e_emissions, period_start')
      .eq('organization_id', plmjOrgId)
      .not('co2e_emissions', 'is', null)
      .order('period_start', { ascending: false })
      .limit(10);

    if (emissionsError) {
      console.error('   Error:', emissionsError.message);
    } else if (emissionsData && emissionsData.length > 0) {
      console.log(`   ✅ Found ${emissionsData.length} records with emissions data`);
      console.log('   Recent emissions values:');
      emissionsData.slice(0, 5).forEach(record => {
        const date = new Date(record.period_start).toLocaleDateString();
        console.log(`      ${date}: ${record.co2e_emissions?.toFixed(2) || 0} tCO2e`);
      });
    } else {
      console.log('   ❌ No emissions data found');
    }

    // 6. Check data by scope
    console.log('\n📊 Data by scope:');
    const { data: scopeData, error: scopeError } = await supabase
      .from('metrics_data')
      .select(`
        co2e_emissions,
        metrics_catalog!inner(scope)
      `)
      .eq('organization_id', plmjOrgId)
      .not('co2e_emissions', 'is', null);

    if (!scopeError && scopeData) {
      const scopeSummary = {
        scope_1: 0,
        scope_2: 0,
        scope_3: 0,
        unknown: 0
      };

      scopeData.forEach(record => {
        const scope = record.metrics_catalog?.scope;
        const emissions = record.co2e_emissions || 0;

        if (scope === 'scope_1' || scope === 1) scopeSummary.scope_1 += emissions;
        else if (scope === 'scope_2' || scope === 2) scopeSummary.scope_2 += emissions;
        else if (scope === 'scope_3' || scope === 3) scopeSummary.scope_3 += emissions;
        else scopeSummary.unknown += emissions;
      });

      console.log('   Scope 1:', scopeSummary.scope_1.toFixed(2), 'tCO2e');
      console.log('   Scope 2:', scopeSummary.scope_2.toFixed(2), 'tCO2e');
      console.log('   Scope 3:', scopeSummary.scope_3.toFixed(2), 'tCO2e');

      const total = scopeSummary.scope_1 + scopeSummary.scope_2 + scopeSummary.scope_3;
      console.log('   Total emissions:', total.toFixed(2), 'tCO2e');
    }

    // 7. Check monthly aggregated data for time series
    console.log('\n📈 Monthly aggregated emissions (for ML training):');
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('metrics_data')
      .select('period_start, period_end, co2e_emissions')
      .eq('organization_id', plmjOrgId)
      .not('co2e_emissions', 'is', null)
      .order('period_start', { ascending: true });

    if (!monthlyError && monthlyData) {
      // Aggregate by month
      const monthlyAggregated = {};

      monthlyData.forEach(record => {
        const date = new Date(record.period_start);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyAggregated[monthKey]) {
          monthlyAggregated[monthKey] = {
            emissions: 0,
            count: 0
          };
        }

        monthlyAggregated[monthKey].emissions += record.co2e_emissions || 0;
        monthlyAggregated[monthKey].count += 1;
      });

      const sortedMonths = Object.keys(monthlyAggregated).sort();
      console.log(`   ✅ ${sortedMonths.length} months of data available`);

      // Show last 6 months
      console.log('\n   Last 6 months:');
      sortedMonths.slice(-6).forEach(month => {
        const data = monthlyAggregated[month];
        console.log(`      ${month}: ${data.emissions.toFixed(2)} tCO2e (${data.count} records)`);
      });

      // Check if we have enough data for ML training
      console.log('\n🤖 ML Training Feasibility:');
      if (sortedMonths.length >= 12) {
        console.log('   ✅ Sufficient data for LSTM training (need at least 12 months)');
        console.log(`   ✅ Have ${sortedMonths.length} months of historical data`);
        console.log('   ✅ Ready to train emissions forecast model!');
      } else {
        console.log(`   ⚠️  Only ${sortedMonths.length} months of data (need at least 12 for good predictions)`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkMetricsData().catch(console.error);