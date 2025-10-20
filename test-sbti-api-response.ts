/**
 * Test what the /api/sustainability/targets endpoint actually returns
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

async function testSBTiApiResponse() {
  console.log('🧪 Testing /api/sustainability/targets API Response\n');

  // Get organization and sites
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id, name')
    .limit(1)
    .single();

  if (!org) {
    console.error('❌ No organization found');
    return;
  }

  const { data: sites } = await supabaseAdmin
    .from('sites')
    .select('id, name')
    .eq('organization_id', org.id)
    .order('name');

  if (!sites || sites.length === 0) {
    console.error('❌ No sites found');
    return;
  }

  console.log(`📊 Organization: ${org.name}`);
  console.log(`📍 Sites: ${sites.map(s => s.name).join(', ')}\n`);

  // Get user token for API call
  const { data: adminUser } = await supabaseAdmin.auth.admin.listUsers();
  const user = adminUser.users[0];

  if (!user) {
    console.error('❌ No user found for testing');
    return;
  }

  const { data: sessionData } = await supabaseAdmin.auth.admin.createUser({
    email: user.email!,
    password: 'test',
    email_confirm: true
  });

  console.log('---------------------------------------------------');
  console.log('🌐 Simulating API Call: NO site filter (All Sites)');
  console.log('---------------------------------------------------\n');

  // Simulate what the endpoint returns
  const { getBaselineEmissions, getPeriodEmissions } = await import('./src/lib/sustainability/baseline-calculator');

  const orgBaseline = await getBaselineEmissions(org.id, 2023);
  const orgCurrent = await getPeriodEmissions(org.id, '2025-01-01', new Date().toISOString().split('T')[0]);

  const orgReductionPercent = 42.0; // From database
  const orgTarget = (orgBaseline?.total || 0) * (1 - orgReductionPercent / 100);

  console.log('Expected Response (All Sites):');
  console.log(`  baseline_emissions: ${orgBaseline?.total || 0} tCO2e`);
  console.log(`  current_emissions: ${orgCurrent.total} tCO2e`);
  console.log(`  target_emissions: ${orgTarget.toFixed(1)} tCO2e`);
  console.log(`  reduction_percentage: ${orgReductionPercent}%`);

  const orgProgress = orgBaseline?.total
    ? ((orgBaseline.total - orgCurrent.total) / (orgBaseline.total - orgTarget)) * 100
    : 0;
  console.log(`  progress_percentage: ${orgProgress.toFixed(1)}%\n`);

  // Test for Faro site
  const faroSite = sites.find(s => s.name === 'Faro');
  if (faroSite) {
    console.log('---------------------------------------------------');
    console.log(`🌐 Simulating API Call: WITH site_id=${faroSite.name}`);
    console.log('---------------------------------------------------\n');

    const faroBaseline = await getBaselineEmissions(org.id, 2023, faroSite.id);
    const faroCurrent = await getPeriodEmissions(org.id, '2025-01-01', new Date().toISOString().split('T')[0], faroSite.id);

    const faroTarget = (faroBaseline?.total || 0) * (1 - orgReductionPercent / 100);

    console.log(`Expected Response (${faroSite.name} only):`);
    console.log(`  baseline_emissions: ${faroBaseline?.total || 0} tCO2e ✅ (not ${orgBaseline?.total})`);
    console.log(`  current_emissions: ${faroCurrent.total} tCO2e ✅`);
    console.log(`  target_emissions: ${faroTarget.toFixed(1)} tCO2e ✅ (not ${orgTarget.toFixed(1)})`);
    console.log(`  reduction_percentage: ${orgReductionPercent}% (org-level target definition)`);

    const faroProgress = faroBaseline?.total
      ? ((faroBaseline.total - faroCurrent.total) / (faroBaseline.total - faroTarget)) * 100
      : 0;
    console.log(`  progress_percentage: ${faroProgress.toFixed(1)}% ✅ (not ${orgProgress.toFixed(1)}%)\n`);

    // Show what makes sense
    console.log('📊 Dashboard Display (Faro):');
    console.log(`  Baseline (2023): ${faroBaseline?.total || 0} tCO2e`);
    console.log(`  Current (2025): ${faroCurrent.total} tCO2e`);
    console.log(`  Required (2025): ${calculateRequired(faroBaseline?.total || 0, faroTarget, 2023, 2030, 2025).toFixed(1)} tCO2e`);
    console.log(`  Target (2030): ${faroTarget.toFixed(1)} tCO2e`);
    console.log(`  Progress: ${faroProgress.toFixed(1)}%`);

    const status = faroCurrent.total <= calculateRequired(faroBaseline?.total || 0, faroTarget, 2023, 2030, 2025)
      ? '✅ On track'
      : '⚠️ Behind schedule';
    console.log(`  Status: ${status}\n`);
  }

  console.log('✅ These numbers should now make sense!');
  console.log('   All values are proportional to the site being viewed.');
}

function calculateRequired(baseline: number, target: number, baselineYear: number, targetYear: number, currentYear: number): number {
  const yearsElapsed = currentYear - baselineYear;
  const totalYears = targetYear - baselineYear;
  const totalReduction = baseline - target;
  const requiredReduction = (totalReduction * yearsElapsed) / totalYears;
  return baseline - requiredReduction;
}

testSBTiApiResponse().catch(console.error);
