/**
 * Blipee Assistant - Main Entry Point
 * The intelligent sustainability advisor that works 24/7
 */

import { ResponseOrchestrator } from './orchestrator';
import { ConversationManager } from './conversation-manager';
import { ContextEngine } from './context-engine';
import { AgentRouter } from './agent-router';
import { AssistantResponse, CompleteContext } from './types';

// Helper function to generate unique IDs
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export class BlipeeAssistant {
  private orchestrator: ResponseOrchestrator;
  private conversationManager?: ConversationManager;
  private session: any;

  constructor(session: any) {
    this.orchestrator = new ResponseOrchestrator();
    this.session = session;
  }

  /**
   * Initialize conversation
   */
  async initializeConversation(conversationId?: string): Promise<string> {
    const id = conversationId || generateId();

    if (!this.session?.user?.id) {
      throw new Error('User session required');
    }

    this.conversationManager = new ConversationManager(
      id,
      this.session.user.id,
      this.session.current_organization?.id || ''
    );

    // Initialize conversation state
    const context = await ContextEngine.extractCompleteContext(
      this.session,
      '/blipee-ai',
      undefined
    );

    await this.conversationManager.initializeConversation(context);

    return id;
  }

  /**
   * Process user message and generate response
   */
  async processMessage(
    message: string,
    pathname: string = '/blipee-ai'
  ): Promise<AssistantResponse> {
    try {
      // Ensure conversation is initialized
      if (!this.conversationManager) {
        await this.initializeConversation();
      }

      // Generate response using orchestrator
      const response = await this.orchestrator.generateResponse(
        message,
        this.session,
        pathname
      );

      // Extract context for history
      const context = await ContextEngine.extractCompleteContext(
        this.session,
        pathname,
        message
      );

      // Add to conversation history
      if (this.conversationManager) {
        await this.conversationManager.addToHistory(message, response, context);

        // Check if escalation is needed
        const state = await this.conversationManager.loadConversationState();
        if (state && this.conversationManager.shouldEscalate(state)) {
          response.suggestions?.unshift('Would you like to speak with a human expert?');
        }

        // Add follow-up questions
        if (state) {
          const followUpQuestions = await this.conversationManager.getSuggestedQuestions(state);
          response.suggestions = [...(response.suggestions || []), ...followUpQuestions];
        }
      }

      return response;
    } catch (error) {
      console.error('Blipee Assistant error:', error);
      return this.generateErrorResponse(error as Error);
    }
  }

  /**
   * Get conversation summary
   */
  async getConversationSummary(): Promise<string> {
    if (!this.conversationManager) {
      return 'No active conversation';
    }

    return this.conversationManager.getConversationSummary();
  }

  /**
   * Record user feedback
   */
  async recordFeedback(satisfaction: number, feedback?: string): Promise<void> {
    if (!this.conversationManager) {
      throw new Error('No active conversation');
    }

    await this.conversationManager.recordFeedback(satisfaction, feedback);
  }

  /**
   * Export conversation
   */
  async exportConversation(): Promise<any> {
    if (!this.conversationManager) {
      throw new Error('No active conversation');
    }

    return this.conversationManager.exportConversation();
  }

  /**
   * Clear conversation
   */
  async clearConversation(): Promise<void> {
    if (!this.conversationManager) {
      return;
    }

    await this.conversationManager.clearConversation();
    this.conversationManager = undefined;
  }

  /**
   * Get agent status
   */
  static getAgentStatus(): Record<string, boolean> {
    const agents = [
      'ESGChiefOfStaff',
      'ComplianceGuardian',
      'CarbonHunter',
      'SupplyChainInvestigator',
      'EnergyOptimizer',
      'ReportingGenius',
      'RiskPredictor',
      'DataIngestionBot'
    ];

    const status: Record<string, boolean> = {};
    agents.forEach(agent => {
      status[agent] = AgentRouter.isAgentAvailable(agent as any);
    });

    return status;
  }

  /**
   * Get system health
   */
  static async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'down';
    agents: Record<string, boolean>;
    responseTime: number;
    confidence: number;
  }> {
    const startTime = Date.now();
    const agentStatus = this.getAgentStatus();
    const activeAgents = Object.values(agentStatus).filter(s => s).length;
    const totalAgents = Object.keys(agentStatus).length;

    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    if (activeAgents === 0) {
      status = 'down';
    } else if (activeAgents < totalAgents * 0.7) {
      status = 'degraded';
    }

    return {
      status,
      agents: agentStatus,
      responseTime: Date.now() - startTime,
      confidence: activeAgents / totalAgents
    };
  }

  /**
   * Generate error response
   */
  private generateErrorResponse(error: Error): AssistantResponse {
    return {
      message: `I apologize, but I encountered an issue: ${error.message}. Please try rephrasing your question or contact support if the issue persists.`,
      visualizations: [],
      actions: [
        {
          id: generateId(),
          label: 'Try Again',
          type: 'primary',
          action: 'retry',
          params: {}
        },
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
          primary: 'troubleshooting',
          confidence: 0,
          entities: [],
          complexity: 'simple',
          requiredAgents: []
        },
        agentsUsed: [],
        confidence: 0,
        responseTime: 0
      }
    };
  }
}

// Export all components
export * from './types';
export { ContextEngine } from './context-engine';
export { PromptBuilder } from './prompt-builder';
export { ResponseOrchestrator } from './orchestrator';
export { AgentRouter } from './agent-router';
export { ConversationManager } from './conversation-manager';