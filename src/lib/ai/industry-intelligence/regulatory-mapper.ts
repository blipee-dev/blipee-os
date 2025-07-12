/**
 * Regulatory Mapper
 * Maps industry-specific regulations by jurisdiction and provides compliance guidance
 */

import {
  RegulatoryRequirement,
  IndustryClassification,
  GRISectorStandard
} from './types';

interface RegulationMapping {
  regulation: RegulatoryRequirement;
  applicableIndustries: string[];
  griAlignment: string[];
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  implementationComplexity: 'low' | 'medium' | 'high';
}

interface ComplianceGap {
  regulation: RegulatoryRequirement;
  currentStatus: 'compliant' | 'partial' | 'non-compliant' | 'unknown';
  gaps: string[];
  recommendations: string[];
  estimatedCost?: number;
  estimatedTimeline?: string;
}

interface ComplianceAssessment {
  organizationId: string;
  jurisdiction: string;
  industry: string;
  overallCompliance: number; // 0-100%
  complianceGaps: ComplianceGap[];
  upcomingDeadlines: Array<{
    regulation: string;
    deadline: Date;
    status: string;
  }>;
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: string;
    timeline: string;
    cost?: number;
  }>;
}

export class RegulatoryMapper {
  private regulations: Map<string, RegulationMapping[]>;
  private jurisdictionHierarchy: Map<string, string[]>; // e.g., 'US-CA' -> ['US', 'global']

  constructor() {
    this.regulations = new Map();
    this.jurisdictionHierarchy = new Map();
    this.initializeRegulations();
    this.initializeJurisdictionHierarchy();
  }

  /**
   * Initialize regulatory database
   */
  private initializeRegulations(): void {
    // Environmental regulations
    this.addRegulation('environmental', {
      regulation: {
        id: 'eu-ets',
        name: 'EU Emissions Trading System',
        jurisdiction: 'EU',
        applicableIndustries: ['Oil & Gas', 'Coal', 'Power Generation', 'Manufacturing'],
        effectiveDate: new Date('2005-01-01'),
        requirements: [
          'Monitor and report verified emissions',
          'Surrender allowances equal to emissions',
          'Comply with MRV regulations',
          'Participate in carbon market'
        ],
        penalties: '€100 per tCO2e excess emissions',
        griAlignment: ['GRI 305-1', 'GRI 305-2', 'GRI 201-2'],
        complianceDeadline: new Date('2025-04-30')
      },
      applicableIndustries: ['oil-gas', 'coal', 'manufacturing'],
      griAlignment: ['GRI 305-1', 'GRI 305-2'],
      urgency: 'high',
      implementationComplexity: 'high'
    });

    this.addRegulation('environmental', {
      regulation: {
        id: 'epa-ghgrp',
        name: 'EPA Greenhouse Gas Reporting Program',
        jurisdiction: 'US',
        applicableIndustries: ['Oil & Gas', 'Coal', 'Manufacturing'],
        effectiveDate: new Date('2010-01-01'),
        requirements: [
          'Report annual GHG emissions if > 25,000 tCO2e',
          'Use EPA-approved calculation methods',
          'Submit by March 31 each year',
          'Maintain supporting documentation'
        ],
        penalties: 'Up to $51,796 per day per violation',
        griAlignment: ['GRI 305-1', 'GRI 305-2'],
        complianceDeadline: new Date('2025-03-31')
      },
      applicableIndustries: ['oil-gas', 'coal', 'manufacturing'],
      griAlignment: ['GRI 305-1', 'GRI 305-2'],
      urgency: 'high',
      implementationComplexity: 'medium'
    });

    // Safety regulations
    this.addRegulation('safety', {
      regulation: {
        id: 'msha',
        name: 'Mine Safety and Health Administration Standards',
        jurisdiction: 'US',
        applicableIndustries: ['Coal', 'Mining'],
        effectiveDate: new Date('1977-11-09'),
        requirements: [
          'Conduct regular safety inspections',
          'Maintain dust control standards',
          'Report accidents and injuries',
          'Provide safety training'
        ],
        penalties: 'Up to $70,000 per violation, criminal penalties for willful violations',
        griAlignment: ['GRI 403-1', 'GRI 403-9'],
        complianceDeadline: new Date('2025-12-31')
      },
      applicableIndustries: ['coal'],
      griAlignment: ['GRI 403-1', 'GRI 403-9'],
      urgency: 'critical',
      implementationComplexity: 'high'
    });

    // Agriculture regulations
    this.addRegulation('agriculture', {
      regulation: {
        id: 'fifra',
        name: 'Federal Insecticide, Fungicide, and Rodenticide Act',
        jurisdiction: 'US',
        applicableIndustries: ['Agriculture'],
        effectiveDate: new Date('1972-10-21'),
        requirements: [
          'Register all pesticides before use',
          'Follow label instructions strictly',
          'Maintain application records',
          'Report adverse effects'
        ],
        penalties: 'Up to $19,500 per violation for commercial applicators',
        griAlignment: ['GRI 13.6.2', 'GRI 13.6.3'],
        complianceDeadline: new Date('2025-12-31')
      },
      applicableIndustries: ['agriculture'],
      griAlignment: ['GRI 13.6.2', 'GRI 13.6.3'],
      urgency: 'high',
      implementationComplexity: 'medium'
    });

    // Financial regulations
    this.addRegulation('financial', {
      regulation: {
        id: 'tcfd',
        name: 'Task Force on Climate-related Financial Disclosures',
        jurisdiction: 'global',
        applicableIndustries: ['All'],
        effectiveDate: new Date('2017-06-29'),
        requirements: [
          'Disclose climate-related governance',
          'Report climate strategy and risks',
          'Implement risk management processes',
          'Provide metrics and targets'
        ],
        penalties: 'Reputational risk, investor pressure',
        griAlignment: ['GRI 201-2', 'GRI 305-1'],
        complianceDeadline: new Date('2025-12-31')
      },
      applicableIndustries: ['oil-gas', 'coal', 'agriculture', 'manufacturing', 'all'],
      griAlignment: ['GRI 201-2', 'GRI 305-1'],
      urgency: 'medium',
      implementationComplexity: 'medium'
    });

    // Emerging regulations
    this.addRegulation('emerging', {
      regulation: {
        id: 'eu-methane',
        name: 'EU Methane Regulation',
        jurisdiction: 'EU',
        applicableIndustries: ['Oil & Gas'],
        effectiveDate: new Date('2024-01-01'),
        requirements: [
          'Measure and report methane emissions',
          'Implement leak detection and repair (LDAR)',
          'Limit venting and flaring',
          'Apply import standards'
        ],
        penalties: 'Varies by member state',
        griAlignment: ['GRI 305-7', 'GRI 11.3.2'],
        complianceDeadline: new Date('2025-01-01')
      },
      applicableIndustries: ['oil-gas'],
      griAlignment: ['GRI 305-7', 'GRI 11.3.2'],
      urgency: 'critical',
      implementationComplexity: 'high'
    });
  }

  /**
   * Initialize jurisdiction hierarchy for regulation inheritance
   */
  private initializeJurisdictionHierarchy(): void {
    // US states inherit federal regulations
    this.jurisdictionHierarchy.set('US-CA', ['US', 'global']);
    this.jurisdictionHierarchy.set('US-TX', ['US', 'global']);
    this.jurisdictionHierarchy.set('US-NY', ['US', 'global']);
    
    // EU member states inherit EU regulations
    this.jurisdictionHierarchy.set('EU-DE', ['EU', 'global']);
    this.jurisdictionHierarchy.set('EU-FR', ['EU', 'global']);
    this.jurisdictionHierarchy.set('EU-NL', ['EU', 'global']);
    
    // Top-level jurisdictions
    this.jurisdictionHierarchy.set('US', ['global']);
    this.jurisdictionHierarchy.set('EU', ['global']);
    this.jurisdictionHierarchy.set('CA', ['global']);
    this.jurisdictionHierarchy.set('AU', ['global']);
    this.jurisdictionHierarchy.set('UK', ['global']);
  }

  /**
   * Add regulation to the database
   */
  private addRegulation(category: string, mapping: RegulationMapping): void {
    if (!this.regulations.has(category)) {
      this.regulations.set(category, []);
    }
    this.regulations.get(category)!.push(mapping);
  }

  /**
   * Get applicable regulations for an organization
   */
  async getApplicableRegulations(
    jurisdiction: string,
    industryClassification: IndustryClassification,
    griStandards?: GRISectorStandard[]
  ): Promise<RegulatoryRequirement[]> {
    const applicableRegulations: RegulatoryRequirement[] = [];
    const jurisdictions = this.getJurisdictionHierarchy(jurisdiction);

    // Check all regulation categories
    for (const [category, mappings] of this.regulations) {
      for (const mapping of mappings) {
        if (this.isRegulationApplicable(mapping, jurisdictions, industryClassification)) {
          applicableRegulations.push(mapping.regulation);
        }
      }
    }

    // Remove duplicates and sort by urgency
    const uniqueRegulations = this.deduplicateRegulations(applicableRegulations);
    return this.sortByUrgency(uniqueRegulations, jurisdiction, industryClassification);
  }

  /**
   * Assess compliance for an organization
   */
  async assessCompliance(
    organizationId: string,
    jurisdiction: string,
    industryClassification: IndustryClassification,
    currentData: Record<string, any>
  ): Promise<ComplianceAssessment> {
    const applicableRegulations = await this.getApplicableRegulations(
      jurisdiction,
      industryClassification
    );

    const complianceGaps: ComplianceGap[] = [];
    let totalCompliance = 0;

    for (const regulation of applicableRegulations) {
      const gap = await this.assessRegulationCompliance(regulation, currentData);
      complianceGaps.push(gap);
      totalCompliance += this.getComplianceScore(gap.currentStatus);
    }

    const overallCompliance = applicableRegulations.length > 0 
      ? (totalCompliance / applicableRegulations.length) * 100 
      : 100;

    const upcomingDeadlines = this.getUpcomingDeadlines(applicableRegulations);
    const recommendations = this.generateComplianceRecommendations(complianceGaps);

    return {
      organizationId,
      jurisdiction,
      industry: this.getIndustryName(industryClassification),
      overallCompliance,
      complianceGaps,
      upcomingDeadlines,
      recommendations
    };
  }

  /**
   * Get regulations by GRI standard
   */
  async getRegulationsByGRI(
    griStandard: string,
    jurisdiction?: string
  ): Promise<RegulatoryRequirement[]> {
    const matchingRegulations: RegulatoryRequirement[] = [];

    for (const [category, mappings] of this.regulations) {
      for (const mapping of mappings) {
        if (mapping.griAlignment.includes(griStandard)) {
          if (!jurisdiction || this.isJurisdictionMatch(mapping.regulation.jurisdiction, jurisdiction)) {
            matchingRegulations.push(mapping.regulation);
          }
        }
      }
    }

    return matchingRegulations;
  }

  /**
   * Get upcoming regulatory changes
   */
  async getUpcomingChanges(
    jurisdiction: string,
    industryClassification: IndustryClassification,
    timeframe: 'next-year' | 'next-two-years' | 'next-five-years' = 'next-year'
  ): Promise<Array<{
    regulation: RegulatoryRequirement;
    changeType: 'new' | 'amendment' | 'deadline' | 'phase-out';
    effectiveDate: Date;
    impact: 'high' | 'medium' | 'low';
    description: string;
  }>> {
    const cutoffDate = new Date();
    switch (timeframe) {
      case 'next-year':
        cutoffDate.setFullYear(cutoffDate.getFullYear() + 1);
        break;
      case 'next-two-years':
        cutoffDate.setFullYear(cutoffDate.getFullYear() + 2);
        break;
      case 'next-five-years':
        cutoffDate.setFullYear(cutoffDate.getFullYear() + 5);
        break;
    }

    // Mock implementation - in production, this would query a regulatory changes database
    return [
      {
        regulation: {
          id: 'eu-csrd',
          name: 'EU Corporate Sustainability Reporting Directive',
          jurisdiction: 'EU',
          applicableIndustries: ['All large companies'],
          effectiveDate: new Date('2025-01-01'),
          requirements: [
            'Report according to ESRS standards',
            'Include double materiality assessment',
            'Provide forward-looking information',
            'Obtain independent assurance'
          ],
          penalties: 'Varies by member state',
          griAlignment: ['GRI 2-1', 'GRI 3-1', 'GRI 3-2'],
          complianceDeadline: new Date('2025-12-31')
        },
        changeType: 'new',
        effectiveDate: new Date('2025-01-01'),
        impact: 'high',
        description: 'Major expansion of sustainability reporting requirements for EU companies'
      }
    ];
  }

  /**
   * Get regulatory guidance for specific requirement
   */
  async getImplementationGuidance(
    regulationId: string,
    organizationType: 'large-corp' | 'sme' | 'startup' = 'large-corp'
  ): Promise<{
    regulation: RegulatoryRequirement;
    implementationSteps: Array<{
      step: number;
      title: string;
      description: string;
      timeline: string;
      resources: string[];
      dependencies: string[];
    }>;
    commonChallenges: string[];
    bestPractices: string[];
    estimatedCost: {
      low: number;
      high: number;
      currency: string;
    };
  } | null> {
    // Find the regulation
    let targetRegulation: RegulatoryRequirement | null = null;
    for (const [category, mappings] of this.regulations) {
      const mapping = mappings.find(m => m.regulation.id === regulationId);
      if (mapping) {
        targetRegulation = mapping.regulation;
        break;
      }
    }

    if (!targetRegulation) {
      return null;
    }

    // Generate implementation guidance based on regulation type
    return this.generateImplementationGuidance(targetRegulation, organizationType);
  }

  /**
   * Check if regulation is applicable
   */
  private isRegulationApplicable(
    mapping: RegulationMapping,
    jurisdictions: string[],
    industryClassification: IndustryClassification
  ): boolean {
    // Check jurisdiction match
    const jurisdictionMatch = jurisdictions.includes(mapping.regulation.jurisdiction);
    if (!jurisdictionMatch) return false;

    // Check industry match
    const industryMatch = mapping.applicableIndustries.includes('all') ||
      mapping.applicableIndustries.some(industry => 
        this.isIndustryMatch(industry, industryClassification)
      );

    return industryMatch;
  }

  /**
   * Check if industry matches classification
   */
  private isIndustryMatch(
    regulationIndustry: string,
    classification: IndustryClassification
  ): boolean {
    const industryKeywords = regulationIndustry.toLowerCase().split(/[\s-]+/);
    
    // Check NAICS code prefix match
    if (classification.naicsCode) {
      const naicsMatches = {
        'oil-gas': ['211', '213', '324', '486'],
        'coal': ['2121', '2122'],
        'agriculture': ['111', '112', '114', '115'],
        'manufacturing': ['31', '32', '33']
      };

      for (const [key, codes] of Object.entries(naicsMatches)) {
        if (industryKeywords.includes(key.replace('-', '')) || 
            industryKeywords.includes(key)) {
          return codes.some(code => classification.naicsCode.startsWith(code));
        }
      }
    }

    // Check custom code match
    if (classification.customCode) {
      return industryKeywords.some(keyword => 
        classification.customCode.toLowerCase().includes(keyword)
      );
    }

    return false;
  }

  /**
   * Get jurisdiction hierarchy
   */
  private getJurisdictionHierarchy(jurisdiction: string): string[] {
    const hierarchy = this.jurisdictionHierarchy.get(jurisdiction) || ['global'];
    return [jurisdiction, ...hierarchy];
  }

  /**
   * Check if jurisdiction matches
   */
  private isJurisdictionMatch(regulationJurisdiction: string, targetJurisdiction: string): boolean {
    if (regulationJurisdiction === 'global') return true;
    if (regulationJurisdiction === targetJurisdiction) return true;
    
    const hierarchy = this.getJurisdictionHierarchy(targetJurisdiction);
    return hierarchy.includes(regulationJurisdiction);
  }

  /**
   * Assess compliance for a specific regulation
   */
  private async assessRegulationCompliance(
    regulation: RegulatoryRequirement,
    currentData: Record<string, any>
  ): Promise<ComplianceGap> {
    const gaps: string[] = [];
    const recommendations: string[] = [];
    
    // Basic compliance checks based on regulation type
    if (regulation.id.includes('ghg') || regulation.id.includes('emission')) {
      if (!currentData.scope1_emissions || !currentData.scope2_emissions) {
        gaps.push('Missing GHG emissions data');
        recommendations.push('Implement GHG accounting system');
      }
      if (!currentData.emissions_verification) {
        gaps.push('No third-party verification of emissions');
        recommendations.push('Engage accredited verification body');
      }
    }

    if (regulation.id.includes('safety') || regulation.id.includes('msha')) {
      if (!currentData.safety_management_system) {
        gaps.push('No formal safety management system');
        recommendations.push('Implement comprehensive safety management system');
      }
      if (currentData.fatality_rate > 0) {
        gaps.push('Work-related fatalities reported');
        recommendations.push('Immediate safety review and enhancement required');
      }
    }

    // Determine compliance status
    let currentStatus: 'compliant' | 'partial' | 'non-compliant' | 'unknown';
    if (gaps.length === 0) {
      currentStatus = 'compliant';
    } else if (gaps.length <= 2) {
      currentStatus = 'partial';
    } else {
      currentStatus = 'non-compliant';
    }

    return {
      regulation,
      currentStatus,
      gaps,
      recommendations,
      estimatedCost: gaps.length * 50000, // Rough estimate
      estimatedTimeline: gaps.length > 3 ? '12-18 months' : '3-6 months'
    };
  }

  /**
   * Get compliance score from status
   */
  private getComplianceScore(status: string): number {
    switch (status) {
      case 'compliant': return 100;
      case 'partial': return 60;
      case 'non-compliant': return 20;
      case 'unknown': return 40;
      default: return 0;
    }
  }

  /**
   * Get upcoming deadlines
   */
  private getUpcomingDeadlines(
    regulations: RegulatoryRequirement[]
  ): Array<{ regulation: string; deadline: Date; status: string }> {
    const now = new Date();
    const oneYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    return regulations
      .filter(reg => reg.complianceDeadline && reg.complianceDeadline <= oneYear)
      .map(reg => ({
        regulation: reg.name,
        deadline: reg.complianceDeadline!,
        status: this.getDeadlineStatus(reg.complianceDeadline!)
      }))
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  }

  /**
   * Get deadline status
   */
  private getDeadlineStatus(deadline: Date): string {
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilDeadline < 30) return 'critical';
    if (daysUntilDeadline < 90) return 'urgent';
    if (daysUntilDeadline < 180) return 'upcoming';
    return 'planned';
  }

  /**
   * Generate compliance recommendations
   */
  private generateComplianceRecommendations(
    gaps: ComplianceGap[]
  ): Array<{ priority: 'critical' | 'high' | 'medium' | 'low'; action: string; timeline: string; cost?: number }> {
    const recommendations: Array<{ 
      priority: 'critical' | 'high' | 'medium' | 'low'; 
      action: string; 
      timeline: string; 
      cost?: number 
    }> = [];

    const criticalGaps = gaps.filter(g => g.currentStatus === 'non-compliant');
    const partialGaps = gaps.filter(g => g.currentStatus === 'partial');

    // Critical recommendations
    criticalGaps.forEach(gap => {
      gap.recommendations.forEach(rec => {
        recommendations.push({
          priority: 'critical',
          action: rec,
          timeline: gap.estimatedTimeline || '6 months',
          cost: gap.estimatedCost
        });
      });
    });

    // High priority recommendations
    partialGaps.forEach(gap => {
      gap.recommendations.forEach(rec => {
        recommendations.push({
          priority: 'high',
          action: rec,
          timeline: gap.estimatedTimeline || '3 months',
          cost: gap.estimatedCost
        });
      });
    });

    return recommendations.slice(0, 10); // Limit to top 10
  }

  /**
   * Generate implementation guidance
   */
  private generateImplementationGuidance(
    regulation: RegulatoryRequirement,
    organizationType: string
  ): any {
    // This would be a comprehensive implementation guide in production
    return {
      regulation,
      implementationSteps: [
        {
          step: 1,
          title: 'Assess Current State',
          description: 'Evaluate current compliance status and identify gaps',
          timeline: '2-4 weeks',
          resources: ['Internal team', 'Consultant'],
          dependencies: []
        },
        {
          step: 2,
          title: 'Develop Implementation Plan',
          description: 'Create detailed project plan with timelines and responsibilities',
          timeline: '1-2 weeks',
          resources: ['Project manager', 'Legal team'],
          dependencies: ['Step 1']
        },
        {
          step: 3,
          title: 'Implement Systems and Processes',
          description: 'Execute the implementation plan and install necessary systems',
          timeline: '3-6 months',
          resources: ['IT team', 'Operations team', 'External vendors'],
          dependencies: ['Step 2']
        }
      ],
      commonChallenges: [
        'Data collection and quality issues',
        'Resource constraints',
        'Change management resistance',
        'Technical system integration'
      ],
      bestPractices: [
        'Engage stakeholders early',
        'Implement pilot programs',
        'Ensure data quality from start',
        'Plan for ongoing maintenance'
      ],
      estimatedCost: {
        low: organizationType === 'large-corp' ? 100000 : 25000,
        high: organizationType === 'large-corp' ? 500000 : 100000,
        currency: 'USD'
      }
    };
  }

  /**
   * Remove duplicate regulations
   */
  private deduplicateRegulations(regulations: RegulatoryRequirement[]): RegulatoryRequirement[] {
    const seen = new Set<string>();
    return regulations.filter(reg => {
      if (seen.has(reg.id)) return false;
      seen.add(reg.id);
      return true;
    });
  }

  /**
   * Sort regulations by urgency
   */
  private sortByUrgency(
    regulations: RegulatoryRequirement[],
    jurisdiction: string,
    industryClassification: IndustryClassification
  ): RegulatoryRequirement[] {
    return regulations.sort((a, b) => {
      // Sort by compliance deadline first
      if (a.complianceDeadline && b.complianceDeadline) {
        return a.complianceDeadline.getTime() - b.complianceDeadline.getTime();
      }
      if (a.complianceDeadline && !b.complianceDeadline) return -1;
      if (!a.complianceDeadline && b.complianceDeadline) return 1;
      
      // Then by regulation importance (based on penalties)
      const penaltyScore = (reg: RegulatoryRequirement) => {
        if (reg.penalties.toLowerCase().includes('criminal')) return 3;
        if (reg.penalties.toLowerCase().includes('closure')) return 3;
        if (reg.penalties.toLowerCase().includes('€') || reg.penalties.toLowerCase().includes('$')) return 2;
        return 1;
      };

      return penaltyScore(b) - penaltyScore(a);
    });
  }

  /**
   * Get industry name from classification
   */
  private getIndustryName(classification: IndustryClassification): string {
    if (classification.naicsCode) {
      if (classification.naicsCode.startsWith('211')) return 'Oil & Gas';
      if (classification.naicsCode.startsWith('212')) return 'Mining';
      if (classification.naicsCode.startsWith('111')) return 'Agriculture';
      if (classification.naicsCode.startsWith('31') || 
          classification.naicsCode.startsWith('32') || 
          classification.naicsCode.startsWith('33')) return 'Manufacturing';
    }
    return classification.customCode || 'Unknown';
  }

  /**
   * Export regulations database for reporting
   */
  exportRegulations(): any {
    const allRegulations: any[] = [];
    
    for (const [category, mappings] of this.regulations) {
      mappings.forEach(mapping => {
        allRegulations.push({
          category,
          ...mapping.regulation,
          urgency: mapping.urgency,
          complexity: mapping.implementationComplexity,
          industries: mapping.applicableIndustries
        });
      });
    }

    return {
      metadata: {
        exportDate: new Date().toISOString(),
        totalRegulations: allRegulations.length,
        jurisdictions: Array.from(new Set(allRegulations.map(r => r.jurisdiction)))
      },
      regulations: allRegulations
    };
  }

  /**
   * Get regulation statistics
   */
  getStatistics(): {
    totalRegulations: number;
    byJurisdiction: Record<string, number>;
    byIndustry: Record<string, number>;
    byUrgency: Record<string, number>;
    upcomingDeadlines: number;
  } {
    let totalRegulations = 0;
    const byJurisdiction: Record<string, number> = {};
    const byIndustry: Record<string, number> = {};
    const byUrgency: Record<string, number> = {};
    let upcomingDeadlines = 0;

    const oneYear = new Date();
    oneYear.setFullYear(oneYear.getFullYear() + 1);

    for (const [category, mappings] of this.regulations) {
      mappings.forEach(mapping => {
        totalRegulations++;
        
        // Count by jurisdiction
        const jurisdiction = mapping.regulation.jurisdiction;
        byJurisdiction[jurisdiction] = (byJurisdiction[jurisdiction] || 0) + 1;
        
        // Count by industry
        mapping.applicableIndustries.forEach(industry => {
          byIndustry[industry] = (byIndustry[industry] || 0) + 1;
        });
        
        // Count by urgency
        byUrgency[mapping.urgency] = (byUrgency[mapping.urgency] || 0) + 1;
        
        // Count upcoming deadlines
        if (mapping.regulation.complianceDeadline && 
            mapping.regulation.complianceDeadline <= oneYear) {
          upcomingDeadlines++;
        }
      });
    }

    return {
      totalRegulations,
      byJurisdiction,
      byIndustry,
      byUrgency,
      upcomingDeadlines
    };
  }
}