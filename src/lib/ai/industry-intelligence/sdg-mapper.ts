/**
 * SDG Mapper - Maps organization activities to UN Sustainable Development Goals
 * Provides comprehensive SDG alignment analysis and impact measurement
 */

export interface SDGTarget {
  id: string;
  description: string;
  indicators: string[];
  measurementUnit?: string;
}

export interface SDGGoal {
  number: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  targets: SDGTarget[];
  businessRelevance: string[];
  industryPriority: Record<string, 'high' | 'medium' | 'low'>;
}

export interface SDGMapping {
  primarySDGs: number[];
  secondarySDGs: number[];
  targets: SDGTarget[];
  impactAreas: SDGImpactArea[];
  alignmentScore: number;
  recommendations: string[];
}

export interface SDGImpactArea {
  sdgNumber: number;
  impactType: 'positive' | 'negative' | 'neutral';
  magnitude: 'high' | 'medium' | 'low';
  description: string;
  metrics: string[];
  currentPerformance?: number;
  target?: number;
}

export interface SDGReport {
  overallAlignment: number;
  contributingSDGs: number[];
  riskSDGs: number[];
  opportunitySDGs: number[];
  priorityActions: SDGAction[];
  industryBenchmark: SDGBenchmark;
}

export interface SDGAction {
  sdg: number;
  target: string;
  action: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  timeline: string;
  businessCase: string;
}

export interface SDGBenchmark {
  industryAverage: number;
  topPerformers: number;
  yourScore: number;
  percentile: number;
}

export class SDGMapper {
  private sdgGoals: Map<number, SDGGoal>;
  private industrySDGPriorities: Map<string, number[]>;

  constructor() {
    this.sdgGoals = new Map();
    this.industrySDGPriorities = new Map();
    this.initializeSDGs();
    this.initializeIndustryPriorities();
  }

  private initializeSDGs(): void {
    // SDG 1: No Poverty
    this.sdgGoals.set(1, {
      number: 1,
      title: 'No Poverty',
      description: 'End poverty in all its forms everywhere',
      icon: '🎯',
      color: '#E5243B',
      targets: [
        {
          id: '1.1',
          description: 'Eradicate extreme poverty for all people everywhere',
          indicators: ['Proportion of population below poverty line', 'Living wage ratio']
        },
        {
          id: '1.4',
          description: 'Ensure equal rights to economic resources',
          indicators: ['Access to basic services', 'Financial inclusion metrics']
        }
      ],
      businessRelevance: ['Living wages', 'Supply chain practices', 'Local employment'],
      industryPriority: {
        'Manufacturing': 'high',
        'Agriculture': 'high',
        'Technology': 'medium',
        'Financial Services': 'high'
      }
    });

    // SDG 2: Zero Hunger
    this.sdgGoals.set(2, {
      number: 2,
      title: 'Zero Hunger',
      description: 'End hunger, achieve food security and improved nutrition',
      icon: '🌾',
      color: '#DDA63A',
      targets: [
        {
          id: '2.1',
          description: 'End hunger and ensure access to safe, nutritious food',
          indicators: ['Food waste reduction', 'Nutrition programs']
        },
        {
          id: '2.4',
          description: 'Ensure sustainable food production systems',
          indicators: ['Sustainable agriculture practices', 'Yield improvements']
        }
      ],
      businessRelevance: ['Food waste reduction', 'Sustainable agriculture', 'Nutrition initiatives'],
      industryPriority: {
        'Agriculture': 'high',
        'Food & Beverage': 'high',
        'Retail': 'medium',
        'Hospitality': 'medium'
      }
    });

    // SDG 3: Good Health and Well-being
    this.sdgGoals.set(3, {
      number: 3,
      title: 'Good Health and Well-being',
      description: 'Ensure healthy lives and promote well-being for all',
      icon: '❤️',
      color: '#4C9F38',
      targets: [
        {
          id: '3.4',
          description: 'Reduce premature mortality from non-communicable diseases',
          indicators: ['Employee health programs', 'Safety incidents', 'Mental health support']
        },
        {
          id: '3.9',
          description: 'Reduce deaths from hazardous chemicals and pollution',
          indicators: ['Air quality impact', 'Chemical safety measures']
        }
      ],
      businessRelevance: ['Occupational health & safety', 'Product safety', 'Healthcare access'],
      industryPriority: {
        'Healthcare': 'high',
        'Pharmaceuticals': 'high',
        'Manufacturing': 'high',
        'Mining': 'high'
      }
    });

    // SDG 4: Quality Education
    this.sdgGoals.set(4, {
      number: 4,
      title: 'Quality Education',
      description: 'Ensure inclusive and equitable quality education',
      icon: '📚',
      color: '#C5192D',
      targets: [
        {
          id: '4.3',
          description: 'Ensure equal access to affordable technical and vocational training',
          indicators: ['Training hours per employee', 'Skill development programs']
        },
        {
          id: '4.4',
          description: 'Increase number of people with relevant skills',
          indicators: ['Digital literacy programs', 'STEM education support']
        }
      ],
      businessRelevance: ['Employee training', 'Skills development', 'Education partnerships'],
      industryPriority: {
        'Technology': 'high',
        'Education': 'high',
        'Professional Services': 'high',
        'All Industries': 'medium'
      }
    });

    // SDG 5: Gender Equality
    this.sdgGoals.set(5, {
      number: 5,
      title: 'Gender Equality',
      description: 'Achieve gender equality and empower all women and girls',
      icon: '⚖️',
      color: '#FF3A21',
      targets: [
        {
          id: '5.1',
          description: 'End discrimination against women and girls',
          indicators: ['Gender pay gap', 'Women in workforce']
        },
        {
          id: '5.5',
          description: 'Ensure women\'s participation in leadership',
          indicators: ['Women in leadership positions', 'Board diversity']
        }
      ],
      businessRelevance: ['Pay equity', 'Women in leadership', 'Inclusive policies'],
      industryPriority: {
        'All Industries': 'high'
      }
    });

    // SDG 6: Clean Water and Sanitation
    this.sdgGoals.set(6, {
      number: 6,
      title: 'Clean Water and Sanitation',
      description: 'Ensure availability and sustainable management of water',
      icon: '💧',
      color: '#26BDE2',
      targets: [
        {
          id: '6.3',
          description: 'Improve water quality by reducing pollution',
          indicators: ['Water consumption', 'Wastewater treatment', 'Water quality']
        },
        {
          id: '6.4',
          description: 'Increase water-use efficiency',
          indicators: ['Water intensity', 'Water recycling rate']
        }
      ],
      businessRelevance: ['Water efficiency', 'Water quality', 'WASH access'],
      industryPriority: {
        'Manufacturing': 'high',
        'Agriculture': 'high',
        'Mining': 'high',
        'Utilities': 'high'
      }
    });

    // SDG 7: Affordable and Clean Energy
    this.sdgGoals.set(7, {
      number: 7,
      title: 'Affordable and Clean Energy',
      description: 'Ensure access to affordable, reliable, sustainable energy',
      icon: '⚡',
      color: '#FCC30B',
      targets: [
        {
          id: '7.2',
          description: 'Increase share of renewable energy',
          indicators: ['Renewable energy percentage', 'Clean energy investments']
        },
        {
          id: '7.3',
          description: 'Double the rate of energy efficiency improvement',
          indicators: ['Energy intensity', 'Energy efficiency improvements']
        }
      ],
      businessRelevance: ['Renewable energy use', 'Energy efficiency', 'Clean tech investment'],
      industryPriority: {
        'Energy': 'high',
        'Manufacturing': 'high',
        'Real Estate': 'high',
        'All Industries': 'medium'
      }
    });

    // SDG 8: Decent Work and Economic Growth
    this.sdgGoals.set(8, {
      number: 8,
      title: 'Decent Work and Economic Growth',
      description: 'Promote sustained, inclusive economic growth and decent work',
      icon: '📈',
      color: '#A21942',
      targets: [
        {
          id: '8.5',
          description: 'Achieve full employment and decent work for all',
          indicators: ['Employment rate', 'Living wages', 'Job quality']
        },
        {
          id: '8.7',
          description: 'Eradicate forced labor and child labor',
          indicators: ['Supply chain audits', 'Labor compliance']
        },
        {
          id: '8.8',
          description: 'Protect labor rights and promote safe working environments',
          indicators: ['Safety incidents', 'Workers\' rights compliance']
        }
      ],
      businessRelevance: ['Job creation', 'Fair wages', 'Worker safety', 'Economic contribution'],
      industryPriority: {
        'All Industries': 'high'
      }
    });

    // SDG 9: Industry, Innovation and Infrastructure
    this.sdgGoals.set(9, {
      number: 9,
      title: 'Industry, Innovation and Infrastructure',
      description: 'Build resilient infrastructure and foster innovation',
      icon: '🏗️',
      color: '#FD6925',
      targets: [
        {
          id: '9.4',
          description: 'Upgrade infrastructure and retrofit industries for sustainability',
          indicators: ['R&D investment', 'Infrastructure upgrades', 'Clean technology adoption']
        },
        {
          id: '9.5',
          description: 'Enhance scientific research and upgrade technological capabilities',
          indicators: ['Innovation metrics', 'Patent applications', 'R&D spending']
        }
      ],
      businessRelevance: ['Innovation', 'Infrastructure investment', 'Digital transformation'],
      industryPriority: {
        'Technology': 'high',
        'Manufacturing': 'high',
        'Construction': 'high',
        'Telecommunications': 'high'
      }
    });

    // SDG 10: Reduced Inequalities
    this.sdgGoals.set(10, {
      number: 10,
      title: 'Reduced Inequalities',
      description: 'Reduce inequality within and among countries',
      icon: '🤝',
      color: '#DD1367',
      targets: [
        {
          id: '10.2',
          description: 'Empower and promote social, economic inclusion',
          indicators: ['Diversity metrics', 'Inclusion programs', 'Pay equity']
        },
        {
          id: '10.3',
          description: 'Ensure equal opportunity and reduce inequalities',
          indicators: ['Non-discrimination policies', 'Accessibility measures']
        }
      ],
      businessRelevance: ['Diversity & inclusion', 'Fair wages', 'Accessibility'],
      industryPriority: {
        'All Industries': 'high'
      }
    });

    // SDG 11: Sustainable Cities and Communities
    this.sdgGoals.set(11, {
      number: 11,
      title: 'Sustainable Cities and Communities',
      description: 'Make cities inclusive, safe, resilient and sustainable',
      icon: '🏙️',
      color: '#FD9D24',
      targets: [
        {
          id: '11.2',
          description: 'Provide access to safe, affordable transport systems',
          indicators: ['Sustainable transport options', 'Urban mobility solutions']
        },
        {
          id: '11.6',
          description: 'Reduce environmental impact of cities',
          indicators: ['Urban air quality impact', 'Waste management']
        }
      ],
      businessRelevance: ['Urban development', 'Smart cities', 'Community investment'],
      industryPriority: {
        'Real Estate': 'high',
        'Construction': 'high',
        'Transportation': 'high',
        'Utilities': 'high'
      }
    });

    // SDG 12: Responsible Consumption and Production
    this.sdgGoals.set(12, {
      number: 12,
      title: 'Responsible Consumption and Production',
      description: 'Ensure sustainable consumption and production patterns',
      icon: '♻️',
      color: '#BF8B2E',
      targets: [
        {
          id: '12.2',
          description: 'Achieve sustainable management of natural resources',
          indicators: ['Resource efficiency', 'Material footprint']
        },
        {
          id: '12.3',
          description: 'Halve per capita global food waste',
          indicators: ['Food waste reduction', 'Loss prevention']
        },
        {
          id: '12.4',
          description: 'Achieve environmentally sound management of chemicals',
          indicators: ['Chemical management', 'Hazardous waste reduction']
        },
        {
          id: '12.5',
          description: 'Substantially reduce waste generation',
          indicators: ['Waste reduction', 'Recycling rate', 'Circular economy practices']
        }
      ],
      businessRelevance: ['Circular economy', 'Waste reduction', 'Sustainable products'],
      industryPriority: {
        'Manufacturing': 'high',
        'Retail': 'high',
        'Consumer Goods': 'high',
        'All Industries': 'medium'
      }
    });

    // SDG 13: Climate Action
    this.sdgGoals.set(13, {
      number: 13,
      title: 'Climate Action',
      description: 'Take urgent action to combat climate change',
      icon: '🌍',
      color: '#3F7E44',
      targets: [
        {
          id: '13.1',
          description: 'Strengthen resilience to climate-related hazards',
          indicators: ['Climate risk assessment', 'Adaptation measures']
        },
        {
          id: '13.2',
          description: 'Integrate climate change measures into policies',
          indicators: ['GHG emissions reduction', 'Science-based targets']
        },
        {
          id: '13.3',
          description: 'Improve education on climate change mitigation',
          indicators: ['Climate education programs', 'Awareness initiatives']
        }
      ],
      businessRelevance: ['Carbon neutrality', 'Climate resilience', 'Emissions reduction'],
      industryPriority: {
        'All Industries': 'high'
      }
    });

    // SDG 14: Life Below Water
    this.sdgGoals.set(14, {
      number: 14,
      title: 'Life Below Water',
      description: 'Conserve and sustainably use oceans and marine resources',
      icon: '🐟',
      color: '#0A97D9',
      targets: [
        {
          id: '14.1',
          description: 'Prevent and reduce marine pollution',
          indicators: ['Ocean plastic reduction', 'Marine pollution prevention']
        },
        {
          id: '14.2',
          description: 'Sustainably manage and protect marine ecosystems',
          indicators: ['Sustainable fishing', 'Marine conservation']
        }
      ],
      businessRelevance: ['Ocean conservation', 'Sustainable fishing', 'Plastic reduction'],
      industryPriority: {
        'Shipping': 'high',
        'Fishing': 'high',
        'Tourism': 'medium',
        'Consumer Goods': 'medium'
      }
    });

    // SDG 15: Life on Land
    this.sdgGoals.set(15, {
      number: 15,
      title: 'Life on Land',
      description: 'Protect and restore terrestrial ecosystems',
      icon: '🌳',
      color: '#56C02B',
      targets: [
        {
          id: '15.1',
          description: 'Ensure conservation of terrestrial ecosystems',
          indicators: ['Forest conservation', 'Biodiversity protection']
        },
        {
          id: '15.2',
          description: 'Promote sustainable forest management',
          indicators: ['Sustainable forestry', 'Deforestation prevention']
        },
        {
          id: '15.5',
          description: 'Reduce degradation of natural habitats',
          indicators: ['Habitat protection', 'Species conservation']
        }
      ],
      businessRelevance: ['Biodiversity', 'Sustainable land use', 'Forest conservation'],
      industryPriority: {
        'Agriculture': 'high',
        'Forestry': 'high',
        'Mining': 'high',
        'Real Estate': 'medium'
      }
    });

    // SDG 16: Peace, Justice and Strong Institutions
    this.sdgGoals.set(16, {
      number: 16,
      title: 'Peace, Justice and Strong Institutions',
      description: 'Promote peaceful societies and strong institutions',
      icon: '⚖️',
      color: '#00689D',
      targets: [
        {
          id: '16.5',
          description: 'Reduce corruption and bribery',
          indicators: ['Anti-corruption policies', 'Transparency measures']
        },
        {
          id: '16.6',
          description: 'Develop effective, accountable institutions',
          indicators: ['Governance practices', 'Stakeholder engagement']
        },
        {
          id: '16.7',
          description: 'Ensure responsive, inclusive decision-making',
          indicators: ['Stakeholder participation', 'Grievance mechanisms']
        }
      ],
      businessRelevance: ['Business ethics', 'Anti-corruption', 'Governance'],
      industryPriority: {
        'All Industries': 'high'
      }
    });

    // SDG 17: Partnerships for the Goals
    this.sdgGoals.set(17, {
      number: 17,
      title: 'Partnerships for the Goals',
      description: 'Strengthen global partnerships for sustainable development',
      icon: '🤝',
      color: '#19486A',
      targets: [
        {
          id: '17.16',
          description: 'Enhance global partnership for sustainable development',
          indicators: ['Multi-stakeholder partnerships', 'Collaboration initiatives']
        },
        {
          id: '17.17',
          description: 'Encourage effective partnerships',
          indicators: ['Public-private partnerships', 'Cross-sector collaboration']
        }
      ],
      businessRelevance: ['Partnerships', 'Collaboration', 'Knowledge sharing'],
      industryPriority: {
        'All Industries': 'medium'
      }
    });
  }

  private initializeIndustryPriorities(): void {
    // Oil & Gas
    this.industrySDGPriorities.set('Oil & Gas', [7, 13, 9, 8, 12, 6, 3, 14, 15]);

    // Manufacturing
    this.industrySDGPriorities.set('Manufacturing', [9, 12, 8, 13, 6, 7, 3, 5, 1]);

    // Technology
    this.industrySDGPriorities.set('Technology', [9, 4, 8, 13, 5, 10, 12, 7]);

    // Financial Services
    this.industrySDGPriorities.set('Financial Services', [8, 1, 10, 5, 13, 9, 16, 17]);

    // Agriculture
    this.industrySDGPriorities.set('Agriculture', [2, 15, 6, 12, 13, 1, 8, 5]);

    // Healthcare
    this.industrySDGPriorities.set('Healthcare', [3, 5, 10, 9, 8, 4, 6, 13]);

    // Retail
    this.industrySDGPriorities.set('Retail', [12, 8, 5, 13, 10, 1, 2, 11]);

    // Real Estate
    this.industrySDGPriorities.set('Real Estate', [11, 7, 13, 9, 6, 12, 8, 15]);

    // Transportation
    this.industrySDGPriorities.set('Transportation', [11, 13, 9, 7, 8, 3, 12]);
  }

  /**
   * Map organization activities to SDGs
   */
  mapToSDGs(
    industry: string,
    activities: string[],
    impacts: Record<string, any>
  ): SDGMapping {
    const prioritySDGs = this.industrySDGPriorities.get(industry) || [8, 12, 13];

    // Analyze activities to determine SDG alignment
    const relevantSDGs = new Set<number>();
    const impactAreas: SDGImpactArea[] = [];

    // Check each activity against SDG targets
    for (const activity of activities) {
      const activityLower = activity.toLowerCase();

      // Energy & Climate
      if (activityLower.includes('energy') || activityLower.includes('renewable')) {
        relevantSDGs.add(7);
        relevantSDGs.add(13);
      }

      // Water
      if (activityLower.includes('water')) {
        relevantSDGs.add(6);
      }

      // Waste & Circular Economy
      if (activityLower.includes('waste') || activityLower.includes('recycl')) {
        relevantSDGs.add(12);
      }

      // Employment & Labor
      if (activityLower.includes('employ') || activityLower.includes('worker')) {
        relevantSDGs.add(8);
        relevantSDGs.add(5);
        relevantSDGs.add(10);
      }

      // Innovation
      if (activityLower.includes('innovation') || activityLower.includes('research')) {
        relevantSDGs.add(9);
      }

      // Health & Safety
      if (activityLower.includes('health') || activityLower.includes('safety')) {
        relevantSDGs.add(3);
      }

      // Education & Training
      if (activityLower.includes('training') || activityLower.includes('education')) {
        relevantSDGs.add(4);
      }
    }

    // Add industry priority SDGs
    prioritySDGs.slice(0, 3).forEach(sdg => relevantSDGs.add(sdg));

    // Create impact areas for each relevant SDG
    for (const sdgNumber of relevantSDGs) {
      const sdg = this.sdgGoals.get(sdgNumber);
      if (sdg) {
        impactAreas.push({
          sdgNumber,
          impactType: 'positive',
          magnitude: prioritySDGs.includes(sdgNumber) ? 'high' : 'medium',
          description: `Contributing to ${sdg.title}`,
          metrics: sdg.targets.slice(0, 2).flatMap(t => t.indicators),
          currentPerformance: Math.random() * 50 + 30,
          target: 80
        });
      }
    }

    const primarySDGs = prioritySDGs.slice(0, 5).filter(sdg => relevantSDGs.has(sdg));
    const secondarySDGs = Array.from(relevantSDGs).filter(sdg => !primarySDGs.includes(sdg));

    return {
      primarySDGs,
      secondarySDGs,
      targets: this.getRelevantTargets(primarySDGs),
      impactAreas,
      alignmentScore: this.calculateAlignmentScore(primarySDGs, impactAreas),
      recommendations: this.generateSDGRecommendations(industry, primarySDGs, impactAreas)
    };
  }

  /**
   * Generate comprehensive SDG report
   */
  generateSDGReport(
    mapping: SDGMapping,
    industry: string,
    performanceData?: Record<string, number>
  ): SDGReport {
    const contributingSDGs = mapping.primarySDGs;
    const riskSDGs = this.identifyRiskSDGs(mapping, industry);
    const opportunitySDGs = this.identifyOpportunitySDGs(mapping, industry);

    return {
      overallAlignment: mapping.alignmentScore,
      contributingSDGs,
      riskSDGs,
      opportunitySDGs,
      priorityActions: this.generatePriorityActions(mapping, industry),
      industryBenchmark: this.calculateIndustryBenchmark(mapping, industry)
    };
  }

  /**
   * Get relevant SDG targets for selected goals
   */
  private getRelevantTargets(sdgNumbers: number[]): SDGTarget[] {
    const targets: SDGTarget[] = [];

    for (const num of sdgNumbers) {
      const sdg = this.sdgGoals.get(num);
      if (sdg) {
        targets.push(...sdg.targets.slice(0, 2));
      }
    }

    return targets;
  }

  /**
   * Calculate SDG alignment score
   */
  private calculateAlignmentScore(
    primarySDGs: number[],
    impactAreas: SDGImpactArea[]
  ): number {
    let score = 0;

    // Base score from number of SDGs addressed
    score += Math.min(primarySDGs.length * 10, 50);

    // Impact magnitude scoring
    const highImpact = impactAreas.filter(i => i.magnitude === 'high').length;
    const mediumImpact = impactAreas.filter(i => i.magnitude === 'medium').length;
    score += highImpact * 10 + mediumImpact * 5;

    // Performance scoring
    const avgPerformance = impactAreas.reduce((sum, i) =>
      sum + (i.currentPerformance || 0), 0) / impactAreas.length;
    score += avgPerformance * 0.3;

    return Math.min(Math.round(score), 100);
  }

  /**
   * Generate SDG recommendations
   */
  private generateSDGRecommendations(
    industry: string,
    primarySDGs: number[],
    impactAreas: SDGImpactArea[]
  ): string[] {
    const recommendations: string[] = [];
    const prioritySDGs = this.industrySDGPriorities.get(industry) || [];

    // Check for missing priority SDGs
    const missingPriority = prioritySDGs.slice(0, 5).filter(sdg => !primarySDGs.includes(sdg));

    for (const sdgNum of missingPriority.slice(0, 2)) {
      const sdg = this.sdgGoals.get(sdgNum);
      if (sdg) {
        recommendations.push(`Consider initiatives addressing SDG ${sdgNum}: ${sdg.title}`);
      }
    }

    // Performance improvements
    const lowPerformance = impactAreas.filter(i => (i.currentPerformance || 0) < 50);
    for (const area of lowPerformance.slice(0, 2)) {
      const sdg = this.sdgGoals.get(area.sdgNumber);
      if (sdg) {
        recommendations.push(`Improve performance on ${sdg.title} metrics`);
      }
    }

    // Industry-specific recommendations
    if (industry === 'Manufacturing') {
      recommendations.push('Implement circular economy principles (SDG 12)');
      recommendations.push('Invest in clean technology and innovation (SDG 9)');
    } else if (industry === 'Financial Services') {
      recommendations.push('Expand financial inclusion initiatives (SDG 1, 10)');
      recommendations.push('Integrate ESG criteria in investment decisions (SDG 13)');
    }

    return recommendations.slice(0, 5);
  }

  /**
   * Identify SDGs at risk
   */
  private identifyRiskSDGs(mapping: SDGMapping, industry: string): number[] {
    const riskSDGs: number[] = [];

    // Industry-specific risks
    if (industry === 'Oil & Gas' || industry === 'Mining') {
      riskSDGs.push(13, 14, 15); // Climate, oceans, land
    }
    if (industry === 'Manufacturing') {
      riskSDGs.push(12, 6, 3); // Consumption, water, health
    }
    if (industry === 'Agriculture') {
      riskSDGs.push(15, 6, 2); // Land, water, hunger
    }

    // Low performance areas
    const lowPerformance = mapping.impactAreas
      .filter(i => (i.currentPerformance || 0) < 30)
      .map(i => i.sdgNumber);

    return [...new Set([...riskSDGs, ...lowPerformance])].slice(0, 5);
  }

  /**
   * Identify SDG opportunities
   */
  private identifyOpportunitySDGs(mapping: SDGMapping, industry: string): number[] {
    const opportunitySDGs: number[] = [];
    const prioritySDGs = this.industrySDGPriorities.get(industry) || [];

    // Industry priorities not yet addressed
    const unaddressed = prioritySDGs.filter(sdg =>
      !mapping.primarySDGs.includes(sdg) && !mapping.secondarySDGs.includes(sdg)
    );

    opportunitySDGs.push(...unaddressed.slice(0, 3));

    // Universal opportunities
    if (!mapping.primarySDGs.includes(5)) opportunitySDGs.push(5); // Gender equality
    if (!mapping.primarySDGs.includes(13)) opportunitySDGs.push(13); // Climate action
    if (!mapping.primarySDGs.includes(8)) opportunitySDGs.push(8); // Decent work

    return [...new Set(opportunitySDGs)].slice(0, 5);
  }

  /**
   * Generate priority actions
   */
  private generatePriorityActions(mapping: SDGMapping, industry: string): SDGAction[] {
    const actions: SDGAction[] = [];

    // High-impact actions for primary SDGs
    for (const sdgNum of mapping.primarySDGs.slice(0, 3)) {
      const sdg = this.sdgGoals.get(sdgNum);
      if (sdg) {
        actions.push({
          sdg: sdgNum,
          target: sdg.targets[0].id,
          action: `Implement ${sdg.businessRelevance[0]}`,
          impact: 'high',
          effort: 'medium',
          timeline: '6-12 months',
          businessCase: `Directly contributes to ${sdg.title} while enhancing ${industry} leadership`
        });
      }
    }

    // Quick wins
    if (!mapping.primarySDGs.includes(5)) {
      actions.push({
        sdg: 5,
        target: '5.5',
        action: 'Establish gender diversity targets for leadership',
        impact: 'medium',
        effort: 'low',
        timeline: '3-6 months',
        businessCase: 'Improve talent attraction and decision-making diversity'
      });
    }

    // Climate action (always relevant)
    if (!mapping.primarySDGs.includes(13)) {
      actions.push({
        sdg: 13,
        target: '13.2',
        action: 'Set science-based emissions reduction targets',
        impact: 'high',
        effort: 'medium',
        timeline: '3-6 months',
        businessCase: 'Meet investor expectations and regulatory requirements'
      });
    }

    return actions.slice(0, 5);
  }

  /**
   * Calculate industry benchmark
   */
  private calculateIndustryBenchmark(mapping: SDGMapping, industry: string): SDGBenchmark {
    // Simulated benchmark data (in production, would come from database)
    const industryAverage = 55 + Math.random() * 10;
    const topPerformers = 80 + Math.random() * 10;
    const yourScore = mapping.alignmentScore;

    const percentile = yourScore > industryAverage
      ? 50 + ((yourScore - industryAverage) / (topPerformers - industryAverage)) * 50
      : (yourScore / industryAverage) * 50;

    return {
      industryAverage: Math.round(industryAverage),
      topPerformers: Math.round(topPerformers),
      yourScore,
      percentile: Math.round(percentile)
    };
  }

  /**
   * Get all SDG goals
   */
  getAllSDGs(): SDGGoal[] {
    return Array.from(this.sdgGoals.values());
  }

  /**
   * Get specific SDG details
   */
  getSDGDetails(sdgNumber: number): SDGGoal | undefined {
    return this.sdgGoals.get(sdgNumber);
  }

  /**
   * Get industry priority SDGs
   */
  getIndustryPrioritySDGs(industry: string): number[] {
    return this.industrySDGPriorities.get(industry) || [8, 12, 13];
  }
}

export const sdgMapper = new SDGMapper();