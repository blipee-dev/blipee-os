import { AgentManager } from "./agent-manager";
import { TaskScheduler } from "./scheduler";
import { ESGChiefOfStaffAgent } from "./esg-chief-of-staff";
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

// Convenience function to initialize the agent system
export async function initializeAgentSystem(organizationId: string) {
  const manager = AgentManager.getInstance();
  const scheduler = new TaskScheduler();
  
  // Initialize scheduler for organization
  await scheduler.initialize(organizationId);
  
  // Start health monitoring
  manager.startHealthMonitoring();
  
  // Start ESG Chief of Staff agent
  const chiefOfStaffId = await manager.startAgent(
    ESGChiefOfStaffAgent,
    organizationId
  );
  
  console.log(`🚀 Agent system initialized for organization ${organizationId}`);
  console.log(`✅ ESG Chief of Staff agent running: ${chiefOfStaffId}`);
  
  return {
    manager,
    scheduler,
    chiefOfStaffId
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