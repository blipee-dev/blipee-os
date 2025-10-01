import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testAITargetSetting() {
  console.log('🎯 Testing AI Target Setting Assistant...\n');

  // 1. Get organization data
  const { data: orgData } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', 'PLMJ')
    .single();

  console.log('Organization:', orgData?.name);
  console.log('Industry:', orgData?.industry_primary);
  console.log('Company Size:', orgData?.company_size);

  // 2. Get current emissions data
  const { data: metricsData } = await supabase
    .from('metrics_data')
    .select(`
      value,
      co2e_emissions,
      period_end,
      metrics_catalog (
        name,
        scope,
        category
      )
    `)
    .eq('organization_id', orgData?.id)
    .order('period_end', { ascending: false })
    .limit(100);

  // Calculate total emissions by scope
  const emissionsByScope = metricsData?.reduce((acc: any, item) => {
    const scope = item.metrics_catalog?.scope;
    if (scope) {
      const scopeNum = parseInt(scope.replace('scope_', ''));
      if (!acc[scopeNum]) acc[scopeNum] = 0;
      acc[scopeNum] += item.co2e_emissions || 0;
    }
    return acc;
  }, {});

  console.log('\n📊 Current Emissions Summary:');
  console.log('Scope 1:', (emissionsByScope[1] || 0).toFixed(2), 'kgCO2e');
  console.log('Scope 2:', (emissionsByScope[2] || 0).toFixed(2), 'kgCO2e');
  console.log('Scope 3:', (emissionsByScope[3] || 0).toFixed(2), 'kgCO2e');
  console.log('Total:', Object.values(emissionsByScope || {}).reduce((a: any, b: any) => a + b, 0).toFixed(2), 'kgCO2e');

  // 3. Generate AI recommendations (simulating what the AI would suggest)
  const totalEmissions = Object.values(emissionsByScope || {}).reduce((a: any, b: any) => a + b, 0) as number;

  const recommendations = {
    nearTerm: {
      year: 2030,
      reductionPercent: 42, // SBTi standard for 1.5°C
      absoluteTarget: totalEmissions * 0.58, // 42% reduction
      strategy: 'Focus on renewable energy transition and energy efficiency'
    },
    longTerm: {
      year: 2050,
      reductionPercent: 90, // Net-zero target
      absoluteTarget: totalEmissions * 0.10,
      strategy: 'Complete decarbonization with residual emissions offset'
    },
    keyActions: [
      'Transition to 100% renewable electricity by 2025',
      'Implement ISO 50001 energy management system',
      'Engage suppliers for Scope 3 reductions',
      'Invest in carbon removal for residual emissions'
    ]
  };

  console.log('\n🤖 AI-Generated Science-Based Targets:');
  console.log('\nNear-term (2030):');
  console.log(`- Reduce absolute emissions by ${recommendations.nearTerm.reductionPercent}%`);
  console.log(`- Target: ${recommendations.nearTerm.absoluteTarget.toFixed(2)} kgCO2e`);
  console.log(`- Strategy: ${recommendations.nearTerm.strategy}`);

  console.log('\nLong-term (2050):');
  console.log(`- Reduce absolute emissions by ${recommendations.longTerm.reductionPercent}%`);
  console.log(`- Target: ${recommendations.longTerm.absoluteTarget.toFixed(2)} kgCO2e`);
  console.log(`- Strategy: ${recommendations.longTerm.strategy}`);

  console.log('\n📋 Recommended Actions:');
  recommendations.keyActions.forEach((action, i) => {
    console.log(`${i + 1}. ${action}`);
  });

  // 4. Save targets to database
  const targets = [
    {
      organization_id: orgData?.id,
      name: '2030 Science-Based Target',
      target_type: 'absolute',
      baseline_year: 2024,
      baseline_value: totalEmissions,
      target_year: 2030,
      target_value: recommendations.nearTerm.absoluteTarget,
      target_unit: 'kgCO2e',
      scopes_included: ['scope_1', 'scope_2', 'scope_3'],
      is_sbti_validated: false,
      status: 'draft',
      created_at: new Date().toISOString()
    },
    {
      organization_id: orgData?.id,
      name: '2050 Net-Zero Target',
      target_type: 'net_zero',
      baseline_year: 2024,
      baseline_value: totalEmissions,
      target_year: 2050,
      target_value: recommendations.longTerm.absoluteTarget,
      target_unit: 'kgCO2e',
      scopes_included: ['scope_1', 'scope_2', 'scope_3'],
      is_sbti_validated: false,
      status: 'draft',
      created_at: new Date().toISOString()
    }
  ];

  console.log('\n💾 Saving targets to database...');

  const { data: savedTargets, error } = await supabase
    .from('sustainability_targets')
    .insert(targets)
    .select();

  if (error) {
    console.error('❌ Error saving targets:', error);
  } else {
    console.log('✅ Targets saved successfully!');
    console.log('\nSaved targets:', savedTargets?.map(t => ({
      name: t.name,
      year: t.target_year,
      reduction: `${((1 - t.target_value / t.baseline_value) * 100).toFixed(1)}%`
    })));
  }

  console.log('\n🎉 AI Target Setting Complete!');
  console.log('View targets at: http://localhost:3000/sustainability/targets');
}

// Run the test
testAITargetSetting().catch(console.error);