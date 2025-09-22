/**
 * Blipee Assistant Response Orchestrator
 * Coordinates AI agents and generates intelligent responses
 */

import {
  CompleteContext,
  Intent,
  IntentType,
  AgentType,
  AgentResponse,
  AssistantResponse,
  Visualization,
  Action
} from './types';
import { ContextEngine } from './context-engine';
import { PromptBuilder } from './prompt-builder';
import { AIService } from '@/lib/ai/service';

// Helper function to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export class ResponseOrchestrator {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Generate a complete response to user input
   */
  async generateResponse(
    message: string,
    session: any,
    pathname: string
  ): Promise<AssistantResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Extract complete context
      const context = await ContextEngine.extractCompleteContext(session, pathname, message);

      // Step 2: Classify intent and assess complexity
      const intent = await this.classifyIntent(message, context);

      // Step 3: Route to appropriate agents
      const requiredAgents = this.selectAgents(intent, context);

      // Step 4: Execute agent tasks in parallel
      const agentResults = await this.executeAgents(requiredAgents, message, context);

      // Step 5: Synthesize response
      const response = await this.synthesizeResponse(agentResults, intent, context);

      // Step 6: Add visualizations if needed
      const visualizations = await this.generateVisualizations(intent, agentResults, context);

      // Step 7: Generate suggested actions
      const actions = this.generateActions(intent, context);

      // Step 8: Add proactive suggestions
      const suggestions = await this.generateProactiveSuggestions(context);

      return {
        message: response,
        visualizations,
        actions,
        suggestions,
        metadata: {
          intent,
          agentsUsed: requiredAgents,
          confidence: this.calculateConfidence(agentResults),
          responseTime: Date.now() - startTime
        }
      };
    } catch (error) {
      console.error('Orchestrator error:', error);
      return this.generateErrorResponse(error as Error, Date.now() - startTime);
    }
  }

  /**
   * Classify user intent from message and context
   */
  private async classifyIntent(message: string, context: CompleteContext): Promise<Intent> {
    const lowercased = message.toLowerCase();

    // Pattern matching for intent classification
    const patterns: { type: IntentType; keywords: string[]; agents: AgentType[] }[] = [
      {
        type: 'data_entry',
        keywords: ['upload', 'add', 'enter', 'input', 'submit', 'import'],
        agents: ['DataIngestionBot', 'CarbonHunter']
      },
      {
        type: 'compliance_check',
        keywords: ['compliance', 'regulation', 'standard', 'gri', 'sasb', 'tcfd', 'audit'],
        agents: ['ComplianceGuardian', 'ReportingGenius']
      },
      {
        type: 'analysis',
        keywords: ['analyze', 'compare', 'trend', 'pattern', 'investigate', 'understand'],
        agents: ['ESGChiefOfStaff', 'CarbonHunter', 'EnergyOptimizer']
      },
      {
        type: 'optimization',
        keywords: ['reduce', 'improve', 'optimize', 'save', 'efficiency', 'opportunity'],
        agents: ['CarbonHunter', 'EnergyOptimizer', 'SupplyChainInvestigator']
      },
      {
        type: 'reporting',
        keywords: ['report', 'document', 'export', 'download', 'generate', 'summary'],
        agents: ['ReportingGenius', 'ComplianceGuardian']
      },
      {
        type: 'troubleshooting',
        keywords: ['error', 'problem', 'issue', 'help', 'broken', 'fix'],
        agents: ['ESGChiefOfStaff']
      },
      {
        type: 'learning',
        keywords: ['what', 'how', 'why', 'explain', 'understand', 'learn'],
        agents: ['ESGChiefOfStaff']
      },
      {
        type: 'configuration',
        keywords: ['configure', 'setup', 'setting', 'preference', 'customize'],
        agents: ['ESGChiefOfStaff']
      }
    ];

    // Find matching pattern
    let matchedPattern = patterns.find(p =>
      p.keywords.some(keyword => lowercased.includes(keyword))
    );

    if (!matchedPattern) {
      // Default to analysis if no pattern matches
      matchedPattern = patterns.find(p => p.type === 'analysis')!;
    }

    // Assess complexity
    const complexity = this.assessComplexity(message, matchedPattern.agents.length);

    // Extract entities (simplified - in production, use NER)
    const entities = this.extractEntities(message);

    return {
      primary: matchedPattern.type,
      confidence: 0.85,
      entities,
      complexity,
      requiredAgents: matchedPattern.agents
    };
  }

  /**
   * Assess query complexity
   */
  private assessComplexity(
    message: string,
    agentCount: number
  ): 'simple' | 'moderate' | 'complex' {
    const wordCount = message.split(' ').length;

    if (agentCount > 2 || wordCount > 50) return 'complex';
    if (agentCount > 1 || wordCount > 20) return 'moderate';
    return 'simple';
  }

  /**
   * Extract entities from message
   */
  private extractEntities(message: string): Intent['entities'] {
    const entities: Intent['entities'] = [];

    // Extract dates
    const datePattern = /\b(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|today|yesterday|last week|last month)\b/gi;
    const dates = message.match(datePattern);
    if (dates) {
      dates.forEach(date => {
        entities.push({ type: 'date', value: date, confidence: 0.9 });
      });
    }

    // Extract metrics
    const metricPattern = /\b(\d+\.?\d*)\s*(kg|ton|mwh|kwh|%|percent)\b/gi;
    const metrics = message.match(metricPattern);
    if (metrics) {
      metrics.forEach(metric => {
        entities.push({ type: 'metric', value: metric, confidence: 0.85 });
      });
    }

    // Extract scopes
    const scopePattern = /\bscope\s*[123]\b/gi;
    const scopes = message.match(scopePattern);
    if (scopes) {
      scopes.forEach(scope => {
        entities.push({ type: 'scope', value: scope, confidence: 0.95 });
      });
    }

    return entities;
  }

  /**
   * Select agents based on intent and context
   */
  private selectAgents(intent: Intent, context: CompleteContext): AgentType[] {
    const agents = [...intent.requiredAgents];

    // Add context-specific agents
    if (context.environment.activeAlerts.some(a => a.severity === 'critical')) {
      if (!agents.includes('RiskPredictor')) {
        agents.push('RiskPredictor');
      }
    }

    if (context.environment.complianceScore < 70) {
      if (!agents.includes('ComplianceGuardian')) {
        agents.push('ComplianceGuardian');
      }
    }

    // Limit agents based on complexity
    if (intent.complexity === 'simple' && agents.length > 1) {
      return [agents[0]]; // Use primary agent only
    }

    if (intent.complexity === 'moderate' && agents.length > 2) {
      return agents.slice(0, 2); // Use top 2 agents
    }

    return agents; // Use all for complex queries
  }

  /**
   * Execute agents in parallel
   */
  private async executeAgents(
    agents: AgentType[],
    message: string,
    context: CompleteContext
  ): Promise<AgentResponse[]> {
    const agentPromises = agents.map(async (agentType) => {
      const startTime = Date.now();

      try {
        // Build agent-specific prompt
        const prompt = PromptBuilder.buildAgentPrompt(agentType, message, context);

        // Execute agent (simplified - in production, call actual agent endpoints)
        const result = await this.executeAgent(agentType, prompt, context);

        return {
          agentId: agentType,
          success: true,
          data: result,
          confidence: 0.85,
          executionTime: Date.now() - startTime,
          suggestions: this.getAgentSuggestions(agentType, result)
        };
      } catch (error) {
        return {
          agentId: agentType,
          success: false,
          data: null,
          confidence: 0,
          executionTime: Date.now() - startTime,
          suggestions: []
        };
      }
    });

    return Promise.all(agentPromises);
  }

  /**
   * Execute a single agent
   */
  private async executeAgent(
    agentType: AgentType,
    prompt: string,
    context: CompleteContext
  ): Promise<any> {
    // In production, this would call the actual agent implementation
    // For now, we'll use the AI service to simulate agent responses

    const systemPrompt = `You are the ${agentType} agent. ${prompt}`;
    const response = await this.aiService.generateResponse(
      prompt,
      systemPrompt,
      0.7 // temperature
    );

    return response;
  }

  /**
   * Get agent-specific suggestions
   */
  private getAgentSuggestions(agentType: AgentType, result: any): string[] {
    // Agent-specific suggestion logic
    const suggestions: Record<AgentType, string[]> = {
      ESGChiefOfStaff: [
        'Review quarterly sustainability goals',
        'Schedule stakeholder alignment meeting'
      ],
      ComplianceGuardian: [
        'Update compliance documentation',
        'Schedule compliance audit'
      ],
      CarbonHunter: [
        'Analyze emission reduction opportunities',
        'Update carbon inventory'
      ],
      SupplyChainInvestigator: [
        'Request supplier emissions data',
        'Review supply chain hotspots'
      ],
      EnergyOptimizer: [
        'Schedule energy audit',
        'Evaluate renewable energy options'
      ],
      ReportingGenius: [
        'Generate monthly report',
        'Update KPI dashboard'
      ],
      RiskPredictor: [
        'Review risk mitigation strategies',
        'Update risk register'
      ],
      DataIngestionBot: [
        'Validate recent data entries',
        'Import pending documents'
      ]
    };

    return suggestions[agentType] || [];
  }

  /**
   * Synthesize response from agent results
   */
  private async synthesizeResponse(
    agentResults: AgentResponse[],
    intent: Intent,
    context: CompleteContext
  ): Promise<string> {
    // Filter successful results
    const successfulResults = agentResults.filter(r => r.success);

    if (successfulResults.length === 0) {
      return 'I encountered an issue processing your request. Let me try a different approach.';
    }

    // Build synthesis prompt
    const systemPrompt = PromptBuilder.buildSystemPrompt(context);
    const userPrompt = PromptBuilder.buildUserPrompt(
      context.message || '',
      context
    );

    // Combine agent results
    const agentData = successfulResults
      .map(r => `${r.agentId}: ${JSON.stringify(r.data)}`)
      .join('\n\n');

    const synthesisPrompt = `
${userPrompt}

Agent Results:
${agentData}

Synthesize these results into a coherent, helpful response that:
1. Directly addresses the user's question
2. Integrates insights from multiple agents
3. Provides clear next steps
4. Maintains a ${context.user.role} appropriate tone
`;

    const response = await this.aiService.generateResponse(
      synthesisPrompt,
      systemPrompt,
      0.7
    );

    return response;
  }

  /**
   * Generate visualizations based on intent and results
   */
  private async generateVisualizations(
    intent: Intent,
    agentResults: AgentResponse[],
    context: CompleteContext
  ): Promise<Visualization[]> {
    const visualizations: Visualization[] = [];

    // Generate visualizations based on intent type
    switch (intent.primary) {
      case 'analysis':
        visualizations.push({
          type: 'chart',
          data: {
            // Mock data - in production, extract from agent results
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
            datasets: [{
              label: 'Emissions (tCO2e)',
              data: [120, 115, 110, 108, 105]
            }]
          },
          config: {
            title: 'Emissions Trend',
            type: 'line'
          },
          interactive: true
        });
        break;

      case 'reporting':
        visualizations.push({
          type: 'table',
          data: {
            headers: ['Metric', 'Current', 'Target', 'Status'],
            rows: [
              ['Carbon Emissions', '105 tCO2e', '100 tCO2e', 'On Track'],
              ['Energy Use', '450 MWh', '400 MWh', 'Needs Attention'],
              ['Water Use', '1200 m³', '1000 m³', 'At Risk']
            ]
          },
          config: {
            title: 'Sustainability Metrics'
          },
          interactive: false
        });
        break;

      case 'optimization':
        visualizations.push({
          type: 'metric',
          data: {
            value: '€45,000',
            label: 'Potential Annual Savings',
            change: '+15%',
            trend: 'up'
          },
          config: {
            color: 'green',
            icon: 'trending-up'
          },
          interactive: false
        });
        break;
    }

    return visualizations;
  }

  /**
   * Generate action buttons based on context
   */
  private generateActions(intent: Intent, context: CompleteContext): Action[] {
    const actions: Action[] = [];

    // Add intent-specific actions
    switch (intent.primary) {
      case 'data_entry':
        actions.push({
          id: generateId(),
          label: 'Upload Documents',
          type: 'primary',
          action: 'navigate',
          params: { path: '/data/upload' }
        });
        break;

      case 'reporting':
        actions.push({
          id: generateId(),
          label: 'Generate Report',
          type: 'primary',
          action: 'generate_report',
          params: { format: 'pdf' }
        });
        break;

      case 'optimization':
        actions.push({
          id: generateId(),
          label: 'View Opportunities',
          type: 'primary',
          action: 'navigate',
          params: { path: '/opportunities' }
        });
        break;
    }

    // Add role-specific actions
    if (context.user.role === 'owner' || context.user.role === 'manager') {
      if (context.environment.pendingApprovals.length > 0) {
        actions.push({
          id: generateId(),
          label: `Review ${context.environment.pendingApprovals.length} Approvals`,
          type: 'secondary',
          action: 'navigate',
          params: { path: '/approvals' }
        });
      }
    }

    return actions;
  }

  /**
   * Generate proactive suggestions
   */
  private async generateProactiveSuggestions(context: CompleteContext): Promise<string[]> {
    const suggestions: string[] = [];

    // Check for critical items
    if (context.environment.activeAlerts.some(a => a.severity === 'critical')) {
      suggestions.push('Address critical alerts immediately');
    }

    // Check for upcoming deadlines
    if (context.environment.reportingDeadline) {
      const daysUntil = Math.floor(
        (context.environment.reportingDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil < 7) {
        suggestions.push(`Prepare report - deadline in ${daysUntil} days`);
      }
    }

    // Check for low scores
    if (context.environment.complianceScore < 70) {
      suggestions.push('Improve compliance score to meet requirements');
    }

    if (context.environment.dataCompleteness < 80) {
      suggestions.push('Complete missing data for accurate reporting');
    }

    // Add role-specific suggestions
    const roleSuggestions: Record<string, string[]> = {
      owner: ['Review monthly performance dashboard', 'Schedule board update'],
      manager: ['Check team progress', 'Review pending tasks'],
      member: ['Update weekly emissions data', 'Complete assigned tasks'],
      viewer: ['Explore latest insights', 'Learn about sustainability metrics']
    };

    const userRoleSuggestions = roleSuggestions[context.user.role] || [];
    suggestions.push(...userRoleSuggestions.slice(0, 2));

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(agentResults: AgentResponse[]): number {
    if (agentResults.length === 0) return 0;

    const successfulResults = agentResults.filter(r => r.success);
    if (successfulResults.length === 0) return 0;

    const avgConfidence = successfulResults.reduce((sum, r) => sum + r.confidence, 0) /
      successfulResults.length;

    // Penalize if some agents failed
    const successRate = successfulResults.length / agentResults.length;

    return avgConfidence * successRate;
  }

  /**
   * Generate error response
   */
  private generateErrorResponse(error: Error, responseTime: number): AssistantResponse {
    console.error('Assistant error:', error);

    return {
      message: 'I apologize, but I encountered an issue processing your request. Please try rephrasing your question or contact support if the issue persists.',
      visualizations: [],
      actions: [
        {
          id: generateId(),
          label: 'Contact Support',
          type: 'secondary',
          action: 'navigate',
          params: { path: '/support' }
        }
      ],
      suggestions: [
        'Try a simpler question',
        'Check your internet connection',
        'Refresh the page'
      ],
      metadata: {
        intent: {
          primary: 'troubleshooting' as IntentType,
          confidence: 0,
          entities: [],
          complexity: 'simple',
          requiredAgents: []
        },
        agentsUsed: [],
        confidence: 0,
        responseTime
      }
    };
  }
}