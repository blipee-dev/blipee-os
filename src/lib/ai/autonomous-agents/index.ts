/**
 * Autonomous Agents Index
 * 
 * Central export point for all autonomous AI employees and orchestration systems.
 * This is the heart of blipee OS's revolutionary autonomous intelligence.
 */

// Base framework
export { AutonomousAgent, AgentRegistry, type Task, type TaskResult, type AgentContext, type AgentCapabilities } from './base/AutonomousAgent';
export { TaskScheduler } from './base/TaskScheduler';
export { DecisionEngine } from './base/DecisionEngine';
export { ApprovalWorkflow } from './base/ApprovalWorkflow';
export { AgentOrchestrator, agentOrchestrator } from './base/AgentOrchestrator';

// AI Employees
export { EsgChiefOfStaff } from './agents/EsgChiefOfStaff';
export { CarbonHunter } from './agents/CarbonHunter';
export { ComplianceGuardian } from './agents/ComplianceGuardian';
export { SupplyChainInvestigator } from './agents/SupplyChainInvestigator';

// Import all agents and orchestrator for the convenience functions
import { EsgChiefOfStaff } from './agents/EsgChiefOfStaff';
import { CarbonHunter } from './agents/CarbonHunter';
import { ComplianceGuardian } from './agents/ComplianceGuardian';
import { SupplyChainInvestigator } from './agents/SupplyChainInvestigator';
import { AgentRegistry } from './base/AutonomousAgent';
import { agentOrchestrator } from './base/AgentOrchestrator';

// Convenience function to initialize the autonomous agent system
export async function initializeAutonomousAgents(organizationId: string) {
  console.log('🚀 Initializing Autonomous Agent System...');
  
  // Create and register all AI employees
  const esgChief = new EsgChiefOfStaff();
  const carbonHunter = new CarbonHunter();
  const complianceGuardian = new ComplianceGuardian();
  const supplyChainInvestigator = new SupplyChainInvestigator();
  
  // Register agents with the registry
  AgentRegistry.register(esgChief);
  AgentRegistry.register(carbonHunter);
  AgentRegistry.register(complianceGuardian);
  AgentRegistry.register(supplyChainInvestigator);
  
  // Start the orchestrator
  await agentOrchestrator.start();
  
  console.log('✅ Autonomous Agent System initialized successfully!');
  console.log('🤖 AI Employees active:');
  console.log('  👔 ESG Chief of Staff - Strategic leadership');
  console.log('  🔍 Carbon Hunter - Emissions tracking');
  console.log('  🛡️ Compliance Guardian - Regulatory monitoring');
  console.log('  🕵️ Supply Chain Investigator - Chain analysis');
  
  return {
    orchestrator: agentOrchestrator,
    agents: {
      esgChief,
      carbonHunter,
      complianceGuardian,
      supplyChainInvestigator
    },
    registry: AgentRegistry
  };
}

// Function to shutdown the autonomous agent system
export async function shutdownAutonomousAgents() {
  console.log('🛑 Shutting down Autonomous Agent System...');
  
  // Stop the orchestrator
  await agentOrchestrator.stop();
  
  console.log('✅ Autonomous Agent System shut down safely');
}