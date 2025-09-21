/**
 * BLIPEE AI Autonomous Agents - Workforce Management System
 *
 * 8 Specialized AI Employees working 24/7 for autonomous sustainability intelligence
 * Each agent operates independently with specific capabilities and approval workflows
 */

// Base framework
export { AutonomousAgent, AgentRegistry, type Task, type TaskResult, type AgentContext, type AgentCapabilities } from './base/AutonomousAgent';
export { TaskScheduler } from './base/TaskScheduler';
export { DecisionEngine } from './base/DecisionEngine';
export { ApprovalWorkflow } from './base/ApprovalWorkflow';
export { AgentOrchestrator, agentOrchestrator } from './base/AgentOrchestrator';

// AI Employees - All 8 specialized autonomous agents
export { ESGChiefOfStaff } from './employees/ESGChiefOfStaff';
export { ComplianceGuardian } from './employees/ComplianceGuardian';
export { CarbonHunter } from './employees/CarbonHunter';
export { SupplyChainInvestigator } from './employees/SupplyChainInvestigator';
export { DataOrchestrator } from './employees/DataOrchestrator';
export { ReportMaster } from './employees/ReportMaster';
export { RiskAnalyst } from './employees/RiskAnalyst';
export { PerformanceOptimizer } from './employees/PerformanceOptimizer';

// Type exports
export type {
  Task,
  TaskResult,
  AgentConfig,
  AgentExecutionResult,
  AgentContext,
  AgentType
} from './types';

// Import all agents for workforce management
import { ESGChiefOfStaff } from './employees/ESGChiefOfStaff';
import { ComplianceGuardian } from './employees/ComplianceGuardian';
import { CarbonHunter } from './employees/CarbonHunter';
import { SupplyChainInvestigator } from './employees/SupplyChainInvestigator';
import { DataOrchestrator } from './employees/DataOrchestrator';
import { ReportMaster } from './employees/ReportMaster';
import { RiskAnalyst } from './employees/RiskAnalyst';
import { PerformanceOptimizer } from './employees/PerformanceOptimizer';
import { AgentRegistry } from './base/AutonomousAgent';
import { agentOrchestrator } from './base/AgentOrchestrator';

export const AI_WORKFORCE_CONFIG = {
  totalEmployees: 8,
  operationalMode: '24/7',
  autonomyLevel: 'high',
  collaborationEnabled: true,
  learningEnabled: true
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
    reportingTo: 'Risk Analyst'
  },
  'Data Orchestrator': {
    agent: DataOrchestrator,
    specialization: 'Data quality, integration, and governance',
    autonomyLevel: 'high',
    canMakeDecisions: true,
    workingHours: '24/7',
    reportingTo: 'ESG Chief of Staff'
  },
  'Report Master': {
    agent: ReportMaster,
    specialization: 'Automated reporting and stakeholder communication',
    autonomyLevel: 'medium',
    canMakeDecisions: true,
    workingHours: '24/7',
    reportingTo: 'ESG Chief of Staff'
  },
  'Risk Analyst': {
    agent: RiskAnalyst,
    specialization: 'Risk assessment and threat monitoring',
    autonomyLevel: 'high',
    canMakeDecisions: true,
    workingHours: '24/7',
    reportingTo: 'ESG Chief of Staff'
  },
  'Performance Optimizer': {
    agent: PerformanceOptimizer,
    specialization: 'KPI monitoring and performance optimization',
    autonomyLevel: 'medium',
    canMakeDecisions: true,
    workingHours: '24/7',
    reportingTo: 'ESG Chief of Staff'
  }
};

// Initialize the complete AI workforce - all 8 autonomous agents
export async function initializeAutonomousAgents(organizationId: string) {
  console.log('🚀 Initializing BLIPEE AI Workforce...');
  console.log(`📋 Deploying ${AI_WORKFORCE_CONFIG.totalEmployees} AI employees for autonomous sustainability intelligence`);

  // Create all 8 AI employees
  const esgChiefOfStaff = new ESGChiefOfStaff();
  const complianceGuardian = new ComplianceGuardian();
  const carbonHunter = new CarbonHunter();
  const supplyChainInvestigator = new SupplyChainInvestigator();
  const dataOrchestrator = new DataOrchestrator();
  const reportMaster = new ReportMaster();
  const riskAnalyst = new RiskAnalyst();
  const performanceOptimizer = new PerformanceOptimizer();

  // Register all agents with the registry
  AgentRegistry.register(esgChiefOfStaff);
  AgentRegistry.register(complianceGuardian);
  AgentRegistry.register(carbonHunter);
  AgentRegistry.register(supplyChainInvestigator);
  AgentRegistry.register(dataOrchestrator);
  AgentRegistry.register(reportMaster);
  AgentRegistry.register(riskAnalyst);
  AgentRegistry.register(performanceOptimizer);

  // Start the orchestrator
  await agentOrchestrator.start();

  console.log('✅ BLIPEE AI Workforce operational - 8 AI employees working 24/7');
  console.log('🤖 AI Employees active:');
  console.log('  👔 ESG Chief of Staff - Strategic leadership & coordination');
  console.log('  🛡️ Compliance Guardian - Regulatory monitoring across 7 frameworks');
  console.log('  🔍 Carbon Hunter - Emissions tracking & reduction opportunities');
  console.log('  🕵️ Supply Chain Investigator - Supplier risk assessment');
  console.log('  📊 Data Orchestrator - Data quality & integration');
  console.log('  📋 Report Master - Automated reporting & distribution');
  console.log('  ⚠️ Risk Analyst - Risk monitoring & threat analysis');
  console.log('  📈 Performance Optimizer - KPI optimization & efficiency');
  console.log('🎯 Autonomous sustainability intelligence active');

  return {
    orchestrator: agentOrchestrator,
    agents: {
      esgChiefOfStaff,
      complianceGuardian,
      carbonHunter,
      supplyChainInvestigator,
      dataOrchestrator,
      reportMaster,
      riskAnalyst,
      performanceOptimizer
    },
    registry: AgentRegistry,
    config: AI_WORKFORCE_CONFIG,
    directory: AI_EMPLOYEE_DIRECTORY
  };
}

// Additional workforce management functions
export async function getAIWorkforceStatus() {
  const status = await agentOrchestrator.getSystemStatus();

  return {
    operational: status.activeAgents > 0,
    employeeCount: status.activeAgents,
    activeAgents: status.agentNames,
    systemHealth: status.activeAgents === 8 ? 'excellent' :
                  status.activeAgents >= 6 ? 'good' :
                  status.activeAgents >= 3 ? 'degraded' : 'offline'
  };
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
  console.log('🛑 Shutting down BLIPEE AI Workforce...');

  // Stop the orchestrator
  await agentOrchestrator.stop();

  console.log('✅ AI Workforce shutdown complete');
}