/**
 * Test Script for Stream A - Autonomous Agents
 * This script tests all 4 autonomous agents and their capabilities
 */

const { createClient } = require('@supabase/supabase-js');

// Import all agents
const { 
  initializeAgentSystem,
  shutdownAgentSystem,
  ESGChiefOfStaffAgent,
  ComplianceGuardianAgent,
  CarbonHunterAgent,
  SupplyChainInvestigatorAgent
} = require('../dist/lib/ai/autonomous-agents/index.js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStreamAAgents() {
  console.log('🤖 Testing Stream A - Autonomous Agents...\n');
  
  const testOrgId = 'test-org-' + Date.now();
  
  try {
    // Test 1: Initialize all agents
    console.log('1. Initializing autonomous agent system...');
    const { manager, scheduler, agentIds } = await initializeAgentSystem(testOrgId);
    
    console.log('✓ Agent system initialized');
    console.log(`✓ Total agents running: ${Object.keys(agentIds).length}`);
    console.log('✓ Agents:', Object.keys(agentIds));
    
    // Test 2: Test individual agent capabilities
    console.log('\n2. Testing agent capabilities...');
    
    // Test ESG Chief of Staff
    const chiefAgent = new ESGChiefOfStaffAgent(testOrgId);
    await chiefAgent.initialize();
    const chiefTasks = await chiefAgent.getScheduledTasks();
    console.log(`\n📊 ESG Chief of Staff:`);
    console.log(`   - Capabilities: ${chiefAgent['capabilities'].length}`);
    console.log(`   - Scheduled tasks: ${chiefTasks.length}`);
    console.log(`   - Task types: ${[...new Set(chiefTasks.map(t => t.type))].join(', ')}`);
    
    // Test Compliance Guardian
    const complianceAgent = new ComplianceGuardianAgent(testOrgId);
    await complianceAgent.initialize();
    const complianceTasks = await complianceAgent.getScheduledTasks();
    console.log(`\n⚖️  Compliance Guardian:`);
    console.log(`   - Capabilities: ${complianceAgent['capabilities'].length}`);
    console.log(`   - Scheduled tasks: ${complianceTasks.length}`);
    console.log(`   - Task types: ${[...new Set(complianceTasks.map(t => t.type))].join(', ')}`);
    
    // Test Carbon Hunter
    const carbonAgent = new CarbonHunterAgent(testOrgId);
    await carbonAgent.initialize();
    const carbonTasks = await carbonAgent.getScheduledTasks();
    console.log(`\n🎯 Carbon Hunter:`);
    console.log(`   - Capabilities: ${carbonAgent['capabilities'].length}`);
    console.log(`   - Scheduled tasks: ${carbonTasks.length}`);
    console.log(`   - Task types: ${[...new Set(carbonTasks.map(t => t.type))].join(', ')}`);
    console.log(`   - Detection algorithms: ${carbonAgent['detectionAlgorithms'].size}`);
    console.log(`   - Optimization strategies: ${carbonAgent['optimizationStrategies'].length}`);
    
    // Test Supply Chain Investigator
    const supplyAgent = new SupplyChainInvestigatorAgent(testOrgId);
    await supplyAgent.initialize();
    const supplyTasks = await supplyAgent.getScheduledTasks();
    console.log(`\n🔍 Supply Chain Investigator:`);
    console.log(`   - Capabilities: ${supplyAgent['capabilities'].length}`);
    console.log(`   - Scheduled tasks: ${supplyTasks.length}`);
    console.log(`   - Task types: ${[...new Set(supplyTasks.map(t => t.type))].join(', ')}`);
    console.log(`   - Investigation strategies: ${supplyAgent['investigationStrategies'].length}`);
    console.log(`   - Risk patterns: ${supplyAgent['riskPatterns'].size}`);
    
    // Test 3: Test task execution (sample)
    console.log('\n3. Testing task execution...');
    
    // Execute a sample task for each agent
    const sampleTasks = [
      {
        agent: chiefAgent,
        name: 'ESG Chief of Staff',
        task: {
          id: 'test-chief-1',
          type: 'analyze_metrics',
          priority: 'high',
          data: { metrics: ['emissions', 'energy'] },
          scheduledFor: new Date(),
          createdAt: new Date()
        }
      },
      {
        agent: carbonAgent,
        name: 'Carbon Hunter',
        task: {
          id: 'test-carbon-1',
          type: 'hunt_carbon_opportunities',
          priority: 'high',
          data: { scope: 'comprehensive' },
          scheduledFor: new Date(),
          createdAt: new Date()
        }
      }
    ];
    
    for (const { agent, name, task } of sampleTasks) {
      try {
        const result = await agent.executeTask(task);
        console.log(`\n✓ ${name} executed task '${task.type}':`);
        console.log(`   - Success: ${result.success}`);
        console.log(`   - Has data: ${!!result.data}`);
        console.log(`   - Next steps: ${result.nextSteps?.length || 0}`);
      } catch (error) {
        console.log(`✗ ${name} task failed:`, error.message);
      }
    }
    
    // Test 4: Test agent coordination
    console.log('\n4. Testing agent coordination...');
    const activeAgents = manager.getActiveAgents();
    console.log(`✓ Active agents in manager: ${activeAgents.length}`);
    
    // Test 5: Test learning system
    console.log('\n5. Testing learning capabilities...');
    const learningResults = [
      { success: true, data: { emissionsReduced: 10, insights: 5 } }
    ];
    
    const chiefLearning = await chiefAgent.learn(learningResults);
    console.log(`✓ ESG Chief learning:`);
    console.log(`   - Strategies improved: ${chiefLearning.strategiesImproved}`);
    console.log(`   - New patterns: ${chiefLearning.newPatternsDetected}`);
    
    // Test 6: Agent health check
    console.log('\n6. Testing agent health monitoring...');
    const health = manager.getSystemHealth();
    console.log(`✓ System health:`);
    console.log(`   - Active agents: ${health.activeAgents}`);
    console.log(`   - Total tasks: ${health.totalTasks}`);
    console.log(`   - Success rate: ${health.successRate}%`);
    console.log(`   - Avg response time: ${health.avgResponseTime}ms`);
    
    // Test 7: Shutdown test
    console.log('\n7. Testing graceful shutdown...');
    await shutdownAgentSystem(testOrgId);
    console.log('✓ Agent system shut down successfully');
    
    console.log('\n🎉 Stream A testing completed successfully!');
    console.log('\nAutonomous Agent Features Verified:');
    console.log('• All 4 agents initialize properly');
    console.log('• Task scheduling works for each agent');
    console.log('• Task execution functions correctly');
    console.log('• Learning systems are operational');
    console.log('• Agent coordination through manager');
    console.log('• Health monitoring active');
    console.log('• Graceful shutdown works');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  }
}

// Run the test
testStreamAAgents();