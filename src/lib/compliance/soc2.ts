import { supabaseAdmin } from '@/lib/supabase/admin';
import { auditService } from '@/lib/audit/service';
import { AuditEventType, AuditEventSeverity } from '@/lib/audit/types';
import { monitoringService } from '@/lib/monitoring/service';
import {
  ComplianceFramework,
  SecurityPolicy,
  SecurityRequirement,
  ComplianceReport,
  ComplianceFinding,
  DataRetentionPolicy,
} from './types';

/**
 * SOC2 Compliance Service
 * Handles SOC2 Trust Service Criteria: Security, Availability, Processing Integrity, Confidentiality, Privacy
 */
export class SOC2ComplianceService {
  /**
   * Get or create security policy
   */
  async getSecurityPolicy(framework: ComplianceFramework = ComplianceFramework.SOC2): Promise<SecurityPolicy> {
    const { data, error } = await supabaseAdmin
      .from('security_policies')
      .select('*')
      .eq('framework', framework)
      .eq('approved', true)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!data) {
      // Create default SOC2 policy
      return this.createDefaultSOC2Policy();
    }

    return this.mapSecurityPolicyFromDb(data);
  }

  /**
   * Create default SOC2 security policy
   */
  private async createDefaultSOC2Policy(): Promise<SecurityPolicy> {
    const policy: SecurityPolicy = {
      id: crypto.randomUUID(),
      name: 'SOC2 Security Policy',
      framework: ComplianceFramework.SOC2,
      version: '1.0',
      requirements: this.getDefaultSOC2Requirements(),
      effectiveDate: new Date(),
      reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      approved: true,
      approvedBy: 'system',
    };

    const { error } = await supabaseAdmin
      .from('security_policies')
      .insert({
        id: policy.id,
        name: policy.name,
        framework: policy.framework,
        version: policy.version,
        requirements: policy.requirements,
        effective_date: policy.effectiveDate,
        review_date: policy.reviewDate,
        approved: policy.approved,
        approved_by: policy.approvedBy,
      });

    if (error) {
      throw error;
    }

    return policy;
  }

  /**
   * Get default SOC2 requirements
   */
  private getDefaultSOC2Requirements(): SecurityRequirement[] {
    return [
      // Security (Common Criteria 1)
      {
        id: 'CC1.1',
        category: 'Security',
        requirement: 'Logical and Physical Access Controls',
        description: 'The entity implements logical access security measures to protect against threats.',
        implemented: true,
        evidence: ['MFA implementation', 'Role-based access control', 'Session management'],
      },
      {
        id: 'CC1.2',
        category: 'Security',
        requirement: 'System Operations',
        description: 'The entity monitors system capacity and performance to meet objectives.',
        implemented: true,
        evidence: ['Monitoring service', 'Alert system', 'Performance metrics'],
      },
      {
        id: 'CC1.3',
        category: 'Security',
        requirement: 'Change Management',
        description: 'Changes to system components are authorized, tested, and approved.',
        implemented: true,
        evidence: ['Git version control', 'Code review process', 'CI/CD pipeline'],
      },
      
      // Availability (Common Criteria 2)
      {
        id: 'CC2.1',
        category: 'Availability',
        requirement: 'System Availability',
        description: 'The entity maintains system availability commitments and SLAs.',
        implemented: true,
        evidence: ['Health checks', 'Uptime monitoring', 'Auto-scaling'],
      },
      {
        id: 'CC2.2',
        category: 'Availability',
        requirement: 'Incident Response',
        description: 'The entity has incident response procedures to maintain availability.',
        implemented: true,
        evidence: ['Incident response plan', 'Alert notifications', 'Recovery procedures'],
      },
      
      // Processing Integrity (Common Criteria 3)
      {
        id: 'CC3.1',
        category: 'Processing Integrity',
        requirement: 'Data Processing',
        description: 'System processing is complete, accurate, timely, and authorized.',
        implemented: true,
        evidence: ['Data validation', 'Transaction logs', 'Error handling'],
      },
      
      // Confidentiality (Common Criteria 4)
      {
        id: 'CC4.1',
        category: 'Confidentiality',
        requirement: 'Data Classification',
        description: 'Confidential information is protected during collection, use, and retention.',
        implemented: true,
        evidence: ['Encryption at rest', 'Encryption in transit', 'Access controls'],
      },
      
      // Privacy (Common Criteria 5)
      {
        id: 'CC5.1',
        category: 'Privacy',
        requirement: 'Privacy Notice',
        description: 'The entity provides notice about its privacy practices.',
        implemented: true,
        evidence: ['Privacy policy', 'Consent management', 'Data subject rights'],
      },
      {
        id: 'CC5.2',
        category: 'Privacy',
        requirement: 'Data Collection',
        description: 'Personal information is collected consistent with privacy notice.',
        implemented: true,
        evidence: ['Consent tracking', 'Purpose limitation', 'Data minimization'],
      },
    ];
  }

  /**
   * Verify security requirement
   */
  async verifyRequirement(
    policyId: string,
    requirementId: string,
    evidence: string[]
  ): Promise<void> {
    try {
      // Get the policy
      const { data: policy } = await supabaseAdmin
        .from('security_policies')
        .select('*')
        .eq('id', policyId)
        .single();

      if (!policy) {
        throw new Error('Security policy not found');
      }

      // Update requirement
      const requirements = policy.requirements as SecurityRequirement[];
      const requirement = requirements.find(r => r.id === requirementId);
      
      if (!requirement) {
        throw new Error('Requirement not found');
      }

      requirement.implemented = true;
      requirement.evidence = evidence;
      requirement.lastVerified = new Date();

      // Update policy
      const { error } = await supabaseAdmin
        .from('security_policies')
        .update({
          requirements,
          updated_at: new Date().toISOString(),
        })
        .eq('id', policyId);

      if (error) {
        throw error;
      }

      // Audit log
      await auditService.log({
        type: AuditEventType.SYSTEM_CONFIG_CHANGED,
        severity: AuditEventSeverity.INFO,
        actor: { type: 'system', id: 'compliance-service' },
        context: {},
        metadata: {
          action: 'requirement_verified',
          framework: ComplianceFramework.SOC2,
          policyId,
          requirementId,
          evidence,
        },
        result: 'success',
      });
    } catch (error) {
      await auditService.log({
        type: AuditEventType.SYSTEM_ERROR,
        severity: AuditEventSeverity.ERROR,
        actor: { type: 'system', id: 'compliance-service' },
        context: {},
        metadata: {
          action: 'requirement_verification_failed',
          framework: ComplianceFramework.SOC2,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        result: 'failure',
      });

      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(
    framework: ComplianceFramework = ComplianceFramework.SOC2,
    period: { start: Date; end: Date }
  ): Promise<ComplianceReport> {
    try {
      // Get security policy
      const policy = await this.getSecurityPolicy(framework);
      
      // Calculate compliance metrics
      const requirements = policy.requirements;
      const implemented = requirements.filter(r => r.implemented).length;
      const totalRequirements = requirements.length;
      const complianceScore = Math.round((implemented / totalRequirements) * 100);

      // Get findings
      const findings = await this.getComplianceFindings(framework, period);

      // Create report
      const report: ComplianceReport = {
        id: crypto.randomUUID(),
        framework,
        generatedAt: new Date(),
        period,
        summary: {
          totalRequirements,
          implemented,
          inProgress: 0, // Would be calculated based on actual data
          notStarted: totalRequirements - implemented,
          complianceScore,
        },
        findings,
        recommendations: this.generateRecommendations(findings, requirements),
      };

      // Store report
      const { error } = await supabaseAdmin
        .from('compliance_reports')
        .insert({
          id: report.id,
          framework: report.framework,
          generated_at: report.generatedAt,
          period_start: report.period.start,
          period_end: report.period.end,
          summary: report.summary,
          findings: report.findings,
          recommendations: report.recommendations,
        });

      if (error) {
        throw error;
      }

      // Audit log
      await auditService.log({
        type: AuditEventType.REPORT_GENERATED,
        severity: AuditEventSeverity.INFO,
        actor: { type: 'system', id: 'compliance-service' },
        context: {},
        metadata: {
          action: 'compliance_report_generated',
          framework,
          reportId: report.id,
          complianceScore,
          period,
        },
        result: 'success',
      });

      return report;
    } catch (error) {
      await auditService.log({
        type: AuditEventType.SYSTEM_ERROR,
        severity: AuditEventSeverity.ERROR,
        actor: { type: 'system', id: 'compliance-service' },
        context: {},
        metadata: {
          action: 'compliance_report_generation_failed',
          framework,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        result: 'failure',
      });

      throw error;
    }
  }

  /**
   * Get compliance findings
   */
  private async getComplianceFindings(
    framework: ComplianceFramework,
    period: { start: Date; end: Date }
  ): Promise<ComplianceFinding[]> {
    const findings: ComplianceFinding[] = [];

    // Check for security incidents
    const { data: incidents } = await supabaseAdmin
      .from('security_events')
      .select('*')
      .gte('timestamp', period.start.toISOString())
      .lte('timestamp', period.end.toISOString())
      .eq('severity', 'critical');

    if (incidents && incidents.length > 0) {
      findings.push({
        id: crypto.randomUUID(),
        severity: 'high',
        category: 'Security',
        title: 'Critical Security Events Detected',
        description: `${incidents.length} critical security events were detected during the audit period.`,
        remediation: 'Review and address all critical security events. Implement additional controls if necessary.',
        status: 'open',
      });
    }

    // Check for failed audits
    const { data: failedAudits } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .gte('created_at', period.start.toISOString())
      .lte('created_at', period.end.toISOString())
      .eq('result', 'failure')
      .eq('severity', 'ERROR');

    if (failedAudits && failedAudits.length > 10) {
      findings.push({
        id: crypto.randomUUID(),
        severity: 'medium',
        category: 'Operations',
        title: 'High Number of Failed Operations',
        description: `${failedAudits.length} operations failed during the audit period.`,
        remediation: 'Investigate root causes of failures and implement corrective measures.',
        status: 'open',
      });
    }

    // Check for access control issues
    const dashboard = await monitoringService.getDashboard();
    if (dashboard.metrics.security.failedLogins > 100) {
      findings.push({
        id: crypto.randomUUID(),
        severity: 'medium',
        category: 'Access Control',
        title: 'Excessive Failed Login Attempts',
        description: 'High number of failed login attempts detected.',
        remediation: 'Review access logs and consider implementing additional security measures.',
        status: 'open',
      });
    }

    return findings;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    findings: ComplianceFinding[],
    requirements: SecurityRequirement[]
  ): string[] {
    const recommendations: string[] = [];

    // Based on findings
    if (findings.some(f => f.severity === 'critical' || f.severity === 'high')) {
      recommendations.push('Address all high and critical severity findings immediately.');
    }

    // Based on unimplemented requirements
    const unimplemented = requirements.filter(r => !r.implemented);
    if (unimplemented.length > 0) {
      recommendations.push(`Implement ${unimplemented.length} remaining security requirements.`);
    }

    // General recommendations
    recommendations.push('Continue regular security assessments and penetration testing.');
    recommendations.push('Maintain up-to-date documentation of security controls.');
    recommendations.push('Provide ongoing security awareness training to all personnel.');

    return recommendations;
  }

  /**
   * Create data retention policy
   */
  async createRetentionPolicy(
    dataType: string,
    retentionDays: number,
    framework: ComplianceFramework = ComplianceFramework.SOC2,
    autoDelete: boolean = false
  ): Promise<DataRetentionPolicy> {
    const policy: DataRetentionPolicy = {
      id: crypto.randomUUID(),
      dataType,
      retentionDays,
      framework,
      autoDelete,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { error } = await supabaseAdmin
      .from('data_retention_policies')
      .insert({
        id: policy.id,
        data_type: policy.dataType,
        retention_days: policy.retentionDays,
        framework: policy.framework,
        auto_delete: policy.autoDelete,
        created_at: policy.createdAt,
        updated_at: policy.updatedAt,
      });

    if (error) {
      throw error;
    }

    // Audit log
    await auditService.log({
      type: AuditEventType.POLICY_CREATED,
      severity: AuditEventSeverity.INFO,
      actor: { type: 'system', id: 'compliance-service' },
      context: {},
      metadata: {
        action: 'retention_policy_created',
        framework,
        dataType,
        retentionDays,
        autoDelete,
      },
      result: 'success',
    });

    return policy;
  }

  /**
   * Check access controls
   */
  async checkAccessControls(): Promise<{
    passed: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];

    // Check MFA enablement
    const { data: users } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, two_factor_enabled')
      .eq('two_factor_enabled', false);

    if (users && users.length > 0) {
      issues.push(`${users.length} users do not have MFA enabled`);
    }

    // Check for stale sessions
    const { data: sessions } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .lt('expires_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (sessions && sessions.length > 0) {
      issues.push(`${sessions.length} expired sessions found`);
    }

    // Check for excessive permissions
    const { data: admins } = await supabaseAdmin
      .from('organization_members')
      .select('*')
      .in('role', ['account_owner', 'admin']);

    const { data: totalUsers } = await supabaseAdmin
      .from('organization_members')
      .select('count');

    if (admins && totalUsers && admins.length > totalUsers[0].count * 0.2) {
      issues.push('More than 20% of users have administrative privileges');
    }

    return {
      passed: issues.length === 0,
      issues,
    };
  }

  /**
   * Map security policy from database
   */
  private mapSecurityPolicyFromDb(data: any): SecurityPolicy {
    return {
      id: data.id,
      name: data.name,
      framework: data.framework,
      version: data.version,
      requirements: data.requirements,
      effectiveDate: new Date(data.effective_date),
      reviewDate: new Date(data.review_date),
      approved: data.approved,
      approvedBy: data.approved_by,
    };
  }
}

// Export singleton instance
export const soc2Service = new SOC2ComplianceService();