/**
 * Industry Transition Pathways
 * Provides strategic guidance for organizations transitioning between industries
 */

import {
  IndustryClassification,
  MaterialTopic,
  IndustryRecommendation,
  GRISectorStandard
} from './types';

export interface TransitionPathway {
  id: string;
  name: string;
  fromIndustry: string;
  toIndustry: string;
  transitionType: 'diversification' | 'transformation' | 'pivot' | 'expansion';
  complexity: 'low' | 'medium' | 'high' | 'very_high';
  timeframe: 'short_term' | 'medium_term' | 'long_term'; // 1-2y, 3-5y, 5-10y
  feasibilityScore: number; // 0-100
  phases: TransitionPhase[];
  prerequisites: TransitionPrerequisite[];
  risks: TransitionRisk[];
  opportunities: TransitionOpportunity[];
  successFactors: string[];
  caseStudies: TransitionCaseStudy[];
  esgConsiderations: ESGTransitionConsiderations;
}

export interface TransitionPhase {
  phase: number;
  name: string;
  duration: string;
  objectives: string[];
  activities: TransitionActivity[];
  milestones: TransitionMilestone[];
  kpis: Array<{
    metric: string;
    target: string;
    measurement: string;
  }>;
  resources: {
    financial: string;
    human: string;
    technology: string;
    partnerships: string[];
  };
  risks: string[];
  dependencies: string[];
}

export interface TransitionActivity {
  id: string;
  name: string;
  description: string;
  category: 'strategic' | 'operational' | 'regulatory' | 'technology' | 'workforce';
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeline: string;
  owner: string;
  prerequisites: string[];
  deliverables: string[];
}

export interface TransitionMilestone {
  id: string;
  name: string;
  description: string;
  targetDate: string;
  successCriteria: string[];
  gateCriteria: string[];
  stakeholderSignoffs: string[];
}

export interface TransitionPrerequisite {
  category: 'financial' | 'regulatory' | 'technical' | 'organizational' | 'market';
  requirement: string;
  criticality: 'essential' | 'important' | 'preferred';
  status?: 'met' | 'in_progress' | 'not_started' | 'at_risk';
  assessmentCriteria: string[];
}

export interface TransitionRisk {
  id: string;
  category: 'financial' | 'operational' | 'regulatory' | 'market' | 'reputational';
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  phase: number[];
  mitigationStrategies: string[];
  earlyWarningIndicators: string[];
}

export interface TransitionOpportunity {
  id: string;
  description: string;
  category: 'revenue' | 'cost_savings' | 'competitive_advantage' | 'esg_benefits';
  potentialValue: string;
  realization_timeframe: string;
  requirements: string[];
}

export interface TransitionCaseStudy {
  company: string;
  fromIndustry: string;
  toIndustry: string;
  timeline: string;
  approach: string;
  challenges: string[];
  solutions: string[];
  outcomes: {
    financial: string;
    operational: string;
    esg: string;
  };
  lessonsLearned: string[];
}

export interface ESGTransitionConsiderations {
  stakeholderImpacts: {
    workforce: string[];
    communities: string[];
    customers: string[];
    suppliers: string[];
    investors: string[];
  };
  environmentalImplications: string[];
  socialResponsibilities: string[];
  governanceRequirements: string[];
  reportingChanges: {
    griStandardChanges: string[];
    newDisclosures: string[];
    retiredMetrics: string[];
    newMetrics: string[];
  };
}

export class TransitionPathwaysEngine {
  private pathways: Map<string, TransitionPathway>;

  constructor() {
    this.pathways = new Map();
    this.initializePathways();
  }

  /**
   * Initialize predefined transition pathways
   */
  private initializePathways(): void {
    // Coal to Renewable Energy Transition
    this.pathways.set('coal-to-renewable', {
      id: 'coal-to-renewable',
      name: 'Coal to Renewable Energy Transformation',
      fromIndustry: 'coal',
      toIndustry: 'renewable-energy',
      transitionType: 'transformation',
      complexity: 'very_high',
      timeframe: 'long_term',
      feasibilityScore: 75,
      phases: [
        {
          phase: 1,
          name: 'Strategic Assessment & Planning',
          duration: '6-12 months',
          objectives: [
            'Assess current assets and infrastructure',
            'Develop comprehensive transition strategy',
            'Secure stakeholder alignment and funding',
            'Establish governance structure'
          ],
          activities: [
            {
              id: 'asset-assessment',
              name: 'Comprehensive Asset Assessment',
              description: 'Evaluate existing coal assets for repurposing potential and decommissioning requirements',
              category: 'strategic',
              priority: 'critical',
              timeline: '3 months',
              owner: 'Strategy Team',
              prerequisites: ['Senior leadership commitment'],
              deliverables: ['Asset inventory', 'Repurposing feasibility study', 'Decommissioning plan']
            },
            {
              id: 'stakeholder-engagement',
              name: 'Stakeholder Engagement Program',
              description: 'Engage with communities, workers, and other stakeholders on just transition',
              category: 'strategic',
              priority: 'critical',
              timeline: '6 months',
              owner: 'Community Relations',
              prerequisites: ['Communication strategy'],
              deliverables: ['Stakeholder mapping', 'Engagement plan', 'Community agreements']
            }
          ],
          milestones: [
            {
              id: 'strategy-approval',
              name: 'Transition Strategy Approval',
              description: 'Board approval of comprehensive transition strategy',
              targetDate: 'Month 6',
              successCriteria: ['Board resolution passed', 'Funding secured', 'Timeline agreed'],
              gateCriteria: ['Financial viability confirmed', 'Stakeholder support achieved'],
              stakeholderSignoffs: ['Board of Directors', 'Major shareholders', 'Union representatives']
            }
          ],
          kpis: [
            { metric: 'Stakeholder engagement score', target: '>80%', measurement: 'Quarterly surveys' },
            { metric: 'Asset valuation accuracy', target: '±5%', measurement: 'External validation' }
          ],
          resources: {
            financial: '$10-20M for planning and assessments',
            human: '20-30 FTE across strategy, engineering, and stakeholder teams',
            technology: 'Asset management systems, modeling software',
            partnerships: ['Renewable energy developers', 'Engineering consultants', 'Community organizations']
          },
          risks: ['Stakeholder resistance', 'Regulatory delays', 'Market volatility'],
          dependencies: ['Regulatory framework clarity', 'Financing availability']
        },
        {
          phase: 2,
          name: 'Pilot Projects & Infrastructure Development',
          duration: '12-24 months',
          objectives: [
            'Develop pilot renewable projects',
            'Begin workforce transition programs',
            'Adapt existing infrastructure',
            'Establish new partnerships'
          ],
          activities: [
            {
              id: 'pilot-renewable',
              name: 'Pilot Renewable Projects',
              description: 'Develop small-scale renewable projects on existing sites',
              category: 'operational',
              priority: 'critical',
              timeline: '18 months',
              owner: 'Project Development',
              prerequisites: ['Site permits', 'Technology partners'],
              deliverables: ['Operational pilot projects', 'Performance data', 'Lessons learned']
            },
            {
              id: 'workforce-transition',
              name: 'Workforce Transition Program',
              description: 'Comprehensive retraining and transition support for workers',
              category: 'workforce',
              priority: 'high',
              timeline: '24 months',
              owner: 'Human Resources',
              prerequisites: ['Skills assessment', 'Training partnerships'],
              deliverables: ['Training curricula', 'Career pathways', 'Transition tracking']
            }
          ],
          milestones: [
            {
              id: 'first-renewable-operational',
              name: 'First Renewable Project Operational',
              description: 'Successful commissioning of first renewable energy project',
              targetDate: 'Month 18',
              successCriteria: ['Grid connection achieved', 'Performance targets met', 'Safety record clean'],
              gateCriteria: ['Regulatory approvals complete', 'Commercial agreements signed'],
              stakeholderSignoffs: ['Operations team', 'Regulatory authorities', 'Grid operator']
            }
          ],
          kpis: [
            { metric: 'Renewable capacity online', target: '10-50 MW', measurement: 'Monthly reporting' },
            { metric: 'Worker transition rate', target: '60%', measurement: 'Quarterly tracking' }
          ],
          resources: {
            financial: '$100-500M for pilot projects and training',
            human: '100-200 FTE for project development and workforce programs',
            technology: 'Renewable energy systems, grid integration technology',
            partnerships: ['Technology vendors', 'Training institutions', 'Grid operators']
          },
          risks: ['Technology performance', 'Grid integration challenges', 'Workforce resistance'],
          dependencies: ['Grid capacity availability', 'Technology vendor support']
        }
      ],
      prerequisites: [
        {
          category: 'financial',
          requirement: 'Access to $1-5B transition funding',
          criticality: 'essential',
          assessmentCriteria: ['Credit rating', 'Cash flow projections', 'Investor support']
        },
        {
          category: 'regulatory',
          requirement: 'Supportive policy framework for just transition',
          criticality: 'essential',
          assessmentCriteria: ['Government transition policies', 'Renewable energy incentives', 'Coal phase-out timeline']
        },
        {
          category: 'organizational',
          requirement: 'Strong leadership commitment to transformation',
          criticality: 'essential',
          assessmentCriteria: ['Board resolution', 'Executive team alignment', 'Public commitments']
        }
      ],
      risks: [
        {
          id: 'financing-risk',
          category: 'financial',
          description: 'Inability to secure sufficient transition funding',
          probability: 'medium',
          impact: 'high',
          phase: [1, 2],
          mitigationStrategies: [
            'Diversify funding sources',
            'Phase transition to spread costs',
            'Seek government support programs'
          ],
          earlyWarningIndicators: ['Credit rating downgrades', 'Investor sentiment decline', 'Cash flow pressures']
        },
        {
          id: 'community-resistance',
          category: 'reputational',
          description: 'Local community opposition to transition plans',
          probability: 'medium',
          impact: 'medium',
          phase: [1, 2, 3],
          mitigationStrategies: [
            'Comprehensive stakeholder engagement',
            'Just transition commitments',
            'Local benefit sharing'
          ],
          earlyWarningIndicators: ['Protest activities', 'Media criticism', 'Political opposition']
        }
      ],
      opportunities: [
        {
          id: 'carbon-credits',
          description: 'Generate revenue from carbon credits through early coal retirement',
          category: 'revenue',
          potentialValue: '$50-200M over 10 years',
          realization_timeframe: '2-5 years',
          requirements: ['Verified coal retirement', 'Carbon credit certification', 'Market access']
        },
        {
          id: 'grid-services',
          description: 'Provide grid stability services with battery storage systems',
          category: 'revenue',
          potentialValue: '$20-100M annually',
          realization_timeframe: '3-7 years',
          requirements: ['Battery storage deployment', 'Grid service agreements', 'Market participation rights']
        }
      ],
      successFactors: [
        'Strong leadership and governance',
        'Comprehensive stakeholder engagement',
        'Adequate financial resources',
        'Supportive regulatory environment',
        'Technology partnerships and expertise',
        'Workforce development programs',
        'Community benefit sharing',
        'Phased implementation approach'
      ],
      caseStudies: [
        {
          company: 'RWE (Germany)',
          fromIndustry: 'coal',
          toIndustry: 'renewable-energy',
          timeline: '2018-2030',
          approach: 'Phased transition with asset repurposing and workforce retraining',
          challenges: [
            'Large-scale workforce transition (20,000+ workers)',
            'Stranded asset management (€2B+ coal assets)',
            'Community economic impacts',
            'Grid stability during transition'
          ],
          solutions: [
            'Just transition framework with union partnerships',
            'Repurposing coal sites for renewable development',
            'Government support programs',
            'Strategic partnerships for technology and financing'
          ],
          outcomes: {
            financial: 'Maintained profitability during transition, secured €12B green financing',
            operational: '30GW renewable capacity target by 2030, successful coal phase-out',
            esg: 'Recognized ESG leader, improved stakeholder relations, reduced carbon intensity by 70%'
          },
          lessonsLearned: [
            'Early stakeholder engagement is critical',
            'Workforce transition requires sustained investment',
            'Site repurposing can capture significant value',
            'Government partnership accelerates transition',
            'Communication and transparency build trust'
          ]
        }
      ],
      esgConsiderations: {
        stakeholderImpacts: {
          workforce: [
            'Job displacement and retraining needs',
            'Career transition support',
            'Pension and benefit continuity',
            'Skills development opportunities'
          ],
          communities: [
            'Economic development alternatives',
            'Tax base impacts and mitigation',
            'Infrastructure adaptation needs',
            'Cultural and social considerations'
          ],
          customers: [
            'Energy supply continuity',
            'Price stability during transition',
            'Service quality maintenance',
            'Renewable energy access'
          ],
          suppliers: [
            'Supply chain restructuring',
            'Contract renegotiation needs',
            'New business opportunities',
            'Transition support requirements'
          ],
          investors: [
            'Return expectations management',
            'Risk profile changes',
            'Capital reallocation needs',
            'Long-term value creation'
          ]
        },
        environmentalImplications: [
          'Significant reduction in carbon emissions',
          'Land rehabilitation and restoration opportunities',
          'Biodiversity enhancement potential',
          'Waste and water management improvements',
          'Air quality benefits for communities'
        ],
        socialResponsibilities: [
          'Just transition principles implementation',
          'Worker protection and support',
          'Community economic development',
          'Health and safety improvements',
          'Energy access and affordability'
        ],
        governanceRequirements: [
          'Transition governance structure',
          'Stakeholder engagement processes',
          'Risk management frameworks',
          'Performance monitoring systems',
          'Transparency and reporting commitments'
        ],
        reportingChanges: {
          griStandardChanges: [
            'Transition from GRI 12 (Coal) to renewable energy reporting',
            'Enhanced disclosure on transition plans and progress',
            'Expanded stakeholder impact reporting'
          ],
          newDisclosures: [
            'Transition strategy and governance',
            'Just transition programs and outcomes',
            'Renewable energy development progress',
            'Workforce transition metrics'
          ],
          retiredMetrics: [
            'Coal production metrics',
            'Coal-specific safety indicators',
            'Coal reserves and resources'
          ],
          newMetrics: [
            'Renewable energy capacity',
            'Grid services revenue',
            'Carbon emissions avoided',
            'Worker transition success rates'
          ]
        }
      }
    });

    // Oil & Gas to Clean Technology Diversification
    this.pathways.set('oil-gas-to-clean-tech', {
      id: 'oil-gas-to-clean-tech',
      name: 'Oil & Gas to Clean Technology Diversification',
      fromIndustry: 'oil-gas',
      toIndustry: 'clean-technology',
      transitionType: 'diversification',
      complexity: 'high',
      timeframe: 'medium_term',
      feasibilityScore: 80,
      phases: [
        {
          phase: 1,
          name: 'Technology Assessment & Portfolio Development',
          duration: '12-18 months',
          objectives: [
            'Identify clean technology opportunities',
            'Assess technology readiness and market potential',
            'Develop investment strategy',
            'Build internal capabilities'
          ],
          activities: [
            {
              id: 'tech-scouting',
              name: 'Clean Technology Scouting',
              description: 'Systematic evaluation of clean technology opportunities aligned with core capabilities',
              category: 'strategic',
              priority: 'critical',
              timeline: '6 months',
              owner: 'Innovation Team',
              prerequisites: ['Investment criteria', 'Technology expertise'],
              deliverables: ['Technology portfolio', 'Investment recommendations', 'Partnership strategy']
            }
          ],
          milestones: [
            {
              id: 'investment-strategy',
              name: 'Clean Technology Investment Strategy Approved',
              description: 'Board approval of clean technology investment strategy and initial funding',
              targetDate: 'Month 12',
              successCriteria: ['Strategy approved', 'Initial funding allocated', 'Team established'],
              gateCriteria: ['Technology assessment complete', 'Market analysis validated'],
              stakeholderSignoffs: ['Board of Directors', 'Technology Committee']
            }
          ],
          kpis: [
            { metric: 'Technology opportunities identified', target: '20-50', measurement: 'Quarterly reviews' },
            { metric: 'Investment readiness score', target: '>80%', measurement: 'Expert assessment' }
          ],
          resources: {
            financial: '$50-200M for initial investments and capability building',
            human: '50-100 FTE for technology assessment and development',
            technology: 'Innovation platforms, pilot facilities, R&D capabilities',
            partnerships: ['Technology startups', 'Research institutions', 'Venture capital firms']
          },
          risks: ['Technology selection errors', 'Market timing risks', 'Capability gaps'],
          dependencies: ['Capital availability', 'Technology market maturity']
        }
      ],
      prerequisites: [
        {
          category: 'financial',
          requirement: 'Strong balance sheet with investment capacity',
          criticality: 'essential',
          assessmentCriteria: ['Free cash flow', 'Debt capacity', 'Investment grade rating']
        },
        {
          category: 'technical',
          requirement: 'Engineering and project management capabilities',
          criticality: 'important',
          assessmentCriteria: ['Technical workforce', 'Project track record', 'Innovation capabilities']
        }
      ],
      risks: [
        {
          id: 'technology-risk',
          category: 'technical',
          description: 'Technology investments may not achieve commercial viability',
          probability: 'medium',
          impact: 'medium',
          phase: [1, 2],
          mitigationStrategies: [
            'Diversified technology portfolio',
            'Stage-gate investment process',
            'External technology partnerships'
          ],
          earlyWarningIndicators: ['Technology performance gaps', 'Market adoption delays', 'Competitive developments']
        }
      ],
      opportunities: [
        {
          id: 'core-capability-leverage',
          description: 'Leverage existing engineering and project management capabilities',
          category: 'competitive_advantage',
          potentialValue: '30-50% cost advantage in project execution',
          realization_timeframe: '1-3 years',
          requirements: ['Capability mapping', 'Technology adaptation', 'Workforce development']
        }
      ],
      successFactors: [
        'Strategic focus on adjacent technologies',
        'Strong technical and project capabilities',
        'Patient capital and long-term perspective',
        'Innovation culture and risk tolerance',
        'Strategic partnerships and ecosystems',
        'Talent acquisition and development'
      ],
      caseStudies: [
        {
          company: 'Equinor (Norway)',
          fromIndustry: 'oil-gas',
          toIndustry: 'renewable-energy',
          timeline: '2017-2030',
          approach: 'Systematic diversification into offshore wind and other renewables',
          challenges: [
            'Technology adaptation from offshore oil to offshore wind',
            'Market competition from specialized renewable developers',
            'Capital allocation between traditional and new business',
            'Organizational change and culture shift'
          ],
          solutions: [
            'Leveraged offshore engineering expertise',
            'Strategic partnerships with technology leaders',
            'Dedicated renewable energy business unit',
            'Significant capital commitment (>$10B by 2026)'
          ],
          outcomes: {
            financial: 'Built leading offshore wind portfolio worth >$50B',
            operational: 'Became top-3 global offshore wind developer',
            esg: 'Achieved carbon neutrality goal acceleration, enhanced investor confidence'
          },
          lessonsLearned: [
            'Core capabilities can provide competitive advantage',
            'Early market entry captures value',
            'Partnership strategy accelerates learning',
            'Dedicated organization and resources essential',
            'Investor communication and expectations management critical'
          ]
        }
      ],
      esgConsiderations: {
        stakeholderImpacts: {
          workforce: [
            'Skills transfer and development opportunities',
            'New career pathways in clean technology',
            'Potential job growth in new business areas',
            'Change management and cultural adaptation'
          ],
          communities: [
            'Economic diversification benefits',
            'New industrial development opportunities',
            'Environmental improvement potential',
            'Technology innovation hubs'
          ],
          customers: [
            'Expanded clean energy solutions',
            'Integrated energy services',
            'Technology innovation benefits',
            'Sustainability partnership opportunities'
          ],
          suppliers: [
            'New business opportunities in clean technology',
            'Supply chain evolution and adaptation',
            'Innovation collaboration potential',
            'Long-term partnership development'
          ],
          investors: [
            'Portfolio diversification and risk reduction',
            'Growth opportunities in expanding markets',
            'ESG performance improvement',
            'Long-term value creation potential'
          ]
        },
        environmentalImplications: [
          'Reduced carbon intensity through clean technology',
          'Innovation in environmental solutions',
          'Circular economy opportunities',
          'Resource efficiency improvements'
        ],
        socialResponsibilities: [
          'Just transition for traditional workforce',
          'Community economic development',
          'Technology access and affordability',
          'Skills development and education'
        ],
        governanceRequirements: [
          'Innovation governance frameworks',
          'Technology investment oversight',
          'Risk management for new business areas',
          'Performance measurement systems'
        ],
        reportingChanges: {
          griStandardChanges: [
            'Expanded technology and innovation reporting',
            'Portfolio-based emissions reporting',
            'Enhanced future-forward disclosures'
          ],
          newDisclosures: [
            'Clean technology investment strategy',
            'Innovation pipeline and outcomes',
            'Technology transfer and development',
            'Partnership and ecosystem development'
          ],
          retiredMetrics: [
            'Traditional oil & gas focused metrics may be de-emphasized'
          ],
          newMetrics: [
            'Clean technology revenue share',
            'Innovation investment ratio',
            'Technology commercialization success rate',
            'Portfolio carbon intensity'
          ]
        }
      }
    });
  }

  /**
   * Get available transition pathways for an industry
   */
  getAvailablePathways(fromIndustry: string): TransitionPathway[] {
    return Array.from(this.pathways.values())
      .filter(pathway => pathway.fromIndustry === fromIndustry)
      .sort((a, b) => b.feasibilityScore - a.feasibilityScore);
  }

  /**
   * Get specific transition pathway
   */
  getPathway(pathwayId: string): TransitionPathway | undefined {
    return this.pathways.get(pathwayId);
  }

  /**
   * Assess organization readiness for transition
   */
  assessTransitionReadiness(
    pathwayId: string,
    organizationData: Record<string, any>
  ): {
    overallReadiness: number;
    prerequisiteAssessment: Array<{
      prerequisite: TransitionPrerequisite;
      status: 'met' | 'partially_met' | 'not_met';
      score: number;
      recommendations: string[];
    }>;
    readinessGaps: string[];
    nextSteps: string[];
  } {
    const pathway = this.pathways.get(pathwayId);
    if (!pathway) {
      throw new Error(`Pathway ${pathwayId} not found`);
    }

    const prerequisiteAssessment = pathway.prerequisites.map(prereq => {
      // Simplified assessment logic - in production, this would be more sophisticated
      let score = 0;
      let status: 'met' | 'partially_met' | 'not_met' = 'not_met';
      const recommendations: string[] = [];

      switch (prereq.category) {
        case 'financial':
          if (organizationData.revenue > 1000000000) score += 40; // >$1B revenue
          if (organizationData.debtToEquity < 0.5) score += 30; // Strong balance sheet
          if (organizationData.creditRating === 'investment_grade') score += 30;
          break;
        case 'organizational':
          if (organizationData.leadershipCommitment) score += 50;
          if (organizationData.changeManagementCapability) score += 30;
          if (organizationData.stakeholderSupport) score += 20;
          break;
        case 'technical':
          if (organizationData.engineeringCapabilities) score += 40;
          if (organizationData.projectManagementTrack) score += 30;
          if (organizationData.innovationCulture) score += 30;
          break;
        case 'regulatory':
          if (organizationData.regulatoryRelationships) score += 50;
          if (organizationData.complianceRecord) score += 30;
          if (organizationData.policyAlignment) score += 20;
          break;
        case 'market':
          if (organizationData.marketPosition === 'leader') score += 50;
          if (organizationData.customerRelationships) score += 30;
          if (organizationData.brandStrength) score += 20;
          break;
      }

      if (score >= 80) status = 'met';
      else if (score >= 50) status = 'partially_met';
      else status = 'not_met';

      if (status !== 'met') {
        recommendations.push(`Strengthen ${prereq.category} capabilities to meet transition requirements`);
      }

      return {
        prerequisite: prereq,
        status,
        score,
        recommendations
      };
    });

    const overallReadiness = prerequisiteAssessment.reduce((sum, assessment) => sum + assessment.score, 0) / prerequisiteAssessment.length;

    const readinessGaps = prerequisiteAssessment
      .filter(assessment => assessment.status !== 'met')
      .map(assessment => assessment.prerequisite.requirement);

    const nextSteps = [
      'Conduct detailed transition feasibility study',
      'Develop comprehensive transition strategy',
      'Secure stakeholder alignment and support',
      'Establish transition governance structure',
      'Begin capability development programs'
    ];

    return {
      overallReadiness,
      prerequisiteAssessment,
      readinessGaps,
      nextSteps
    };
  }

  /**
   * Generate transition recommendations
   */
  generateTransitionRecommendations(
    pathwayId: string,
    organizationData: Record<string, any>
  ): IndustryRecommendation[] {
    const pathway = this.pathways.get(pathwayId);
    if (!pathway) return [];

    const readiness = this.assessTransitionReadiness(pathwayId, organizationData);
    const recommendations: IndustryRecommendation[] = [];

    // Generate recommendations based on readiness gaps
    if (readiness.overallReadiness < 70) {
      recommendations.push({
        type: 'strategic',
        priority: 'critical',
        title: 'Strengthen Transition Readiness',
        description: 'Address key capability gaps before proceeding with full transition',
        impact: 'Reduces transition risks and improves success probability',
        effort: 'medium',
        griAlignment: [],
        estimatedTimeline: '6-12 months'
      });
    }

    // Add pathway-specific recommendations
    recommendations.push({
      type: 'strategic',
      priority: 'high',
      title: `Initiate ${pathway.name}`,
      description: pathway.phases[0].objectives.join('; '),
      impact: pathway.opportunities.map(o => o.description).join('; '),
      effort: pathway.complexity === 'very_high' ? 'high' : 'medium',
      griAlignment: [],
      estimatedTimeline: pathway.phases[0].duration
    });

    return recommendations;
  }

  /**
   * Get transition success factors
   */
  getTransitionSuccessFactors(pathwayId: string): string[] {
    const pathway = this.pathways.get(pathwayId);
    return pathway?.successFactors || [];
  }

  /**
   * Get transition case studies
   */
  getTransitionCaseStudies(pathwayId: string): TransitionCaseStudy[] {
    const pathway = this.pathways.get(pathwayId);
    return pathway?.caseStudies || [];
  }
}