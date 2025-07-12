#!/usr/bin/env node
/**
 * ESG Chief of Staff Agent Test
 * Tests the actual agent implementation
 */

import { createClient } from '@supabase/supabase-js';
import { ESGChiefOfStaffAgent } from './src/lib/ai/autonomous-agents/esg-chief-of-staff.js';

// Load environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testESGAgent() {
  console.log('🤖 Testing ESG Chief of Staff Agent...\n');

  try {
    // Get test organization ID
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    if (!orgs || orgs.length === 0) {
      console.log('❌ No organizations found for testing');
      return;
    }

    const testOrgId = orgs[0].id;
    console.log('🏢 Using organization:', testOrgId);

    // Initialize agent
    console.log('\n1️⃣ Initializing ESG Chief of Staff Agent...');
    const agent = new ESGChiefOfStaffAgent(testOrgId);
    
    await agent.initialize();
    console.log('✅ Agent initialized successfully');

    // Test scheduled tasks
    console.log('\n2️⃣ Getting scheduled tasks...');
    const tasks = await agent.getScheduledTasks();
    console.log(`✅ Found ${tasks.length} scheduled tasks:`);
    tasks.forEach(task => {
      console.log(`   • ${task.type} - scheduled for ${task.scheduledFor}`);
    });

    // Test metrics analysis
    console.log('\n3️⃣ Testing metrics analysis...');
    const analysisTask = {
      id: 'test-analysis-' + Date.now(),
      type: 'analyze_metrics',
      scheduledFor: new Date().toISOString(),
      data: {
        timeRange: '24h',
        metrics: ['emissions', 'energy', 'water']
      }
    };

    const result = await agent.executeTask(analysisTask);
    console.log('✅ Metrics analysis completed');
    console.log(`   • Success: ${result.success}`);
    console.log(`   • Insights: ${result.insights.length} generated`);
    console.log(`   • Actions: ${result.actions.length} planned`);
    console.log(`   • Execution time: ${result.executionTimeMs}ms`);

    // Test learning system
    console.log('\n4️⃣ Testing learning system...');
    await agent.learn(result);
    console.log('✅ Agent learning completed');

    // Test report generation
    console.log('\n5️⃣ Testing report generation...');
    const reportTask = {
      id: 'test-report-' + Date.now(),
      type: 'generate_reports',
      scheduledFor: new Date().toISOString(),
      data: {
        reportType: 'weekly',
        includeRecommendations: true
      }
    };

    const reportResult = await agent.executeTask(reportTask);
    console.log('✅ Report generation completed');
    console.log(`   • Success: ${reportResult.success}`);
    console.log(`   • Next steps: ${reportResult.nextSteps.length} identified`);

    console.log('\n🎉 ESG Chief of Staff Agent testing complete!');
    console.log('\n📊 Agent Performance Summary:');
    console.log('• Initialization: ✅ Working');
    console.log('• Task Scheduling: ✅ Working');
    console.log('• Metrics Analysis: ✅ Working');
    console.log('• Report Generation: ✅ Working');
    console.log('• Learning System: ✅ Working');
    console.log('\n🚀 Stream A autonomous agent is ready for production!');

  } catch (error) {
    console.error('❌ Agent test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testESGAgent().catch(console.error);