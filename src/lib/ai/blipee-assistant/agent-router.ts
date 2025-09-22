/**
 * Blipee Assistant Agent Router
 * Routes tasks to appropriate AI agents based on intent and context
 */

import { AgentType, Intent, CompleteContext } from './types';
import { UserRole } from '@/types/auth';

interface AgentCapability {
  agent: AgentType;
  capabilities: string[];
  priority: number;
  requiredPermissions: string[];
  costTier: 'low' | 'medium' | 'high';
}

interface RoutingDecision {
  primaryAgent: AgentType;
  supportingAgents: AgentType[];
  reasoning: string;
  estimatedCost: number;
  estimatedTime: number;
}

export class AgentRouter {
  private static agentCapabilities: Record<AgentType, AgentCapability> = {
    ESGChiefOfStaff: {
      agent: 'ESGChiefOfStaff',
      capabilities: [
        'strategic_planning',
        'coordination',
        'executive_reporting',
        'goal_setting',
        'stakeholder_management'
      ],
      priority: 1,
      requiredPermissions: ['view'],
      costTier: 'medium'
    },
    ComplianceGuardian: {
      agent: 'ComplianceGuardian',
      capabilities: [
        'compliance_check',
        'regulation_monitoring',
        'standard_adherence',
        'audit_preparation',
        'gap_analysis'
      ],
      priority: 2,
      requiredPermissions: ['view'],
      costTier: 'medium'
    },
    CarbonHunter: {
      agent: 'CarbonHunter',
      capabilities: [
        'emissions_tracking',
        'carbon_calculation',
        'reduction_opportunities',
        'scope_analysis',
        'offset_management'
      ],
      priority: 2,
      requiredPermissions: ['view'],
      costTier: 'low'
    },
    SupplyChainInvestigator: {
      agent: 'SupplyChainInvestigator',
      capabilities: [
        'scope3_analysis',
        'vendor_assessment',
        'supply_chain_mapping',
        'procurement_analysis',
        'value_chain_optimization'
      ],
      priority: 3,
      requiredPermissions: ['view'],
      costTier: 'high'
    },
    EnergyOptimizer: {
      agent: 'EnergyOptimizer',
      capabilities: [
        'energy_analysis',
        'efficiency_recommendations',
        'consumption_tracking',
        'renewable_planning',
        'cost_optimization'
      ],
      priority: 3,
      requiredPermissions: ['view'],
      costTier: 'low'
    },
    ReportingGenius: {
      agent: 'ReportingGenius',
      capabilities: [
        'report_generation',
        'data_visualization',
        'disclosure_preparation',
        'stakeholder_communication',
        'metric_compilation'
      ],
      priority: 2,
      requiredPermissions: ['view'],
      costTier: 'medium'
    },
    RiskPredictor: {
      agent: 'RiskPredictor',
      capabilities: [
        'risk_assessment',
        'scenario_analysis',
        'climate_risk',
        'mitigation_planning',
        'predictive_modeling'
      ],
      priority: 3,
      requiredPermissions: ['view'],
      costTier: 'high'
    },
    DataIngestionBot: {
      agent: 'DataIngestionBot',
      capabilities: [
        'data_extraction',
        'document_parsing',
        'validation',
        'data_import',
        'quality_check'
      ],
      priority: 1,
      requiredPermissions: ['edit'],
      costTier: 'low'
    }
  };

  /**
   * Route task to appropriate agents
   */
  static route(intent: Intent, context: CompleteContext): RoutingDecision {
    // Check user permissions
    const availableAgents = this.filterByPermissions(context.user.permissions);

    // Score agents based on intent match
    const scoredAgents = this.scoreAgents(intent, context, availableAgents);

    // Select primary and supporting agents
    const primaryAgent = this.selectPrimaryAgent(scoredAgents);
    const supportingAgents = this.selectSupportingAgents(
      scoredAgents,
      primaryAgent,
      intent.complexity
    );

    // Calculate estimates
    const { cost, time } = this.calculateEstimates(
      primaryAgent,
      supportingAgents,
      intent.complexity
    );

    return {
      primaryAgent,
      supportingAgents,
      reasoning: this.generateRoutingReasoning(intent, primaryAgent, supportingAgents),
      estimatedCost: cost,
      estimatedTime: time
    };
  }

  /**
   * Filter agents by user permissions
   */
  private static filterByPermissions(userPermissions: string[]): AgentType[] {
    return Object.values(this.agentCapabilities)
      .filter(capability =>
        capability.requiredPermissions.every(perm =>
          userPermissions.includes(perm) || userPermissions.includes('all')
        )
      )
      .map(c => c.agent);
  }

  /**
   * Score agents based on intent and context
   */
  private static scoreAgents(
    intent: Intent,
    context: CompleteContext,
    availableAgents: AgentType[]
  ): Map<AgentType, number> {
    const scores = new Map<AgentType, number>();

    for (const agent of availableAgents) {
      let score = 0;
      const capability = this.agentCapabilities[agent];

      // Score based on intent match
      score += this.scoreIntentMatch(intent, capability);

      // Score based on context relevance
      score += this.scoreContextRelevance(context, capability);

      // Score based on priority
      score += (4 - capability.priority) * 10;

      // Penalize high-cost agents for simple queries
      if (intent.complexity === 'simple' && capability.costTier === 'high') {
        score -= 20;
      }

      scores.set(agent, score);
    }

    return scores;
  }

  /**
   * Score intent match
   */
  private static scoreIntentMatch(intent: Intent, capability: AgentCapability): number {
    let score = 0;

    // Direct intent mapping
    const intentCapabilityMap: Record<string, string[]> = {
      data_entry: ['data_extraction', 'document_parsing', 'validation'],
      compliance_check: ['compliance_check', 'regulation_monitoring', 'gap_analysis'],
      analysis: ['emissions_tracking', 'energy_analysis', 'scope_analysis'],
      optimization: ['reduction_opportunities', 'efficiency_recommendations', 'cost_optimization'],
      reporting: ['report_generation', 'data_visualization', 'metric_compilation'],
      learning: ['strategic_planning', 'coordination'],
      configuration: ['strategic_planning'],
      troubleshooting: ['strategic_planning', 'risk_assessment']
    };

    const relevantCapabilities = intentCapabilityMap[intent.primary] || [];
    const matchingCapabilities = capability.capabilities.filter(cap =>
      relevantCapabilities.includes(cap)
    );

    score += matchingCapabilities.length * 25;

    // Bonus for agents already identified in intent
    if (intent.requiredAgents.includes(capability.agent)) {
      score += 50;
    }

    return score;
  }

  /**
   * Score context relevance
   */
  private static scoreContextRelevance(
    context: CompleteContext,
    capability: AgentCapability
  ): number {
    let score = 0;

    // Check for critical alerts requiring specific agents
    if (context.environment.activeAlerts.some(a => a.severity === 'critical')) {
      if (capability.agent === 'RiskPredictor' || capability.agent === 'ESGChiefOfStaff') {
        score += 30;
      }
    }

    // Check for compliance issues
    if (context.environment.complianceScore < 70) {
      if (capability.agent === 'ComplianceGuardian') {
        score += 40;
      }
    }

    // Check for data completeness issues
    if (context.environment.dataCompleteness < 80) {
      if (capability.agent === 'DataIngestionBot') {
        score += 30;
      }
    }

    // Role-based scoring
    const roleAgentPreferences: Record<string, AgentType[]> = {
      [UserRole.OWNER]: ['ESGChiefOfStaff', 'RiskPredictor', 'ReportingGenius'],
      [UserRole.MANAGER]: ['ComplianceGuardian', 'CarbonHunter', 'EnergyOptimizer'],
      [UserRole.MEMBER]: ['DataIngestionBot', 'CarbonHunter'],
      [UserRole.VIEWER]: ['ReportingGenius', 'ESGChiefOfStaff']
    };

    const preferredAgents = roleAgentPreferences[context.user.role] || [];
    if (preferredAgents.includes(capability.agent)) {
      score += 20;
    }

    return score;
  }

  /**
   * Select primary agent
   */
  private static selectPrimaryAgent(scores: Map<AgentType, number>): AgentType {
    let maxScore = -1;
    let primaryAgent: AgentType = 'ESGChiefOfStaff'; // Default

    scores.forEach((score, agent) => {
      if (score > maxScore) {
        maxScore = score;
        primaryAgent = agent;
      }
    });

    return primaryAgent;
  }

  /**
   * Select supporting agents
   */
  private static selectSupportingAgents(
    scores: Map<AgentType, number>,
    primaryAgent: AgentType,
    complexity: 'simple' | 'moderate' | 'complex'
  ): AgentType[] {
    const supportingAgents: AgentType[] = [];

    // Determine how many supporting agents based on complexity
    const maxSupporting = complexity === 'complex' ? 3 : complexity === 'moderate' ? 1 : 0;

    if (maxSupporting === 0) return [];

    // Sort agents by score (excluding primary)
    const sortedAgents = Array.from(scores.entries())
      .filter(([agent]) => agent !== primaryAgent)
      .sort((a, b) => b[1] - a[1]);

    // Select top agents based on score and synergy
    for (let i = 0; i < Math.min(maxSupporting, sortedAgents.length); i++) {
      const [agent, score] = sortedAgents[i];

      // Only include if score is above threshold
      if (score > 30) {
        supportingAgents.push(agent);
      }
    }

    return supportingAgents;
  }

  /**
   * Calculate cost and time estimates
   */
  private static calculateEstimates(
    primaryAgent: AgentType,
    supportingAgents: AgentType[],
    complexity: 'simple' | 'moderate' | 'complex'
  ): { cost: number; time: number } {
    const costMap = { low: 0.01, medium: 0.05, high: 0.15 };
    const timeMap = { simple: 2000, moderate: 5000, complex: 10000 };

    let totalCost = costMap[this.agentCapabilities[primaryAgent].costTier];

    for (const agent of supportingAgents) {
      totalCost += costMap[this.agentCapabilities[agent].costTier] * 0.7; // Reduced cost for supporting
    }

    // Complexity multiplier
    const complexityMultiplier = complexity === 'complex' ? 2 : complexity === 'moderate' ? 1.5 : 1;
    totalCost *= complexityMultiplier;

    return {
      cost: Math.round(totalCost * 100) / 100,
      time: timeMap[complexity]
    };
  }

  /**
   * Generate routing reasoning
   */
  private static generateRoutingReasoning(
    intent: Intent,
    primaryAgent: AgentType,
    supportingAgents: AgentType[]
  ): string {
    const primaryCapability = this.agentCapabilities[primaryAgent];

    let reasoning = `Selected ${primaryAgent} as primary agent for ${intent.primary} intent ` +
      `(confidence: ${Math.round(intent.confidence * 100)}%).`;

    if (supportingAgents.length > 0) {
      reasoning += ` Supporting agents: ${supportingAgents.join(', ')} ` +
        `for comprehensive ${intent.complexity} analysis.`;
    }

    if (intent.entities.length > 0) {
      reasoning += ` Detected entities: ${intent.entities.map(e => e.type).join(', ')}.`;
    }

    return reasoning;
  }

  /**
   * Check if agent is available
   */
  static isAgentAvailable(agent: AgentType): boolean {
    // In production, check agent health status
    // For now, all agents are available
    return true;
  }

  /**
   * Get agent fallback
   */
  static getAgentFallback(agent: AgentType): AgentType {
    // Define fallback chains
    const fallbacks: Record<AgentType, AgentType> = {
      ESGChiefOfStaff: 'ComplianceGuardian',
      ComplianceGuardian: 'ESGChiefOfStaff',
      CarbonHunter: 'EnergyOptimizer',
      EnergyOptimizer: 'CarbonHunter',
      SupplyChainInvestigator: 'CarbonHunter',
      ReportingGenius: 'ESGChiefOfStaff',
      RiskPredictor: 'ESGChiefOfStaff',
      DataIngestionBot: 'ESGChiefOfStaff'
    };

    return fallbacks[agent] || 'ESGChiefOfStaff';
  }

  /**
   * Optimize agent selection for cost
   */
  static optimizeForCost(agents: AgentType[]): AgentType[] {
    return agents
      .sort((a, b) => {
        const costA = this.agentCapabilities[a].costTier;
        const costB = this.agentCapabilities[b].costTier;
        const costOrder = { low: 0, medium: 1, high: 2 };
        return costOrder[costA] - costOrder[costB];
      })
      .slice(0, 2); // Limit to 2 agents for cost optimization
  }

  /**
   * Get agent description
   */
  static getAgentDescription(agent: AgentType): string {
    const descriptions: Record<AgentType, string> = {
      ESGChiefOfStaff: 'Strategic coordinator for ESG initiatives and executive reporting',
      ComplianceGuardian: 'Ensures regulatory compliance and standards adherence',
      CarbonHunter: 'Tracks emissions and identifies reduction opportunities',
      SupplyChainInvestigator: 'Analyzes Scope 3 emissions and supplier impact',
      EnergyOptimizer: 'Optimizes energy consumption and efficiency',
      ReportingGenius: 'Generates comprehensive sustainability reports',
      RiskPredictor: 'Assesses and predicts sustainability risks',
      DataIngestionBot: 'Processes and validates incoming data'
    };

    return descriptions[agent] || 'Specialized sustainability agent';
  }
}