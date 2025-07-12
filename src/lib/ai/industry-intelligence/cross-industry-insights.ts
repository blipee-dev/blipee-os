/**
 * Cross-Industry Insights Engine
 * Provides comparative analysis, best practices sharing, and industry transition insights
 */

import { IndustryModel } from './base-model';
import { OilGasGRI11Model } from './models/oil-gas-gri11';
import { CoalGRI12Model } from './models/coal-gri12';
import { AgricultureGRI13Model } from './models/agriculture-gri13';
import { MiningGRI14Model } from './models/mining-gri14';
import { ConstructionGRI15Model } from './models/construction-gri15';
import {
  IndustryClassification,
  MaterialTopic,
  IndustryBenchmark,
  IndustryRecommendation,
  GRISectorStandard
} from './types';

export interface CrossIndustryComparison {
  organizationId: string;
  primaryIndustry: IndustryClassification;
  comparativeIndustries: string[];
  metrics: {
    [metricId: string]: {
      value: number;
      industryRanking: { [industry: string]: number };
      crossIndustryPercentile: number;
      bestInClassValue: number;
      bestInClassIndustry: string;
    };
  };
  insights: CrossIndustryInsight[];
  transferableOpportunities: TransferableOpportunity[];
  transitionPathways: IndustryTransitionPathway[];
}

export interface CrossIndustryInsight {
  id: string;
  type: 'benchmark' | 'practice' | 'opportunity' | 'risk';
  title: string;
  description: string;
  relevantIndustries: string[];
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  evidenceSources: string[];
  actionable: boolean;
}

export interface TransferableOpportunity {
  id: string;
  title: string;
  description: string;
  sourceIndustry: string;
  targetIndustry: string;
  category: 'technology' | 'process' | 'governance' | 'measurement';
  potentialImpact: string;
  implementationComplexity: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  examples: Array<{
    company: string;
    implementation: string;
    results: string;
  }>;
  adaptationGuidance: string;
}

export interface IndustryTransitionPathway {
  id: string;
  fromIndustry: string;
  toIndustry: string;
  transitionType: 'diversification' | 'transformation' | 'pivot';
  phases: Array<{
    phase: number;
    title: string;
    duration: string;
    activities: string[];
    milestones: string[];
    risks: string[];
  }>;
  successFactors: string[];
  casStudies: Array<{
    company: string;
    timeline: string;
    challenges: string[];
    outcomes: string;
  }>;
}

export interface BestPractice {
  id: string;
  title: string;
  description: string;
  category: string;
  sourceIndustry: string;
  applicableIndustries: string[];
  griAlignment: string[];
  evidenceLevel: 'proven' | 'emerging' | 'theoretical';
  implementation: {
    steps: string[];
    timeline: string;
    resources: string[];
    kpis: string[];
  };
  results: {
    quantitative: Array<{
      metric: string;
      improvement: string;
      timeframe: string;
    }>;
    qualitative: string[];
  };
}

export class CrossIndustryInsightsEngine {
  private models: Map<string, IndustryModel>;
  private bestPracticesLibrary: Map<string, BestPractice>;
  private transitionPathways: Map<string, IndustryTransitionPathway>;

  constructor() {
    this.models = new Map();
    this.bestPracticesLibrary = new Map();
    this.transitionPathways = new Map();
    this.initializeModels();
    this.initializeBestPractices();
    this.initializeTransitionPathways();
  }

  /**
   * Initialize industry models
   */
  private initializeModels(): void {
    this.models.set('oil-gas', new OilGasGRI11Model());
    this.models.set('coal', new CoalGRI12Model());
    this.models.set('agriculture', new AgricultureGRI13Model());
    this.models.set('mining', new MiningGRI14Model());
    this.models.set('construction', new ConstructionGRI15Model());
  }

  /**
   * Initialize best practices library
   */
  private initializeBestPractices(): void {
    this.bestPracticesLibrary.set('carbon-accounting-digitization', {
      id: 'carbon-accounting-digitization',
      title: 'Digital Carbon Accounting Systems',
      description: 'Advanced digital platforms for real-time carbon accounting and emissions tracking',
      category: 'measurement',
      sourceIndustry: 'oil-gas',
      applicableIndustries: ['mining', 'construction', 'agriculture'],
      griAlignment: ['GRI 305-1', 'GRI 305-2', 'GRI 305-3'],
      evidenceLevel: 'proven',
      implementation: {
        steps: [
          'Deploy IoT sensors for real-time monitoring',
          'Implement automated data collection systems',
          'Integrate with existing ERP systems',
          'Train staff on digital platforms',
          'Establish data quality protocols'
        ],
        timeline: '6-12 months',
        resources: ['IT infrastructure', 'Training programs', 'Change management'],
        kpis: ['Data accuracy improvement', 'Reporting time reduction', 'Cost savings']
      },
      results: {
        quantitative: [
          { metric: 'Reporting accuracy', improvement: '+15%', timeframe: '6 months' },
          { metric: 'Time to report', improvement: '-60%', timeframe: '3 months' },
          { metric: 'Administrative costs', improvement: '-25%', timeframe: '12 months' }
        ],
        qualitative: [
          'Improved regulatory compliance',
          'Enhanced stakeholder confidence',
          'Better decision-making capabilities'
        ]
      }
    });

    this.bestPracticesLibrary.set('circular-economy-practices', {
      id: 'circular-economy-practices',
      title: 'Circular Economy Implementation',
      description: 'Comprehensive waste-to-resource programs and circular design principles',
      category: 'process',
      sourceIndustry: 'construction',
      applicableIndustries: ['mining', 'agriculture', 'oil-gas'],
      griAlignment: ['GRI 306-2', 'GRI 301-1', 'GRI 301-3'],
      evidenceLevel: 'proven',
      implementation: {
        steps: [
          'Conduct material flow analysis',
          'Identify circular opportunities',
          'Design resource recovery systems',
          'Establish partnerships for material exchange',
          'Monitor and optimize circular performance'
        ],
        timeline: '12-18 months',
        resources: ['Process engineering', 'Partnership development', 'Technology systems'],
        kpis: ['Waste diversion rate', 'Resource efficiency', 'Cost reduction']
      },
      results: {
        quantitative: [
          { metric: 'Waste diversion', improvement: '+40%', timeframe: '12 months' },
          { metric: 'Material costs', improvement: '-15%', timeframe: '18 months' },
          { metric: 'Carbon footprint', improvement: '-20%', timeframe: '24 months' }
        ],
        qualitative: [
          'Enhanced resource security',
          'Improved environmental performance',
          'Innovation culture development'
        ]
      }
    });

    this.bestPracticesLibrary.set('predictive-safety-analytics', {
      id: 'predictive-safety-analytics',
      title: 'Predictive Safety Analytics',
      description: 'AI-powered safety analytics for incident prevention and risk prediction',
      category: 'technology',
      sourceIndustry: 'mining',
      applicableIndustries: ['construction', 'oil-gas', 'agriculture'],
      griAlignment: ['GRI 403-2', 'GRI 403-9'],
      evidenceLevel: 'emerging',
      implementation: {
        steps: [
          'Deploy wearable safety devices',
          'Implement computer vision systems',
          'Develop predictive models',
          'Create real-time alert systems',
          'Train safety teams on analytics'
        ],
        timeline: '9-15 months',
        resources: ['AI technology', 'Safety equipment', 'Data analytics expertise'],
        kpis: ['Incident reduction', 'Near-miss detection', 'Safety culture scores']
      },
      results: {
        quantitative: [
          { metric: 'Safety incidents', improvement: '-35%', timeframe: '12 months' },
          { metric: 'Near-miss detection', improvement: '+150%', timeframe: '6 months' },
          { metric: 'Safety training effectiveness', improvement: '+25%', timeframe: '9 months' }
        ],
        qualitative: [
          'Proactive risk management',
          'Enhanced worker confidence',
          'Regulatory leadership'
        ]
      }
    });
  }

  /**
   * Initialize transition pathways
   */
  private initializeTransitionPathways(): void {
    this.transitionPathways.set('coal-to-renewable', {
      id: 'coal-to-renewable',
      fromIndustry: 'coal',
      toIndustry: 'renewable-energy',
      transitionType: 'transformation',
      phases: [
        {
          phase: 1,
          title: 'Assessment and Planning',
          duration: '6-12 months',
          activities: [
            'Asset evaluation and repurposing potential',
            'Workforce skills assessment',
            'Community engagement and just transition planning',
            'Technology feasibility studies'
          ],
          milestones: [
            'Transition strategy approved',
            'Stakeholder agreements signed',
            'Funding secured'
          ],
          risks: [
            'Community resistance',
            'Regulatory delays',
            'Financing challenges'
          ]
        },
        {
          phase: 2,
          title: 'Pilot Implementation',
          duration: '12-18 months',
          activities: [
            'Pilot renewable projects development',
            'Worker retraining programs',
            'Infrastructure adaptation',
            'Partnership development'
          ],
          milestones: [
            'First renewable project operational',
            '50% workforce transitioned',
            'Technology validation complete'
          ],
          risks: [
            'Technical challenges',
            'Market conditions',
            'Talent retention'
          ]
        },
        {
          phase: 3,
          title: 'Full Transformation',
          duration: '24-36 months',
          activities: [
            'Scale renewable operations',
            'Complete workforce transition',
            'Asset decommissioning',
            'New business model implementation'
          ],
          milestones: [
            'Coal operations ceased',
            'Renewable portfolio complete',
            'Community benefits realized'
          ],
          risks: [
            'Scale-up challenges',
            'Market competition',
            'Operational complexity'
          ]
        }
      ],
      successFactors: [
        'Strong leadership commitment',
        'Community engagement and support',
        'Comprehensive workforce development',
        'Financial resources and planning',
        'Regulatory alignment',
        'Technology partnerships'
      ],
      casStudies: [
        {
          company: 'RWE (Germany)',
          timeline: '2018-2025',
          challenges: [
            'Large-scale workforce transition',
            'Community economic impacts',
            'Asset stranding risks'
          ],
          outcomes: 'Successfully transitioning from coal to renewable energy with 30GW renewable capacity target'
        }
      ]
    });
  }

  /**
   * Perform cross-industry comparison
   */
  async performCrossIndustryComparison(
    organizationId: string,
    organizationData: Record<string, any>,
    primaryIndustry: IndustryClassification,
    compareToIndustries: string[] = []
  ): Promise<CrossIndustryComparison> {
    // Default comparison industries if not specified
    if (compareToIndustries.length === 0) {
      compareToIndustries = Array.from(this.models.keys());
    }

    const metrics: { [metricId: string]: any } = {};
    const insights: CrossIndustryInsight[] = [];

    // Get benchmarks from all industries
    const industryBenchmarks: { [industry: string]: IndustryBenchmark[] } = {};
    
    for (const industry of compareToIndustries) {
      const model = this.models.get(industry);
      if (model) {
        industryBenchmarks[industry] = await model.getBenchmarks();
      }
    }

    // Analyze common metrics across industries
    const commonMetrics = this.identifyCommonMetrics(industryBenchmarks);
    
    for (const metricId of commonMetrics) {
      const orgValue = organizationData[metricId];
      if (orgValue !== undefined) {
        const industryRanking: { [industry: string]: number } = {};
        let bestValue = orgValue;
        let bestIndustry = 'organization';

        // Compare against each industry
        for (const [industry, benchmarks] of Object.entries(industryBenchmarks)) {
          const benchmark = benchmarks.find(b => b.metricId === metricId);
          if (benchmark) {
            industryRanking[industry] = benchmark.average;
            
            // Track best-in-class performance
            if (this.isBetterPerformance(metricId, benchmark.percentiles.p90, bestValue)) {
              bestValue = benchmark.percentiles.p90;
              bestIndustry = industry;
            }
          }
        }

        // Calculate cross-industry percentile
        const allValues = Object.values(industryRanking).concat([orgValue]);
        const crossIndustryPercentile = this.calculatePercentile(orgValue, allValues);

        metrics[metricId] = {
          value: orgValue,
          industryRanking,
          crossIndustryPercentile,
          bestInClassValue: bestValue,
          bestInClassIndustry: bestIndustry
        };

        // Generate insights
        if (crossIndustryPercentile < 25) {
          insights.push({
            id: `${metricId}-improvement`,
            type: 'opportunity',
            title: `${metricId} improvement opportunity`,
            description: `Your ${metricId} performance is in the bottom quartile across industries. ${bestIndustry} industry shows best practices.`,
            relevantIndustries: [bestIndustry],
            impact: 'high',
            confidence: 0.85,
            evidenceSources: ['cross-industry benchmarks'],
            actionable: true
          });
        }
      }
    }

    // Identify transferable opportunities
    const transferableOpportunities = await this.identifyTransferableOpportunities(
      primaryIndustry,
      organizationData,
      compareToIndustries
    );

    // Get relevant transition pathways
    const transitionPathways = this.getRelevantTransitionPathways(primaryIndustry);

    return {
      organizationId,
      primaryIndustry,
      comparativeIndustries: compareToIndustries,
      metrics,
      insights,
      transferableOpportunities,
      transitionPathways
    };
  }

  /**
   * Get best practices applicable to an industry
   */
  getApplicableBestPractices(industry: string): BestPractice[] {
    return Array.from(this.bestPracticesLibrary.values())
      .filter(practice => 
        practice.applicableIndustries.includes(industry) || 
        practice.sourceIndustry === industry
      )
      .sort((a, b) => {
        // Prioritize by evidence level and impact
        const evidenceScore = { proven: 3, emerging: 2, theoretical: 1 };
        return evidenceScore[b.evidenceLevel] - evidenceScore[a.evidenceLevel];
      });
  }

  /**
   * Find best practices by category
   */
  getBestPracticesByCategory(category: string): BestPractice[] {
    return Array.from(this.bestPracticesLibrary.values())
      .filter(practice => practice.category === category);
  }

  /**
   * Get industry transition insights
   */
  getIndustryTransitionInsights(fromIndustry: string): {
    opportunities: string[];
    challenges: string[];
    pathways: IndustryTransitionPathway[];
  } {
    const pathways = Array.from(this.transitionPathways.values())
      .filter(pathway => pathway.fromIndustry === fromIndustry);

    const opportunities = [
      'Access to new markets and revenue streams',
      'Enhanced ESG performance and investor appeal',
      'Future-proofing against regulatory changes',
      'Innovation and competitive advantage',
      'Talent attraction and retention'
    ];

    const challenges = [
      'Significant capital investment requirements',
      'Workforce transition and retraining needs',
      'Regulatory and policy uncertainties',
      'Market acceptance and customer education',
      'Technical implementation risks'
    ];

    return {
      opportunities,
      challenges,
      pathways
    };
  }

  /**
   * Generate cross-industry recommendations
   */
  async generateCrossIndustryRecommendations(
    organizationData: Record<string, any>,
    primaryIndustry: IndustryClassification
  ): Promise<IndustryRecommendation[]> {
    const recommendations: IndustryRecommendation[] = [];
    
    // Get applicable best practices
    const applicablePractices = this.getApplicableBestPractices(this.getIndustryKey(primaryIndustry));
    
    for (const practice of applicablePractices.slice(0, 5)) { // Top 5 practices
      recommendations.push({
        type: 'strategic',
        priority: practice.evidenceLevel === 'proven' ? 'high' : 'medium',
        title: `Adopt ${practice.title}`,
        description: `${practice.description} Proven successful in ${practice.sourceIndustry} industry.`,
        impact: practice.results.qualitative.join(', '),
        effort: practice.implementation.timeline.includes('6') ? 'medium' : 'high',
        griAlignment: practice.griAlignment,
        estimatedTimeline: practice.implementation.timeline
      });
    }

    return recommendations;
  }

  /**
   * Helper methods
   */
  private identifyCommonMetrics(industryBenchmarks: { [industry: string]: IndustryBenchmark[] }): string[] {
    const metricCounts = new Map<string, number>();
    
    for (const benchmarks of Object.values(industryBenchmarks)) {
      const uniqueMetrics = new Set(benchmarks.map(b => b.metricId));
      for (const metricId of uniqueMetrics) {
        metricCounts.set(metricId, (metricCounts.get(metricId) || 0) + 1);
      }
    }

    // Return metrics present in at least 50% of industries
    const threshold = Math.ceil(Object.keys(industryBenchmarks).length * 0.5);
    return Array.from(metricCounts.entries())
      .filter(([_, count]) => count >= threshold)
      .map(([metricId, _]) => metricId);
  }

  private isBetterPerformance(metricId: string, value1: number, value2: number): boolean {
    // Define metrics where lower is better
    const lowerIsBetter = ['emissions', 'intensity', 'rate', 'incidents', 'fatality', 'trir', 'ltir'];
    
    const isLowerBetter = lowerIsBetter.some(keyword => 
      metricId.toLowerCase().includes(keyword)
    );
    
    return isLowerBetter ? value1 < value2 : value1 > value2;
  }

  private calculatePercentile(value: number, allValues: number[]): number {
    const sorted = allValues.sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    return Math.round((index / (sorted.length - 1)) * 100);
  }

  private async identifyTransferableOpportunities(
    primaryIndustry: IndustryClassification,
    organizationData: Record<string, any>,
    compareToIndustries: string[]
  ): Promise<TransferableOpportunity[]> {
    const opportunities: TransferableOpportunity[] = [];
    const primaryKey = this.getIndustryKey(primaryIndustry);

    // Find practices from other industries that could benefit this organization
    for (const industry of compareToIndustries) {
      if (industry === primaryKey) continue;

      const practices = Array.from(this.bestPracticesLibrary.values())
        .filter(p => p.sourceIndustry === industry && p.applicableIndustries.includes(primaryKey));

      for (const practice of practices) {
        opportunities.push({
          id: `${practice.id}-${primaryKey}`,
          title: practice.title,
          description: practice.description,
          sourceIndustry: industry,
          targetIndustry: primaryKey,
          category: practice.category as any,
          potentialImpact: practice.results.qualitative.join('; '),
          implementationComplexity: practice.implementation.timeline.includes('6') ? 'low' : 'medium',
          timeframe: practice.implementation.timeline.includes('6') ? 'short_term' : 'medium_term',
          examples: practice.results.quantitative.map(q => ({
            company: 'Industry Leader',
            implementation: practice.implementation.steps[0],
            results: `${q.metric}: ${q.improvement} in ${q.timeframe}`
          })),
          adaptationGuidance: `Adapt the ${practice.category} approach to fit ${primaryKey} industry context and regulatory requirements.`
        });
      }
    }

    return opportunities.slice(0, 10); // Top 10 opportunities
  }

  private getRelevantTransitionPathways(primaryIndustry: IndustryClassification): IndustryTransitionPathway[] {
    const industryKey = this.getIndustryKey(primaryIndustry);
    return Array.from(this.transitionPathways.values())
      .filter(pathway => pathway.fromIndustry === industryKey);
  }

  private getIndustryKey(classification: IndustryClassification): string {
    // Map NAICS codes to industry keys
    if (classification.naicsCode) {
      const naics = classification.naicsCode;
      if (naics.startsWith('211') || naics.startsWith('213111') || naics.startsWith('324')) return 'oil-gas';
      if (naics.startsWith('212') && naics.includes('1')) return 'coal';
      if (naics.startsWith('111') || naics.startsWith('112') || naics.startsWith('114')) return 'agriculture';
      if (naics.startsWith('212')) return 'mining';
      if (naics.startsWith('23') || naics.startsWith('531')) return 'construction';
    }
    return 'unknown';
  }
}