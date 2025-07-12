/**
 * AI Integration Helper
 * Connects industry intelligence with the AI chat system
 */

import { IndustryOrchestrator } from './industry-orchestrator';
import { BenchmarkEngine } from './benchmark-engine';
import { RegulatoryMapper } from './regulatory-mapper';
import { IndustryAnalysis, IndustryRecommendation } from './types';

interface AIContextEnhancement {
  industryContext: string;
  materialTopics: string[];
  regulatoryFocus: string[];
  benchmarkInsights: string[];
  recommendations: string[];
}

interface ConversationContext {
  organizationId: string;
  organizationData: Record<string, any>;
  userMessage: string;
  jurisdiction?: string;
  previousAnalysis?: IndustryAnalysis;
}

export class IndustryIntelligenceAIIntegration {
  private orchestrator: IndustryOrchestrator;
  private benchmarkEngine: BenchmarkEngine;
  private regulatoryMapper: RegulatoryMapper;

  constructor() {
    this.orchestrator = new IndustryOrchestrator();
    this.benchmarkEngine = new BenchmarkEngine();
    this.regulatoryMapper = new RegulatoryMapper();
  }

  /**
   * Enhance AI context with industry-specific intelligence
   */
  async enhanceAIContext(context: ConversationContext): Promise<AIContextEnhancement> {
    const { organizationId, organizationData, userMessage, jurisdiction = 'global' } = context;

    // Get or reuse industry analysis
    let analysis: IndustryAnalysis;
    if (context.previousAnalysis) {
      analysis = context.previousAnalysis;
    } else {
      analysis = await this.orchestrator.analyzeOrganization(organizationId, organizationData);
    }

    // Build industry context string
    const industryContext = this.buildIndustryContext(analysis);

    // Extract material topics relevant to the message
    const relevantTopics = this.extractRelevantTopics(userMessage, analysis.materialTopics);

    // Get regulatory focus areas
    const regulatoryFocus = await this.getRegulatoryFocus(
      organizationData,
      jurisdiction,
      userMessage
    );

    // Get benchmark insights
    const benchmarkInsights = await this.getBenchmarkInsights(
      analysis,
      userMessage
    );

    // Get contextual recommendations
    const recommendations = this.getContextualRecommendations(
      analysis.recommendations,
      userMessage
    );

    return {
      industryContext,
      materialTopics: relevantTopics,
      regulatoryFocus,
      benchmarkInsights,
      recommendations
    };
  }

  /**
   * Generate industry-specific prompt enhancement
   */
  async generatePromptEnhancement(context: ConversationContext): Promise<string> {
    const enhancement = await this.enhanceAIContext(context);

    const promptAddition = `

INDUSTRY CONTEXT:
${enhancement.industryContext}

MATERIAL TOPICS TO CONSIDER:
${enhancement.materialTopics.map(topic => `- ${topic}`).join('\n')}

REGULATORY CONSIDERATIONS:
${enhancement.regulatoryFocus.map(reg => `- ${reg}`).join('\n')}

BENCHMARK INSIGHTS:
${enhancement.benchmarkInsights.map(insight => `- ${insight}`).join('\n')}

RECOMMENDED ACTIONS:
${enhancement.recommendations.map(rec => `- ${rec}`).join('\n')}

Please incorporate this industry-specific context into your response, focusing on the most relevant aspects based on the user's question.`;

    return promptAddition;
  }

  /**
   * Process user message for industry intelligence triggers
   */
  async processMessage(context: ConversationContext): Promise<{
    shouldUseIndustryIntelligence: boolean;
    triggerType: 'analysis' | 'compliance' | 'benchmarking' | 'recommendations' | 'general';
    specificRequest?: string;
    urgency: 'high' | 'medium' | 'low';
  }> {
    const { userMessage } = context;
    const lowerMessage = userMessage.toLowerCase();

    // Check for specific industry intelligence triggers
    const triggers = {
      analysis: ['industry analysis', 'sector analysis', 'gri standards', 'material topics'],
      compliance: ['compliance', 'regulation', 'regulatory', 'legal requirements'],
      benchmarking: ['benchmark', 'peer comparison', 'industry average', 'percentile'],
      recommendations: ['recommendations', 'improve', 'optimize', 'best practices']
    };

    let triggerType: 'analysis' | 'compliance' | 'benchmarking' | 'recommendations' | 'general' = 'general';
    let shouldUse = false;
    let urgency: 'high' | 'medium' | 'low' = 'low';

    // Check for explicit triggers
    for (const [type, keywords] of Object.entries(triggers)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        triggerType = type as any;
        shouldUse = true;
        urgency = type === 'compliance' ? 'high' : 'medium';
        break;
      }
    }

    // Check for ESG-related terms that would benefit from industry context
    const esgKeywords = [
      'emissions', 'carbon', 'sustainability', 'esg', 'environmental',
      'social', 'governance', 'climate', 'energy', 'water', 'waste',
      'safety', 'health', 'labor', 'human rights', 'biodiversity'
    ];

    if (!shouldUse && esgKeywords.some(keyword => lowerMessage.includes(keyword))) {
      shouldUse = true;
      urgency = 'medium';
    }

    return {
      shouldUseIndustryIntelligence: shouldUse,
      triggerType,
      urgency
    };
  }

  /**
   * Generate specific industry response
   */
  async generateIndustryResponse(
    context: ConversationContext,
    triggerType: string
  ): Promise<string> {
    const { organizationId, organizationData, jurisdiction = 'global' } = context;

    switch (triggerType) {
      case 'analysis':
        const analysis = await this.orchestrator.analyzeOrganization(organizationId, organizationData);
        return this.formatAnalysisResponse(analysis);

      case 'compliance':
        const compliance = await this.orchestrator.getComplianceAssessment(
          organizationId,
          organizationData,
          jurisdiction
        );
        return this.formatComplianceResponse(compliance);

      case 'benchmarking':
        const comparison = await this.orchestrator.compareToPeers(
          organizationId,
          organizationData
        );
        return this.formatBenchmarkResponse(comparison);

      case 'recommendations':
        const recommendations = await this.orchestrator.getRecommendations(
          organizationId,
          organizationData
        );
        return this.formatRecommendationsResponse(recommendations);

      default:
        return '';
    }
  }

  /**
   * Build industry context string
   */
  private buildIndustryContext(analysis: IndustryAnalysis): string {
    const industryName = analysis.industry.naicsCode 
      ? this.getIndustryName(analysis.industry.naicsCode)
      : 'General';

    const griStandards = analysis.applicableGRIStandards.join(', ');

    return `Industry: ${industryName}
Applicable GRI Standards: ${griStandards}
Material Topics: ${analysis.materialTopics.length} identified
ESG Performance: Overall score ${(analysis as any).esgScore?.overall || 'not calculated'}`;
  }

  /**
   * Extract relevant material topics based on user message
   */
  private extractRelevantTopics(
    userMessage: string,
    allTopics: any[]
  ): string[] {
    const lowerMessage = userMessage.toLowerCase();
    
    return allTopics
      .filter(topic => {
        const topicWords = topic.name.toLowerCase().split(/[\s-]+/);
        return topicWords.some(word => lowerMessage.includes(word));
      })
      .map(topic => topic.name)
      .slice(0, 5); // Limit to most relevant
  }

  /**
   * Get regulatory focus areas
   */
  private async getRegulatoryFocus(
    organizationData: Record<string, any>,
    jurisdiction: string,
    userMessage: string
  ): Promise<string[]> {
    try {
      const regulations = await this.orchestrator.getApplicableRegulations(
        organizationData,
        jurisdiction
      );

      // Filter regulations relevant to the user's question
      const lowerMessage = userMessage.toLowerCase();
      const relevantRegulations = regulations.filter((reg: any) => {
        const regWords = reg.name.toLowerCase().split(/[\s-]+/);
        return regWords.some((word: string) => lowerMessage.includes(word)) ||
               lowerMessage.includes('compliance') ||
               lowerMessage.includes('regulation');
      });

      return relevantRegulations
        .slice(0, 3)
        .map((reg: any) => `${reg.name} (${reg.jurisdiction})`);
    } catch (error) {
      return ['General regulatory compliance considerations'];
    }
  }

  /**
   * Get benchmark insights
   */
  private async getBenchmarkInsights(
    analysis: IndustryAnalysis,
    userMessage: string
  ): Promise<string[]> {
    const insights: string[] = [];

    if (analysis.peerComparison && analysis.peerComparison.percentileRank) {
      const metrics = Object.entries(analysis.peerComparison.percentileRank);
      
      // Find metrics mentioned in the message or show top insights
      const relevantMetrics = metrics.filter(([metric, rank]) => {
        return userMessage.toLowerCase().includes(metric.replace('_', ' ')) ||
               (rank as number) < 50; // Below median performance
      });

      relevantMetrics.slice(0, 3).forEach(([metric, rank]) => {
        const percentile = rank as number;
        if (percentile < 25) {
          insights.push(`${metric}: Below 25th percentile - significant improvement opportunity`);
        } else if (percentile < 50) {
          insights.push(`${metric}: Below median - room for improvement`);
        } else if (percentile > 75) {
          insights.push(`${metric}: Above 75th percentile - strong performance`);
        }
      });
    }

    if (insights.length === 0) {
      insights.push('Benchmark data analysis available - request specific metrics for comparison');
    }

    return insights;
  }

  /**
   * Get contextual recommendations
   */
  private getContextualRecommendations(
    allRecommendations: IndustryRecommendation[],
    userMessage: string
  ): string[] {
    const lowerMessage = userMessage.toLowerCase();
    
    // Filter recommendations based on message content
    const relevant = allRecommendations.filter(rec => {
      const recWords = rec.title.toLowerCase().split(/[\s-]+/);
      return recWords.some(word => lowerMessage.includes(word)) ||
             rec.priority === 'critical';
    });

    return relevant
      .slice(0, 3)
      .map(rec => `${rec.title} (${rec.priority} priority)`);
  }

  /**
   * Format analysis response
   */
  private formatAnalysisResponse(analysis: IndustryAnalysis): string {
    return `Based on your industry analysis:

**Industry Classification**: ${this.getIndustryName(analysis.industry.naicsCode || '')}
**Applicable GRI Standards**: ${analysis.applicableGRIStandards.join(', ')}
**Material Topics**: ${analysis.materialTopics.length} topics identified
**Required Disclosures**: ${analysis.requiredDisclosures.length} GRI disclosures

**Top Material Topics**:
${analysis.materialTopics.slice(0, 5).map(topic => `• ${topic.name}`).join('\n')}

**Key Recommendations**:
${analysis.recommendations.slice(0, 3).map(rec => `• ${rec.title} (${rec.priority})`).join('\n')}`;
  }

  /**
   * Format compliance response
   */
  private formatComplianceResponse(compliance: any): string {
    return `**Regulatory Compliance Assessment**:

**Overall Compliance**: ${compliance.overallCompliance.toFixed(1)}%
**Jurisdiction**: ${compliance.jurisdiction}

**Upcoming Deadlines**:
${compliance.upcomingDeadlines.slice(0, 3).map((deadline: any) => 
  `• ${deadline.regulation}: ${deadline.deadline.toLocaleDateString()} (${deadline.status})`
).join('\n')}

**Priority Actions**:
${compliance.recommendations.slice(0, 3).map((rec: any) => 
  `• ${rec.action} (${rec.priority})`
).join('\n')}`;
  }

  /**
   * Format benchmark response
   */
  private formatBenchmarkResponse(comparison: any): string {
    if (!comparison || !comparison.percentileRank) {
      return 'Peer benchmarking data is not available for your organization.';
    }

    const metrics = Object.entries(comparison.percentileRank);
    
    return `**Peer Benchmarking Results**:

**Performance vs Industry**:
${metrics.slice(0, 4).map(([metric, rank]) => {
  const percentile = rank as number;
  const performance = percentile > 75 ? 'Strong' : 
                     percentile > 50 ? 'Above Average' :
                     percentile > 25 ? 'Below Average' : 'Needs Improvement';
  return `• ${metric.replace('_', ' ')}: ${percentile.toFixed(1)}th percentile (${performance})`;
}).join('\n')}

**Improvement Opportunities**:
${comparison.improvementOpportunities.slice(0, 3).map((opp: string) => `• ${opp}`).join('\n')}`;
  }

  /**
   * Format recommendations response
   */
  private formatRecommendationsResponse(recommendations: IndustryRecommendation[]): string {
    const critical = recommendations.filter(r => r.priority === 'critical');
    const high = recommendations.filter(r => r.priority === 'high');
    
    return `**Industry-Specific Recommendations**:

${critical.length > 0 ? `**Critical Priority**:
${critical.slice(0, 2).map(rec => 
  `• ${rec.title}\n  Impact: ${rec.impact}\n  Timeline: ${rec.estimatedTimeline || 'TBD'}`
).join('\n\n')}` : ''}

${high.length > 0 ? `**High Priority**:
${high.slice(0, 3).map(rec => 
  `• ${rec.title}\n  Impact: ${rec.impact}\n  Timeline: ${rec.estimatedTimeline || 'TBD'}`
).join('\n\n')}` : ''}`;
  }

  /**
   * Get industry name from NAICS code
   */
  private getIndustryName(naicsCode: string): string {
    if (naicsCode.startsWith('211')) return 'Oil and Gas Extraction';
    if (naicsCode.startsWith('212')) return 'Mining';
    if (naicsCode.startsWith('111')) return 'Crop Production';
    if (naicsCode.startsWith('112')) return 'Animal Production';
    if (naicsCode.startsWith('31') || naicsCode.startsWith('32') || naicsCode.startsWith('33')) {
      return 'Manufacturing';
    }
    return 'General Industry';
  }
}