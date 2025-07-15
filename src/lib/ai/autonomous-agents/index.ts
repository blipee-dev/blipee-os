import { AgentManager } from "./agent-manager";
import { TaskScheduler } from "./scheduler";
import { ESGChiefOfStaffAgent } from "./esg-chief-of-staff";
import { ComplianceGuardianAgent } from "./compliance-guardian";
import { CarbonHunterAgent } from "./carbon-hunter";
import { SupplyChainInvestigatorAgent } from "./supply-chain-investigator";
// Export base framework
export {
  AutonomousAgent
} from './agent-framework';

export type {
  AgentCapability,
  AgentTask,
  AgentResult,
  ExecutedAction,
  Learning,
  AgentConfig
} from './agent-framework';

// Export agent manager
export { AgentManager } from './agent-manager';
export type { ManagedAgent } from './agent-manager';

// Export permission system
export { AgentPermissionSystem } from './permissions';
export type {
  Permission,
  ApprovalRequest,
  PermissionMatrix
} from './permissions';

// Export task scheduler
export { TaskScheduler } from './scheduler';
export type { ScheduledTask } from './scheduler';

// Export learning system
export { AgentLearningSystem } from './learning-system';
export type {
  LearningPattern,
  Outcome,
  KnowledgeEntry
} from './learning-system';

// Export error handler
export { AgentErrorHandler } from './error-handler';
export type {
  AgentError,
  RecoveryStrategy,
  RollbackAction
} from './error-handler';

// Export agents
export { ESGChiefOfStaffAgent } from './esg-chief-of-staff';
export { ComplianceGuardianAgent } from './compliance-guardian';
export { CarbonHunterAgent } from './carbon-hunter';
export { SupplyChainInvestigatorAgent } from './supply-chain-investigator';

// Convenience function to initialize the agent system
export async function initializeAgentSystem(organizationId: string, options?: {
  agents?: ('all' | 'chief' | 'compliance' | 'carbon' | 'supply')[]
}) {
  const manager = AgentManager.getInstance();
  const scheduler = new TaskScheduler();
  
  // Initialize scheduler for organization
  await scheduler.initialize(organizationId);
  
  // Start health monitoring
  manager.startHealthMonitoring();
  
  const agentIds: Record<string, string> = {};
  const agentsToStart = options?.agents || ['all'];
  
  // Start agents based on options
  if (agentsToStart.includes('all') || agentsToStart.includes('chief')) {
    agentIds.chiefOfStaffId = await manager.startAgent(
      ESGChiefOfStaffAgent,
      organizationId
    );
    console.log(`✅ ESG Chief of Staff agent running: ${agentIds.chiefOfStaffId}`);
  }
  
  if (agentsToStart.includes('all') || agentsToStart.includes('compliance')) {
    agentIds.complianceGuardianId = await manager.startAgent(
      ComplianceGuardianAgent,
      organizationId
    );
    console.log(`✅ Compliance Guardian agent running: ${agentIds.complianceGuardianId}`);
  }
  
  if (agentsToStart.includes('all') || agentsToStart.includes('carbon')) {
    agentIds.carbonHunterId = await manager.startAgent(
      CarbonHunterAgent,
      organizationId
    );
    console.log(`✅ Carbon Hunter agent running: ${agentIds.carbonHunterId}`);
  }
  
  if (agentsToStart.includes('all') || agentsToStart.includes('supply')) {
    agentIds.supplyChainInvestigatorId = await manager.startAgent(
      SupplyChainInvestigatorAgent,
      organizationId
    );
    console.log(`✅ Supply Chain Investigator agent running: ${agentIds.supplyChainInvestigatorId}`);
  }
  
  console.log(`🚀 Agent system initialized for organization ${organizationId}`);
  console.log(`📊 Total agents running: ${Object.keys(agentIds).length}`);
  
  return {
    manager,
    scheduler,
    agentIds
  };
}

// Function to shutdown agent system
export async function shutdownAgentSystem(organizationId: string) {
  const manager = AgentManager.getInstance();
  
  // Stop all agents for organization
  await manager.stopOrganizationAgents(organizationId);
  
  // Stop health monitoring if no agents remain
  const remainingAgents = Array.from(manager['agents'].keys());
  if (remainingAgents.length === 0) {
    manager.stopHealthMonitoring();
  }
  
  console.log(`🛑 Agent system shut down for organization ${organizationId}`);
}