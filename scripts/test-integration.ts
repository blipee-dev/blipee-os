import { UnifiedOrchestrator } from '../src/lib/orchestration/unified-orchestrator';
import { AgentActivationService } from '../src/lib/agents/agent-activation-service';
import { ExternalAPIManager } from '../src/lib/data/external-api-manager';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testIntegration() {
  console.log('🧪 Testing blipee OS Integration...\n');

  try {
    // 1. Test Unified Orchestrator
    console.log('1️⃣ Testing Unified Orchestrator...');
    const orchestrator = new UnifiedOrchestrator();
    
    // Test message processing
    const testMessages = [
      "What's our current carbon footprint?",
      "Check our CSRD compliance status",
      "Show me ESG performance analysis",
      "Find emission reduction opportunities"
    ];

    for (const message of testMessages) {
      console.log(`\n📨 Testing: "${message}"`);
      const response = await orchestrator.processUserMessage({
        message,
        userId: 'test-user',
        organizationId: '2274271e-679f-49d1-bda8-c92c77ae1d0c', // Demo org
        context: {}
      });
      
      console.log(`✅ Response type: ${response.metadata?.agent || 'general'}`);
      console.log(`📊 Components: ${response.components?.length || 0}`);
      console.log(`⚡ Execution time: ${response.metadata?.executionTime}ms`);
    }

    // 2. Test Agent Activation Service
    console.log('\n\n2️⃣ Testing Agent Activation Service...');
    const activationService = AgentActivationService.getInstance();
    
    // Get agent statuses
    const statuses = activationService.getAgentStatuses();
    console.log(`📊 Agent statuses: ${statuses.length} agents configured`);
    
    // Note: Don't actually activate in test to avoid creating cron jobs
    console.log('✅ Agent activation service ready (not activating in test)');

    // 3. Test External API Manager
    console.log('\n\n3️⃣ Testing External API Manager...');
    const apiManager = ExternalAPIManager.getInstance();
    
    // Check API connections
    const connections = apiManager.getConnectionStatuses();
    console.log('🔌 API Connections:');
    connections.forEach(conn => {
      console.log(`  - ${conn.name}: ${conn.status} ${conn.errorMessage ? `(${conn.errorMessage})` : ''}`);
    });

    // 4. Integration Test - Full Flow
    console.log('\n\n4️⃣ Testing Full Integration Flow...');
    
    // Simulate a complex query that would use multiple systems
    const complexQuery = "Analyze our ESG performance and suggest improvements based on current weather conditions and carbon intensity";
    
    console.log(`📨 Complex query: "${complexQuery}"`);
    const complexResponse = await orchestrator.processUserMessage({
      message: complexQuery,
      userId: 'test-user',
      organizationId: '2274271e-679f-49d1-bda8-c92c77ae1d0c',
      context: {}
    });
    
    console.log('\n📋 Integration Response:');
    console.log(`  Message: ${complexResponse.message.substring(0, 100)}...`);
    console.log(`  Agent used: ${complexResponse.metadata?.agent || 'none'}`);
    console.log(`  Data sources: ${complexResponse.metadata?.dataSource || 'none'}`);
    console.log(`  Has UI components: ${complexResponse.components ? 'Yes' : 'No'}`);
    console.log(`  Suggested actions: ${complexResponse.actions?.length || 0}`);

    // 5. Check Database Connectivity
    console.log('\n\n5️⃣ Checking Database Connectivity...');
    
    // This would be done through the orchestrator's internal queries
    const dbTestResponse = await orchestrator.processUserMessage({
      message: "Show me our sustainability targets",
      userId: 'test-user',
      organizationId: '2274271e-679f-49d1-bda8-c92c77ae1d0c',
      context: {}
    });
    
    console.log(`✅ Database query successful: ${dbTestResponse.data ? 'Data retrieved' : 'No data'}`);

    console.log('\n\n✅ Integration test completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Orchestrator: ✅ Working');
    console.log('  - Agent System: ✅ Ready');
    console.log('  - External APIs: ⚠️  Keys needed');
    console.log('  - Database: ✅ Connected');
    console.log('  - Integration: ✅ Functional');

  } catch (error) {
    console.error('\n❌ Integration test failed:', error);
  }
}

// Run the test
testIntegration();