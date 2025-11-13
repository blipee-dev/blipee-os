/**
 * BLIPEE AI Autonomous Agents - Workforce Management System
 *
 * 8 Specialized AI Employees working 24/7 for autonomous sustainability intelligence
 * Each agent operates independently with specific capabilities and approval workflows
 */

// Base framework
export { AutonomousAgent, AgentRegistry, type AgentCapabilities } from './base/AutonomousAgent';
export { TaskScheduler } from './base/TaskScheduler';
export { DecisionEngine } from './base/DecisionEngine';
export { ApprovalWorkflow } from './base/ApprovalWorkflow';
export { AgentOrchestrator, agentOrchestrator } from './base/AgentOrchestrator';

// Blipee - The friendly AI orchestrator
export { BlipeeOrchestrator, blipeeOrchestrator } from './BlipeeOrchestrator';

// AI Employees - All 8 specialized autonomous agents from FULL_IMPLEMENTATION_PLAN.md
export { EsgChiefOfStaff as ESGChiefOfStaff } from './agents/EsgChiefOfStaff';
export { ComplianceGuardian } from './agents/ComplianceGuardian';
export { CarbonHunter } from './agents/CarbonHunter';
export { SupplyChainInvestigator } from './agents/SupplyChainInvestigator';
export { CostSavingFinder } from './agents/CostSavingFinder';
export { PredictiveMaintenance } from './agents/PredictiveMaintenance';
export { AutonomousOptimizer } from './agents/AutonomousOptimizer';
export { RegulatoryForesight } from './agents/RegulatoryForesight';

// Type exports - single source of truth for shared types
export type {
  Task,
  TaskResult,
  AgentConfig,
  AgentExecutionResult,
  AgentContext,
  AgentType
} from './types';

// Import all agents for workforce management - The 8 agents from FULL_IMPLEMENTATION_PLAN.md
import { EsgChiefOfStaff as ESGChiefOfStaff } from './agents/EsgChiefOfStaff';
import { ComplianceGuardian } from './agents/ComplianceGuardian';
import { CarbonHunter } from './agents/CarbonHunter';
import { SupplyChainInvestigator } from './agents/SupplyChainInvestigator';
import { CostSavingFinder } from './agents/CostSavingFinder';
import { PredictiveMaintenance } from './agents/PredictiveMaintenance';
import { AutonomousOptimizer } from './agents/AutonomousOptimizer';
import { RegulatoryForesight } from './agents/RegulatoryForesight';
import { AgentRegistry } from './base/AutonomousAgent';
import { agentOrchestrator } from './base/AgentOrchestrator';

export const AI_WORKFORCE_CONFIG = {
  totalEmployees: 8,
  operationalMode: 'global',
  autonomyLevel: 'high',
  collaborationEnabled: true,
  learningEnabled: true,
  crossOrgBenchmarkingEnabled: true,
  implementationPlan: 'FULL_IMPLEMENTATION_PLAN.md - Phase 1 Complete'
};

export const AI_EMPLOYEE_DIRECTORY = {
  'ESG Chief of Staff': {
    agent: ESGChiefOfStaff,
    specialization: 'Strategic oversight and coordination',
    autonomyLevel: 'executive',
    canMakeDecisions: true,
    workingHours: '24/7',
    reportingTo: 'Board of Directors'
  },
  'Compliance Guardian': {
    agent: ComplianceGuardian,
    specialization: 'Regulatory compliance across 7 frameworks',
    autonomyLevel: 'high',
    canMakeDecisions: true,
    workingHours: '24/7',
    reportingTo: 'ESG Chief of Staff'
  },
  'Carbon Hunter': {
    agent: CarbonHunter,
    specialization: 'Carbon reduction opportunities and energy optimization',
    autonomyLevel: 'high',
    canMakeDecisions: true,
    workingHours: '24/7',
    reportingTo: 'ESG Chief of Staff'
  },
  'Supply Chain Investigator': {
    agent: SupplyChainInvestigator,
    specialization: 'Supplier risk assessment and due diligence',
    autonomyLevel: 'high',
    canMakeDecisions: true,
    workingHours: '24/7',
    reportingTo: 'ESG Chief of Staff'
  },
  'Cost Saving Finder': {
    agent: CostSavingFinder,
    specialization: 'Energy cost analysis and savings opportunities',
    autonomyLevel: 'high',
    canMakeDecisions: true,
    workingHours: '24/7',
    reportingTo: 'ESG Chief of Staff'
  },
  'Predictive Maintenance': {
    agent: PredictiveMaintenance,
    specialization: 'Equipment failure prediction and maintenance scheduling',
    autonomyLevel: 'high',
    canMakeDecisions: true,
    workingHours: '24/7',
    reportingTo: 'ESG Chief of Staff'
  },
  'Autonomous Optimizer': {
    agent: AutonomousOptimizer,
    specialization: 'Autonomous operations optimization and performance tuning',
    autonomyLevel: 'high',
    canMakeDecisions: true,
    workingHours: '24/7',
    reportingTo: 'ESG Chief of Staff'
  },
  'Regulatory Foresight': {
    agent: RegulatoryForesight,
    specialization: 'Regulatory monitoring and compliance automation',
    autonomyLevel: 'high',
    canMakeDecisions: true,
    workingHours: '24/7',
    reportingTo: 'Compliance Guardian'
  }
};

/**
 * Initialize the complete GLOBAL AI workforce
 *
 * Creates a single set of 8 autonomous agents that work across ALL organizations.
 * Agents filter by organization_id when executing tasks, enabling:
 * - Cross-organizational benchmarking
 * - Best practice sharing
 * - Industry-wide insights
 * - Reduced resource usage (8 agents total instead of 8 per org)
 */
export async function initializeAutonomousAgents() {
  console.log('[Global Workforce] Initializing 8 autonomous agents for all organizations...');

  // Create global instances of all 8 AI employees
  const esgChiefOfStaff = new ESGChiefOfStaff();
  const complianceGuardian = new ComplianceGuardian();
  const carbonHunter = new CarbonHunter();
  const supplyChainInvestigator = new SupplyChainInvestigator();
  const costSavingFinder = new CostSavingFinder();
  const predictiveMaintenance = new PredictiveMaintenance();
  const autonomousOptimizer = new AutonomousOptimizer();
  const regulatoryForesight = new RegulatoryForesight();

  // Register all agents with the global registry
  AgentRegistry.register(esgChiefOfStaff);
  AgentRegistry.register(complianceGuardian);
  AgentRegistry.register(carbonHunter);
  AgentRegistry.register(supplyChainInvestigator);
  AgentRegistry.register(costSavingFinder);
  AgentRegistry.register(predictiveMaintenance);
  AgentRegistry.register(autonomousOptimizer);
  AgentRegistry.register(regulatoryForesight);

  // Start the global orchestrator
  await agentOrchestrator.start();

  console.log('[Global Workforce] ✅ 8 agents initialized globally');
  console.log('[Global Workforce] Mode: Cross-organizational with benchmarking');

  return {
    orchestrator: agentOrchestrator,
    agents: {
      esgChiefOfStaff,
      complianceGuardian,
      carbonHunter,
      supplyChainInvestigator,
      costSavingFinder,
      predictiveMaintenance,
      autonomousOptimizer,
      regulatoryForesight
    },
    registry: AgentRegistry,
    config: AI_WORKFORCE_CONFIG,
    directory: AI_EMPLOYEE_DIRECTORY
  };
}

// Additional workforce management functions
export async function getAIWorkforceStatus() {
  try {
    const workload = await agentOrchestrator.getWorkloadDistribution();
    const activeAgents = await AgentRegistry.getActiveAgents();

    return {
      operational: workload.activeAgents > 0,
      employeeCount: workload.activeAgents,
      activeAgents: activeAgents.map(a => a.agentName),
      systemHealth: workload.activeAgents === 8 ? 'excellent' :
                    workload.activeAgents >= 6 ? 'good' :
                    workload.activeAgents >= 3 ? 'degraded' : 'offline'
    };
  } catch (error) {
    console.error('Error getting AI workforce status:', error);
    // Return safe defaults
    return {
      operational: false,
      employeeCount: 0,
      activeAgents: [],
      systemHealth: 'offline'
    };
  }
}

export function getAIEmployeeByName(name: string) {
  const employeeConfig = AI_EMPLOYEE_DIRECTORY[name as keyof typeof AI_EMPLOYEE_DIRECTORY];
  return employeeConfig ? new employeeConfig.agent() : null;
}

export async function executeWorkforceTask(taskType: string, payload: any, context: any) {
  return await agentOrchestrator.executeTask({
    id: `task_${Date.now()}`,
    type: taskType,
    priority: 'medium',
    payload,
    createdBy: 'system',
    context,
    scheduledFor: new Date()
  });
}

// Function to shutdown the autonomous agent system
export async function shutdownAutonomousAgents() {

  // Stop the orchestrator
  await agentOrchestrator.stop();

}