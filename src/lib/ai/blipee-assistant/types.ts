/**
 * Blipee Assistant Type Definitions
 * Core types for the intelligent sustainability advisor
 */

import { UserRole } from '@/types/auth';

export interface UserContext {
  // Identity
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  
  // Organization
  organizationId: string;
  organizationName: string;
  organizationSize: 'small' | 'medium' | 'large' | 'enterprise';
  industry: string;
  
  // Permissions
  permissions: string[];
  accessibleSites: string[];
  accessibleDevices: string[];
  
  // Behavioral
  lastVisitedPage?: string;
  frequentActions: string[];
  preferredVisualization: 'chart' | 'table' | 'summary';
  technicalLevel: 'beginner' | 'intermediate' | 'expert';
  
  // Session
  sessionDuration: number;
  actionsThisSession: string[];
  currentGoal?: string;
  
  // Historical
  conversationHistory: ConversationSummary[];
  achievedMilestones: string[];
  pendingTasks: string[];
}

export interface ConversationSummary {
  id: string;
  date: Date;
  topic: string;
  outcome: string;
  satisfaction?: number;
}

export interface PageContext {
  currentPath: string;
  pageType: 'dashboard' | 'settings' | 'data-entry' | 'report' | 'analysis' | 'ai-chat';
  availableActions: string[];
  dataInView?: any;
  userIntent: string;
}

export interface EnvironmentalContext {
  // Temporal
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  isQuarterEnd: boolean;
  reportingDeadline?: Date;
  
  // System State
  activeAlerts: Alert[];
  pendingApprovals: Approval[];
  recentChanges: Change[];
  
  // Metrics
  carbonReduction: number;
  complianceScore: number;
  dataCompleteness: number;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  actionRequired: boolean;
  timestamp: Date;
}

export interface Approval {
  id: string;
  type: string;
  requestedBy: string;
  description: string;
  deadline?: Date;
}

export interface Change {
  id: string;
  type: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: Date;
}

export interface CompleteContext {
  user: UserContext;
  page: PageContext;
  environment: EnvironmentalContext;
  message?: string;
}

export interface Intent {
  primary: IntentType;
  confidence: number;
  entities: Entity[];
  complexity: 'simple' | 'moderate' | 'complex';
  requiredAgents: AgentType[];
}

export type IntentType = 
  | 'data_entry'
  | 'compliance_check'
  | 'analysis'
  | 'optimization'
  | 'reporting'
  | 'learning'
  | 'configuration'
  | 'troubleshooting';

export interface Entity {
  type: string;
  value: string;
  confidence: number;
}

export type AgentType =
  | 'ESGChiefOfStaff'
  | 'ComplianceGuardian'
  | 'CarbonHunter'
  | 'SupplyChainInvestigator'
  | 'EnergyOptimizer'
  | 'ReportingGenius'
  | 'RiskPredictor'
  | 'DataIngestionBot';

export interface AgentResponse {
  agentId: AgentType;
  success: boolean;
  data: any;
  confidence: number;
  executionTime: number;
  suggestions?: string[];
}

export interface AssistantResponse {
  message: string;
  visualizations?: Visualization[];
  actions?: Action[];
  suggestions?: string[];
  metadata: {
    intent: Intent;
    agentsUsed: AgentType[];
    confidence: number;
    responseTime: number;
  };
}

export interface Visualization {
  type: 'chart' | 'table' | 'metric' | 'map' | 'timeline';
  data: any;
  config: any;
  interactive: boolean;
}

export interface Action {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: string;
  params?: any;
}

export interface ConversationState {
  id: string;
  topic?: string;
  depth: number;
  clarificationsNeeded: string[];
  suggestedActions: Action[];
  userSatisfaction?: number;
  context: CompleteContext;
  history: AssistantResponse[];
}