import { gdprService } from './gdpr';
import { soc2Service } from './soc2';
import { auditService } from '@/lib/audit/service';
import { AuditEventType, AuditEventSeverity } from '@/lib/audit/types';
import {
  ComplianceFramework,
  ConsentType,
  ConsentStatus,
  PrivacySettings,
  DataProcessingActivity,
  PrivacyImpactAssessment,
  PrivacyRisk,
  RiskMitigation,
  Approval,
} from './types';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Unified Compliance Service
 * Coordinates compliance activities across multiple frameworks
 */
export class ComplianceService {
  /**
   * Check overall compliance status
   */
  async getComplianceStatus(userId?: string): Promise<{
    frameworks: Record<ComplianceFramework, {
      compliant: boolean;
      score: number;
      issues: string[];
    }>;
    overallCompliant: boolean;
    recommendations: string[];
  }> {
    const frameworks: Record<string, any> = {};

    // Check GDPR compliance
    const gdprStatus = await this.checkGDPRCompliance(userId);
    frameworks[ComplianceFramework.GDPR] = gdprStatus;

    // Check SOC2 compliance
    const soc2Status = await this.checkSOC2Compliance();
    frameworks[ComplianceFramework.SOC2] = soc2Status;

    // Overall compliance
    const overallCompliant = Object.values(frameworks).every(f => f.compliant);
    
    // Generate recommendations
    const recommendations: string[] = [];
    Object.entries(frameworks).forEach(([framework, status]) => {
      if (!status.compliant) {
        recommendations.push(`Address ${status.issues.length} issues in ${framework} compliance`);
      }
    });

    return {
      frameworks: frameworks as any,
      overallCompliant,
      recommendations,
    };
  }

  /**
   * Check GDPR compliance
   */
  private async checkGDPRCompliance(userId?: string): Promise<{
    compliant: boolean;
    score: number;
    issues: string[];
  }> {
    const issues: string[] = [];
    let score = 100;

    if (userId) {
      // Check user consents
      const consents = await gdprService.getUserConsents(userId);
      const requiredConsents = [
        ConsentType.NECESSARY,
        ConsentType.FUNCTIONAL,
      ];

      for (const type of requiredConsents) {
        const consent = consents.find(c => c.type === type && c.status === ConsentStatus.GRANTED);
        if (!consent) {
          issues.push(`Missing required consent: ${type}`);
          score -= 10;
        }
      }

      // Check privacy settings
      const { data: settings } = await supabaseAdmin
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (!settings) {
        issues.push('Privacy settings not configured');
        score -= 20;
      }
    }

    // Check data retention policies
    const { data: policies } = await supabaseAdmin
      .from('data_retention_policies')
      .select('*')
      .eq('framework', ComplianceFramework.GDPR);

    if (!policies || policies.length === 0) {
      issues.push('No GDPR data retention policies defined');
      score -= 15;
    }

    // Check privacy notice
    const { data: privacyNotice } = await supabaseAdmin
      .from('legal_documents')
      .select('*')
      .eq('type', 'privacy_notice')
      .eq('active', true)
      .single();

    if (!privacyNotice) {
      issues.push('Privacy notice not found or not active');
      score -= 25;
    }

    return {
      compliant: issues.length === 0,
      score: Math.max(0, score),
      issues,
    };
  }

  /**
   * Check SOC2 compliance
   */
  private async checkSOC2Compliance(): Promise<{
    compliant: boolean;
    score: number;
    issues: string[];
  }> {
    const issues: string[] = [];
    let score = 100;

    // Check security policy
    try {
      const policy = await soc2Service.getSecurityPolicy();
      const implemented = policy.requirements.filter(r => r.implemented).length;
      const total = policy.requirements.length;
      const implementationRate = implemented / total;

      if (implementationRate < 1) {
        issues.push(`${total - implemented} security requirements not implemented`);
        score -= Math.round((1 - implementationRate) * 50);
      }
    } catch (error) {
      issues.push('Security policy not found');
      score -= 30;
    }

    // Check access controls
    const accessControls = await soc2Service.checkAccessControls();
    if (!accessControls.passed) {
      issues.push(...accessControls.issues);
      score -= accessControls.issues.length * 5;
    }

    // Check monitoring
    const { data: alerts } = await supabaseAdmin
      .from('alert_rules')
      .select('*')
      .eq('enabled', true);

    if (!alerts || alerts.length < 5) {
      issues.push('Insufficient monitoring alerts configured');
      score -= 10;
    }

    // Check encryption
    const encryptionEnabled = process.env.ENCRYPTION_PROVIDER !== 'local';
    if (!encryptionEnabled) {
      issues.push('Production encryption provider not configured');
      score -= 20;
    }

    return {
      compliant: issues.length === 0,
      score: Math.max(0, score),
      issues,
    };
  }

  /**
   * Create data processing activity record (GDPR Article 30)
   */
  async createDataProcessingActivity(
    activity: Omit<DataProcessingActivity, 'id'>
  ): Promise<DataProcessingActivity> {
    const record: DataProcessingActivity = {
      id: crypto.randomUUID(),
      ...activity,
    };

    const { error } = await supabaseAdmin
      .from('data_processing_activities')
      .insert({
        id: record.id,
        name: record.name,
        purpose: record.purpose,
        legal_basis: record.legalBasis,
        data_categories: record.dataCategories,
        data_subjects: record.dataSubjects,
        recipients: record.recipients,
        retention_period: record.retentionPeriod,
        safeguards: record.safeguards,
        cross_border_transfers: record.crossBorderTransfers,
        transfer_mechanisms: record.transferMechanisms,
      });

    if (error) {
      throw error;
    }

    await auditService.log({
      type: AuditEventType.POLICY_CREATED,
      severity: AuditEventSeverity.INFO,
      actor: { type: 'system', id: 'compliance-service' },
      context: {},
      metadata: {
        action: 'data_processing_activity_created',
        framework: ComplianceFramework.GDPR,
        activityId: record.id,
        name: record.name,
      },
      result: 'success',
    });

    return record;
  }

  /**
   * Create privacy impact assessment
   */
  async createPrivacyImpactAssessment(
    assessment: Omit<PrivacyImpactAssessment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PrivacyImpactAssessment> {
    const pia: PrivacyImpactAssessment = {
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...assessment,
    };

    const { error } = await supabaseAdmin
      .from('privacy_impact_assessments')
      .insert({
        id: pia.id,
        project_name: pia.projectName,
        description: pia.description,
        created_at: pia.createdAt,
        updated_at: pia.updatedAt,
        status: pia.status,
        risk_level: pia.riskLevel,
        data_processing_activities: pia.dataProcessingActivities,
        risks: pia.risks,
        mitigations: pia.mitigations,
        approvals: pia.approvals,
      });

    if (error) {
      throw error;
    }

    await auditService.log({
      type: AuditEventType.POLICY_CREATED,
      severity: AuditEventSeverity.INFO,
      actor: { type: 'system', id: 'compliance-service' },
      context: {},
      metadata: {
        action: 'privacy_impact_assessment_created',
        framework: ComplianceFramework.GDPR,
        assessmentId: pia.id,
        projectName: pia.projectName,
        riskLevel: pia.riskLevel,
      },
      result: 'success',
    });

    return pia;
  }

  /**
   * Export compliance data for audit
   */
  async exportComplianceData(
    frameworks: ComplianceFramework[],
    period: { start: Date; end: Date }
  ): Promise<{
    reports: any[];
    policies: any[];
    activities: any[];
    assessments: any[];
    findings: any[];
  }> {
    const data: any = {
      reports: [],
      policies: [],
      activities: [],
      assessments: [],
      findings: [],
    };

    // Get compliance reports
    const { data: reports } = await supabaseAdmin
      .from('compliance_reports')
      .select('*')
      .in('framework', frameworks)
      .gte('generated_at', period.start.toISOString())
      .lte('generated_at', period.end.toISOString());
    data.reports = reports || [];

    // Get security policies
    const { data: policies } = await supabaseAdmin
      .from('security_policies')
      .select('*')
      .in('framework', frameworks);
    data.policies = policies || [];

    // Get data processing activities
    if (frameworks.includes(ComplianceFramework.GDPR)) {
      const { data: activities } = await supabaseAdmin
        .from('data_processing_activities')
        .select('*');
      data.activities = activities || [];

      const { data: assessments } = await supabaseAdmin
        .from('privacy_impact_assessments')
        .select('*')
        .gte('created_at', period.start.toISOString())
        .lte('created_at', period.end.toISOString());
      data.assessments = assessments || [];
    }

    // Get compliance findings from reports
    data.findings = data.reports.flatMap((r: any) => r.findings || []);

    await auditService.log({
      type: AuditEventType.DATA_ACCESS,
      severity: AuditEventSeverity.INFO,
      actor: { type: 'system', id: 'compliance-service' },
      context: {},
      metadata: {
        action: 'compliance_data_exported',
        frameworks,
        period,
        recordCounts: {
          reports: data.reports.length,
          policies: data.policies.length,
          activities: data.activities.length,
          assessments: data.assessments.length,
          findings: data.findings.length,
        },
      },
      result: 'success',
    });

    return data;
  }

  /**
   * Validate compliance before system changes
   */
  async validateCompliance(
    changeType: 'data_schema' | 'security_config' | 'privacy_settings' | 'retention_policy',
    changes: Record<string, any>
  ): Promise<{
    valid: boolean;
    violations: string[];
    recommendations: string[];
  }> {
    const violations: string[] = [];
    const recommendations: string[] = [];

    switch (changeType) {
      case 'data_schema':
        // Check if new fields require privacy assessment
        if (changes.personalData) {
          recommendations.push('Consider updating Privacy Impact Assessment');
          recommendations.push('Update data processing activities record');
        }
        break;

      case 'security_config':
        // Check if changes affect SOC2 requirements
        if (changes.mfaRequired === false) {
          violations.push('Disabling MFA violates SOC2 security requirements');
        }
        if (changes.sessionTimeout && changes.sessionTimeout > 30 * 60) {
          recommendations.push('Session timeout exceeds recommended 30 minutes');
        }
        break;

      case 'privacy_settings':
        // Check GDPR compliance
        if (changes.dataSharing && !changes.consent) {
          violations.push('Data sharing requires explicit consent under GDPR');
        }
        break;

      case 'retention_policy':
        // Check retention periods
        if (changes.retentionDays < 0) {
          violations.push('Retention period cannot be negative');
        }
        if (changes.retentionDays > 2555) { // 7 years
          recommendations.push('Consider if such long retention is necessary');
        }
        break;
    }

    return {
      valid: violations.length === 0,
      violations,
      recommendations,
    };
  }
}

// Export singleton instance
export const complianceService = new ComplianceService();

// Re-export sub-services
export { gdprService, soc2Service };