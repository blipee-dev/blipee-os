// Export base framework
export {
  AutonomousAgent,
  AgentCapability,
  AgentTask,
  AgentResult,
  ExecutedAction,
  Learning,
  AgentConfig
} from './agent-framework';

// Export agent manager
export { AgentManager, ManagedAgent } from './agent-manager';

// Export permission system
export {
  AgentPermissionSystem,
  Permission,
  ApprovalRequest,
  PermissionMatrix
} from './permissions';

// Export task scheduler
export { TaskScheduler, ScheduledTask } from './scheduler';

// Export learning system
export {
  AgentLearningSystem,
  LearningPattern,
  Outcome,
  KnowledgeEntry
} from './learning-system';

// Export error handler
export {
  AgentErrorHandler,
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