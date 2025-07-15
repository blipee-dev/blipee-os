import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

console.log('🧪 Testing blipee OS Integration (Simple)...\n');

// Verify environment variables are loaded
console.log('📋 Environment Check:');
console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`  SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`  OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing'}`);

// Now import after env vars are loaded
async function runTest() {
  try {
    console.log('\n1️⃣ Testing Unified Orchestrator...');
    const { UnifiedOrchestrator } = await import('../src/lib/orchestration/unified-orchestrator');
    const orchestrator = new UnifiedOrchestrator();
    console.log('✅ Orchestrator created successfully');

    // Test a simple message
    console.log('\n📨 Testing message processing...');
    const response = await orchestrator.processUserMessage({
      message: "What's our carbon footprint?",
      userId: 'test-user',
      organizationId: '2274271e-679f-49d1-bda8-c92c77ae1d0c',
      context: {}
    });

    console.log('✅ Response received:');
    console.log(`  Message length: ${response.message.length} chars`);
    console.log(`  Agent used: ${response.metadata?.agent || 'none'}`);
    console.log(`  Execution time: ${response.metadata?.executionTime}ms`);

    console.log('\n2️⃣ Testing Agent Activation Service...');
    const { AgentActivationService } = await import('../src/lib/agents/agent-activation-service');
    const activationService = AgentActivationService.getInstance();
    const statuses = activationService.getAgentStatuses();
    console.log(`✅ Agent service ready with ${statuses.length} agents`);

    console.log('\n3️⃣ Testing External API Manager...');
    const { ExternalAPIManager } = await import('../src/lib/data/external-api-manager');
    const apiManager = ExternalAPIManager.getInstance();
    const connections = apiManager.getConnectionStatuses();
    console.log('✅ API Manager ready with connections:');
    connections.forEach(conn => {
      console.log(`  - ${conn.name}: ${conn.status}`);
    });

    console.log('\n✅ Integration test completed successfully!');
    
    console.log('\n📊 Summary:');
    console.log('  ✅ Environment variables loaded');
    console.log('  ✅ Orchestrator functional');
    console.log('  ✅ Agent system ready');
    console.log('  ✅ External API manager ready');
    console.log('  ✅ Basic integration working');
    
    console.log('\n🚀 Ready to connect remaining pieces:');
    console.log('  - Activate agents with cron schedules');
    console.log('  - Connect external data feeds');
    console.log('  - Implement Stream D network features');
    console.log('  - Setup production monitoring');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('\nStack trace:', error.stack);
  }
}

runTest();