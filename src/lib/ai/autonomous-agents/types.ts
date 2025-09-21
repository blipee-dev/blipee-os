/**
 * Core types for the Autonomous Agents System
 * Implements the 8 AI employees from the blueprint
 */

export interface Task {
  id: string;
  type: string;
  description: string;
  context: any;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  assignedAgent?: string;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  metadata?: Record<string, any>;
}

export interface AgentCapability {
  name: string;
  description: string;
  complexity: 'low' | 'medium' | 'high';
  domains: string[];
  requirements: string[];
}

export interface AgentMemory {
  shortTerm: Record<string, any>;
  longTerm: Record<string, any>;
  patterns: Record<string, any>;
  learnings: Record<string, any>;
}

export interface AgentPerformance {
  tasksCompleted: number;
  successRate: number;
  averageResponseTime: number;
  lastActive: Date;
  efficiency: number;
  specializations: string[];
}

export interface AgentConfig {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  capabilities: AgentCapability[];
  autonomyLevel: 'low' | 'medium' | 'high';
  monitors: string[];
  actions: string[];
  approvalRequired: boolean;
  maxConcurrentTasks: number;
  specializations: string[];
}

export type AgentType =
  | 'esg_chief_of_staff'
  | 'compliance_guardian'
  | 'carbon_hunter'
  | 'supply_chain_investigator'
  | 'data_orchestrator'
  | 'report_master'
  | 'risk_analyst'
  | 'performance_optimizer';

export interface AgentExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  actions: string[];
  recommendations: string[];
  nextSteps: string[];
  confidence: number;
  metadata: Record<string, any>;
}

export interface AgentContext {
  organizationId: string;
  userId: string;
  buildingContext?: any;
  currentState: Record<string, any>;
  historicalData: Record<string, any>;
  preferences: Record<string, any>;
}

export interface MonitoringMetrics {
  systemHealth: number;
  agentPerformance: Record<string, AgentPerformance>;
  taskQueueSize: number;
  averageResponseTime: number;
  errorRate: number;
  resourceUtilization: number;
}

export interface AgentCommunication {
  senderId: string;
  receiverId: string;
  message: any;
  type: 'task_request' | 'status_update' | 'collaboration' | 'escalation';
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface LearningEvent {
  agentId: string;
  event: string;
  outcome: 'success' | 'failure' | 'partial';
  context: any;
  timestamp: Date;
  feedback?: any;
}

export interface ApprovalRequest {
  id: string;
  agentId: string;
  action: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  requiredApprover: string;
  context: any;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}