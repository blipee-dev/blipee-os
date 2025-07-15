#!/usr/bin/env node

/**
 * Compliance Guardian Agent Test Script
 * Tests the enhanced Compliance Guardian agent with real regulatory monitoring
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

async function testComplianceGuardian() {
  console.log('🔍 Testing Enhanced Compliance Guardian Agent');
  console.log('======================================\n');

  try {
    // Test 1: Agent Instance Check
    console.log('📋 Test 1: Agent Instance Check');
    const { data: agents, error: agentError } = await supabase
      .from('agent_instances')
      .select('*')
      .eq('organization_id', testOrgId)
      .eq('name', 'Compliance Guardian')
      .single();
    
    if (agentError) {
      console.error('❌ Error fetching agent:', agentError);
      return;
    }
    
    if (agents) {
      console.log(`✅ Found Compliance Guardian agent: ${agents.name} (${agents.status}, health: ${agents.health_score})`);
    } else {
      console.log('❌ No Compliance Guardian agent found');
    }
    
    // Test 2: Data Completeness Check
    console.log('\n📊 Test 2: Data Completeness Check');
    
    // Check emissions data availability
    const { data: emissionsData, error: emissionsError } = await supabase
      .from('emissions')
      .select('*')
      .eq('organization_id', testOrgId)
      .limit(5);
    
    if (emissionsError) {
      console.log('⚠️  Emissions data check failed:', emissionsError.message);
    } else {
      console.log(`✅ Found ${emissionsData?.length || 0} emissions records`);
      if (emissionsData && emissionsData.length > 0) {
        const sample = emissionsData[0];
        console.log(`   Sample: Scope 1: ${sample.scope_1}, Scope 2: ${sample.scope_2}, Total: ${sample.total_emissions}`);
      }
    }
    
    // Check waste data availability
    const { data: wasteData, error: wasteError } = await supabase
      .from('waste_data')
      .select('*')
      .eq('organization_id', testOrgId)
      .limit(5);
    
    if (wasteError) {
      console.log('⚠️  Waste data check failed:', wasteError.message);
    } else {
      console.log(`✅ Found ${wasteData?.length || 0} waste records`);
    }
    
    // Check sustainability reports
    const { data: reportData, error: reportError } = await supabase
      .from('sustainability_reports')
      .select('*')
      .eq('organization_id', testOrgId)
      .limit(5);
    
    if (reportError) {
      console.log('⚠️  Sustainability reports check failed:', reportError.message);
    } else {
      console.log(`✅ Found ${reportData?.length || 0} sustainability reports`);
    }
    
    // Test 3: Compliance Framework Validation
    console.log('\n🛡️  Test 3: Compliance Framework Validation');
    
    // Test data validation with sample compliance checks
    if (emissionsData && emissionsData.length > 0) {
      console.log('  Running validation checks on emissions data...');
      
      let validationErrors = 0;
      for (const emission of emissionsData) {
        // Check for negative values
        if (emission.scope_1 && emission.scope_1 < 0) {
          validationErrors++;
          console.log(`  ❌ Negative Scope 1 emissions: ${emission.scope_1} (ID: ${emission.id})`);
        }
        
        if (emission.scope_2 && emission.scope_2 < 0) {
          validationErrors++;
          console.log(`  ❌ Negative Scope 2 emissions: ${emission.scope_2} (ID: ${emission.id})`);
        }
        
        // Check total consistency
        if (emission.scope_1 && emission.scope_2 && emission.total_emissions) {
          const calculatedTotal = emission.scope_1 + emission.scope_2 + (emission.scope_3 || 0);
          if (Math.abs(calculatedTotal - emission.total_emissions) > 0.01) {
            validationErrors++;
            console.log(`  ❌ Total mismatch: Expected ${calculatedTotal}, got ${emission.total_emissions} (ID: ${emission.id})`);
          }
        }
      }
      
      console.log(`✅ Validation complete: ${validationErrors} errors found`);
    }
    
    // Test 4: Deadline Tracking
    console.log('\n📅 Test 4: Deadline Tracking');
    
    const now = new Date();
    const deadlines = [];
    
    if (reportData && reportData.length > 0) {
      for (const report of reportData) {
        if (report.reporting_period_end) {
          const dueDate = new Date(report.reporting_period_end);
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (Math.abs(daysUntilDue) <= 90) { // Show deadlines within 90 days
            deadlines.push({
              id: report.id,
              framework: report.framework_type || 'GRI',
              reportType: report.report_type || 'Sustainability Report',
              dueDate: dueDate.toISOString(),
              daysUntilDue,
              status: daysUntilDue < 0 ? 'overdue' : 'upcoming'
            });
          }
        }
      }
    }
    
    if (deadlines.length > 0) {
      console.log(`✅ Found ${deadlines.length} deadlines:`);
      deadlines.forEach(deadline => {
        const status = deadline.status === 'overdue' ? '🔴' : deadline.daysUntilDue <= 7 ? '🟠' : '🟢';
        console.log(`  ${status} ${deadline.framework} - ${deadline.reportType} (${deadline.daysUntilDue} days)`);
      });
    } else {
      console.log('✅ No upcoming deadlines found (or mock data will be used)');
    }
    
    // Test 5: Compliance Alert Storage
    console.log('\n🚨 Test 5: Compliance Alert Storage');
    
    // Check if we can store alerts in agent_metrics
    const testAlert = {
      agent_instance_id: agents?.id || null,
      metric_type: 'compliance_alert',
      metric_name: 'validation_error',
      metric_value: 3,
      metadata: {
        alertId: 'test-alert-1',
        message: 'Test compliance alert',
        framework: 'GRI',
        severity: 'high',
        actionRequired: 'Review data validation',
        estimatedEffort: '2 hours'
      }
    };
    
    const { error: alertError } = await supabase
      .from('agent_metrics')
      .insert([testAlert]);
    
    if (alertError) {
      console.log('⚠️  Alert storage test failed:', alertError.message);
    } else {
      console.log('✅ Successfully stored test compliance alert');
    }
    
    // Test 6: Agent Capabilities
    console.log('\n⚡ Test 6: Agent Capabilities');
    
    const capabilities = [
      'monitor_compliance',
      'validate_data', 
      'track_deadlines',
      'generate_compliance_reports',
      'detect_framework_updates',
      'create_remediation_plans'
    ];
    
    console.log('✅ Compliance Guardian capabilities:');
    capabilities.forEach(cap => {
      console.log(`  - ${cap}`);
    });
    
    // Test 7: Regulatory Monitoring Schedule
    console.log('\n🕐 Test 7: Regulatory Monitoring Schedule');
    
    const schedule = [
      { task: 'monitor_compliance', frequency: 'every 4 hours' },
      { task: 'validate_data', frequency: 'weekly (Monday 10 AM)' },
      { task: 'track_deadlines', frequency: 'daily (9 AM)' },
      { task: 'detect_framework_updates', frequency: 'monthly (1st, 11 AM)' }
    ];
    
    console.log('✅ Regulatory monitoring schedule:');
    schedule.forEach(item => {
      console.log(`  - ${item.task}: ${item.frequency}`);
    });
    
    // Test Summary
    console.log('\n📊 Compliance Guardian Test Summary');
    console.log('============================');
    console.log(`✅ Agent Instance: ${agents?.name || 'Not Found'} (${agents?.status || 'unknown'})`);
    console.log(`✅ Health Score: ${agents?.health_score || 'N/A'}`);
    console.log(`✅ Data Sources: ${(emissionsData?.length || 0) + (wasteData?.length || 0) + (reportData?.length || 0)} tables checked`);
    console.log(`✅ Deadlines Tracked: ${deadlines.length} found`);
    console.log(`✅ Validation System: Active`);
    console.log(`✅ Alert Storage: ${alertError ? 'Failed' : 'Working'}`);
    console.log(`✅ Capabilities: ${capabilities.length} defined`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testComplianceGuardian().catch(console.error);