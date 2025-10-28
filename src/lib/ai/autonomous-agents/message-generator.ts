/**
 * Agent Message Generator
 *
 * Generates proactive messages from autonomous agents to users
 * Messages appear in the chat interface like a colleague sending updates
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

export interface ProactiveMessageParams {
  userId: string;
  organizationId: string;
  agentId: string;
  taskResult: any;
  priority: 'info' | 'alert' | 'critical';
}

export class AgentMessageGenerator {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Redact sensitive information from text
   */
  private redactSensitiveInfo(text: string): string {
    let redacted = text;

    // Email addresses
    redacted = redacted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL_REDACTED]');

    // Phone numbers
    redacted = redacted.replace(/\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE_REDACTED]');

    // Credit card numbers
    redacted = redacted.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD_REDACTED]');

    // Social Security Numbers
    redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]');

    // API keys (32+ character alphanumeric strings)
    redacted = redacted.replace(/\b[A-Za-z0-9_-]{32,}\b/g, '[API_KEY_REDACTED]');

    // AWS access keys
    redacted = redacted.replace(/\b(AKIA|ASIA)[A-Z0-9]{16}\b/g, '[AWS_KEY_REDACTED]');

    // Secrets in text format
    redacted = redacted.replace(/\b(secret|password|token|key)[\s:=]+[^\s]+/gi, '[SECRET_REDACTED]');

    return redacted;
  }

  /**
   * Check if text contains sensitive information
   */
  private containsSensitiveInfo(text: string): boolean {
    const patterns = [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,  // Email
      /\b\d{3}-\d{2}-\d{4}\b/,  // SSN
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/,  // Credit card
      /\b[A-Za-z0-9_-]{32,}\b/,  // API keys
      /\b(AKIA|ASIA)[A-Z0-9]{16}\b/,  // AWS keys
    ];

    return patterns.some(pattern => pattern.test(text));
  }

  /**
   * Determine if a task result is important enough to notify users
   */
  async shouldNotifyUsers(taskResult: any): Promise<boolean> {
    const { agent_id, result, priority } = taskResult;

    // Always notify for critical findings
    if (priority === 'critical') return true;

    // Always notify for alerts
    if (priority === 'alert') return true;

    // Agent-specific notification rules
    const notificationRules = {
      'carbon-hunter': (r: any) => {
        // Notify if emissions increased significantly or anomalies found
        return (
          r?.emissionsIncrease > 10 ||
          r?.anomaliesDetected > 0 ||
          r?.savingsOpportunities?.length > 0
        );
      },
      'compliance-guardian': (r: any) => {
        // Notify if compliance issues or upcoming deadlines
        return (
          r?.complianceIssues?.length > 0 ||
          r?.upcomingDeadlines?.length > 0 ||
          r?.gapAnalysis?.criticalGaps > 0
        );
      },
      'cost-finder': (r: any) => {
        // Notify if significant savings found (>$1000)
        return (
          r?.potentialSavings > 1000 ||
          r?.initiatives?.length > 0 ||
          r?.totalROI > 1.5
        );
      },
      'predictive-maintenance': (r: any) => {
        // Notify if equipment failures predicted
        return (
          r?.failurePredictions?.length > 0 ||
          r?.highRiskEquipment?.length > 0 ||
          r?.maintenanceRecommendations?.length > 0
        );
      },
      'supply-chain': (r: any) => {
        // Notify if high risk suppliers found
        return (
          r?.highRiskSuppliers?.length > 0 ||
          r?.newRisks?.length > 0 ||
          r?.recommendedActions?.length > 0
        );
      },
      'regulatory': (r: any) => {
        // Notify if new regulations or deadlines
        return (
          r?.newRegulations?.length > 0 ||
          r?.upcomingDeadlines?.length > 0 ||
          r?.complianceGaps?.length > 0
        );
      },
      'optimizer': (r: any) => {
        // Notify if optimization opportunities found
        return (
          r?.optimizationOpportunities?.length > 0 ||
          r?.inefficienciesDetected > 0 ||
          r?.potentialSavings > 500
        );
      },
      'esg-chief': (r: any) => {
        // Notify for strategic recommendations
        return (
          r?.strategicRecommendations?.length > 0 ||
          r?.executiveSummary?.priority === 'high' ||
          r?.actionItems?.length > 0
        );
      }
    };

    const rule = notificationRules[agent_id as keyof typeof notificationRules];

    // If no specific rule, notify only if priority is set
    if (!rule) {
      return priority === 'alert' || priority === 'critical';
    }

    return rule(result);
  }

  /**
   * Check if a similar message was recently sent to avoid duplicates
   */
  private async isDuplicateMessage(
    conversationId: string,
    agentId: string,
    taskResult: any,
    hoursToCheck: number = 24
  ): Promise<boolean> {
    try {
      // Get recent messages from this agent in this conversation
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hoursToCheck);

      const { data: recentMessages, error } = await this.supabase
        .from('messages')
        .select('metadata')
        .eq('conversation_id', conversationId)
        .eq('agent_id', agentId)
        .gte('created_at', cutoffTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      if (error || !recentMessages || recentMessages.length === 0) {
        return false; // No recent messages, not a duplicate
      }

      // Create a fingerprint of the current finding for comparison
      const currentFingerprint = this.createFindingFingerprint(taskResult);

      // Check if any recent message has a similar fingerprint
      for (const msg of recentMessages) {
        const msgResult = (msg.metadata as any)?.taskResult;
        if (msgResult) {
          const msgFingerprint = this.createFindingFingerprint(msgResult);
          if (currentFingerprint === msgFingerprint) {
            console.log(`[${agentId}] 🔄 Duplicate finding detected - skipping message creation`);
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return false; // On error, allow the message (fail open)
    }
  }

  /**
   * Create a fingerprint of a finding for deduplication
   * This extracts key metrics and creates a comparable signature
   */
  private createFindingFingerprint(taskResult: any): string {
    // Extract key numeric values and round them for comparison
    const extractNumbers = (obj: any): number[] => {
      const numbers: number[] = [];
      const extract = (o: any) => {
        if (typeof o === 'number') {
          numbers.push(Math.round(o * 100) / 100); // Round to 2 decimals
        } else if (Array.isArray(o)) {
          o.forEach(extract);
        } else if (typeof o === 'object' && o !== null) {
          Object.values(o).forEach(extract);
        }
      };
      extract(obj);
      return numbers.sort((a, b) => a - b); // Sort for consistent ordering
    };

    const numbers = extractNumbers(taskResult);

    // Create fingerprint from key metrics
    return numbers.slice(0, 5).join('|'); // Use top 5 numbers as signature
  }

  /**
   * Create a proactive message from an agent
   */
  async createProactiveMessage(params: ProactiveMessageParams) {
    const { userId, organizationId, agentId, taskResult, priority } = params;

    try {
      // Get or create conversation for this user
      const conversation = await this.getOrCreateAgentConversation(
        userId,
        organizationId,
        agentId
      );

      if (!conversation) {
        console.error('Failed to get/create conversation');
        return null;
      }

      // Check for duplicate messages (skip for critical priority)
      if (priority !== 'critical') {
        const isDuplicate = await this.isDuplicateMessage(
          conversation.id,
          agentId,
          taskResult,
          24 // Check last 24 hours
        );

        if (isDuplicate) {
          console.log(`[${agentId}] Skipping duplicate message for user ${userId}`);
          return null;
        }
      }

      // Generate natural language message using AI
      const messageText = await this.generateMessageText(agentId, taskResult, priority);

      // Store message in database
      const { data: message, error } = await this.supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          role: 'agent', // New role type for agent-initiated messages
          content: messageText,
          agent_id: agentId,
          priority: priority,
          metadata: {
            taskResult,
            timestamp: new Date().toISOString(),
            requiresAction: priority === 'critical',
            automated: true
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create proactive message:', error);
        return null;
      }

      console.log(`✅ Created proactive message from ${agentId} for user ${userId}`);

      // Send notification
      await this.sendNotification(userId, agentId, messageText, priority);

      return message;

    } catch (error) {
      console.error('Error creating proactive message:', error);
      return null;
    }
  }

  /**
   * Generate natural language message text using AI
   */
  /**
   * Add compliance disclaimer to critical agent messages
   */
  private addComplianceDisclaimer(
    messageText: string,
    agentId: string,
    priority: 'info' | 'alert' | 'critical'
  ): string {
    // Add disclaimer for compliance-related agents or critical messages
    const complianceAgents = ['compliance-guardian', 'regulatory', 'esg-chief'];
    const needsDisclaimer = complianceAgents.includes(agentId) || priority === 'critical';

    if (needsDisclaimer) {
      return messageText + `

---

⚠️ **Important Disclaimer**: This is AI-generated guidance based on automated analysis. While our agents use industry-standard methodologies, you should always:
- Consult with qualified sustainability professionals before making compliance decisions
- Verify findings with authoritative sources and regulations
- Review all data and calculations before submitting regulatory reports
- Seek legal advice for compliance-related matters

This guidance is provided for informational purposes only and does not constitute professional advice.`;
    }

    return messageText;
  }

  private async generateMessageText(
    agentId: string,
    taskResult: any,
    priority: string
  ): Promise<string> {
    const agentPersonalities = {
      'carbon-hunter': {
        name: 'Carbon Hunter',
        emoji: '🔍',
        tone: 'detective-like and analytical',
        focus: 'emissions, carbon footprint, and reduction opportunities'
      },
      'compliance-guardian': {
        name: 'Compliance Guardian',
        emoji: '⚖️',
        tone: 'professional and regulatory-focused',
        focus: 'compliance status, deadlines, and regulatory requirements'
      },
      'cost-finder': {
        name: 'Cost Saving Finder',
        emoji: '💰',
        tone: 'business-savvy and ROI-focused',
        focus: 'cost savings, ROI, and efficiency improvements'
      },
      'predictive-maintenance': {
        name: 'Predictive Maintenance',
        emoji: '🔧',
        tone: 'technical and preventive',
        focus: 'equipment health, failure predictions, and maintenance needs'
      },
      'supply-chain': {
        name: 'Supply Chain Investigator',
        emoji: '🔗',
        tone: 'investigative and risk-aware',
        focus: 'supplier risks, supply chain issues, and collaboration opportunities'
      },
      'regulatory': {
        name: 'Regulatory Foresight',
        emoji: '📋',
        tone: 'forward-looking and compliance-oriented',
        focus: 'upcoming regulations, deadlines, and compliance requirements'
      },
      'optimizer': {
        name: 'Autonomous Optimizer',
        emoji: '⚡',
        tone: 'efficiency-focused and proactive',
        focus: 'operations optimization, efficiency improvements, and resource allocation'
      },
      'esg-chief': {
        name: 'ESG Chief of Staff',
        emoji: '👔',
        tone: 'strategic and executive-level',
        focus: 'strategic ESG priorities, executive insights, and coordination'
      }
    };

    const agent = agentPersonalities[agentId as keyof typeof agentPersonalities] || {
      name: agentId,
      emoji: '🤖',
      tone: 'professional and helpful',
      focus: 'sustainability insights'
    };

    try {
      const { text } = await generateText({
        model: openai('gpt-4o-mini'),
        system: `You are the ${agent.name}, an autonomous AI assistant that works 24/7 analyzing ${agent.focus}.

Your role: Generate a concise, actionable message for a user based on your recent analysis.

Tone: ${agent.tone}
Format:
1. Start with "${agent.emoji} ${agent.name}" as a header
2. Brief context (what you analyzed)
3. Key findings (be specific with numbers/metrics)
4. Recommended actions (2-3 clear next steps)
5. End with offer to help further

Keep it under 200 words. Be conversational but professional. Focus on actionable insights.`,
        prompt: `I just completed an analysis with these findings:

${JSON.stringify(taskResult, null, 2)}

Priority Level: ${priority}

Generate a proactive message to inform the user about this finding. Include:
- What you analyzed and when
- Specific findings with metrics
- Why this matters
- Clear next steps they should take
- How you can help further

Make it feel like a helpful colleague sending an important update.`
      });

      let messageText = text;

      // Check for sensitive information and redact if needed
      if (this.containsSensitiveInfo(messageText)) {
        console.warn(`[Agent ${agentId}] Sensitive information detected in message, redacting...`);

        // Log security event
        await this.supabase.from('ai_security_events').insert({
          event_type: 'agent_pii_detected',
          severity: 'medium',
          actor_type: 'agent',
          actor_id: agentId,
          details: {
            agent_id: agentId,
            task_type: taskResult.task_type,
            message_preview: messageText.substring(0, 100)
          }
        }).catch(err => {
          // Table might not exist yet, just log
          console.warn('Could not log security event:', err);
        });

        messageText = this.redactSensitiveInfo(messageText);
      }

      // Apply compliance disclaimer for critical messages
      return this.addComplianceDisclaimer(messageText, agentId, priority as 'info' | 'alert' | 'critical');

    } catch (error) {
      console.error('Failed to generate message text:', error);

      // Fallback to template-based message
      let fallbackMessage = this.generateFallbackMessage(agent, taskResult, priority);

      // Apply content safety to fallback message too
      if (this.containsSensitiveInfo(fallbackMessage)) {
        console.warn(`[Agent ${agentId}] Sensitive info in fallback message, redacting...`);
        fallbackMessage = this.redactSensitiveInfo(fallbackMessage);
      }

      return this.addComplianceDisclaimer(fallbackMessage, agentId, priority as 'info' | 'alert' | 'critical');
    }
  }

  /**
   * Fallback message template if AI generation fails
   */
  private generateFallbackMessage(agent: any, taskResult: any, priority: string): string {
    const priorityEmoji = {
      critical: '🚨',
      alert: '⚠️',
      info: 'ℹ️'
    };

    return `${agent.emoji} **${agent.name}**

${priorityEmoji[priority as keyof typeof priorityEmoji]} I just completed an analysis and found something ${priority === 'critical' ? 'critical' : 'important'}.

**Key Findings:**
${JSON.stringify(taskResult, null, 2)}

Would you like me to investigate further or take any actions?`;
  }

  /**
   * Get or create a conversation for agent proactive messages
   */
  private async getOrCreateAgentConversation(
    userId: string,
    organizationId: string,
    agentId: string
  ) {
    try {
      // Check if conversation exists for this specific agent
      const { data: existing } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('type', 'agent_proactive')
        .eq('metadata->>agent_id', agentId)
        .maybeSingle();

      if (existing) return existing;

      // Get agent display name
      const agentName = this.getAgentDisplayName(agentId);

      // Create new conversation for this agent
      const { data: newConv, error } = await this.supabase
        .from('conversations')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          type: 'agent_proactive',
          title: agentName,
          metadata: {
            automated: true,
            createdBy: 'agent-worker',
            agent_id: agentId,
            agent_name: agentName,
            description: `Proactive updates from ${agentName}`
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create agent conversation:', error);
        return null;
      }

      return newConv;

    } catch (error) {
      console.error('Error in getOrCreateAgentConversation:', error);
      return null;
    }
  }

  /**
   * Send notification to user
   */
  private async sendNotification(
    userId: string,
    agentId: string,
    message: string,
    priority: string
  ) {
    try {
      // Create in-app notification
      const { error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'agent_message',
          title: `New update from ${this.getAgentDisplayName(agentId)}`,
          message: message.substring(0, 200) + (message.length > 200 ? '...' : ''),
          priority: priority,
          read: false,
          metadata: {
            agentId,
            source: 'autonomous_agent',
            timestamp: new Date().toISOString()
          }
        });

      if (error) {
        console.error('Failed to create notification:', error);
      }

      // For critical alerts, trigger additional notifications
      if (priority === 'critical') {
        console.log(`📧 Critical alert for user ${userId} - Email notification recommended`);
        // TODO: Integrate with email service (SendGrid, Resend, etc.)
        // TODO: Integrate with push notifications (Firebase, OneSignal, etc.)
      }

    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  /**
   * Get display name for agent
   */
  private getAgentDisplayName(agentId: string): string {
    const displayNames: Record<string, string> = {
      'carbon-hunter': 'Carbon Hunter 🔍',
      'compliance-guardian': 'Compliance Guardian ⚖️',
      'cost-finder': 'Cost Saving Finder 💰',
      'predictive-maintenance': 'Predictive Maintenance 🔧',
      'supply-chain': 'Supply Chain Investigator 🔗',
      'regulatory': 'Regulatory Foresight 📋',
      'optimizer': 'Autonomous Optimizer ⚡',
      'esg-chief': 'ESG Chief of Staff 👔'
    };

    return displayNames[agentId] || agentId;
  }
}
