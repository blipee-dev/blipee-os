import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testESGCompliance() {
  console.log('🔍 Testing ESG Compliance Status...\n');

  try {
    // Get organization
    const { data: orgs } = await supabase.from('organizations').select('id, name').limit(1);
    if (!orgs || orgs.length === 0) {
      console.error('❌ No organization found');
      return;
    }
    const org = orgs[0];
    console.log(`🏢 Organization: ${org.name} (${org.id})\n`);

    // Check Environmental Data (E1-E5)
    console.log('🌍 ENVIRONMENTAL DATA (ESRS E1-E5):');
    
    const { count: emissionsCount } = await supabase
      .from('emissions_data')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
    console.log(`  ✅ E1 Climate: ${emissionsCount} emissions records`);

    const { count: pollutionCount } = await supabase
      .from('pollution_emissions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
    console.log(`  ${pollutionCount > 0 ? '✅' : '⚠️'} E2 Pollution: ${pollutionCount} records`);

    const { count: waterCount } = await supabase
      .from('water_usage')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
    console.log(`  ✅ E3 Water: ${waterCount} records`);

    const { count: biodiversityCount } = await supabase
      .from('biodiversity_sites')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
    console.log(`  ${biodiversityCount > 0 ? '✅' : '⚠️'} E4 Biodiversity: ${biodiversityCount} records`);

    const { count: circularCount } = await supabase
      .from('circular_economy_flows')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
    console.log(`  ${circularCount > 0 ? '✅' : '⚠️'} E5 Circular Economy: ${circularCount} records`);

    // Check Social Data (S1-S4)
    console.log('\n👥 SOCIAL DATA (ESRS S1-S4):');
    
    const { count: workforceCount } = await supabase
      .from('workforce_demographics')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
    console.log(`  ${workforceCount > 0 ? '✅' : '⚠️'} S1 Workforce: ${workforceCount} records`);

    const { count: supplierCount } = await supabase
      .from('supplier_social_assessment')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
    console.log(`  ${supplierCount > 0 ? '✅' : '⚠️'} S2 Value Chain: ${supplierCount} records`);

    const { count: communityCount } = await supabase
      .from('community_engagement')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
    console.log(`  ${communityCount > 0 ? '✅' : '⚠️'} S3 Communities: ${communityCount} records`);

    const { count: safetyCount } = await supabase
      .from('health_safety_metrics')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
    console.log(`  ${safetyCount > 0 ? '✅' : '⚠️'} S1 Health & Safety: ${safetyCount} records`);

    // Check Governance Data (G1)
    console.log('\n🏛️  GOVERNANCE DATA (ESRS G1):');
    
    const { count: conductCount } = await supabase
      .from('business_conduct')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
    console.log(`  ${conductCount > 0 ? '✅' : '⚠️'} G1 Business Conduct: ${conductCount} records`);

    const { count: boardCount } = await supabase
      .from('board_composition')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
    console.log(`  ${boardCount > 0 ? '✅' : '⚠️'} G1 Board Composition: ${boardCount} records`);

    // Check CSRD-specific requirements
    console.log('\n🇪🇺 CSRD SPECIFIC REQUIREMENTS:');
    
    const { count: materialityCount } = await supabase
      .from('materiality_assessments')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
    console.log(`  ${materialityCount > 0 ? '✅' : '⚠️'} Double Materiality: ${materialityCount} assessments`);

    const { count: taxonomyCount } = await supabase
      .from('eu_taxonomy_alignment')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
    console.log(`  ${taxonomyCount > 0 ? '✅' : '⚠️'} EU Taxonomy: ${taxonomyCount} records`);

    // Check Science-Based Targets
    console.log('\n🎯 TARGETS & COMMITMENTS:');
    
    const { count: targetsCount } = await supabase
      .from('sustainability_targets')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);
    console.log(`  ${targetsCount > 0 ? '✅' : '⚠️'} Sustainability Targets: ${targetsCount} targets`);

    // Calculate compliance scores
    const environmentalScore = [
      emissionsCount > 0,
      pollutionCount > 0,
      waterCount > 0,
      biodiversityCount > 0,
      circularCount > 0
    ].filter(Boolean).length / 5 * 100;

    const socialScore = [
      workforceCount > 0,
      supplierCount > 0,
      communityCount > 0,
      safetyCount > 0
    ].filter(Boolean).length / 4 * 100;

    const governanceScore = [
      conductCount > 0,
      boardCount > 0
    ].filter(Boolean).length / 2 * 100;

    const csrdScore = [
      materialityCount > 0,
      taxonomyCount > 0,
      targetsCount > 0
    ].filter(Boolean).length / 3 * 100;

    console.log('\n📊 COMPLIANCE SUMMARY:');
    console.log(`  Environmental (E1-E5): ${environmentalScore.toFixed(0)}%`);
    console.log(`  Social (S1-S4): ${socialScore.toFixed(0)}%`);
    console.log(`  Governance (G1): ${governanceScore.toFixed(0)}%`);
    console.log(`  CSRD Requirements: ${csrdScore.toFixed(0)}%`);

    const overallScore = (environmentalScore + socialScore + governanceScore + csrdScore) / 4;
    console.log(`\n🎯 OVERALL ESG COMPLIANCE: ${overallScore.toFixed(0)}%`);

    if (overallScore >= 80) {
      console.log('🟢 EXCELLENT - Ready for full ESG reporting');
    } else if (overallScore >= 60) {
      console.log('🟡 GOOD - Minor gaps to address');
    } else {
      console.log('🟠 NEEDS WORK - Significant data gaps');
    }

    // Framework-specific compliance
    console.log('\n📋 FRAMEWORK COMPLIANCE:');
    
    const griCompliance = (environmentalScore + socialScore + governanceScore) / 3;
    console.log(`  GRI Standards: ${griCompliance.toFixed(0)}%`);
    
    const csrdCompliance = (environmentalScore + socialScore + governanceScore + csrdScore) / 4;
    console.log(`  CSRD/ESRS: ${csrdCompliance.toFixed(0)}%`);
    
    // GHG Protocol specific
    const ghgScope1Count = await supabase
      .from('emissions_data')
      .select('scope', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('scope', '1');
    
    const ghgScope2Count = await supabase
      .from('emissions_data')
      .select('scope', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('scope', '2');
    
    const ghgScope3Count = await supabase
      .from('emissions_data')
      .select('scope', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .eq('scope', '3');

    const ghgCompliance = [
      ghgScope1Count.count > 0,
      ghgScope2Count.count > 0,
      ghgScope3Count.count > 0
    ].filter(Boolean).length / 3 * 100;
    
    console.log(`  GHG Protocol: ${ghgCompliance.toFixed(0)}%`);

    console.log('\n✅ ESG compliance assessment completed!');

  } catch (error) {
    console.error('❌ Error testing ESG compliance:', error);
  }
}

testESGCompliance();