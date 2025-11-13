/**
 * Blipee - Your Friendly AI Sustainability Orchestrator
 *
 * The main conversational interface that users interact with.
 * Blipee introduces and coordinates with 8 specialized agents:
 * - blipee-cost
 * - blipee-optimizer
 * - blipee-maintenance
 * - blipee-regulatory
 * - blipee-compliance
 * - blipee-carbon
 * - blipee-esg
 * - blipee-supply
 */

import { agentOrchestrator } from './base/AgentOrchestrator';
import { aiService } from '@/lib/ai/service';

interface AgentIntroduction {
  agentName: string;
  introduction: string;
  taskType: string;
}

interface BlipeeResponse {
  greeting: string;
  agentIntroductions: AgentIntroduction[];
  agentResults: Record<string, any>;
  summary: string;
}

export class BlipeeOrchestrator {
  private readonly agentMap = {
    'emissions': { name: 'blipee-carbon', introduction: 'Let me connect you with blipee-carbon, our carbon emissions specialist.' },
    'carbon': { name: 'blipee-carbon', introduction: 'I\'ll bring in blipee-carbon to help track and reduce emissions.' },
    'cost': { name: 'blipee-cost', introduction: 'Let me get blipee-cost to analyze savings opportunities for you.' },
    'savings': { name: 'blipee-cost', introduction: 'I\'m bringing in blipee-cost to find cost-saving opportunities.' },
    'compliance': { name: 'blipee-compliance', introduction: 'Let me connect you with blipee-compliance for regulatory guidance.' },
    'regulation': { name: 'blipee-compliance', introduction: 'I\'ll get blipee-compliance to help ensure regulatory compliance.' },
    'supply_chain': { name: 'blipee-supply', introduction: 'I\'m connecting you with blipee-supply for supply chain insights.' },
    'supplier': { name: 'blipee-supply', introduction: 'Let me bring in blipee-supply to investigate your supply chain.' },
    'optimization': { name: 'blipee-optimizer', introduction: 'I\'m getting blipee-optimizer to help improve efficiency.' },
    'efficiency': { name: 'blipee-optimizer', introduction: 'Let me connect you with blipee-optimizer for performance improvements.' },
    'predictive': { name: 'blipee-maintenance', introduction: 'I\'ll bring in blipee-maintenance to predict and prevent issues.' },
    'maintenance': { name: 'blipee-maintenance', introduction: 'Let me get blipee-maintenance to help with equipment health.' },
    'strategy': { name: 'blipee-esg', introduction: 'I\'m connecting you with blipee-esg for strategic ESG guidance.' },
    'esg': { name: 'blipee-esg', introduction: 'Let me bring in blipee-esg for comprehensive ESG strategy.' },
    'regulatory': { name: 'blipee-regulatory', introduction: 'I\'ll get blipee-regulatory to monitor regulatory changes for you.' }
  };

  /**
   * Analyze message and determine which specialized agents to involve
   */
  private analyzeMessageIntent(message: string): string[] {
    const intents: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Emissions and carbon tracking
    if (lowerMessage.includes('emission') || lowerMessage.includes('carbon') ||
        lowerMessage.includes('co2') || lowerMessage.includes('ghg')) {
      intents.push('emissions');
    }

    // Compliance and regulations
    if (lowerMessage.includes('compliance') || lowerMessage.includes('regulation') ||
        lowerMessage.includes('standard') || lowerMessage.includes('gri') ||
        lowerMessage.includes('tcfd') || lowerMessage.includes('sbti')) {
      intents.push('compliance');
    }

    // Cost and savings
    if (lowerMessage.includes('cost') || lowerMessage.includes('saving') ||
        lowerMessage.includes('expense') || lowerMessage.includes('budget')) {
      intents.push('cost');
    }

    // Supply chain
    if (lowerMessage.includes('supplier') || lowerMessage.includes('scope 3') ||
        lowerMessage.includes('supply chain') || lowerMessage.includes('vendor')) {
      intents.push('supply_chain');
    }

    // Optimization
    if (lowerMessage.includes('optimize') || lowerMessage.includes('improve') ||
        lowerMessage.includes('efficiency') || lowerMessage.includes('performance')) {
      intents.push('optimization');
    }

    // Predictive and maintenance
    if (lowerMessage.includes('predict') || lowerMessage.includes('forecast') ||
        lowerMessage.includes('maintenance') || lowerMessage.includes('failure')) {
      intents.push('predictive');
    }

    // ESG strategy
    if (lowerMessage.includes('strategy') || lowerMessage.includes('esg') ||
        lowerMessage.includes('sustainability plan')) {
      intents.push('strategy');
    }

    return intents;
  }

  /**
   * Map intent to task type for agent orchestrator
   */
  private getTaskType(intent: string): string {
    const taskMap: Record<string, string> = {
      'emissions': 'emissions_analysis',
      'carbon': 'emissions_analysis',
      'cost': 'cost_analysis',
      'savings': 'cost_analysis',
      'compliance': 'compliance_check',
      'regulation': 'compliance_check',
      'supply_chain': 'supply_chain_investigation',
      'supplier': 'supply_chain_investigation',
      'optimization': 'optimization_analysis',
      'efficiency': 'optimization_analysis',
      'predictive': 'predictive_maintenance',
      'maintenance': 'predictive_maintenance',
      'strategy': 'esg_strategy',
      'esg': 'esg_strategy',
      'regulatory': 'regulatory_monitoring'
    };
    return taskMap[intent] || 'general_analysis';
  }

  /**
   * Process a user message with blipee's friendly orchestration
   */
  async processMessage(
    message: string,
    userId: string,
    organizationId: string,
    conversationId: string
  ): Promise<BlipeeResponse> {
    // Analyze what the user needs
    const intents = this.analyzeMessageIntent(message);

    // Generate friendly greeting
    const greeting = this.generateGreeting(intents);

    // Prepare agent introductions
    const agentIntroductions: AgentIntroduction[] = [];
    const agentResults: Record<string, any> = {};

    // Route to specialized agents
    for (const intent of intents) {
      const agentInfo = this.agentMap[intent];
      if (!agentInfo) continue;

      // Add introduction
      agentIntroductions.push({
        agentName: agentInfo.name,
        introduction: agentInfo.introduction,
        taskType: this.getTaskType(intent)
      });

      // Execute task with the appropriate agent
      try {
        const result = await agentOrchestrator.executeTask({
          id: `chat_${Date.now()}_${intent}`,
          type: this.getTaskType(intent),
          priority: 'high',
          payload: { message, organizationId },
          createdBy: userId,
          context: { conversationId },
          scheduledFor: new Date()
        });

        agentResults[agentInfo.name] = result;
      } catch (error) {
        console.error(`Error executing ${agentInfo.name}:`, error);
        agentResults[agentInfo.name] = {
          success: false,
          error: 'Agent temporarily unavailable'
        };
      }
    }

    // Generate summary using AI
    const summary = await this.generateSummary(message, agentIntroductions, agentResults);

    return {
      greeting,
      agentIntroductions,
      agentResults,
      summary
    };
  }

  /**
   * Generate a friendly greeting based on detected intents
   */
  private generateGreeting(intents: string[]): string {
    if (intents.length === 0) {
      return "Hi! I'm blipee, your sustainability assistant. How can I help you today?";
    }

    if (intents.length === 1) {
      return "Hi! I understand you need help with that. Let me bring in the right specialist.";
    }

    return `Hi! I see you need help with ${intents.length} different areas. Let me coordinate with our team of specialists.`;
  }

  /**
   * Generate a conversational summary of agent results
   */
  private async generateSummary(
    message: string,
    introductions: AgentIntroduction[],
    results: Record<string, any>
  ): Promise<string> {
    try {
      // Build context from agent results
      const agentContext = Object.entries(results)
        .map(([agent, result]) => {
          if (!result || !result.success) {
            return `${agent}: Not available`;
          }
          return `${agent}: ${JSON.stringify(result.insights || result.data || 'Analysis complete')}`;
        })
        .join('\n');

      const prompt = `You are blipee, a friendly sustainability AI assistant.

User asked: "${message}"

You connected them with these specialists:
${introductions.map(intro => `- ${intro.agentName}: ${intro.introduction}`).join('\n')}

Agent results:
${agentContext}

Generate a friendly, conversational summary (2-3 sentences) that:
1. Acknowledges what the specialists found
2. Highlights the most important insights
3. Offers to help further

Keep it warm, professional, and concise. You're blipee - friendly but knowledgeable.`;

      const summary = await aiService.complete(prompt, {
        temperature: 0.7,
        maxTokens: 200
      });

      return summary;

    } catch (error) {
      console.error('Error generating summary:', error);
      return "I've gathered insights from our specialists. Let me know if you'd like to dive deeper into any specific area!";
    }
  }

  /**
   * Format the response for the chat API
   */
  formatForChatAPI(blipeeResponse: BlipeeResponse): any {
    return {
      blipee: {
        greeting: blipeeResponse.greeting,
        specialists: blipeeResponse.agentIntroductions.map(intro => ({
          name: intro.agentName,
          introduction: intro.introduction
        })),
        summary: blipeeResponse.summary
      },
      agentInsights: {
        available: Object.keys(blipeeResponse.agentResults).length > 0,
        agents: Object.keys(blipeeResponse.agentResults),
        insights: this.formatAgentInsights(blipeeResponse.agentResults)
      }
    };
  }

  /**
   * Format agent insights for display
   */
  private formatAgentInsights(agentResults: Record<string, any>): any[] {
    const formatted = [];

    for (const [agentName, result] of Object.entries(agentResults)) {
      if (!result || !result.success) continue;

      formatted.push({
        agent: agentName,
        summary: result.insights?.slice(0, 3).join('. ') || 'Analysis complete',
        confidence: result.confidence || 0.85,
        recommendations: result.recommendations || [],
        data: result.data || {}
      });
    }

    return formatted;
  }
}

// Export singleton instance
export const blipeeOrchestrator = new BlipeeOrchestrator();
