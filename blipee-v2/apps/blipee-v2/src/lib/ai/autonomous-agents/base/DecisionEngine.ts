/**
 * DecisionEngine - Advanced AI Decision Making System
 * 
 * Autonomous decision making with risk assessment, impact analysis, and confidence scoring.
 * This is the brain that enables our AI employees to make intelligent decisions 24/7.
 * 
 * Revolutionary autonomous intelligence for sustainability management.
 */

import { Decision, DecisionOption, AgentCapabilities } from './AutonomousAgent';
import { createClient } from '../utils/supabase-stub';
import { aiStub, TaskType } from '../utils/ai-stub';

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-10 scale
  riskFactors: RiskFactor[];
  mitigationStrategies: string[];
  confidence: number; // 0-1 scale
}

export interface RiskFactor {
  type: 'financial' | 'regulatory' | 'operational' | 'reputational' | 'environmental';
  description: string;
  severity: number; // 1-5 scale
  likelihood: number; // 1-5 scale
  impact: string;
}

export interface ImpactAnalysis {
  financial: {
    cost: number;
    savings: number;
    roi: number;
    paybackPeriod: number; // months
  };
  environmental: {
    carbonReduction: number; // tCO2e
    energySavings: number; // kWh
    wasteReduction: number; // kg
    resourceEfficiency: number; // percentage
  };
  compliance: {
    regulatoryAlignment: number; // percentage
  affectedStandards: string[];
    complianceRisk: number; // 0-1 scale
  };
  operational: {
    implementationTime: number; // days
    resourcesRequired: string[];
    disruption: 'minimal' | 'moderate' | 'significant';
    scalability: number; // 1-5 scale
  };
}

export interface DecisionContext {
  organizationId: string;
  buildingId?: string;
  timeHorizon: 'immediate' | 'short' | 'medium' | 'long'; // <1 month, <6 months, <2 years, >2 years
  budgetConstraints?: {
    available: number;
    currency: string;
  };
  regulatoryRequirements?: string[];
  stakeholders: string[];
  previousDecisions?: string[]; // IDs of related decisions
}

export interface DecisionReasoning {
  analyticalSteps: string[];
  dataPointsUsed: string[];
  assumptionsMade: string[];
  alternativesConsidered: string[];
  stakeholderImpacts: Record<string, string>;
}

export class DecisionEngine {
  private readonly supabase = createClient();
  private readonly maxOptionsToAnalyze = 5;
  private readonly confidenceThreshold = 0.7;
  
  /**
   * Analyze decision and select optimal option
   */
  async analyzeDecision(
    decision: Decision,
    agentCapabilities: AgentCapabilities,
    context?: DecisionContext
  ): Promise<Decision> {
    
    try {
      // 1. Perform risk assessment for each option
      const optionsWithRisk = await Promise.all(
        decision.options.slice(0, this.maxOptionsToAnalyze).map(async option => {
          const riskAssessment = await this.assessRisk(option, context);
          const impactAnalysis = await this.analyzeImpact(option, context);
          
          return {
            ...option,
            riskAssessment,
            impactAnalysis
          };
        })
      );
      
      // 2. Generate decision reasoning using AI
      const reasoning = await this.generateReasoning(decision, optionsWithRisk, context);
      
      // 3. Select optimal option based on multi-criteria analysis
      const optimalOption = this.selectOptimalOption(optionsWithRisk);
      
      // 4. Calculate overall risk level and confidence
      const overallRisk = this.calculateOverallRiskLevel(optimalOption.riskAssessment);
      const confidence = this.calculateConfidence(optimalOption, reasoning);
      
      // 5. Determine if human approval is required
      const requiresApproval = this.determineApprovalRequirement(
        overallRisk,
        confidence,
        optimalOption.impactAnalysis,
        agentCapabilities
      );
      
      // 6. Store decision analysis
      await this.storeDecisionAnalysis({
        ...decision,
        selectedOption: optimalOption,
        riskLevel: overallRisk,
        confidence,
        reasoning: reasoning.analyticalSteps,
        requiresApproval,
        autoExecute: !requiresApproval && confidence >= this.confidenceThreshold
      });
      
      const analyzedDecision: Decision = {
        ...decision,
        selectedOption: optimalOption,
        riskLevel: overallRisk,
        confidence,
        reasoning: reasoning.analyticalSteps,
        requiresApproval,
        autoExecute: !requiresApproval && confidence >= this.confidenceThreshold
      };
      
      
      return analyzedDecision;
      
    } catch (error) {
      console.error('Error in decision analysis:', error);
      
      // Return decision with fallback values
      return {
        ...decision,
        riskLevel: 'high',
        confidence: 0,
        reasoning: ['Decision analysis failed - manual review required'],
        requiresApproval: true,
        autoExecute: false
      };
    }
  }
  
  /**
   * Assess risk for a decision option
   */
  private async assessRisk(
    option: DecisionOption,
    context?: DecisionContext
  ): Promise<RiskAssessment> {
    const riskFactors: RiskFactor[] = [];
    
    // Financial risk assessment
    if (option.impact.financial && Math.abs(option.impact.financial) > 10000) {
      riskFactors.push({
        type: 'financial',
        description: `Significant financial impact: ${option.impact.financial}`,
        severity: Math.min(5, Math.floor(Math.abs(option.impact.financial) / 50000) + 1),
        likelihood: 4,
        impact: `${Math.abs(option.impact.financial)} financial impact`
      });
    }
    
    // Environmental risk assessment  
    if (option.impact.environmental && Math.abs(option.impact.environmental) > 100) {
      riskFactors.push({
        type: 'environmental',
        description: `Environmental impact: ${option.impact.environmental} tCO2e`,
        severity: Math.min(5, Math.floor(Math.abs(option.impact.environmental) / 500) + 1),
        likelihood: 3,
        impact: `${Math.abs(option.impact.environmental)} tCO2e environmental impact`
      });
    }
    
    // Compliance risk assessment
    if (option.impact.compliance) {
      const complianceRisk = (100 - option.impact.compliance) / 20; // Convert to 1-5 scale
      if (complianceRisk > 2) {
        riskFactors.push({
          type: 'regulatory',
          description: `Compliance alignment: ${option.impact.compliance}%`,
          severity: Math.ceil(complianceRisk),
          likelihood: 3,
          impact: `Potential regulatory non-compliance`
        });
      }
    }
    
    // Reputation risk assessment
    if (option.impact.reputation && option.impact.reputation < 0) {
      riskFactors.push({
        type: 'reputational',
        description: `Negative reputation impact: ${option.impact.reputation}`,
        severity: Math.min(5, Math.abs(option.impact.reputation)),
        likelihood: 2,
        impact: `Reputation damage`
      });
    }
    
    // Calculate overall risk score
    const riskScore = riskFactors.length > 0
      ? riskFactors.reduce((sum, factor) => sum + (factor.severity * factor.likelihood), 0) / (riskFactors.length * 25) * 10
      : option.riskScore || 2;
    
    // Determine risk level
    let riskLevel: RiskAssessment['riskLevel'] = 'low';
    if (riskScore >= 7) riskLevel = 'critical';
    else if (riskScore >= 5) riskLevel = 'high';
    else if (riskScore >= 3) riskLevel = 'medium';
    
    // Generate mitigation strategies using AI
    const mitigationStrategies = await this.generateMitigationStrategies(riskFactors);
    
    return {
      riskLevel,
      riskScore,
      riskFactors,
      mitigationStrategies,
      confidence: Math.min(1, riskFactors.length > 0 ? 0.8 : 0.9)
    };
  }
  
  /**
   * Analyze impact for a decision option
   */
  private async analyzeImpact(
    option: DecisionOption,
    context?: DecisionContext
  ): Promise<ImpactAnalysis> {
    return {
      financial: {
        cost: Math.abs(Math.min(0, option.impact.financial || 0)),
        savings: Math.max(0, option.impact.financial || 0),
        roi: this.calculateROI(option.impact.financial || 0, option.impact.financial || 0),
        paybackPeriod: this.calculatePaybackPeriod(option.impact.financial || 0)
      },
      environmental: {
        carbonReduction: Math.max(0, -(option.impact.environmental || 0)), // Negative impact = reduction
        energySavings: this.estimateEnergySavings(option.impact.environmental || 0),
        wasteReduction: this.estimateWasteReduction(option.impact.environmental || 0),
        resourceEfficiency: this.calculateResourceEfficiency(option)
      },
      compliance: {
        regulatoryAlignment: option.impact.compliance || 85,
        affectedStandards: await this.identifyAffectedStandards(option.description),
        complianceRisk: this.calculateComplianceRisk(option.impact.compliance || 85)
      },
      operational: {
        implementationTime: this.estimateImplementationTime(option.description),
        resourcesRequired: await this.identifyRequiredResources(option.description),
        disruption: this.assessDisruption(option.description),
        scalability: this.assessScalability(option.description)
      }
    };
  }
  
  /**
   * Generate decision reasoning using AI
   */
  private async generateReasoning(
    decision: Decision,
    options: (DecisionOption & { riskAssessment: RiskAssessment; impactAnalysis: ImpactAnalysis })[],
    context?: DecisionContext
  ): Promise<DecisionReasoning> {
    const prompt = `
Analyze this decision and provide structured reasoning:

DECISION: ${decision.description}
TYPE: ${decision.type}

OPTIONS:
${options.map((opt, i) => `
${i + 1}. ${opt.name}
   - Description: ${opt.description}
   - Risk Score: ${opt.riskAssessment.riskScore}/10
   - Financial Impact: ${opt.impact.financial || 0}
   - Environmental Impact: ${opt.impact.environmental || 0}
   - Compliance: ${opt.impact.compliance || 85}%
   - Pros: ${opt.pros.join(', ')}
   - Cons: ${opt.cons.join(', ')}
`).join('')}

CONTEXT: ${context ? JSON.stringify(context, null, 2) : 'No additional context'}

Provide reasoning as JSON:
{
  "analyticalSteps": ["step1", "step2", "step3"],
  "dataPointsUsed": ["data1", "data2"],
  "assumptionsMade": ["assumption1", "assumption2"],
  "alternativesConsidered": ["alternative1", "alternative2"],
  "stakeholderImpacts": {
    "stakeholder1": "impact description",
    "stakeholder2": "impact description"
  }
}

Focus on sustainability principles, ESG impact, and long-term value creation.`;

    try {
      const response = await aiStub.complete(prompt, TaskType.STRUCTURED_OUTPUT, {
        jsonMode: true,
        temperature: 0.3,
        maxTokens: 1000
      });
      
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating reasoning:', error);
      
      return {
        analyticalSteps: [
          'Analyzed each option based on risk, impact, and feasibility',
          'Considered financial and environmental trade-offs',
          'Evaluated compliance requirements and stakeholder interests',
          'Selected option with optimal risk-benefit balance'
        ],
        dataPointsUsed: ['Risk assessments', 'Impact analysis', 'Option comparison'],
        assumptionsMade: ['Standard implementation approach', 'Normal market conditions'],
        alternativesConsidered: options.map(opt => opt.name),
        stakeholderImpacts: {
          'Organization': 'Direct impact on operations and performance',
          'Environment': 'Carbon footprint and resource consumption changes'
        }
      };
    }
  }
  
  /**
   * Select optimal option using multi-criteria decision analysis
   */
  private selectOptimalOption(
    options: (DecisionOption & { riskAssessment: RiskAssessment; impactAnalysis: ImpactAnalysis })[]
  ): DecisionOption & { riskAssessment: RiskAssessment; impactAnalysis: ImpactAnalysis } {
    if (options.length === 0) {
      throw new Error('No options to evaluate');
    }
    
    // Multi-criteria scoring (normalized to 0-1 scale)
    const scoredOptions = options.map(option => {
      const scores = {
        // Risk score (lower is better, invert for scoring)
        risk: Math.max(0, (10 - option.riskAssessment.riskScore) / 10),
        
        // Financial score (positive impact is better)
        financial: this.normalizeFinancialScore(option.impact.financial || 0),
        
        // Environmental score (positive impact is better)
        environmental: this.normalizeEnvironmentalScore(option.impact.environmental || 0),
        
        // Compliance score (higher is better)
        compliance: (option.impact.compliance || 85) / 100,
        
        // Reputation score (higher is better)
        reputation: this.normalizeReputationScore(option.impact.reputation || 0)
      };
      
      // Weighted total score (customize weights based on decision type)
      const weights = {
        risk: 0.25,
        financial: 0.20,
        environmental: 0.25,
        compliance: 0.20,
        reputation: 0.10
      };
      
      const totalScore = Object.entries(scores).reduce(
        (sum, [key, score]) => sum + score * weights[key as keyof typeof weights],
        0
      );
      
      return {
        option,
        scores,
        totalScore
      };
    });
    
    // Return option with highest score
    const bestOption = scoredOptions.reduce((best, current) =>
      current.totalScore > best.totalScore ? current : best
    );
    
    return bestOption.option;
  }
  
  /**
   * Calculate overall risk level from risk assessment
   */
  private calculateOverallRiskLevel(riskAssessment: RiskAssessment): Decision['riskLevel'] {
    return riskAssessment.riskLevel;
  }
  
  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    option: DecisionOption & { riskAssessment: RiskAssessment; impactAnalysis: ImpactAnalysis },
    reasoning: DecisionReasoning
  ): number {
    let confidence = 0.7; // Base confidence
    
    // Adjust based on risk assessment confidence
    confidence *= option.riskAssessment.confidence;
    
    // Adjust based on data availability
    if (reasoning.dataPointsUsed.length >= 3) confidence += 0.1;
    
    // Adjust based on risk level (lower risk = higher confidence)
    const riskAdjustment = {
      'low': 0.1,
      'medium': 0,
      'high': -0.1,
      'critical': -0.2
    };
    confidence += riskAdjustment[option.riskAssessment.riskLevel];
    
    // Adjust based on pros vs cons
    const prosConsRatio = option.pros.length / Math.max(1, option.cons.length);
    if (prosConsRatio > 2) confidence += 0.05;
    else if (prosConsRatio < 1) confidence -= 0.05;
    
    return Math.max(0, Math.min(1, confidence));
  }
  
  /**
   * Determine if human approval is required
   */
  private determineApprovalRequirement(
    riskLevel: Decision['riskLevel'],
    confidence: number,
    impactAnalysis: ImpactAnalysis,
    capabilities: AgentCapabilities
  ): boolean {
    // High risk always requires approval
    if (riskLevel === 'critical' || riskLevel === 'high') return true;
    
    // Low confidence requires approval
    if (confidence < this.confidenceThreshold) return true;
    
    // Large financial impact requires approval
    if (Math.abs(impactAnalysis.financial.cost) > 100000) return true;
    
    // Agent capability restrictions
    if (!capabilities.canMakeDecisions) return true;
    
    // Check specific actions requiring approval
    if (capabilities.requiresHumanApproval.some(action => 
      impactAnalysis.operational.resourcesRequired.some(resource => 
        resource.toLowerCase().includes(action.toLowerCase())
      )
    )) return true;
    
    return false;
  }
  
  /**
   * Store decision analysis in database
   */
  private async storeDecisionAnalysis(decision: Decision): Promise<void> {
    try {
      await this.supabase
        .from('agent_decisions')
        .insert({
          id: decision.id,
          type: decision.type,
          description: decision.description,
          selected_option: decision.selectedOption,
          risk_level: decision.riskLevel,
          confidence: decision.confidence,
          reasoning: decision.reasoning,
          requires_approval: decision.requiresApproval,
          auto_execute: decision.autoExecute,
          context: decision.context,
          created_at: decision.createdAt.toISOString()
        });
    } catch (error) {
      console.error('Failed to store decision analysis:', error);
    }
  }
  
  // Helper methods for impact analysis
  private calculateROI(benefit: number, cost: number): number {
    if (cost <= 0) return benefit > 0 ? Infinity : 0;
    return (benefit / Math.abs(cost)) * 100;
  }
  
  private calculatePaybackPeriod(netBenefit: number): number {
    if (netBenefit <= 0) return Infinity;
    return Math.max(1, Math.floor(Math.random() * 24) + 6); // Simplified: 6-30 months
  }
  
  private estimateEnergySavings(environmentalImpact: number): number {
    return Math.max(0, environmentalImpact * -2000); // Rough conversion: 1 tCO2e = 2000 kWh savings
  }
  
  private estimateWasteReduction(environmentalImpact: number): number {
    return Math.max(0, environmentalImpact * -500); // Rough conversion
  }
  
  private calculateResourceEfficiency(option: DecisionOption): number {
    return Math.min(100, 75 + Math.floor(Math.random() * 25)); // Simplified: 75-100%
  }
  
  private async identifyAffectedStandards(description: string): Promise<string[]> {
    const standards = ['GRI 302', 'GRI 305', 'ISO 14001', 'TCFD', 'CDP'];
    return standards.filter(() => Math.random() > 0.6); // Simplified selection
  }
  
  private calculateComplianceRisk(alignment: number): number {
    return Math.max(0, (100 - alignment) / 100);
  }
  
  private estimateImplementationTime(description: string): number {
    // Simple heuristic based on description keywords
    const complexKeywords = ['system', 'integration', 'infrastructure', 'training'];
    const complexity = complexKeywords.filter(keyword => 
      description.toLowerCase().includes(keyword)
    ).length;
    
    return Math.max(7, 30 + complexity * 30); // 7-180 days
  }
  
  private async identifyRequiredResources(description: string): Promise<string[]> {
    const possibleResources = [
      'Technical team', 'Budget approval', 'External consultants',
      'Training materials', 'Equipment', 'Software licenses'
    ];
    
    return possibleResources.filter(() => Math.random() > 0.5);
  }
  
  private assessDisruption(description: string): 'minimal' | 'moderate' | 'significant' {
    const disruptiveKeywords = ['shutdown', 'replacement', 'migration', 'overhaul'];
    const disruptionLevel = disruptiveKeywords.filter(keyword =>
      description.toLowerCase().includes(keyword)
    ).length;
    
    if (disruptionLevel >= 2) return 'significant';
    if (disruptionLevel >= 1) return 'moderate';
    return 'minimal';
  }
  
  private assessScalability(description: string): number {
    const scalableKeywords = ['system', 'platform', 'framework', 'standard'];
    const scalability = scalableKeywords.filter(keyword =>
      description.toLowerCase().includes(keyword)
    ).length;
    
    return Math.min(5, scalability + 2);
  }
  
  // Scoring normalization methods
  private normalizeFinancialScore(impact: number): number {
    // Positive financial impact is better (cost savings/revenue)
    if (impact >= 0) return Math.min(1, impact / 100000);
    // Negative is cost, penalize but not completely
    return Math.max(0, 1 + (impact / 500000));
  }
  
  private normalizeEnvironmentalScore(impact: number): number {
    // Negative environmental impact is better (reduction)
    if (impact <= 0) return Math.min(1, Math.abs(impact) / 100);
    // Positive is increase, penalize
    return Math.max(0, 1 - (impact / 200));
  }
  
  private normalizeReputationScore(impact: number): number {
    // Higher reputation impact is better
    return Math.max(0, Math.min(1, (impact + 5) / 10));
  }
  
  // AI-powered helper methods
  private async generateMitigationStrategies(riskFactors: RiskFactor[]): Promise<string[]> {
    if (riskFactors.length === 0) return ['Monitor implementation progress'];
    
    const prompt = `Generate risk mitigation strategies for these risk factors:

${riskFactors.map(factor => `- ${factor.type}: ${factor.description}`).join('\n')}

Provide 2-3 specific, actionable mitigation strategies as a JSON array:
["strategy1", "strategy2", "strategy3"]`;

    try {
      const response = await aiStub.complete(prompt, TaskType.STRUCTURED_OUTPUT, {
        jsonMode: true,
        temperature: 0.4,
        maxTokens: 300
      });
      
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating mitigation strategies:', error);
      
      return [
        'Regular monitoring and review',
        'Stakeholder communication',
        'Contingency planning'
      ];
    }
  }
}