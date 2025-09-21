/**
 * Base Framework Engine
 *
 * Abstract base class for all compliance framework implementations.
 * Provides common functionality for compliance monitoring, scoring, and reporting.
 */

import {
  ComplianceFramework,
  ComplianceAssessment,
  ComplianceScore,
  ComplianceRecommendation,
  ComplianceFinding,
  RegulatoryUpdate,
  ComplianceReport,
  ComplianceAlert,
  DataRequirement,
  ComplianceRequirement
} from '../types';

export abstract class BaseFrameworkEngine {
  protected framework: ComplianceFramework;
  protected organizationId: string;

  constructor(framework: ComplianceFramework, organizationId: string) {
    this.framework = framework;
    this.organizationId = organizationId;
  }

  // Abstract methods that must be implemented by specific frameworks
  abstract assessCompliance(scope?: string[]): Promise<ComplianceAssessment>;
  abstract calculateScore(assessment: ComplianceAssessment): Promise<ComplianceScore>;
  abstract generateRecommendations(findings: ComplianceFinding[]): Promise<ComplianceRecommendation[]>;
  abstract generateReport(type: string, period: any): Promise<ComplianceReport>;
  abstract validateData(data: any): Promise<ValidationResult[]>;
  abstract mapRequirements(): ComplianceRequirement[];
  abstract processRegulatoryUpdate(update: RegulatoryUpdate): Promise<UpdateProcessResult>;

  // Common functionality
  public async getFrameworkInfo(): Promise<ComplianceFramework> {
    return this.framework;
  }

  public async getDataRequirements(requirementIds?: string[]): Promise<DataRequirement[]> {
    const requirements = this.mapRequirements();

    if (requirementIds) {
      const filteredRequirements = requirements.filter(req =>
        requirementIds.includes(req.id)
      );
      return this.extractDataRequirements(filteredRequirements);
    }

    return this.extractDataRequirements(requirements);
  }

  public async checkDeadlines(): Promise<ComplianceAlert[]> {
    const alerts: ComplianceAlert[] = [];
    const now = new Date();

    for (const deadline of this.framework.deadlines) {
      const daysUntilDeadline = Math.ceil(
        (deadline.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilDeadline <= 30 && daysUntilDeadline > 0) {
        alerts.push({
          id: `deadline_${deadline.id}_${Date.now()}`,
          type: 'deadline_approaching',
          severity: daysUntilDeadline <= 7 ? 'critical' :
                   daysUntilDeadline <= 14 ? 'error' : 'warning',
          title: `${this.framework.name} Deadline Approaching`,
          message: `${deadline.name} is due in ${daysUntilDeadline} days`,
          frameworkId: this.framework.id,
          deadlineId: deadline.id,
          source: 'framework_engine',
          timestamp: now,
          acknowledged: false,
          resolved: false,
          actions: [
            {
              id: 'view_deadline',
              title: 'View Deadline Details',
              description: 'View full deadline information and requirements',
              type: 'view',
              priority: 1
            },
            {
              id: 'start_preparation',
              title: 'Start Preparation',
              description: 'Begin preparing for this deadline',
              type: 'edit',
              priority: 2
            }
          ]
        });
      } else if (daysUntilDeadline <= 0) {
        alerts.push({
          id: `overdue_${deadline.id}_${Date.now()}`,
          type: 'deadline_missed',
          severity: 'critical',
          title: `${this.framework.name} Deadline Missed`,
          message: `${deadline.name} was due ${Math.abs(daysUntilDeadline)} days ago`,
          frameworkId: this.framework.id,
          deadlineId: deadline.id,
          source: 'framework_engine',
          timestamp: now,
          acknowledged: false,
          resolved: false,
          actions: [
            {
              id: 'escalate',
              title: 'Escalate Issue',
              description: 'Escalate this missed deadline to management',
              type: 'escalate',
              priority: 1
            },
            {
              id: 'request_extension',
              title: 'Request Extension',
              description: 'Request deadline extension if possible',
              type: 'edit',
              priority: 2
            }
          ]
        });
      }
    }

    return alerts;
  }

  public async identifyGaps(currentData: any): Promise<ComplianceFinding[]> {
    const requirements = this.mapRequirements();
    const findings: ComplianceFinding[] = [];

    for (const requirement of requirements) {
      const gaps = await this.analyzeRequirementGaps(requirement, currentData);
      findings.push(...gaps);
    }

    return findings;
  }

  public async getBenchmarkData(): Promise<BenchmarkData> {
    // This would typically fetch from external sources or internal databases
    return {
      industry: await this.getIndustryBenchmark(),
      region: await this.getRegionalBenchmark(),
      size: await this.getSizeBenchmark(),
      peers: await this.getPeerBenchmark()
    };
  }

  // Protected helper methods
  protected extractDataRequirements(requirements: ComplianceRequirement[]): DataRequirement[] {
    const allDataRequirements: DataRequirement[] = [];

    for (const requirement of requirements) {
      allDataRequirements.push(...requirement.dataRequirements);
    }

    // Remove duplicates based on ID
    const uniqueDataRequirements = allDataRequirements.filter(
      (req, index, array) => array.findIndex(r => r.id === req.id) === index
    );

    return uniqueDataRequirements;
  }

  protected async analyzeRequirementGaps(
    requirement: ComplianceRequirement,
    currentData: any
  ): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    // Check if required data is available
    for (const dataReq of requirement.dataRequirements) {
      if (dataReq.mandatory && !this.hasRequiredData(dataReq, currentData)) {
        findings.push({
          id: `gap_${requirement.id}_${dataReq.id}_${Date.now()}`,
          requirementId: requirement.id,
          severity: requirement.priority === 'critical' ? 'critical' :
                   requirement.priority === 'high' ? 'high' : 'medium',
          type: 'gap',
          description: `Missing required data: ${dataReq.name}`,
          evidence: [`Data requirement: ${dataReq.description}`],
          impact: {
            financial: 5,
            operational: 6,
            reputational: 4,
            regulatory: 8,
            environmental: 3,
            social: 3,
            description: `Missing ${dataReq.name} prevents compliance with ${requirement.title}`
          },
          recommendation: `Collect and provide ${dataReq.name} data from ${dataReq.source}`,
          status: 'open',
          createdDate: new Date(),
          updatedDate: new Date()
        });
      }
    }

    return findings;
  }

  protected hasRequiredData(dataReq: DataRequirement, currentData: any): boolean {
    // Simple check - in real implementation, this would be more sophisticated
    return currentData && currentData[dataReq.name] !== undefined;
  }

  protected async getIndustryBenchmark(): Promise<number> {
    // Mock implementation - would fetch from external data sources
    return 75 + Math.random() * 15; // 75-90 range
  }

  protected async getRegionalBenchmark(): Promise<number> {
    // Mock implementation
    return 70 + Math.random() * 20; // 70-90 range
  }

  protected async getSizeBenchmark(): Promise<number> {
    // Mock implementation
    return 65 + Math.random() * 25; // 65-90 range
  }

  protected async getPeerBenchmark(): Promise<number> {
    // Mock implementation
    return 80 + Math.random() * 15; // 80-95 range
  }

  protected calculateTrendDirection(currentScore: number, previousScore: number): 'improving' | 'declining' | 'stable' {
    const difference = currentScore - previousScore;
    const threshold = 2; // 2 point threshold for meaningful change

    if (difference > threshold) return 'improving';
    if (difference < -threshold) return 'declining';
    return 'stable';
  }

  protected prioritizeFindings(findings: ComplianceFinding[]): ComplianceFinding[] {
    return findings.sort((a, b) => {
      // Sort by severity first
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];

      if (severityDiff !== 0) return severityDiff;

      // Then by regulatory impact
      return b.impact.regulatory - a.impact.regulatory;
    });
  }

  protected async generateStandardRecommendations(
    findings: ComplianceFinding[]
  ): Promise<ComplianceRecommendation[]> {
    const recommendations: ComplianceRecommendation[] = [];

    // Group findings by type
    const gaps = findings.filter(f => f.type === 'gap');
    const nonCompliance = findings.filter(f => f.type === 'non_compliance');

    if (gaps.length > 0) {
      recommendations.push({
        id: `rec_data_collection_${Date.now()}`,
        title: 'Implement Comprehensive Data Collection',
        description: 'Establish systematic data collection processes for missing compliance data',
        priority: 'high',
        type: 'process_improvement',
        effort: {
          hours: 40 * gaps.length,
          cost: 5000 * gaps.length,
          complexity: 'medium',
          skillsRequired: ['data_analyst', 'process_specialist']
        },
        impact: {
          complianceImprovement: 30,
          riskReduction: 40,
          efficiency: 20,
          timeToValue: '2-3 months'
        },
        timeline: '8-12 weeks',
        resources: ['data_collection_specialist', 'software_tools'],
        dependencies: ['stakeholder_approval', 'system_access'],
        risks: ['data_quality_issues', 'resource_constraints'],
        benefits: ['improved_compliance', 'better_decision_making', 'automated_reporting'],
        status: 'proposed'
      });
    }

    if (nonCompliance.length > 0) {
      recommendations.push({
        id: `rec_compliance_remediation_${Date.now()}`,
        title: 'Immediate Compliance Remediation',
        description: 'Address non-compliance issues with immediate action plan',
        priority: 'critical',
        type: 'process_improvement',
        effort: {
          hours: 20 * nonCompliance.length,
          cost: 3000 * nonCompliance.length,
          complexity: 'high',
          skillsRequired: ['compliance_specialist', 'legal_advisor']
        },
        impact: {
          complianceImprovement: 50,
          riskReduction: 60,
          efficiency: 10,
          timeToValue: '1-2 months'
        },
        timeline: '2-4 weeks',
        resources: ['compliance_team', 'legal_support'],
        dependencies: ['management_approval'],
        risks: ['regulatory_penalties', 'reputational_damage'],
        benefits: ['regulatory_compliance', 'risk_mitigation'],
        status: 'proposed'
      });
    }

    return recommendations;
  }
}

// Supporting interfaces
export interface ValidationResult {
  field: string;
  status: 'valid' | 'invalid' | 'warning';
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface UpdateProcessResult {
  processed: boolean;
  impactAssessment: any;
  actionItems: any[];
  timeline: string;
  stakeholders: string[];
}

export interface BenchmarkData {
  industry: number;
  region: number;
  size: number;
  peers: number;
}