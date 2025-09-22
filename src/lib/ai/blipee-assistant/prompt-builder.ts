/**
 * Blipee Assistant Prompt Builder
 * Constructs context-aware prompts based on user role and situation
 */

import { UserRole } from '@/types/auth';
import { CompleteContext, Intent, IntentType } from './types';

export class PromptBuilder {
  /**
   * Build the complete system prompt
   */
  static buildSystemPrompt(context: CompleteContext): string {
    const basePrompt = this.getBasePrompt();
    const roleModifier = this.getRoleModifier(context.user.role);
    const contextualModifier = this.getContextualModifier(context);
    const capabilities = this.getCapabilities();

    return `${basePrompt}\n\n${roleModifier}\n\n${contextualModifier}\n\n${capabilities}`;
  }

  /**
   * Build a user-specific prompt
   */
  static buildUserPrompt(message: string, context: CompleteContext): string {
    const contextString = this.buildContextSummary(context);
    const intentHint = this.getIntentHint(message);

    return `
## Context
${contextString}

## User Message
${message}

## Intent Analysis
${intentHint}

Please provide a helpful, context-aware response that:
1. Addresses the user's specific need
2. Considers their role and permissions
3. Suggests relevant next actions
4. Includes visualizations if helpful
`;
  }

  /**
   * Get base system prompt
   */
  private static getBasePrompt(): string {
    return `You are Blipee Assistant, an intelligent sustainability advisor powered by advanced AI.

IDENTITY:
- Natural, conversational tone - like a knowledgeable colleague
- Address users by their first name when known
- Be proactive but not pushy
- Focus on achieving the user's sustainability goals

BEHAVIORAL RULES:
1. Guide, don't dictate - suggest next best actions
2. Show, don't just tell - generate visualizations when helpful
3. Learn, don't repeat - remember past interactions
4. Anticipate, don't wait - predict user needs
5. Simplify, don't overwhelm - use progressive disclosure

RESPONSE STRUCTURE:
1. Acknowledge the user's context and intent
2. Provide actionable insight or complete the requested task
3. Suggest logical next steps
4. Offer deeper exploration options if relevant`;
  }

  /**
   * Get role-specific prompt modifier
   */
  private static getRoleModifier(role: UserRole): string {
    const modifiers: Record<string, string> = {
      [UserRole.OWNER]: `
ROLE: Organization Owner
- Frame responses in business impact and ROI terms
- Highlight financial implications and strategic value
- Connect actions to organizational goals
- Provide executive summaries with drill-down options
- Suggest board-ready visualizations and reports`,

      [UserRole.MANAGER]: `
ROLE: Manager
- Provide tactical, operational recommendations
- Include team coordination suggestions
- Highlight items requiring approval or review
- Offer workflow optimizations
- Focus on efficiency and team performance`,

      [UserRole.MEMBER]: `
ROLE: Team Member
- Give clear, step-by-step instructions
- Validate inputs proactively
- Celebrate progress and achievements
- Simplify complex tasks into manageable steps
- Provide helpful tooltips and guidance`,

      [UserRole.VIEWER]: `
ROLE: Viewer
- Educate while informing
- Use analogies and clear examples
- Avoid technical jargon
- Provide learning resources
- Focus on understanding over action`
    };

    return modifiers[role] || modifiers[UserRole.VIEWER];
  }

  /**
   * Get contextual prompt modifier based on current situation
   */
  private static getContextualModifier(context: CompleteContext): string {
    const modifiers: string[] = [];

    // Time-based modifiers
    if (context.environment.timeOfDay === 'morning') {
      modifiers.push('Start with a brief summary of overnight changes or alerts.');
    } else if (context.environment.timeOfDay === 'evening') {
      modifiers.push('Offer to schedule non-urgent tasks for tomorrow.');
    }

    // Urgency modifiers
    if (context.environment.activeAlerts.some(a => a.severity === 'critical')) {
      modifiers.push('Prioritize addressing critical alerts immediately.');
    }

    // Quarter-end modifiers
    if (context.environment.isQuarterEnd) {
      modifiers.push('Emphasize reporting and compliance deadlines.');
    }

    // Page-specific modifiers
    if (context.page.pageType === 'data-entry') {
      modifiers.push('Focus on data validation and accuracy.');
    } else if (context.page.pageType === 'report') {
      modifiers.push('Emphasize completeness and compliance standards.');
    }

    // Technical level modifiers
    if (context.user.technicalLevel === 'beginner') {
      modifiers.push('Use simple language and provide more explanation.');
    } else if (context.user.technicalLevel === 'expert') {
      modifiers.push('Provide technical details and advanced options.');
    }

    return modifiers.length > 0
      ? `CONTEXTUAL CONSIDERATIONS:\n${modifiers.map(m => `- ${m}`).join('\n')}`
      : '';
  }

  /**
   * Get capabilities description
   */
  private static getCapabilities(): string {
    return `
CAPABILITIES:
- Access to 8 specialized AI agents:
  • ESG Chief of Staff: Strategic planning and coordination
  • Compliance Guardian: Regulatory compliance and standards (GRI, SASB, TCFD)
  • Carbon Hunter: Emissions tracking and reduction opportunities
  • Supply Chain Investigator: Scope 3 analysis and vendor management
  • Energy Optimizer: Consumption analysis and efficiency
  • Reporting Genius: Automated report generation
  • Risk Predictor: Climate risk assessment and mitigation
  • Data Ingestion Bot: Document parsing and data extraction

- ML-powered predictions:
  • Energy consumption forecasting (30-day LSTM)
  • Emissions anomaly detection
  • Compliance risk scoring
  • Optimization opportunity identification

- Real-time data access:
  • Organization metrics and KPIs
  • Weather and environmental conditions
  • Carbon intensity and market data
  • Regulatory updates and standards`;
  }

  /**
   * Build context summary for prompt
   */
  private static buildContextSummary(context: CompleteContext): string {
    const { user, page, environment } = context;

    return `
User: ${user.name} (${user.role} at ${user.organizationName})
Current Page: ${page.currentPath} (${page.userIntent})
Time: ${environment.timeOfDay}, ${environment.dayOfWeek}
Organization Status:
- Carbon Reduction: ${environment.carbonReduction}%
- Compliance Score: ${environment.complianceScore}/100
- Active Alerts: ${environment.activeAlerts.length}
- Pending Approvals: ${environment.pendingApprovals.length}
User Preferences: ${user.preferredVisualization} visualizations, ${user.technicalLevel} level`;
  }

  /**
   * Get intent hint from message
   */
  private static getIntentHint(message: string): string {
    const lowercased = message.toLowerCase();

    if (lowercased.includes('upload') || lowercased.includes('add') || lowercased.includes('enter')) {
      return 'User likely wants to add data. Guide through data entry with validation.';
    }

    if (lowercased.includes('compliance') || lowercased.includes('regulation') || lowercased.includes('standard')) {
      return 'User needs compliance information. Check status and highlight any gaps.';
    }

    if (lowercased.includes('analyze') || lowercased.includes('compare') || lowercased.includes('trend')) {
      return 'User seeks analysis. Provide data-driven insights with visualizations.';
    }

    if (lowercased.includes('reduce') || lowercased.includes('improve') || lowercased.includes('optimize')) {
      return 'User wants optimization. Identify opportunities and create action plan.';
    }

    if (lowercased.includes('report') || lowercased.includes('download') || lowercased.includes('export')) {
      return 'User needs documentation. Generate or provide access to reports.';
    }

    return 'Understand the user\'s need and provide helpful assistance.';
  }

  /**
   * Build prompt for specific agent
   */
  static buildAgentPrompt(
    agentType: string,
    task: string,
    context: CompleteContext
  ): string {
    const agentPrompts: Record<string, string> = {
      ESGChiefOfStaff: `
As the ESG Chief of Staff, coordinate strategic sustainability initiatives.
Task: ${task}
Organization: ${context.user.organizationName} (${context.user.industry})
Focus on strategic planning, cross-functional coordination, and executive reporting.`,

      ComplianceGuardian: `
As the Compliance Guardian, ensure regulatory compliance and standards adherence.
Task: ${task}
Current Compliance Score: ${context.environment.complianceScore}/100
Check against GRI, SASB, TCFD, and relevant industry standards.`,

      CarbonHunter: `
As the Carbon Hunter, track emissions and identify reduction opportunities.
Task: ${task}
Current Reduction: ${context.environment.carbonReduction}%
Analyze Scope 1, 2, and 3 emissions. Suggest science-based targets.`,

      SupplyChainInvestigator: `
As the Supply Chain Investigator, analyze vendor emissions and supply chain impact.
Task: ${task}
Focus on Scope 3 emissions, supplier engagement, and value chain optimization.`,

      EnergyOptimizer: `
As the Energy Optimizer, analyze consumption and identify efficiency opportunities.
Task: ${task}
Provide specific recommendations for energy reduction and renewable transitions.`,

      ReportingGenius: `
As the Reporting Genius, generate comprehensive sustainability reports.
Task: ${task}
Data Completeness: ${context.environment.dataCompleteness}%
Ensure compliance with disclosure standards and stakeholder requirements.`,

      RiskPredictor: `
As the Risk Predictor, assess climate and sustainability risks.
Task: ${task}
Perform scenario analysis and provide mitigation strategies.`,

      DataIngestionBot: `
As the Data Ingestion Bot, process and validate incoming data.
Task: ${task}
Ensure data quality, perform validation, and extract relevant metrics.`
    };

    return agentPrompts[agentType] || `As ${agentType}, complete this task: ${task}`;
  }

  /**
   * Build prompt for proactive suggestions
   */
  static buildProactivePrompt(context: CompleteContext): string {
    const triggers: string[] = [];

    // Check for critical alerts
    if (context.environment.activeAlerts.some(a => a.severity === 'critical')) {
      triggers.push('Address critical alerts that require immediate attention.');
    }

    // Check for pending approvals
    if (context.environment.pendingApprovals.length > 0) {
      triggers.push(`Review ${context.environment.pendingApprovals.length} pending approvals.`);
    }

    // Check for reporting deadlines
    if (context.environment.reportingDeadline) {
      const daysUntil = Math.floor(
        (context.environment.reportingDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntil < 7) {
        triggers.push(`Prepare for reporting deadline in ${daysUntil} days.`);
      }
    }

    // Check for low metrics
    if (context.environment.complianceScore < 70) {
      triggers.push('Improve compliance score to meet minimum requirements.');
    }

    if (context.environment.dataCompleteness < 80) {
      triggers.push('Complete missing data entries for accurate reporting.');
    }

    if (triggers.length === 0) {
      // No urgent items, suggest based on role
      switch (context.user.role) {
        case UserRole.OWNER:
          triggers.push('Review monthly sustainability performance dashboard.');
          break;
        case UserRole.MANAGER:
          triggers.push('Check team progress on current initiatives.');
          break;
        case UserRole.MEMBER:
          triggers.push('Update this week\'s emissions data.');
          break;
        default:
          triggers.push('Explore sustainability insights and trends.');
      }
    }

    return `
Based on current context, here are proactive suggestions:
${triggers.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Offer to help with any of these items or continue with the user's current task.`;
  }

  /**
   * Build learning prompt to improve responses
   */
  static buildLearningPrompt(
    previousResponse: string,
    feedback: string,
    context: CompleteContext
  ): string {
    return `
Previous response: ${previousResponse}

User feedback: ${feedback}

Context:
- User Role: ${context.user.role}
- Technical Level: ${context.user.technicalLevel}
- Preferred Style: ${context.user.preferredVisualization}

Learn from this feedback to improve future responses:
1. What aspect should be adjusted?
2. How can the response better match user preferences?
3. What additional context would have been helpful?

Generate an improved response that addresses the feedback.`;
  }
}