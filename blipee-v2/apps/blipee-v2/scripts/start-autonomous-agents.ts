/**
 * Start Autonomous Agents Script
 *
 * Initializes the 8 autonomous AI agents that work 24/7 across all organizations.
 * These agents perform:
 * - ESG metrics monitoring
 * - Compliance tracking
 * - Carbon hunting
 * - Supply chain investigation
 * - Cost saving identification
 * - Predictive maintenance
 * - Autonomous optimization
 * - Regulatory foresight
 *
 * Usage:
 *   pnpm tsx scripts/start-autonomous-agents.ts
 */

// Load environment variables BEFORE any other imports
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('✅ Environment variables loaded from .env.local');
} else {
  console.warn('⚠️  .env.local not found, using system environment variables');
}

import { initializeAutonomousAgents, getAIWorkforceStatus } from '../src/lib/ai/autonomous-agents';

async function main() {
  console.log('🚀 Starting Blipee Autonomous Agents...\n');

  try {
    // Initialize the 8 global AI agents
    const workforce = await initializeAutonomousAgents();

    console.log('\n✅ Workforce initialized successfully!');
    console.log(`   Total agents: ${workforce.config.totalEmployees}`);
    console.log(`   Operational mode: ${workforce.config.operationalMode}`);
    console.log(`   Autonomy level: ${workforce.config.autonomyLevel}`);
    console.log(`   Collaboration: ${workforce.config.collaborationEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Learning: ${workforce.config.learningEnabled ? 'Enabled' : 'Disabled'}`);

    // Display agent directory
    console.log('\n👥 AI Employee Directory:');
    Object.entries(workforce.directory).forEach(([name, config]) => {
      console.log(`   • ${name}`);
      console.log(`     Specialization: ${config.specialization}`);
      console.log(`     Working hours: ${config.workingHours}`);
      console.log(`     Reports to: ${config.reportingTo}`);
    });

    // Get initial status
    const status = await getAIWorkforceStatus();
    console.log('\n📊 Workforce Status:');
    console.log(`   Operational: ${status.operational ? 'Yes' : 'No'}`);
    console.log(`   Active agents: ${status.employeeCount}/${workforce.config.totalEmployees}`);
    console.log(`   System health: ${status.systemHealth}`);

    console.log('\n✅ Agents are now running autonomously!');
    console.log('   Press Ctrl+C to shutdown');

    // Keep process alive
    await new Promise(() => {});
  } catch (error) {
    console.error('\n❌ Error starting autonomous agents:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down autonomous agents...');
  const { shutdownAutonomousAgents } = await import('../src/lib/ai/autonomous-agents');
  await shutdownAutonomousAgents();
  console.log('✅ Agents stopped gracefully');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Shutting down autonomous agents...');
  const { shutdownAutonomousAgents } = await import('../src/lib/ai/autonomous-agents');
  await shutdownAutonomousAgents();
  console.log('✅ Agents stopped gracefully');
  process.exit(0);
});

main().catch(console.error);
