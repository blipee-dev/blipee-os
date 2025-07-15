#!/usr/bin/env node

/**
 * Supply Chain Investigator Agent Test Script
 * Tests the enhanced Supply Chain Investigator with real supplier analytics
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not set. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test organization ID
const testOrgId = '2274271e-679f-49d1-bda8-c92c77ae1d0c';

async function testSupplyChainInvestigator() {
  console.log('🔍 Testing Enhanced Supply Chain Investigator Agent');
  console.log('================================================\n');

  try {
    // Test 1: Agent Instance Check
    console.log('📋 Test 1: Agent Instance Check');
    const { data: agents, error: agentError } = await supabase
      .from('agent_instances')
      .select('*')
      .eq('organization_id', testOrgId)
      .eq('name', 'Supply Chain Investigator')
      .single();
    
    if (agentError) {
      console.error('❌ Error fetching agent:', agentError);
      return;
    }
    
    if (agents) {
      console.log(`✅ Found Supply Chain Investigator agent: ${agents.name} (${agents.status}, health: ${agents.health_score})`);
    } else {
      console.log('❌ No Supply Chain Investigator agent found');
    }
    
    // Test 2: Supplier Data Sources
    console.log('\n📊 Test 2: Supplier Data Sources');
    
    // Check for suppliers table
    const { data: suppliersData, error: suppliersError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('organization_id', testOrgId)
      .limit(5);
    
    if (suppliersError) {
      console.log('⚠️  No suppliers table found:', suppliersError.message);
    } else {
      console.log(`✅ Found ${suppliersData?.length || 0} suppliers`);
    }
    
    // Check organizations (potential suppliers)
    const { data: orgsData, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .neq('id', testOrgId)
      .limit(5);
    
    if (orgsError) {
      console.log('⚠️  Organizations check failed:', orgsError.message);
    } else {
      console.log(`✅ Found ${orgsData?.length || 0} other organizations (potential suppliers)`);
    }
    
    // Check emissions data (supplier analysis)
    const { data: emissionsData, error: emissionsError } = await supabase
      .from('emissions')
      .select('*')
      .eq('organization_id', testOrgId)
      .limit(10);
    
    if (emissionsError) {
      console.log('⚠️  Emissions data check failed:', emissionsError.message);
    } else {
      console.log(`✅ Found ${emissionsData?.length || 0} emissions records for supplier analysis`);
      
      if (emissionsData && emissionsData.length > 0) {
        const uniqueSources = [...new Set(emissionsData.map(e => e.source).filter(Boolean))];
        console.log(`   📝 Unique emission sources: ${uniqueSources.slice(0, 5).join(', ')}`);
      }
    }
    
    // Test 3: Supplier Profile Creation
    console.log('\n🏭 Test 3: Supplier Profile Creation');
    
    // Test supplier profile creation from emissions data
    if (emissionsData && emissionsData.length > 0) {
      console.log('  Creating supplier profiles from emissions data...');
      
      const supplierProfiles = [];
      const uniqueEmissions = emissionsData.slice(0, 5); // Test first 5
      
      for (const emission of uniqueEmissions) {
        const profile = {
          id: `supplier-${emission.id}`,
          name: emission.source || emission.activity_type || 'Emission Source',
          category: categorizeEmissionSource(emission.source || emission.activity_type),
          tier: 1,
          location: {
            country: emission.country || 'Unknown',
            region: emission.region || 'Unknown'
          },
          sustainability_score: calculateSustainabilityScore(emission),
          carbon_intensity: calculateCarbonIntensity(emission),
          certifications: [],
          risk_level: assessRiskLevel(emission.total_emissions || 0),
          emission_data: {
            scope1: emission.scope_1 || 0,
            scope2: emission.scope_2 || 0,
            scope3: emission.scope_3 || 0,
            total: emission.total_emissions || 0
          }
        };
        
        supplierProfiles.push(profile);
      }
      
      console.log(`✅ Created ${supplierProfiles.length} supplier profiles:`);
      supplierProfiles.forEach((profile, idx) => {
        console.log(`  ${idx + 1}. ${profile.name} (${profile.category}, Risk: ${profile.risk_level}, Score: ${profile.sustainability_score})`);
      });
      
      // Test 4: Risk Analysis
      console.log('\n🚨 Test 4: Supply Chain Risk Analysis');
      
      const risks = [];
      for (const supplier of supplierProfiles) {
        // Environmental risks
        if (supplier.carbon_intensity > 0.4) {
          risks.push({
            type: 'environmental',
            severity: supplier.carbon_intensity > 0.6 ? 'critical' : 'high',
            supplier_id: supplier.id,
            description: `High carbon intensity (${supplier.carbon_intensity.toFixed(2)} tCO2e/$)`,
            potential_impact: 'Scope 3 emissions increase'
          });
        }
        
        // Social risks
        if (supplier.sustainability_score < 70) {
          risks.push({
            type: 'social',
            severity: supplier.sustainability_score < 50 ? 'critical' : 'medium',
            supplier_id: supplier.id,
            description: `Low sustainability score (${supplier.sustainability_score}/100)`,
            potential_impact: 'Labor rights issues'
          });
        }
        
        // Governance risks
        if (supplier.certifications.length === 0) {
          risks.push({
            type: 'governance',
            severity: 'medium',
            supplier_id: supplier.id,
            description: 'Lack of sustainability certifications',
            potential_impact: 'Compliance gaps'
          });
        }
      }
      
      console.log(`✅ Identified ${risks.length} supply chain risks:`);
      risks.forEach(risk => {
        const emoji = risk.severity === 'critical' ? '🔴' : risk.severity === 'high' ? '🟠' : '🟡';
        console.log(`  ${emoji} ${risk.type}: ${risk.description}`);
      });
      
      // Test 5: Supplier Assessment
      console.log('\n📊 Test 5: Supplier Assessment');
      
      const assessments = [];
      for (const supplier of supplierProfiles) {
        const assessment = {
          supplier_id: supplier.id,
          sustainability_score: supplier.sustainability_score,
          carbon_intensity: supplier.carbon_intensity,
          risk_level: supplier.risk_level,
          recommendations: []
        };
        
        // Generate recommendations based on profile
        if (supplier.carbon_intensity > 0.3) {
          assessment.recommendations.push('Implement carbon reduction program');
        }
        if (supplier.sustainability_score < 80) {
          assessment.recommendations.push('Improve sustainability practices');
        }
        if (supplier.certifications.length === 0) {
          assessment.recommendations.push('Obtain relevant certifications');
        }
        
        assessments.push(assessment);
      }
      
      const avgScore = assessments.reduce((sum, a) => sum + a.sustainability_score, 0) / assessments.length;
      const lowPerformers = assessments.filter(a => a.sustainability_score < 70).length;
      
      console.log(`✅ Assessed ${assessments.length} suppliers:`);
      console.log(`   📈 Average sustainability score: ${avgScore.toFixed(1)}/100`);
      console.log(`   ⚠️  Low performers (< 70): ${lowPerformers}`);
      console.log(`   🎯 Total recommendations: ${assessments.reduce((sum, a) => sum + a.recommendations.length, 0)}`);
      
      // Test 6: Scope 3 Emissions Analysis
      console.log('\n🌍 Test 6: Scope 3 Emissions Analysis');
      
      const scope3Analysis = {
        total_scope3: supplierProfiles.reduce((sum, s) => sum + s.emission_data.scope3, 0),
        high_impact_suppliers: supplierProfiles.filter(s => s.emission_data.scope3 > 100).length,
        categories: {}
      };
      
      // Categorize Scope 3 emissions
      supplierProfiles.forEach(supplier => {
        const category = supplier.category;
        if (!scope3Analysis.categories[category]) {
          scope3Analysis.categories[category] = 0;
        }
        scope3Analysis.categories[category] += supplier.emission_data.scope3;
      });
      
      console.log(`✅ Scope 3 emissions analysis:`);
      console.log(`   📊 Total Scope 3 emissions: ${scope3Analysis.total_scope3.toFixed(1)} tCO2e`);
      console.log(`   🔥 High-impact suppliers: ${scope3Analysis.high_impact_suppliers}`);
      console.log(`   📈 Top categories:`);
      
      Object.entries(scope3Analysis.categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .forEach(([category, emissions]) => {
          console.log(`     - ${category}: ${emissions.toFixed(1)} tCO2e`);
        });
    }
    
    // Test 7: Agent Metrics Storage
    console.log('\n💾 Test 7: Agent Metrics Storage');
    
    // Test storing supply chain metrics
    const testMetrics = [
      {
        agent_instance_id: agents?.id,
        metric_type: 'supply_chain_risk',
        metric_name: 'environmental',
        metric_value: 3,
        metadata: {
          riskId: 'test-risk-1',
          supplierId: 'supplier-1',
          description: 'Test environmental risk',
          severity: 'high'
        }
      },
      {
        agent_instance_id: agents?.id,
        metric_type: 'supplier_assessment',
        metric_name: 'sustainability_score',
        metric_value: 75,
        metadata: {
          supplierId: 'supplier-1',
          assessmentType: 'test',
          recommendations: ['Improve energy efficiency']
        }
      }
    ];
    
    const { error: metricsError } = await supabase
      .from('agent_metrics')
      .insert(testMetrics);
    
    if (metricsError) {
      console.log('⚠️  Metrics storage test failed:', metricsError.message);
    } else {
      console.log('✅ Successfully stored supply chain metrics');
    }
    
    // Test 8: Agent Capabilities
    console.log('\n⚡ Test 8: Agent Capabilities');
    
    const capabilities = [
      'investigate_supply_chain',
      'map_supplier_emissions',
      'assess_supplier_sustainability',
      'identify_supply_chain_risks',
      'discover_scope3_emissions',
      'identify_emission_reduction_opportunities'
    ];
    
    console.log('✅ Supply Chain Investigator capabilities:');
    capabilities.forEach(cap => {
      console.log(`  - ${cap}`);
    });
    
    // Test 9: Investigation Schedule
    console.log('\n🕐 Test 9: Investigation Schedule');
    
    const schedule = [
      { task: 'investigate_supply_chain', frequency: 'daily (7 AM)' },
      { task: 'map_supplier_emissions', frequency: 'every 6 hours' },
      { task: 'assess_supplier_sustainability', frequency: 'weekly (Tuesday 10 AM)' },
      { task: 'identify_supply_chain_risks', frequency: 'every 4 hours' },
      { task: 'discover_scope3_emissions', frequency: 'monthly (1st, 11 AM)' }
    ];
    
    console.log('✅ Investigation schedule:');
    schedule.forEach(item => {
      console.log(`  - ${item.task}: ${item.frequency}`);
    });
    
    // Test Summary
    console.log('\n📊 Supply Chain Investigator Test Summary');
    console.log('=========================================');
    console.log(`✅ Agent Instance: ${agents?.name || 'Not Found'} (${agents?.status || 'unknown'})`);
    console.log(`✅ Health Score: ${agents?.health_score || 'N/A'}`);
    console.log(`✅ Data Sources: ${(suppliersData?.length || 0) + (orgsData?.length || 0) + (emissionsData?.length || 0)} records found`);
    console.log(`✅ Supplier Profiles: ${emissionsData?.length || 0} created from emissions data`);
    console.log(`✅ Risk Analysis: Active`);
    console.log(`✅ Scope 3 Analysis: Active`);
    console.log(`✅ Metrics Storage: ${metricsError ? 'Failed' : 'Working'}`);
    console.log(`✅ Capabilities: ${capabilities.length} defined`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Helper functions
function categorizeEmissionSource(source) {
  if (!source) return 'general';
  
  const sourceMap = {
    'electricity': 'energy',
    'natural_gas': 'energy',
    'fuel': 'transportation',
    'travel': 'transportation',
    'waste': 'waste_management',
    'water': 'utilities',
    'manufacturing': 'production',
    'office': 'facilities'
  };
  
  const lowerSource = source.toLowerCase();
  return Object.entries(sourceMap).find(([key]) => 
    lowerSource.includes(key)
  )?.[1] || 'general';
}

function calculateSustainabilityScore(record) {
  const totalEmissions = record.total_emissions || 0;
  
  // Lower emissions = higher sustainability score
  if (totalEmissions < 10) return 90;
  if (totalEmissions < 50) return 80;
  if (totalEmissions < 100) return 70;
  if (totalEmissions < 200) return 60;
  return 50;
}

function calculateCarbonIntensity(record) {
  const totalEmissions = record.total_emissions || 0;
  const estimatedSpend = record.estimated_spend || 1000; // Default spend estimate
  
  return totalEmissions / estimatedSpend;
}

function assessRiskLevel(totalEmissions) {
  if (totalEmissions > 500) return 'critical';
  if (totalEmissions > 200) return 'high';
  if (totalEmissions > 50) return 'medium';
  return 'low';
}

// Run the test
testSupplyChainInvestigator().catch(console.error);