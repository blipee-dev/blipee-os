/**
 * GDPR Compliance Manager Test Suite
 * Tests for GDPR compliance features and data subject rights
 */

import { jest } from '@jest/globals';
import { GDPRComplianceManager } from '../gdpr-compliance';
import { 
  DataSubjectRequest, 
  ConsentRecord, 
  DataProcessingActivity,
  GDPRComplianceReport,
  PrivacyRight
} from '../gdpr-compliance';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('ioredis');

describe('GDPRComplianceManager', () => {
  let gdprManager: GDPRComplianceManager;

  beforeEach(() => {
    jest.clearAllMocks();
    gdprManager = new GDPRComplianceManager();
  });

  describe('Data Subject Rights Management', () => {
    it('should process data access requests', async () => {
      const request: DataSubjectRequest = {
        id: 'dsr-001',
        type: 'access',
        subjectId: 'user-123',
        subjectEmail: 'user@example.com',
        requestDate: new Date(),
        status: 'pending',
        verificationMethod: 'email',
        details: 'Request for all personal data'
      };

      const result = await gdprManager.processDataSubjectRequest(request);
      
      expect(result).toHaveProperty('requestId', 'dsr-001');
      expect(result).toHaveProperty('status', 'completed');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('completedAt');
      expect(result.processingTime).toBeLessThan(72 * 60 * 60 * 1000); // Within 72 hours
    });

    it('should handle data portability requests', async () => {
      const request: DataSubjectRequest = {
        id: 'dsr-002',
        type: 'portability',
        subjectId: 'user-123',
        subjectEmail: 'user@example.com',
        requestDate: new Date(),
        status: 'pending',
        format: 'json'
      };

      const result = await gdprManager.processDataSubjectRequest(request);
      
      expect(result.format).toBe('json');
      expect(result.data).toHaveProperty('personalData');
      expect(result.data).toHaveProperty('consentHistory');
      expect(result.data).toHaveProperty('processingActivities');
      expect(result.portable).toBe(true);
    });

    it('should process deletion requests with validation', async () => {
      const request: DataSubjectRequest = {
        id: 'dsr-003',
        type: 'deletion',
        subjectId: 'user-123',
        subjectEmail: 'user@example.com',
        requestDate: new Date(),
        status: 'pending',
        reason: 'No longer using service'
      };

      const result = await gdprManager.processDataSubjectRequest(request);
      
      expect(result.status).toBe('completed');
      expect(result.deletedRecords).toBeGreaterThan(0);
      expect(result.retainedData).toHaveProperty('legalBasis');
      expect(result.retainedData).toHaveProperty('retentionPeriod');
    });

    it('should handle rectification requests', async () => {
      const request: DataSubjectRequest = {
        id: 'dsr-004',
        type: 'rectification',
        subjectId: 'user-123',
        subjectEmail: 'user@example.com',
        requestDate: new Date(),
        status: 'pending',
        corrections: {
          email: 'newemail@example.com',
          phone: '+1234567890'
        }
      };

      const result = await gdprManager.processDataSubjectRequest(request);
      
      expect(result.status).toBe('completed');
      expect(result.updatedFields).toContain('email');
      expect(result.updatedFields).toContain('phone');
      expect(result.auditTrail).toBeDefined();
    });

    it('should enforce request time limits', async () => {
      const requests = await gdprManager.getPendingRequests();
      const overdueRequests = requests.filter(r => {
        const age = Date.now() - r.requestDate.getTime();
        return age > 30 * 24 * 60 * 60 * 1000; // 30 days
      });

      expect(overdueRequests.length).toBe(0);
      
      // Check alerts for approaching deadlines
      const alerts = await gdprManager.getDeadlineAlerts();
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  describe('Consent Management', () => {
    it('should record consent with all required details', async () => {
      const consent: ConsentRecord = {
        id: 'consent-001',
        subjectId: 'user-123',
        purpose: 'marketing',
        lawfulBasis: 'consent',
        givenAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        withdrawable: true,
        version: '1.0',
        language: 'en',
        method: 'web-form',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...'
      };

      const recorded = await gdprManager.recordConsent(consent);
      
      expect(recorded).toHaveProperty('id');
      expect(recorded).toHaveProperty('timestamp');
      expect(recorded).toHaveProperty('hash'); // For integrity
      expect(recorded.status).toBe('active');
    });

    it('should handle consent withdrawal', async () => {
      const withdrawal = await gdprManager.withdrawConsent('user-123', 'marketing');
      
      expect(withdrawal).toHaveProperty('withdrawnAt');
      expect(withdrawal).toHaveProperty('reason');
      expect(withdrawal).toHaveProperty('confirmedBy');
      expect(withdrawal.status).toBe('withdrawn');
      
      // Verify cascading effects
      const affectedProcessing = withdrawal.affectedProcessing;
      expect(Array.isArray(affectedProcessing)).toBe(true);
    });

    it('should validate consent for processing', async () => {
      const validation = await gdprManager.validateConsent(
        'user-123',
        'analytics',
        'process-user-behavior'
      );
      
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('consent');
      expect(validation).toHaveProperty('lawfulBasis');
      
      if (!validation.isValid) {
        expect(validation.reason).toBeDefined();
      }
    });

    it('should manage consent versions', async () => {
      const versions = await gdprManager.getConsentVersionHistory('marketing');
      
      expect(Array.isArray(versions)).toBe(true);
      expect(versions[0]).toHaveProperty('version');
      expect(versions[0]).toHaveProperty('effectiveDate');
      expect(versions[0]).toHaveProperty('changes');
      
      // Verify migration for updated consent
      const migration = await gdprManager.migrateConsents('marketing', '2.0');
      expect(migration.migratedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Data Processing Activities', () => {
    it('should register data processing activities', async () => {
      const activity: DataProcessingActivity = {
        id: 'dpa-001',
        name: 'User Analytics',
        purpose: 'Service improvement',
        legalBasis: 'legitimate_interest',
        dataCategories: ['usage_data', 'device_info'],
        dataSources: ['web_app', 'mobile_app'],
        dataRecipients: ['analytics_provider'],
        retentionPeriod: 365,
        securityMeasures: ['encryption', 'access_control', 'audit_logging'],
        crossBorderTransfers: false,
        automatedDecisionMaking: false
      };

      const registered = await gdprManager.registerProcessingActivity(activity);
      
      expect(registered).toHaveProperty('id');
      expect(registered).toHaveProperty('registeredAt');
      expect(registered).toHaveProperty('lastReviewed');
      expect(registered.status).toBe('active');
    });

    it('should perform privacy impact assessments', async () => {
      const pia = await gdprManager.performPrivacyImpactAssessment('dpa-001');
      
      expect(pia).toHaveProperty('activityId', 'dpa-001');
      expect(pia).toHaveProperty('riskLevel');
      expect(pia).toHaveProperty('risks');
      expect(pia).toHaveProperty('mitigations');
      expect(pia).toHaveProperty('residualRisk');
      expect(pia).toHaveProperty('approvalRequired');
      
      // High risk activities should require DPO approval
      if (pia.riskLevel === 'high') {
        expect(pia.approvalRequired).toBe(true);
      }
    });

    it('should maintain processing records', async () => {
      const records = await gdprManager.getProcessingRecords();
      
      expect(Array.isArray(records)).toBe(true);
      records.forEach(record => {
        expect(record).toHaveProperty('controller');
        expect(record).toHaveProperty('processor');
        expect(record).toHaveProperty('purposes');
        expect(record).toHaveProperty('categories');
        expect(record).toHaveProperty('recipients');
        expect(record).toHaveProperty('transfers');
        expect(record).toHaveProperty('retention');
        expect(record).toHaveProperty('security');
      });
    });
  });

  describe('Data Breach Management', () => {
    it('should handle data breach notifications', async () => {
      const breach = {
        id: 'breach-001',
        discoveredAt: new Date(),
        type: 'unauthorized_access',
        affectedRecords: 1500,
        dataCategories: ['email', 'name', 'phone'],
        severity: 'high' as const,
        cause: 'phishing_attack'
      };

      const notification = await gdprManager.reportDataBreach(breach);
      
      expect(notification).toHaveProperty('breachId');
      expect(notification).toHaveProperty('notificationTime');
      expect(notification.notifiedAuthorities).toContain('DPA');
      
      // Verify 72-hour rule
      const timeDiff = notification.notificationTime.getTime() - breach.discoveredAt.getTime();
      expect(timeDiff).toBeLessThan(72 * 60 * 60 * 1000);
    });

    it('should assess breach impact on data subjects', async () => {
      const impact = await gdprManager.assessBreachImpact('breach-001');
      
      expect(impact).toHaveProperty('affectedSubjects');
      expect(impact).toHaveProperty('riskToRights');
      expect(impact).toHaveProperty('likelyConsequences');
      expect(impact).toHaveProperty('notificationRequired');
      expect(impact).toHaveProperty('mitigationMeasures');
    });

    it('should generate breach notification templates', async () => {
      const templates = await gdprManager.generateBreachNotifications('breach-001');
      
      expect(templates).toHaveProperty('authorityNotification');
      expect(templates).toHaveProperty('subjectNotification');
      expect(templates.authorityNotification).toContain('nature of breach');
      expect(templates.subjectNotification).toContain('recommended actions');
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate comprehensive GDPR compliance report', async () => {
      const report = await gdprManager.generateComplianceReport();
      
      expect(report).toHaveProperty('reportDate');
      expect(report).toHaveProperty('complianceScore');
      expect(report).toHaveProperty('dataSubjectRequests');
      expect(report).toHaveProperty('consentMetrics');
      expect(report).toHaveProperty('processingActivities');
      expect(report).toHaveProperty('breaches');
      expect(report).toHaveProperty('crossBorderTransfers');
      expect(report).toHaveProperty('thirdPartyProcessors');
    });

    it('should track GDPR principle compliance', async () => {
      const principles = await gdprManager.assessPrincipleCompliance();
      
      const expectedPrinciples = [
        'Lawfulness',
        'Purpose Limitation',
        'Data Minimization',
        'Accuracy',
        'Storage Limitation',
        'Integrity and Confidentiality',
        'Accountability'
      ];
      
      expectedPrinciples.forEach(principle => {
        expect(principles).toHaveProperty(principle);
        expect(principles[principle]).toHaveProperty('status');
        expect(principles[principle]).toHaveProperty('evidence');
        expect(principles[principle]).toHaveProperty('gaps');
      });
    });

    it('should export Article 30 records', async () => {
      const records = await gdprManager.exportArticle30Records();
      
      expect(records).toHaveProperty('controllerActivities');
      expect(records).toHaveProperty('processorActivities');
      expect(records).toHaveProperty('format', 'structured');
      expect(records).toHaveProperty('lastUpdated');
      expect(records).toHaveProperty('signature');
    });
  });

  describe('Third-Party Management', () => {
    it('should manage data processor agreements', async () => {
      const processor = {
        id: 'proc-001',
        name: 'Analytics Provider',
        services: ['web_analytics'],
        dataAccess: ['usage_data'],
        subProcessors: ['cloud_provider'],
        certifications: ['ISO27001', 'SOC2'],
        agreementDate: new Date(),
        reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      };

      const agreement = await gdprManager.registerDataProcessor(processor);
      
      expect(agreement).toHaveProperty('id');
      expect(agreement).toHaveProperty('contractClauses');
      expect(agreement.contractClauses).toContain('security_measures');
      expect(agreement.contractClauses).toContain('audit_rights');
      expect(agreement.contractClauses).toContain('data_deletion');
    });

    it('should perform processor audits', async () => {
      const audit = await gdprManager.auditDataProcessor('proc-001');
      
      expect(audit).toHaveProperty('processorId');
      expect(audit).toHaveProperty('auditDate');
      expect(audit).toHaveProperty('findings');
      expect(audit).toHaveProperty('complianceScore');
      expect(audit).toHaveProperty('recommendations');
      expect(audit).toHaveProperty('nextAuditDate');
    });

    it('should manage cross-border data transfers', async () => {
      const transfer = {
        id: 'transfer-001',
        fromCountry: 'DE',
        toCountry: 'US',
        dataCategories: ['personal_data'],
        transferMechanism: 'SCCs', // Standard Contractual Clauses
        volumePerMonth: 10000,
        purpose: 'cloud_storage'
      };

      const validation = await gdprManager.validateCrossBorderTransfer(transfer);
      
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('mechanism');
      expect(validation).toHaveProperty('adequacyDecision');
      expect(validation).toHaveProperty('safeguards');
      expect(validation).toHaveProperty('risks');
    });
  });

  describe('Privacy by Design', () => {
    it('should enforce data minimization', async () => {
      const assessment = await gdprManager.assessDataMinimization('user-profile');
      
      expect(assessment).toHaveProperty('currentFields');
      expect(assessment).toHaveProperty('requiredFields');
      expect(assessment).toHaveProperty('unnecessaryFields');
      expect(assessment).toHaveProperty('recommendations');
      
      expect(assessment.unnecessaryFields.length).toBeGreaterThanOrEqual(0);
    });

    it('should implement privacy defaults', async () => {
      const defaults = await gdprManager.getPrivacyDefaults('new-user');
      
      expect(defaults).toHaveProperty('dataSharing', false);
      expect(defaults).toHaveProperty('analytics', false);
      expect(defaults).toHaveProperty('marketing', false);
      expect(defaults).toHaveProperty('profiling', false);
      expect(defaults).toHaveProperty('thirdPartyAccess', false);
    });

    it('should perform data protection impact assessments', async () => {
      const dpia = await gdprManager.performDPIA('new-ai-feature');
      
      expect(dpia).toHaveProperty('necessity');
      expect(dpia).toHaveProperty('proportionality');
      expect(dpia).toHaveProperty('risks');
      expect(dpia).toHaveProperty('measures');
      expect(dpia).toHaveProperty('residualRisks');
      expect(dpia).toHaveProperty('consultationRequired');
    });
  });

  describe('Automated Compliance Checks', () => {
    it('should run automated compliance scans', async () => {
      const scan = await gdprManager.runComplianceScan();
      
      expect(scan).toHaveProperty('timestamp');
      expect(scan).toHaveProperty('issues');
      expect(scan).toHaveProperty('warnings');
      expect(scan).toHaveProperty('suggestions');
      expect(scan).toHaveProperty('score');
      
      scan.issues.forEach(issue => {
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('category');
        expect(issue).toHaveProperty('description');
        expect(issue).toHaveProperty('remediation');
      });
    });

    it('should monitor consent expiration', async () => {
      const expiring = await gdprManager.getExpiringConsents(30); // Next 30 days
      
      expect(Array.isArray(expiring)).toBe(true);
      expiring.forEach(consent => {
        expect(consent).toHaveProperty('subjectId');
        expect(consent).toHaveProperty('purpose');
        expect(consent).toHaveProperty('expiresAt');
        expect(consent).toHaveProperty('daysUntilExpiry');
      });
    });

    it('should detect unlawful processing', async () => {
      const violations = await gdprManager.detectUnlawfulProcessing();
      
      expect(Array.isArray(violations)).toBe(true);
      violations.forEach(violation => {
        expect(violation).toHaveProperty('activityId');
        expect(violation).toHaveProperty('reason');
        expect(violation).toHaveProperty('severity');
        expect(violation).toHaveProperty('recommendation');
      });
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle bulk data subject requests efficiently', async () => {
      const requests = Array.from({ length: 100 }, (_, i) => ({
        id: `bulk-${i}`,
        type: 'access' as const,
        subjectId: `user-${i}`,
        subjectEmail: `user${i}@example.com`,
        requestDate: new Date(),
        status: 'pending' as const
      }));

      const startTime = Date.now();
      const results = await gdprManager.processBulkRequests(requests);
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(100);
      expect(duration).toBeLessThan(10000); // Process 100 requests in under 10 seconds
    });

    it('should cache compliance assessments', () => {
      // First assessment - no cache
      const start1 = Date.now();
      gdprManager.assessPrincipleCompliance();
      const duration1 = Date.now() - start1;
      
      // Second assessment - cached
      const start2 = Date.now();
      gdprManager.assessPrincipleCompliance();
      const duration2 = Date.now() - start2;
      
      expect(duration2).toBeLessThan(duration1);
    });
  });
});