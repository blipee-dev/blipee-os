/**
 * Cross-Framework Analysis Engine
 *
 * Advanced system for analyzing overlaps, synergies, and optimization opportunities
 * across multiple compliance frameworks. Provides unified compliance strategy
 * and resource optimization.
 */

import {
  ComplianceFramework,
  ComplianceRequirement,
  ComplianceMetric,
  FrameworkOverlap,
  ComplianceOptimization,
  DataRequirement,
  UnifiedComplianceStrategy
} from '../types';
import { FrameworkFactory } from '../frameworks';
import { BaseFrameworkEngine } from '../frameworks/base-framework';

/**
 * Framework Requirement Mapping
 */
interface RequirementMapping {
  id: string;
  sourceFramework: string;
  sourceRequirement: string;
  targetFramework: string;
  targetRequirement: string;
  overlapType: 'identical' | 'substantial' | 'partial' | 'complementary';
  similarityScore: number;
  dataOverlap: string[];
  effortReduction: number; // Percentage of effort saved
}

/**
 * Data Collection Optimization
 */
interface DataOptimization {
  dataPoint: string;
  category: string;
  frameworks: string[];
  requirements: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  frequency: string;
  cost: number;
  efficiency: number;
}

/**
 * Cross-Framework Synergy Analysis
 */
interface FrameworkSynergy {
  frameworks: string[];
  synergyType: 'data_sharing' | 'process_alignment' | 'reporting_consolidation' | 'timeline_optimization';
  description: string;
  benefitScore: number;
  implementationEffort: number;
  timelineSaving: number; // Days saved
  costSaving: number; // Percentage reduction
}

/**
 * Unified Compliance Dashboard Configuration
 */
interface UnifiedDashboard {
  id: string;
  organizationId: string;
  activeFrameworks: string[];
  consolidatedMetrics: {
    id: string;
    name: string;
    description: string;
    frameworks: string[];
    calculation: string;
    target: number;
    current: number;
    trend: 'improving' | 'declining' | 'stable';
  }[];
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  nextDeadlines: {
    framework: string;
    requirement: string;
    deadline: Date;
    status: 'on_track' | 'at_risk' | 'overdue';
  }[];
}

/**
 * Cross-Framework Analysis Engine
 */
export class CrossFrameworkAnalyzer {
  private organizationId: string;
  private frameworkEngines: Map<string, BaseFrameworkEngine>;
  private requirementMappings: RequirementMapping[];
  private dataOptimizations: DataOptimization[];
  private frameworkSynergies: FrameworkSynergy[];

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    this.frameworkEngines = new Map();
    this.requirementMappings = [];
    this.dataOptimizations = [];
    this.frameworkSynergies = [];
  }

  /**
   * Initialize framework engines for analysis
   */
  public async initializeFrameworks(frameworkCodes: string[]): Promise<void> {
    for (const code of frameworkCodes) {
      try {
        const engine = FrameworkFactory.createEngine(code, this.organizationId);
        this.frameworkEngines.set(code, engine);
      } catch (error) {
        console.error(`Failed to initialize framework ${code}:`, error);
      }
    }

    // Analyze requirement overlaps
    await this.analyzeRequirementOverlaps();

    // Optimize data collection
    await this.optimizeDataCollection();

    // Identify synergies
    await this.identifyFrameworkSynergies();
  }

  /**
   * Analyze requirement overlaps between frameworks
   */
  private async analyzeRequirementOverlaps(): Promise<void> {
    const frameworks = Array.from(this.frameworkEngines.keys());

    for (let i = 0; i < frameworks.length; i++) {
      for (let j = i + 1; j < frameworks.length; j++) {
        const sourceFramework = frameworks[i];
        const targetFramework = frameworks[j];

        await this.compareFrameworkRequirements(sourceFramework, targetFramework);
      }
    }
  }

  /**
   * Compare requirements between two frameworks
   */
  private async compareFrameworkRequirements(
    sourceFramework: string,
    targetFramework: string
  ): Promise<void> {
    const sourceEngine = this.frameworkEngines.get(sourceFramework);
    const targetEngine = this.frameworkEngines.get(targetFramework);

    if (!sourceEngine || !targetEngine) return;

    const sourceInfo = await sourceEngine.getFrameworkInfo();
    const targetInfo = await targetEngine.getFrameworkInfo();

    // Compare requirements using NLP similarity
    for (const sourceReq of sourceInfo.requirements) {
      for (const targetReq of targetInfo.requirements) {
        const similarity = this.calculateRequirementSimilarity(sourceReq, targetReq);

        if (similarity > 0.3) { // Threshold for meaningful overlap
          const mapping: RequirementMapping = {
            id: `${sourceFramework}_${targetFramework}_${sourceReq.id}_${targetReq.id}`,
            sourceFramework,
            sourceRequirement: sourceReq.id,
            targetFramework,
            targetRequirement: targetReq.id,
            overlapType: this.categorizeOverlap(similarity),
            similarityScore: similarity,
            dataOverlap: this.identifyDataOverlap(sourceReq, targetReq),
            effortReduction: this.calculateEffortReduction(similarity)
          };

          this.requirementMappings.push(mapping);
        }
      }
    }
  }

  /**
   * Calculate similarity between requirements using NLP techniques
   */
  private calculateRequirementSimilarity(
    req1: ComplianceRequirement,
    req2: ComplianceRequirement
  ): number {
    // Simplified similarity calculation (in production, use proper NLP)
    const text1 = `${req1.title} ${req1.description}`.toLowerCase();
    const text2 = `${req2.title} ${req2.description}`.toLowerCase();

    // Keyword overlap analysis
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    const keywordSimilarity = intersection.size / union.size;

    // Category and subcategory matching
    const categorySimilarity = req1.category === req2.category ? 0.3 : 0;
    const subcategorySimilarity = req1.subcategory === req2.subcategory ? 0.2 : 0;

    // Data requirement overlap
    const dataOverlap = this.identifyDataOverlap(req1, req2);
    const dataSimilarity = dataOverlap.length > 0 ? 0.3 : 0;

    return keywordSimilarity + categorySimilarity + subcategorySimilarity + dataSimilarity;
  }

  /**
   * Categorize overlap type based on similarity score
   */
  private categorizeOverlap(similarity: number): 'identical' | 'substantial' | 'partial' | 'complementary' {
    if (similarity >= 0.9) return 'identical';
    if (similarity >= 0.7) return 'substantial';
    if (similarity >= 0.5) return 'partial';
    return 'complementary';
  }

  /**
   * Identify data overlap between requirements
   */
  private identifyDataOverlap(req1: ComplianceRequirement, req2: ComplianceRequirement): string[] {
    const data1 = new Set(req1.dataRequirements?.map(d => d.type) || []);
    const data2 = new Set(req2.dataRequirements?.map(d => d.type) || []);

    return [...data1].filter(x => data2.has(x));
  }

  /**
   * Calculate effort reduction from overlap
   */
  private calculateEffortReduction(similarity: number): number {
    // Effort reduction based on similarity score
    if (similarity >= 0.9) return 90; // Near identical requirements
    if (similarity >= 0.7) return 60; // Substantial overlap
    if (similarity >= 0.5) return 35; // Partial overlap
    return 15; // Complementary requirements
  }

  /**
   * Optimize data collection across frameworks
   */
  private async optimizeDataCollection(): Promise<void> {
    const allDataRequirements = new Map<string, DataOptimization>();

    // Collect all data requirements from all frameworks
    for (const [frameworkCode, engine] of this.frameworkEngines) {
      const frameworkInfo = await engine.getFrameworkInfo();

      for (const requirement of frameworkInfo.requirements) {
        if (requirement.dataRequirements) {
          for (const dataReq of requirement.dataRequirements) {
            const key = `${dataReq.type}_${dataReq.category}`;

            if (!allDataRequirements.has(key)) {
              allDataRequirements.set(key, {
                dataPoint: dataReq.type,
                category: dataReq.category,
                frameworks: [frameworkCode],
                requirements: [requirement.id],
                priority: dataReq.priority,
                frequency: dataReq.frequency,
                cost: dataReq.estimatedCost || 100,
                efficiency: 1
              });
            } else {
              const existing = allDataRequirements.get(key)!;
              existing.frameworks.push(frameworkCode);
              existing.requirements.push(requirement.id);
              existing.efficiency = existing.frameworks.length; // More frameworks = higher efficiency
            }
          }
        }
      }
    }

    this.dataOptimizations = Array.from(allDataRequirements.values());
  }

  /**
   * Identify framework synergies
   */
  private async identifyFrameworkSynergies(): Promise<void> {
    const frameworks = Array.from(this.frameworkEngines.keys());

    // Data sharing synergies
    await this.identifyDataSharingSynergies(frameworks);

    // Process alignment synergies
    await this.identifyProcessAlignmentSynergies(frameworks);

    // Reporting consolidation synergies
    await this.identifyReportingConsolidationSynergies(frameworks);

    // Timeline optimization synergies
    await this.identifyTimelineOptimizationSynergies(frameworks);
  }

  /**
   * Identify data sharing synergies
   */
  private async identifyDataSharingSynergies(frameworks: string[]): Promise<void> {
    // Group frameworks by shared data requirements
    const dataGroups = new Map<string, string[]>();

    for (const optimization of this.dataOptimizations) {
      if (optimization.frameworks.length > 1) {
        const key = optimization.dataPoint;
        dataGroups.set(key, optimization.frameworks);
      }
    }

    for (const [dataPoint, frameworkList] of dataGroups) {
      if (frameworkList.length >= 2) {
        this.frameworkSynergies.push({
          frameworks: frameworkList,
          synergyType: 'data_sharing',
          description: `Shared data collection for ${dataPoint} across ${frameworkList.length} frameworks`,
          benefitScore: frameworkList.length * 20,
          implementationEffort: 30,
          timelineSaving: frameworkList.length * 5,
          costSaving: (frameworkList.length - 1) * 25
        });
      }
    }
  }

  /**
   * Identify process alignment synergies
   */
  private async identifyProcessAlignmentSynergies(frameworks: string[]): Promise<void> {
    // Look for frameworks with similar processes
    const processPatterns = new Map<string, string[]>();

    for (const framework of frameworks) {
      const engine = this.frameworkEngines.get(framework);
      if (!engine) continue;

      const frameworkInfo = await engine.getFrameworkInfo();

      // Group by process categories
      for (const req of frameworkInfo.requirements) {
        const processKey = `${req.category}_${req.type}`;

        if (!processPatterns.has(processKey)) {
          processPatterns.set(processKey, [framework]);
        } else {
          processPatterns.get(processKey)!.push(framework);
        }
      }
    }

    for (const [process, frameworkList] of processPatterns) {
      if (frameworkList.length >= 2) {
        this.frameworkSynergies.push({
          frameworks: frameworkList,
          synergyType: 'process_alignment',
          description: `Aligned ${process} processes across frameworks`,
          benefitScore: frameworkList.length * 15,
          implementationEffort: 40,
          timelineSaving: frameworkList.length * 3,
          costSaving: frameworkList.length * 15
        });
      }
    }
  }

  /**
   * Identify reporting consolidation synergies
   */
  private async identifyReportingConsolidationSynergies(frameworks: string[]): Promise<void> {
    // Look for frameworks with similar reporting requirements
    const reportingGroups = this.groupFrameworksByReportingPeriod(frameworks);

    for (const [period, frameworkList] of reportingGroups) {
      if (frameworkList.length >= 2) {
        this.frameworkSynergies.push({
          frameworks: frameworkList,
          synergyType: 'reporting_consolidation',
          description: `Consolidated ${period} reporting across frameworks`,
          benefitScore: frameworkList.length * 25,
          implementationEffort: 50,
          timelineSaving: frameworkList.length * 7,
          costSaving: frameworkList.length * 20
        });
      }
    }
  }

  /**
   * Group frameworks by reporting period
   */
  private groupFrameworksByReportingPeriod(frameworks: string[]): Map<string, string[]> {
    const groups = new Map<string, string[]>();

    // Simplified grouping by known framework reporting periods
    const frameworkPeriods: Record<string, string> = {
      'SEC_CLIMATE': 'annual',
      'EU_CSRD': 'annual',
      'TCFD': 'annual',
      'GRI': 'annual',
      'CDP': 'annual',
      'SBTi': 'annual',
      'ISO_14001': 'annual'
    };

    for (const framework of frameworks) {
      const period = frameworkPeriods[framework] || 'unknown';

      if (!groups.has(period)) {
        groups.set(period, [framework]);
      } else {
        groups.get(period)!.push(framework);
      }
    }

    return groups;
  }

  /**
   * Identify timeline optimization synergies
   */
  private async identifyTimelineOptimizationSynergies(frameworks: string[]): Promise<void> {
    // Analyze deadline clustering opportunities
    const deadlineClusters = await this.clusterFrameworkDeadlines(frameworks);

    for (const cluster of deadlineClusters) {
      if (cluster.frameworks.length >= 2) {
        this.frameworkSynergies.push({
          frameworks: cluster.frameworks,
          synergyType: 'timeline_optimization',
          description: `Optimized timeline for ${cluster.period} deliverables`,
          benefitScore: cluster.frameworks.length * 18,
          implementationEffort: 35,
          timelineSaving: cluster.frameworks.length * 10,
          costSaving: cluster.frameworks.length * 12
        });
      }
    }
  }

  /**
   * Cluster framework deadlines for optimization
   */
  private async clusterFrameworkDeadlines(frameworks: string[]): Promise<{
    frameworks: string[];
    period: string;
    deadlines: Date[];
  }[]> {
    // Simplified deadline clustering (in production, use more sophisticated clustering)
    return [
      {
        frameworks: frameworks.filter(f => ['SEC_CLIMATE', 'TCFD'].includes(f)),
        period: 'Q1 Climate Reporting',
        deadlines: [new Date('2024-03-31'), new Date('2024-04-15')]
      },
      {
        frameworks: frameworks.filter(f => ['EU_CSRD', 'GRI'].includes(f)),
        period: 'Q2 Sustainability Reporting',
        deadlines: [new Date('2024-06-30'), new Date('2024-07-15')]
      }
    ];
  }

  /**
   * Generate unified compliance strategy
   */
  public async generateUnifiedStrategy(): Promise<UnifiedComplianceStrategy> {
    const activeFrameworks = Array.from(this.frameworkEngines.keys());

    // Calculate overall optimization potential
    const totalEffortReduction = this.requirementMappings.reduce(
      (sum, mapping) => sum + mapping.effortReduction, 0
    ) / this.requirementMappings.length;

    const totalCostSaving = this.frameworkSynergies.reduce(
      (sum, synergy) => sum + synergy.costSaving, 0
    ) / this.frameworkSynergies.length;

    const totalTimelineSaving = this.frameworkSynergies.reduce(
      (sum, synergy) => sum + synergy.timelineSaving, 0
    );

    return {
      id: `unified_strategy_${this.organizationId}_${Date.now()}`,
      organizationId: this.organizationId,
      activeFrameworks,
      optimizationPotential: {
        effortReduction: totalEffortReduction,
        costSaving: totalCostSaving,
        timelineSaving: totalTimelineSaving,
        riskReduction: this.calculateRiskReduction()
      },
      implementationPlan: await this.generateImplementationPlan(),
      priorityActions: await this.generatePriorityActions(),
      resourceOptimization: this.generateResourceOptimization(),
      riskMitigation: await this.generateRiskMitigation(),
      timeline: await this.generateOptimizedTimeline(),
      success_metrics: this.generateSuccessMetrics(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Calculate risk reduction from cross-framework analysis
   */
  private calculateRiskReduction(): number {
    // Risk reduction based on framework coverage and synergies
    const frameworkCount = this.frameworkEngines.size;
    const synergyCount = this.frameworkSynergies.length;
    const overlapCount = this.requirementMappings.length;

    return Math.min(85, (frameworkCount * 10) + (synergyCount * 2) + (overlapCount * 0.5));
  }

  /**
   * Generate implementation plan
   */
  private async generateImplementationPlan(): Promise<any[]> {
    return [
      {
        phase: 'Phase 1: Foundation',
        duration: '4-6 weeks',
        actions: [
          'Establish unified data collection processes',
          'Implement cross-framework monitoring',
          'Set up consolidated reporting infrastructure'
        ]
      },
      {
        phase: 'Phase 2: Integration',
        duration: '6-8 weeks',
        actions: [
          'Deploy framework synergies',
          'Optimize reporting workflows',
          'Implement automated compliance tracking'
        ]
      },
      {
        phase: 'Phase 3: Optimization',
        duration: '4-6 weeks',
        actions: [
          'Fine-tune cross-framework processes',
          'Implement advanced analytics',
          'Deploy predictive compliance intelligence'
        ]
      }
    ];
  }

  /**
   * Generate priority actions
   */
  private async generatePriorityActions(): Promise<any[]> {
    const highValueSynergies = this.frameworkSynergies
      .filter(s => s.benefitScore > 50)
      .sort((a, b) => b.benefitScore - a.benefitScore)
      .slice(0, 5);

    return highValueSynergies.map(synergy => ({
      action: synergy.description,
      frameworks: synergy.frameworks,
      priority: 'high',
      expectedBenefit: synergy.benefitScore,
      effort: synergy.implementationEffort,
      timeline: `${synergy.timelineSaving} days saved`
    }));
  }

  /**
   * Generate resource optimization recommendations
   */
  private generateResourceOptimization(): any {
    const highEfficiencyData = this.dataOptimizations
      .filter(d => d.efficiency > 2)
      .sort((a, b) => b.efficiency - a.efficiency);

    return {
      dataOptimization: highEfficiencyData.slice(0, 10),
      teamOptimization: this.generateTeamOptimization(),
      technologyOptimization: this.generateTechnologyOptimization()
    };
  }

  /**
   * Generate team optimization recommendations
   */
  private generateTeamOptimization(): any {
    return {
      recommendations: [
        'Assign dedicated cross-framework coordinator',
        'Create framework specialist teams with shared responsibilities',
        'Implement matrix organization for compliance activities'
      ],
      effortReduction: '35-45%',
      skillRequirements: [
        'Cross-framework expertise',
        'Data integration skills',
        'Regulatory intelligence'
      ]
    };
  }

  /**
   * Generate technology optimization recommendations
   */
  private generateTechnologyOptimization(): any {
    return {
      recommendations: [
        'Implement unified compliance data platform',
        'Deploy automated cross-framework mapping',
        'Use AI for regulatory change detection'
      ],
      costSaving: '40-60%',
      implementationPriority: [
        'Data integration platform',
        'Automated reporting system',
        'Predictive analytics engine'
      ]
    };
  }

  /**
   * Generate risk mitigation strategy
   */
  private async generateRiskMitigation(): Promise<any> {
    return {
      identifiedRisks: [
        'Framework requirement changes',
        'Data quality issues',
        'Resource constraints',
        'Timeline conflicts'
      ],
      mitigationStrategies: [
        'Implement automated regulatory monitoring',
        'Establish data quality governance',
        'Create flexible resource allocation',
        'Deploy predictive timeline management'
      ],
      contingencyPlans: [
        'Framework rollback procedures',
        'Alternative data source activation',
        'Emergency resource mobilization',
        'Accelerated compliance protocols'
      ]
    };
  }

  /**
   * Generate optimized timeline
   */
  private async generateOptimizedTimeline(): Promise<any> {
    const now = new Date();

    return {
      milestones: [
        {
          name: 'Cross-Framework Analysis Complete',
          date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
          deliverables: ['Framework mapping', 'Synergy identification', 'Optimization plan']
        },
        {
          name: 'Unified Infrastructure Deployed',
          date: new Date(now.getTime() + 42 * 24 * 60 * 60 * 1000), // 6 weeks
          deliverables: ['Data platform', 'Monitoring system', 'Reporting automation']
        },
        {
          name: 'Full Optimization Active',
          date: new Date(now.getTime() + 84 * 24 * 60 * 60 * 1000), // 12 weeks
          deliverables: ['Complete integration', 'Performance metrics', 'Continuous improvement']
        }
      ],
      criticalPath: [
        'Framework analysis',
        'Data integration',
        'Process optimization',
        'System deployment'
      ],
      dependencies: [
        'Stakeholder approval',
        'Resource allocation',
        'Technology procurement',
        'Team training'
      ]
    };
  }

  /**
   * Generate success metrics
   */
  private generateSuccessMetrics(): any {
    return {
      efficiency: {
        'Effort Reduction': '40-60%',
        'Cost Savings': '35-50%',
        'Time Savings': '45-65%'
      },
      quality: {
        'Compliance Score': '90%+',
        'Data Accuracy': '95%+',
        'Report Quality': '98%+'
      },
      risk: {
        'Risk Reduction': '70-85%',
        'Deadline Compliance': '95%+',
        'Regulatory Alignment': '100%'
      }
    };
  }

  /**
   * Create unified dashboard configuration
   */
  public async createUnifiedDashboard(): Promise<UnifiedDashboard> {
    const activeFrameworks = Array.from(this.frameworkEngines.keys());

    // Generate consolidated metrics
    const consolidatedMetrics = await this.generateConsolidatedMetrics();

    // Calculate overall compliance score
    const overallScore = await this.calculateOverallComplianceScore();

    // Get next deadlines
    const nextDeadlines = await this.getNextDeadlines();

    // Assess risk level
    const riskLevel = this.assessOverallRiskLevel(overallScore, nextDeadlines);

    return {
      id: `unified_dashboard_${this.organizationId}`,
      organizationId: this.organizationId,
      activeFrameworks,
      consolidatedMetrics,
      overallScore,
      riskLevel,
      nextDeadlines
    };
  }

  /**
   * Generate consolidated metrics across frameworks
   */
  private async generateConsolidatedMetrics(): Promise<UnifiedDashboard['consolidatedMetrics']> {
    const metrics: UnifiedDashboard['consolidatedMetrics'] = [];

    // Carbon emissions (relevant to multiple frameworks)
    metrics.push({
      id: 'carbon_emissions',
      name: 'Carbon Emissions (tCO2e)',
      description: 'Total organizational carbon footprint',
      frameworks: ['SEC_CLIMATE', 'TCFD', 'CDP', 'SBTi'],
      calculation: 'Scope 1 + Scope 2 + Scope 3',
      target: 10000,
      current: 12500,
      trend: 'declining'
    });

    // Sustainability score (GRI, EU CSRD)
    metrics.push({
      id: 'sustainability_score',
      name: 'Sustainability Performance Score',
      description: 'Comprehensive sustainability performance indicator',
      frameworks: ['GRI', 'EU_CSRD'],
      calculation: 'Weighted average of ESG indicators',
      target: 85,
      current: 78,
      trend: 'improving'
    });

    // Environmental management effectiveness (ISO 14001)
    metrics.push({
      id: 'ems_effectiveness',
      name: 'EMS Effectiveness Score',
      description: 'Environmental management system performance',
      frameworks: ['ISO_14001'],
      calculation: 'Audit score + performance indicators',
      target: 90,
      current: 88,
      trend: 'stable'
    });

    return metrics;
  }

  /**
   * Calculate overall compliance score
   */
  private async calculateOverallComplianceScore(): Promise<number> {
    let totalScore = 0;
    let frameworkCount = 0;

    for (const [frameworkCode, engine] of this.frameworkEngines) {
      try {
        const assessment = await engine.assessCompliance();
        totalScore += assessment.overallScore;
        frameworkCount++;
      } catch (error) {
        console.error(`Error calculating score for ${frameworkCode}:`, error);
      }
    }

    return frameworkCount > 0 ? Math.round(totalScore / frameworkCount) : 0;
  }

  /**
   * Get next deadlines across all frameworks
   */
  private async getNextDeadlines(): Promise<UnifiedDashboard['nextDeadlines']> {
    const deadlines: UnifiedDashboard['nextDeadlines'] = [];

    for (const [frameworkCode, engine] of this.frameworkEngines) {
      try {
        const frameworkInfo = await engine.getFrameworkInfo();

        for (const requirement of frameworkInfo.requirements) {
          if (requirement.deadline) {
            deadlines.push({
              framework: frameworkCode,
              requirement: requirement.title,
              deadline: new Date(requirement.deadline),
              status: this.assessDeadlineStatus(new Date(requirement.deadline))
            });
          }
        }
      } catch (error) {
        console.error(`Error getting deadlines for ${frameworkCode}:`, error);
      }
    }

    // Sort by deadline and return next 10
    return deadlines
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
      .slice(0, 10);
  }

  /**
   * Assess deadline status
   */
  private assessDeadlineStatus(deadline: Date): 'on_track' | 'at_risk' | 'overdue' {
    const now = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 30) return 'at_risk';
    return 'on_track';
  }

  /**
   * Assess overall risk level
   */
  private assessOverallRiskLevel(
    overallScore: number,
    deadlines: UnifiedDashboard['nextDeadlines']
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Risk based on compliance score
    let riskScore = 0;

    if (overallScore < 60) riskScore += 40;
    else if (overallScore < 75) riskScore += 20;
    else if (overallScore < 90) riskScore += 10;

    // Risk based on deadlines
    const overdueCount = deadlines.filter(d => d.status === 'overdue').length;
    const atRiskCount = deadlines.filter(d => d.status === 'at_risk').length;

    riskScore += overdueCount * 15;
    riskScore += atRiskCount * 5;

    if (riskScore >= 50) return 'critical';
    if (riskScore >= 30) return 'high';
    if (riskScore >= 15) return 'medium';
    return 'low';
  }

  /**
   * Get framework overlaps summary
   */
  public getFrameworkOverlaps(): FrameworkOverlap[] {
    const overlaps: FrameworkOverlap[] = [];

    // Group mappings by framework pairs
    const frameworkPairs = new Map<string, RequirementMapping[]>();

    for (const mapping of this.requirementMappings) {
      const key = `${mapping.sourceFramework}_${mapping.targetFramework}`;

      if (!frameworkPairs.has(key)) {
        frameworkPairs.set(key, [mapping]);
      } else {
        frameworkPairs.get(key)!.push(mapping);
      }
    }

    // Create overlap summaries
    for (const [pairKey, mappings] of frameworkPairs) {
      const [sourceFramework, targetFramework] = pairKey.split('_');

      const totalOverlap = mappings.reduce((sum, m) => sum + m.effortReduction, 0) / mappings.length;
      const sharedRequirements = mappings.length;

      overlaps.push({
        id: `overlap_${pairKey}`,
        sourceFramework,
        targetFramework,
        overlapPercentage: Math.min(100, totalOverlap),
        sharedRequirements,
        effortReduction: totalOverlap,
        implementationSynergies: mappings.filter(m => m.overlapType === 'substantial' || m.overlapType === 'identical').length,
        riskMitigation: sharedRequirements * 5,
        detailedMappings: mappings
      });
    }

    return overlaps.sort((a, b) => b.overlapPercentage - a.overlapPercentage);
  }

  /**
   * Get optimization recommendations
   */
  public getOptimizationRecommendations(): ComplianceOptimization[] {
    const optimizations: ComplianceOptimization[] = [];

    // Data collection optimizations
    const highEfficiencyData = this.dataOptimizations
      .filter(d => d.efficiency > 2)
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 5);

    for (const data of highEfficiencyData) {
      optimizations.push({
        id: `data_opt_${data.dataPoint}`,
        type: 'data_collection',
        title: `Optimize ${data.dataPoint} Collection`,
        description: `Streamline data collection for ${data.dataPoint} across ${data.frameworks.length} frameworks`,
        frameworks: data.frameworks,
        effortReduction: (data.efficiency - 1) * 25,
        costSaving: data.frameworks.length * 15,
        riskReduction: data.frameworks.length * 10,
        implementationComplexity: 'medium',
        timelineImpact: data.frameworks.length * 2,
        priority: data.priority === 'critical' ? 'high' : 'medium'
      });
    }

    // Process synergy optimizations
    const highBenefitSynergies = this.frameworkSynergies
      .filter(s => s.benefitScore > 40)
      .sort((a, b) => b.benefitScore - a.benefitScore)
      .slice(0, 5);

    for (const synergy of highBenefitSynergies) {
      optimizations.push({
        id: `synergy_opt_${synergy.synergyType}`,
        type: 'process_optimization',
        title: `Implement ${synergy.synergyType.replace('_', ' ')} Synergy`,
        description: synergy.description,
        frameworks: synergy.frameworks,
        effortReduction: synergy.costSaving,
        costSaving: synergy.costSaving,
        riskReduction: synergy.benefitScore / 2,
        implementationComplexity: synergy.implementationEffort > 40 ? 'high' : 'medium',
        timelineImpact: synergy.timelineSaving,
        priority: synergy.benefitScore > 60 ? 'high' : 'medium'
      });
    }

    return optimizations.sort((a, b) => {
      // Sort by priority and then by benefit
      const priorityScore = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityScore[a.priority];
      const bPriority = priorityScore[b.priority];

      if (aPriority !== bPriority) return bPriority - aPriority;
      return (b.effortReduction + b.costSaving) - (a.effortReduction + a.costSaving);
    });
  }
}

export default CrossFrameworkAnalyzer;