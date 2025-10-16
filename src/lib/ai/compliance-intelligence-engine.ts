import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { aiService } from './service';

/**
 * Compliance Intelligence Engine
 * Comprehensive regulatory compliance management system
 * Supporting SEC Climate, EU CSRD, EU Taxonomy, TCFD, GRI, CDP, SBTi
 */

export class ComplianceIntelligenceEngine {
  private supabase: ReturnType<typeof createClient<Database>>;
  private frameworks: Map<string, ComplianceFramework> = new Map();
  private requirements: Map<string, ComplianceRequirement[]> = new Map();
  private gapAnalysis: Map<string, GapAnalysisResult> = new Map();
  private complianceScores: Map<string, ComplianceScore> = new Map();
  private deadlineTracker: DeadlineTracker;
  private changeMonitor: RegulatoryChangeMonitor;

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    this.deadlineTracker = new DeadlineTracker();
    this.changeMonitor = new RegulatoryChangeMonitor();
    this.initializeFrameworks();
    this.loadRequirements();
  }

  /**
   * Initialize compliance frameworks
   */
  private initializeFrameworks() {
    // SEC Climate Disclosure Rules
    this.frameworks.set('SEC_Climate', {
      id: 'SEC_Climate',
      name: 'SEC Climate-Related Disclosure Rules',
      version: '2024.1',
      effectiveDate: new Date('2024-03-06'),
      jurisdiction: 'United States',
      applicability: {
        criteria: ['public_company', 'us_listed'],
        thresholds: {
          revenue: 1000000000, // $1B
          marketCap: 700000000 // $700M
        }
      },
      categories: [
        {
          id: 'governance',
          name: 'Governance',
          requirements: 8,
          weight: 0.2
        },
        {
          id: 'strategy',
          name: 'Strategy',
          requirements: 12,
          weight: 0.25
        },
        {
          id: 'risk_management',
          name: 'Risk Management',
          requirements: 10,
          weight: 0.25
        },
        {
          id: 'metrics_targets',
          name: 'Metrics and Targets',
          requirements: 15,
          weight: 0.3
        }
      ],
      penalties: {
        maxFine: 10000000,
        type: 'civil',
        enforcer: 'SEC'
      }
    });

    // EU Corporate Sustainability Reporting Directive
    this.frameworks.set('EU_CSRD', {
      id: 'EU_CSRD',
      name: 'EU Corporate Sustainability Reporting Directive',
      version: '2023.1',
      effectiveDate: new Date('2024-01-01'),
      jurisdiction: 'European Union',
      applicability: {
        criteria: ['large_company', 'eu_operations'],
        thresholds: {
          employees: 250,
          revenue: 40000000, // €40M
          assets: 20000000 // €20M
        }
      },
      categories: [
        {
          id: 'environmental',
          name: 'Environmental',
          requirements: 25,
          weight: 0.33
        },
        {
          id: 'social',
          name: 'Social',
          requirements: 20,
          weight: 0.33
        },
        {
          id: 'governance',
          name: 'Governance',
          requirements: 15,
          weight: 0.34
        }
      ],
      penalties: {
        maxFine: 50000000,
        type: 'administrative',
        enforcer: 'National Authorities'
      }
    });

    // EU Taxonomy
    this.frameworks.set('EU_Taxonomy', {
      id: 'EU_Taxonomy',
      name: 'EU Taxonomy Regulation',
      version: '2023.2',
      effectiveDate: new Date('2023-01-01'),
      jurisdiction: 'European Union',
      applicability: {
        criteria: ['financial_market_participant', 'large_company'],
        thresholds: {
          employees: 500,
          revenue: 40000000,
          assets: 20000000
        }
      },
      categories: [
        {
          id: 'eligibility',
          name: 'Eligibility',
          requirements: 10,
          weight: 0.3
        },
        {
          id: 'alignment',
          name: 'Alignment',
          requirements: 15,
          weight: 0.4
        },
        {
          id: 'dnsh',
          name: 'Do No Significant Harm',
          requirements: 8,
          weight: 0.3
        }
      ],
      penalties: {
        maxFine: 20000000,
        type: 'administrative',
        enforcer: 'ESMA'
      }
    });

    // Task Force on Climate-related Financial Disclosures
    this.frameworks.set('TCFD', {
      id: 'TCFD',
      name: 'Task Force on Climate-related Financial Disclosures',
      version: '2021.1',
      effectiveDate: new Date('2021-01-01'),
      jurisdiction: 'Global',
      applicability: {
        criteria: ['voluntary', 'listed_company'],
        thresholds: {}
      },
      categories: [
        {
          id: 'governance',
          name: 'Governance',
          requirements: 5,
          weight: 0.25
        },
        {
          id: 'strategy',
          name: 'Strategy',
          requirements: 8,
          weight: 0.25
        },
        {
          id: 'risk_management',
          name: 'Risk Management',
          requirements: 6,
          weight: 0.25
        },
        {
          id: 'metrics_targets',
          name: 'Metrics and Targets',
          requirements: 7,
          weight: 0.25
        }
      ],
      penalties: {
        maxFine: 0,
        type: 'reputational',
        enforcer: 'Market'
      }
    });

    // Global Reporting Initiative
    this.frameworks.set('GRI', {
      id: 'GRI',
      name: 'Global Reporting Initiative Standards',
      version: '2021',
      effectiveDate: new Date('2021-01-01'),
      jurisdiction: 'Global',
      applicability: {
        criteria: ['voluntary'],
        thresholds: {}
      },
      categories: [
        {
          id: 'universal',
          name: 'Universal Standards',
          requirements: 30,
          weight: 0.3
        },
        {
          id: 'economic',
          name: 'Economic',
          requirements: 20,
          weight: 0.2
        },
        {
          id: 'environmental',
          name: 'Environmental',
          requirements: 25,
          weight: 0.25
        },
        {
          id: 'social',
          name: 'Social',
          requirements: 25,
          weight: 0.25
        }
      ],
      penalties: {
        maxFine: 0,
        type: 'reputational',
        enforcer: 'Stakeholders'
      }
    });

    // Carbon Disclosure Project
    this.frameworks.set('CDP', {
      id: 'CDP',
      name: 'Carbon Disclosure Project',
      version: '2024',
      effectiveDate: new Date('2024-01-01'),
      jurisdiction: 'Global',
      applicability: {
        criteria: ['invited', 'voluntary'],
        thresholds: {}
      },
      categories: [
        {
          id: 'climate_change',
          name: 'Climate Change',
          requirements: 50,
          weight: 0.4
        },
        {
          id: 'water_security',
          name: 'Water Security',
          requirements: 30,
          weight: 0.3
        },
        {
          id: 'forests',
          name: 'Forests',
          requirements: 20,
          weight: 0.3
        }
      ],
      penalties: {
        maxFine: 0,
        type: 'scoring',
        enforcer: 'CDP'
      }
    });

    // Science-Based Targets initiative
    this.frameworks.set('SBTi', {
      id: 'SBTi',
      name: 'Science-Based Targets initiative',
      version: '5.1',
      effectiveDate: new Date('2023-01-01'),
      jurisdiction: 'Global',
      applicability: {
        criteria: ['voluntary', 'committed'],
        thresholds: {}
      },
      categories: [
        {
          id: 'near_term',
          name: 'Near-term Targets',
          requirements: 10,
          weight: 0.4
        },
        {
          id: 'long_term',
          name: 'Long-term Targets',
          requirements: 8,
          weight: 0.3
        },
        {
          id: 'net_zero',
          name: 'Net-Zero Standard',
          requirements: 12,
          weight: 0.3
        }
      ],
      penalties: {
        maxFine: 0,
        type: 'delisting',
        enforcer: 'SBTi'
      }
    });
  }

  /**
   * Load detailed requirements for each framework
   */
  private async loadRequirements() {
    // SEC Climate requirements
    this.requirements.set('SEC_Climate', [
      {
        id: 'sec_1',
        frameworkId: 'SEC_Climate',
        category: 'governance',
        requirement: 'Board oversight of climate-related risks',
        description: 'Describe board oversight of climate-related risks and opportunities',
        dataPoints: ['board_charter', 'committee_responsibilities', 'meeting_frequency'],
        evidence: ['board_minutes', 'committee_charters', 'governance_policies'],
        deadline: this.getQuarterlyDeadline(),
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'sec_2',
        frameworkId: 'SEC_Climate',
        category: 'strategy',
        requirement: 'Climate-related risks identification',
        description: 'Identify material climate-related risks over short, medium, and long term',
        dataPoints: ['risk_assessment', 'time_horizons', 'materiality_threshold'],
        evidence: ['risk_register', 'materiality_assessment', 'scenario_analysis'],
        deadline: this.getAnnualDeadline(),
        priority: 'critical',
        status: 'pending'
      },
      {
        id: 'sec_3',
        frameworkId: 'SEC_Climate',
        category: 'metrics_targets',
        requirement: 'GHG emissions disclosure',
        description: 'Disclose Scope 1 and Scope 2 GHG emissions',
        dataPoints: ['scope1_emissions', 'scope2_emissions', 'methodology'],
        evidence: ['emissions_calculations', 'third_party_verification'],
        deadline: this.getQuarterlyDeadline(),
        priority: 'critical',
        status: 'pending'
      }
      // Add more requirements...
    ]);

    // EU CSRD requirements
    this.requirements.set('EU_CSRD', [
      {
        id: 'csrd_1',
        frameworkId: 'EU_CSRD',
        category: 'environmental',
        requirement: 'Climate change mitigation',
        description: 'Report on climate change mitigation actions and targets',
        dataPoints: ['mitigation_actions', 'emission_targets', 'transition_plan'],
        evidence: ['transition_plan', 'target_validation', 'progress_report'],
        deadline: this.getAnnualDeadline(),
        priority: 'high',
        status: 'pending'
      },
      {
        id: 'csrd_2',
        frameworkId: 'EU_CSRD',
        category: 'social',
        requirement: 'Workforce diversity',
        description: 'Report on workforce composition and diversity metrics',
        dataPoints: ['gender_diversity', 'age_distribution', 'pay_gap'],
        evidence: ['hr_reports', 'diversity_policy', 'pay_analysis'],
        deadline: this.getAnnualDeadline(),
        priority: 'medium',
        status: 'pending'
      }
      // Add more requirements...
    ]);

    // Load remaining framework requirements
    await this.loadFromDatabase();
  }

  /**
   * Perform comprehensive gap analysis
   */
  public async performGapAnalysis(
    organizationId: string,
    frameworkIds?: string[]
  ): Promise<GapAnalysisResult[]> {
    const results: GapAnalysisResult[] = [];
    const targetFrameworks = frameworkIds || Array.from(this.frameworks.keys());

    for (const frameworkId of targetFrameworks) {
      const framework = this.frameworks.get(frameworkId);
      if (!framework) continue;

      // Check applicability
      const isApplicable = await this.checkApplicability(organizationId, framework);
      if (!isApplicable && !frameworkIds) continue;

      // Get requirements
      const requirements = this.requirements.get(frameworkId) || [];

      // Assess compliance for each requirement
      const assessments: RequirementAssessment[] = [];
      let compliantCount = 0;
      let partialCount = 0;
      let nonCompliantCount = 0;

      for (const requirement of requirements) {
        const assessment = await this.assessRequirement(organizationId, requirement);
        assessments.push(assessment);

        if (assessment.status === 'compliant') compliantCount++;
        else if (assessment.status === 'partial') partialCount++;
        else nonCompliantCount++;
      }

      // Calculate overall compliance score
      const complianceScore = this.calculateComplianceScore(
        compliantCount,
        partialCount,
        nonCompliantCount,
        requirements.length
      );

      // Identify critical gaps
      const criticalGaps = assessments
        .filter(a => a.status === 'non_compliant' && a.priority === 'critical')
        .map(a => a.requirement);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(
        assessments.filter(a => a.status !== 'compliant')
      );

      const result: GapAnalysisResult = {
        frameworkId,
        frameworkName: framework.name,
        analyzedAt: new Date(),
        organizationId,
        applicable: isApplicable,
        complianceScore,
        totalRequirements: requirements.length,
        compliantCount,
        partialCount,
        nonCompliantCount,
        criticalGaps,
        assessments,
        recommendations,
        estimatedEffort: this.estimateRemediationEffort(assessments),
        riskLevel: this.assessRiskLevel(complianceScore, criticalGaps.length),
        nextSteps: this.generateNextSteps(assessments)
      };

      results.push(result);
      this.gapAnalysis.set(`${organizationId}_${frameworkId}`, result);
    }

    // Store results
    await this.storeGapAnalysis(results);

    return results;
  }

  /**
   * Check if framework is applicable to organization
   */
  private async checkApplicability(
    organizationId: string,
    framework: ComplianceFramework
  ): Promise<boolean> {
    // Get organization details
    const { data: org } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (!org) return false;

    // Check criteria
    for (const criterion of framework.applicability.criteria) {
      switch (criterion) {
        case 'public_company':
          if (!org.is_public) return false;
          break;
        case 'us_listed':
          if (!org.listing_exchange?.includes('US')) return false;
          break;
        case 'eu_operations':
          if (!org.regions?.includes('EU')) return false;
          break;
        case 'large_company':
          if (org.employee_count < framework.applicability.thresholds.employees!) {
            return false;
          }
          break;
      }
    }

    // Check thresholds
    const thresholds = framework.applicability.thresholds;
    if (thresholds.revenue && org.annual_revenue < thresholds.revenue) {
      return false;
    }
    if (thresholds.marketCap && org.market_cap < thresholds.marketCap) {
      return false;
    }

    return true;
  }

  /**
   * Assess compliance for a requirement
   */
  private async assessRequirement(
    organizationId: string,
    requirement: ComplianceRequirement
  ): Promise<RequirementAssessment> {
    // Check for existing data
    const dataAvailability = await this.checkDataAvailability(
      organizationId,
      requirement.dataPoints
    );

    // Check for evidence
    const evidenceAvailability = await this.checkEvidenceAvailability(
      organizationId,
      requirement.evidence
    );

    // Determine compliance status
    let status: ComplianceStatus = 'non_compliant';
    let completeness = 0;

    if (dataAvailability.percentage >= 100 && evidenceAvailability.percentage >= 100) {
      status = 'compliant';
      completeness = 100;
    } else if (dataAvailability.percentage >= 50 || evidenceAvailability.percentage >= 50) {
      status = 'partial';
      completeness = (dataAvailability.percentage + evidenceAvailability.percentage) / 2;
    }

    // Identify gaps
    const gaps: string[] = [];
    dataAvailability.missing.forEach(dp => gaps.push(`Missing data: ${dp}`));
    evidenceAvailability.missing.forEach(ev => gaps.push(`Missing evidence: ${ev}`));

    return {
      requirementId: requirement.id,
      requirement: requirement.requirement,
      category: requirement.category,
      status,
      completeness,
      gaps,
      priority: requirement.priority,
      deadline: requirement.deadline,
      dataAvailability,
      evidenceAvailability,
      remediationActions: this.getRemediationActions(requirement, gaps)
    };
  }

  /**
   * Check data availability
   */
  private async checkDataAvailability(
    organizationId: string,
    dataPoints: string[]
  ): Promise<DataAvailability> {
    const available: string[] = [];
    const missing: string[] = [];

    for (const dataPoint of dataPoints) {
      // Check if data exists in database
      const exists = await this.checkDataPoint(organizationId, dataPoint);
      if (exists) {
        available.push(dataPoint);
      } else {
        missing.push(dataPoint);
      }
    }

    return {
      total: dataPoints.length,
      available,
      missing,
      percentage: (available.length / dataPoints.length) * 100
    };
  }

  /**
   * Check evidence availability
   */
  private async checkEvidenceAvailability(
    organizationId: string,
    evidence: string[]
  ): Promise<DataAvailability> {
    const available: string[] = [];
    const missing: string[] = [];

    for (const doc of evidence) {
      // Check if evidence document exists
      const { data } = await this.supabase
        .from('compliance_documents')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('document_type', doc)
        .single();

      if (data) {
        available.push(doc);
      } else {
        missing.push(doc);
      }
    }

    return {
      total: evidence.length,
      available,
      missing,
      percentage: (available.length / evidence.length) * 100
    };
  }

  /**
   * Check if specific data point exists
   */
  private async checkDataPoint(
    organizationId: string,
    dataPoint: string
  ): Promise<boolean> {
    // Map data points to database tables/columns
    const dataMapping: Record<string, { table: string; column: string }> = {
      'scope1_emissions': { table: 'emissions_data', column: 'scope1_total' },
      'scope2_emissions': { table: 'emissions_data', column: 'scope2_total' },
      'scope3_emissions': { table: 'emissions_data', column: 'scope3_total' },
      'board_charter': { table: 'governance_documents', column: 'board_charter' },
      'risk_assessment': { table: 'risk_assessments', column: 'assessment_data' }
      // Add more mappings...
    };

    const mapping = dataMapping[dataPoint];
    if (!mapping) return false;

    const { data } = await this.supabase
      .from(mapping.table)
      .select(mapping.column)
      .eq('organization_id', organizationId)
      .not(mapping.column, 'is', null)
      .limit(1)
      .single();

    return !!data;
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(
    compliant: number,
    partial: number,
    nonCompliant: number,
    total: number
  ): number {
    if (total === 0) return 0;

    const score = ((compliant * 1.0) + (partial * 0.5) + (nonCompliant * 0)) / total;
    return Math.round(score * 100);
  }

  /**
   * Generate recommendations for gaps
   */
  private async generateRecommendations(
    gaps: RequirementAssessment[]
  ): Promise<ComplianceRecommendation[]> {
    const recommendations: ComplianceRecommendation[] = [];

    // Group gaps by category
    const gapsByCategory = new Map<string, RequirementAssessment[]>();
    gaps.forEach(gap => {
      const existing = gapsByCategory.get(gap.category) || [];
      existing.push(gap);
      gapsByCategory.set(gap.category, existing);
    });

    // Generate recommendations for each category
    for (const [category, categoryGaps] of gapsByCategory) {
      const criticalGaps = categoryGaps.filter(g => g.priority === 'critical');
      const highGaps = categoryGaps.filter(g => g.priority === 'high');

      if (criticalGaps.length > 0) {
        recommendations.push({
          category,
          priority: 'critical',
          title: `Address ${criticalGaps.length} critical ${category} gaps`,
          description: `Immediate action required for regulatory compliance`,
          actions: criticalGaps.flatMap(g => g.remediationActions),
          estimatedEffort: criticalGaps.length * 40, // hours
          deadline: this.getEarliestDeadline(criticalGaps),
          impact: 'high',
          resources: ['compliance_team', 'legal_counsel', 'external_auditor']
        });
      }

      if (highGaps.length > 0) {
        recommendations.push({
          category,
          priority: 'high',
          title: `Resolve ${highGaps.length} high-priority ${category} gaps`,
          description: `Important for maintaining compliance posture`,
          actions: highGaps.flatMap(g => g.remediationActions),
          estimatedEffort: highGaps.length * 20, // hours
          deadline: this.getEarliestDeadline(highGaps),
          impact: 'medium',
          resources: ['sustainability_team', 'data_analysts']
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Get remediation actions for requirement
   */
  private getRemediationActions(
    requirement: ComplianceRequirement,
    gaps: string[]
  ): string[] {
    const actions: string[] = [];

    gaps.forEach(gap => {
      if (gap.includes('Missing data:')) {
        actions.push(`Collect and validate ${gap.replace('Missing data: ', '')}`);
      } else if (gap.includes('Missing evidence:')) {
        actions.push(`Prepare and document ${gap.replace('Missing evidence: ', '')}`);
      }
    });

    // Add specific actions based on requirement type
    if (requirement.requirement.includes('GHG emissions')) {
      actions.push('Implement emissions calculation methodology');
      actions.push('Obtain third-party verification');
    }

    if (requirement.requirement.includes('Board oversight')) {
      actions.push('Update board charter with climate responsibilities');
      actions.push('Document board climate discussions in minutes');
    }

    return actions;
  }

  /**
   * Estimate remediation effort
   */
  private estimateRemediationEffort(assessments: RequirementAssessment[]): number {
    let totalHours = 0;

    assessments.forEach(assessment => {
      if (assessment.status === 'non_compliant') {
        totalHours += assessment.priority === 'critical' ? 40 : 20;
      } else if (assessment.status === 'partial') {
        totalHours += 10;
      }
    });

    return totalHours;
  }

  /**
   * Assess risk level
   */
  private assessRiskLevel(complianceScore: number, criticalGaps: number): RiskLevel {
    if (criticalGaps > 5 || complianceScore < 30) return 'critical';
    if (criticalGaps > 2 || complianceScore < 50) return 'high';
    if (criticalGaps > 0 || complianceScore < 70) return 'medium';
    if (complianceScore < 90) return 'low';
    return 'minimal';
  }

  /**
   * Generate next steps
   */
  private generateNextSteps(assessments: RequirementAssessment[]): string[] {
    const steps: string[] = [];

    // Critical gaps first
    const criticalGaps = assessments.filter(
      a => a.status === 'non_compliant' && a.priority === 'critical'
    );

    if (criticalGaps.length > 0) {
      steps.push(`1. Address ${criticalGaps.length} critical compliance gaps immediately`);
      steps.push('2. Engage legal counsel for regulatory risk assessment');
      steps.push('3. Implement emergency data collection procedures');
    }

    // High priority gaps
    const highGaps = assessments.filter(
      a => a.status === 'non_compliant' && a.priority === 'high'
    );

    if (highGaps.length > 0) {
      steps.push(`${steps.length + 1}. Resolve ${highGaps.length} high-priority gaps within 30 days`);
    }

    // Partial compliance
    const partialGaps = assessments.filter(a => a.status === 'partial');
    if (partialGaps.length > 0) {
      steps.push(`${steps.length + 1}. Complete ${partialGaps.length} partially compliant requirements`);
    }

    return steps;
  }

  /**
   * Get earliest deadline from assessments
   */
  private getEarliestDeadline(assessments: RequirementAssessment[]): Date {
    const deadlines = assessments
      .map(a => a.deadline)
      .filter(d => d !== undefined)
      .sort((a, b) => a!.getTime() - b!.getTime());

    return deadlines[0] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  /**
   * Store gap analysis results
   */
  private async storeGapAnalysis(results: GapAnalysisResult[]) {
    for (const result of results) {
      await this.supabase.from('compliance_gap_analysis').insert({
        organization_id: result.organizationId,
        framework_id: result.frameworkId,
        compliance_score: result.complianceScore,
        risk_level: result.riskLevel,
        analysis_data: result,
        analyzed_at: result.analyzedAt.toISOString()
      });
    }
  }

  /**
   * Load requirements from database
   */
  private async loadFromDatabase() {
    const { data } = await this.supabase
      .from('compliance_requirements')
      .select('*');

    if (data) {
      data.forEach(req => {
        const existing = this.requirements.get(req.framework_id) || [];
        existing.push(req);
        this.requirements.set(req.framework_id, existing);
      });
    }
  }

  /**
   * Get quarterly deadline
   */
  private getQuarterlyDeadline(): Date {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const year = now.getFullYear();

    if (quarter === 3) {
      return new Date(year + 1, 2, 31); // Q1 next year
    } else {
      return new Date(year, (quarter + 1) * 3 + 2, 31);
    }
  }

  /**
   * Get annual deadline
   */
  private getAnnualDeadline(): Date {
    const now = new Date();
    return new Date(now.getFullYear() + 1, 2, 31); // March 31 next year
  }

  /**
   * Get compliance status for organization
   */
  public async getComplianceStatus(
    organizationId: string
  ): Promise<ComplianceStatusSummary> {
    const frameworkStatuses: FrameworkStatus[] = [];

    for (const [frameworkId, framework] of this.frameworks) {
      const gapAnalysis = this.gapAnalysis.get(`${organizationId}_${frameworkId}`);

      if (gapAnalysis) {
        frameworkStatuses.push({
          frameworkId,
          frameworkName: framework.name,
          complianceScore: gapAnalysis.complianceScore,
          riskLevel: gapAnalysis.riskLevel,
          criticalGaps: gapAnalysis.criticalGaps.length,
          nextDeadline: this.deadlineTracker.getNextDeadline(frameworkId),
          lastAssessed: gapAnalysis.analyzedAt
        });
      }
    }

    return {
      organizationId,
      overallScore: this.calculateOverallScore(frameworkStatuses),
      frameworkStatuses,
      upcomingDeadlines: await this.deadlineTracker.getUpcomingDeadlines(organizationId),
      recentChanges: await this.changeMonitor.getRecentChanges(),
      recommendations: await this.getTopRecommendations(organizationId)
    };
  }

  /**
   * Calculate overall compliance score
   */
  private calculateOverallScore(statuses: FrameworkStatus[]): number {
    if (statuses.length === 0) return 0;

    const totalScore = statuses.reduce((sum, status) => sum + status.complianceScore, 0);
    return Math.round(totalScore / statuses.length);
  }

  /**
   * Get top recommendations
   */
  private async getTopRecommendations(
    organizationId: string
  ): Promise<ComplianceRecommendation[]> {
    const allRecommendations: ComplianceRecommendation[] = [];

    this.gapAnalysis.forEach((analysis, key) => {
      if (key.startsWith(organizationId)) {
        allRecommendations.push(...analysis.recommendations);
      }
    });

    // Sort by priority and return top 5
    return allRecommendations
      .sort((a, b) => {
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 5);
  }
}

/**
 * Deadline Tracker
 */
class DeadlineTracker {
  private deadlines: Map<string, ComplianceDeadline[]> = new Map();

  public addDeadline(deadline: ComplianceDeadline) {
    const existing = this.deadlines.get(deadline.frameworkId) || [];
    existing.push(deadline);
    this.deadlines.set(deadline.frameworkId, existing);
  }

  public getNextDeadline(frameworkId: string): Date | undefined {
    const frameworkDeadlines = this.deadlines.get(frameworkId) || [];
    const future = frameworkDeadlines.filter(d => d.date > new Date());
    future.sort((a, b) => a.date.getTime() - b.date.getTime());
    return future[0]?.date;
  }

  public async getUpcomingDeadlines(
    organizationId: string,
    days: number = 90
  ): Promise<ComplianceDeadline[]> {
    const upcoming: ComplianceDeadline[] = [];
    const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    this.deadlines.forEach(frameworkDeadlines => {
      frameworkDeadlines
        .filter(d => d.date <= cutoff && d.date > new Date())
        .forEach(d => upcoming.push(d));
    });

    return upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}

/**
 * Regulatory Change Monitor
 */
class RegulatoryChangeMonitor {
  private changes: RegulatoryChange[] = [];

  public addChange(change: RegulatoryChange) {
    this.changes.push(change);
  }

  public async getRecentChanges(days: number = 30): Promise<RegulatoryChange[]> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return this.changes
      .filter(c => c.publishedDate > cutoff)
      .sort((a, b) => b.publishedDate.getTime() - a.publishedDate.getTime());
  }

  public async checkForUpdates() {
    // In production, this would check external regulatory databases
  }
}

// Type Definitions
interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  effectiveDate: Date;
  jurisdiction: string;
  applicability: {
    criteria: string[];
    thresholds: {
      revenue?: number;
      employees?: number;
      assets?: number;
      marketCap?: number;
    };
  };
  categories: FrameworkCategory[];
  penalties: {
    maxFine: number;
    type: string;
    enforcer: string;
  };
}

interface FrameworkCategory {
  id: string;
  name: string;
  requirements: number;
  weight: number;
}

interface ComplianceRequirement {
  id: string;
  frameworkId: string;
  category: string;
  requirement: string;
  description: string;
  dataPoints: string[];
  evidence: string[];
  deadline: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'complete';
}

interface GapAnalysisResult {
  frameworkId: string;
  frameworkName: string;
  analyzedAt: Date;
  organizationId: string;
  applicable: boolean;
  complianceScore: number;
  totalRequirements: number;
  compliantCount: number;
  partialCount: number;
  nonCompliantCount: number;
  criticalGaps: string[];
  assessments: RequirementAssessment[];
  recommendations: ComplianceRecommendation[];
  estimatedEffort: number;
  riskLevel: RiskLevel;
  nextSteps: string[];
}

interface RequirementAssessment {
  requirementId: string;
  requirement: string;
  category: string;
  status: ComplianceStatus;
  completeness: number;
  gaps: string[];
  priority: string;
  deadline?: Date;
  dataAvailability: DataAvailability;
  evidenceAvailability: DataAvailability;
  remediationActions: string[];
}

interface DataAvailability {
  total: number;
  available: string[];
  missing: string[];
  percentage: number;
}

interface ComplianceRecommendation {
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actions: string[];
  estimatedEffort: number;
  deadline: Date;
  impact: string;
  resources: string[];
}

interface ComplianceScore {
  frameworkId: string;
  score: number;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

interface ComplianceDeadline {
  frameworkId: string;
  requirement: string;
  date: Date;
  type: 'filing' | 'disclosure' | 'audit' | 'certification';
  description: string;
}

interface RegulatoryChange {
  frameworkId: string;
  changeType: 'new' | 'update' | 'clarification';
  title: string;
  description: string;
  publishedDate: Date;
  effectiveDate: Date;
  impact: 'low' | 'medium' | 'high';
  requiredActions: string[];
}

interface ComplianceStatusSummary {
  organizationId: string;
  overallScore: number;
  frameworkStatuses: FrameworkStatus[];
  upcomingDeadlines: ComplianceDeadline[];
  recentChanges: RegulatoryChange[];
  recommendations: ComplianceRecommendation[];
}

interface FrameworkStatus {
  frameworkId: string;
  frameworkName: string;
  complianceScore: number;
  riskLevel: RiskLevel;
  criticalGaps: number;
  nextDeadline?: Date;
  lastAssessed: Date;
}

type ComplianceStatus = 'compliant' | 'partial' | 'non_compliant';
type RiskLevel = 'minimal' | 'low' | 'medium' | 'high' | 'critical';

// Export singleton instance
export const complianceIntelligenceEngine = new ComplianceIntelligenceEngine();