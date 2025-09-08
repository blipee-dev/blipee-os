/**
 * Data Retention Manager Test Suite
 * Tests for data retention policies and automated cleanup
 */

import { jest } from '@jest/globals';
import { DataRetentionManager } from '../data-retention';
import { 
  RetentionPolicy, 
  DataCategory, 
  RetentionRule,
  RetentionReport,
  DeletionRecord
} from '../data-retention';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('ioredis');

describe('DataRetentionManager', () => {
  let retentionManager: DataRetentionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    retentionManager = new DataRetentionManager();
  });

  describe('Policy Management', () => {
    it('should create retention policies with all required fields', async () => {
      const policy: RetentionPolicy = {
        id: 'policy-001',
        name: 'User Data Retention',
        description: 'Standard retention policy for user data',
        dataCategory: 'user_data',
        retentionPeriod: {
          value: 3,
          unit: 'years'
        },
        legalBasis: 'regulatory_requirement',
        regulation: 'GDPR',
        gracePeriod: {
          value: 30,
          unit: 'days'
        },
        exceptions: [
          {
            condition: 'legal_hold',
            override: 'indefinite'
          }
        ],
        approvedBy: 'dpo@example.com',
        effectiveDate: new Date(),
        reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      };

      const created = await retentionManager.createPolicy(policy);
      
      expect(created).toHaveProperty('id');
      expect(created).toHaveProperty('version');
      expect(created).toHaveProperty('status', 'active');
      expect(created).toHaveProperty('createdAt');
    });

    it('should validate retention periods against regulations', async () => {
      const validation = await retentionManager.validateRetentionPeriod({
        dataCategory: 'financial_records',
        retentionPeriod: { value: 5, unit: 'years' },
        regulation: 'SOX'
      });

      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('minimumRequired');
      expect(validation).toHaveProperty('maximumAllowed');
      
      // SOX requires 7 years for financial records
      if (!validation.isValid) {
        expect(validation.reason).toContain('minimum');
      }
    });

    it('should handle policy versioning', async () => {
      const policyId = 'policy-001';
      
      // Create initial version
      await retentionManager.createPolicy({
        id: policyId,
        name: 'Test Policy',
        dataCategory: 'logs',
        retentionPeriod: { value: 90, unit: 'days' }
      });

      // Update policy
      const updated = await retentionManager.updatePolicy(policyId, {
        retentionPeriod: { value: 180, unit: 'days' },
        reason: 'Compliance requirement change'
      });

      expect(updated.version).toBe(2);
      
      // Get version history
      const history = await retentionManager.getPolicyHistory(policyId);
      expect(history).toHaveLength(2);
      expect(history[0].version).toBe(1);
      expect(history[1].version).toBe(2);
    });

    it('should manage policy conflicts', async () => {
      // Create overlapping policies
      await retentionManager.createPolicy({
        id: 'policy-001',
        dataCategory: 'user_data',
        retentionPeriod: { value: 3, unit: 'years' },
        regulation: 'GDPR'
      });

      await retentionManager.createPolicy({
        id: 'policy-002',
        dataCategory: 'user_data',
        retentionPeriod: { value: 7, unit: 'years' },
        regulation: 'CCPA'
      });

      const conflicts = await retentionManager.detectPolicyConflicts();
      
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0]).toHaveProperty('category', 'user_data');
      expect(conflicts[0]).toHaveProperty('policies');
      expect(conflicts[0]).toHaveProperty('resolution', 'use_longest'); // Conservative approach
    });
  });

  describe('Data Lifecycle Management', () => {
    it('should track data lifecycle stages', async () => {
      const dataRecord = {
        id: 'data-001',
        category: 'user_data',
        createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year old
        lastAccessedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastModifiedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      };

      const lifecycle = await retentionManager.getDataLifecycle(dataRecord);
      
      expect(lifecycle).toHaveProperty('age');
      expect(lifecycle).toHaveProperty('stage'); // 'active', 'archive', 'delete'
      expect(lifecycle).toHaveProperty('daysUntilAction');
      expect(lifecycle).toHaveProperty('nextAction');
      expect(lifecycle).toHaveProperty('retentionPolicy');
    });

    it('should identify data eligible for deletion', async () => {
      const eligibleData = await retentionManager.getDataForDeletion({
        categories: ['logs', 'temp_data'],
        checkDate: new Date()
      });

      expect(Array.isArray(eligibleData)).toBe(true);
      eligibleData.forEach(data => {
        expect(data).toHaveProperty('id');
        expect(data).toHaveProperty('category');
        expect(data).toHaveProperty('createdAt');
        expect(data).toHaveProperty('retentionExpiry');
        expect(data).toHaveProperty('reason');
        expect(data.retentionExpiry.getTime()).toBeLessThan(Date.now());
      });
    });

    it('should handle grace periods correctly', async () => {
      const dataWithGracePeriod = {
        id: 'data-002',
        category: 'user_data',
        retentionExpiry: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Expired 10 days ago
        gracePeriodDays: 30
      };

      const status = await retentionManager.getRetentionStatus(dataWithGracePeriod);
      
      expect(status).toHaveProperty('isExpired', true);
      expect(status).toHaveProperty('inGracePeriod', true);
      expect(status).toHaveProperty('daysRemainingInGrace', 20);
      expect(status).toHaveProperty('finalDeletionDate');
    });

    it('should respect legal holds', async () => {
      const legalHold = {
        id: 'hold-001',
        dataIds: ['data-001', 'data-002'],
        reason: 'Ongoing litigation',
        createdBy: 'legal@example.com',
        createdAt: new Date(),
        estimatedEndDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
      };

      await retentionManager.applyLegalHold(legalHold);
      
      const eligibleData = await retentionManager.getDataForDeletion();
      const heldDataIds = eligibleData.map(d => d.id);
      
      expect(heldDataIds).not.toContain('data-001');
      expect(heldDataIds).not.toContain('data-002');
    });
  });

  describe('Automated Deletion', () => {
    it('should execute deletion jobs safely', async () => {
      const deletionJob = await retentionManager.executeDeletionJob({
        jobId: 'job-001',
        categories: ['logs'],
        dryRun: false,
        batchSize: 100
      });

      expect(deletionJob).toHaveProperty('jobId');
      expect(deletionJob).toHaveProperty('status');
      expect(deletionJob).toHaveProperty('startTime');
      expect(deletionJob).toHaveProperty('itemsProcessed');
      expect(deletionJob).toHaveProperty('itemsDeleted');
      expect(deletionJob).toHaveProperty('errors');
      expect(deletionJob).toHaveProperty('deletionRecords');
    });

    it('should create deletion certificates', async () => {
      const deletionRecord: DeletionRecord = {
        id: 'del-001',
        dataId: 'data-001',
        dataCategory: 'user_data',
        deletedAt: new Date(),
        deletedBy: 'retention-system',
        method: 'permanent_deletion',
        verification: {
          method: 'overwrite',
          passes: 3,
          verified: true
        },
        certificate: {
          hash: 'sha256:abcdef...',
          timestamp: new Date(),
          witness: 'audit-system'
        }
      };

      const certificate = await retentionManager.generateDeletionCertificate(deletionRecord);
      
      expect(certificate).toHaveProperty('certificateId');
      expect(certificate).toHaveProperty('dataId');
      expect(certificate).toHaveProperty('deletionDate');
      expect(certificate).toHaveProperty('verificationHash');
      expect(certificate).toHaveProperty('signature');
      expect(certificate).toHaveProperty('attestation');
    });

    it('should handle cascading deletions', async () => {
      const cascadeResult = await retentionManager.deleteCascade({
        primaryId: 'user-001',
        category: 'user_data',
        includeDependencies: true
      });

      expect(cascadeResult).toHaveProperty('primary');
      expect(cascadeResult).toHaveProperty('dependencies');
      expect(cascadeResult.dependencies).toHaveProperty('profiles', 1);
      expect(cascadeResult.dependencies).toHaveProperty('preferences', 1);
      expect(cascadeResult.dependencies).toHaveProperty('sessions', 5);
      expect(cascadeResult).toHaveProperty('totalDeleted');
    });

    it('should anonymize instead of delete when required', async () => {
      const anonymizationResult = await retentionManager.anonymizeData({
        dataId: 'user-001',
        fields: ['name', 'email', 'phone'],
        method: 'hash',
        preserveStructure: true
      });

      expect(anonymizationResult).toHaveProperty('dataId');
      expect(anonymizationResult).toHaveProperty('anonymizedFields');
      expect(anonymizationResult).toHaveProperty('method');
      expect(anonymizationResult).toHaveProperty('reversible', false);
      expect(anonymizationResult).toHaveProperty('anonymizedAt');
    });
  });

  describe('Compliance Reporting', () => {
    it('should generate retention compliance reports', async () => {
      const report = await retentionManager.generateComplianceReport({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        categories: ['user_data', 'logs', 'backups']
      });

      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('summary');
      expect(report.summary).toHaveProperty('totalDataItems');
      expect(report.summary).toHaveProperty('itemsDeleted');
      expect(report.summary).toHaveProperty('itemsRetained');
      expect(report.summary).toHaveProperty('complianceRate');
      expect(report).toHaveProperty('byCategory');
      expect(report).toHaveProperty('violations');
      expect(report).toHaveProperty('legalHolds');
    });

    it('should track retention violations', async () => {
      const violations = await retentionManager.getRetentionViolations();
      
      expect(Array.isArray(violations)).toBe(true);
      violations.forEach(violation => {
        expect(violation).toHaveProperty('dataId');
        expect(violation).toHaveProperty('category');
        expect(violation).toHaveProperty('policy');
        expect(violation).toHaveProperty('violationType'); // 'overdue', 'premature', 'missing_policy'
        expect(violation).toHaveProperty('severity');
        expect(violation).toHaveProperty('daysOverdue');
      });
    });

    it('should provide audit trail for deletions', async () => {
      const auditTrail = await retentionManager.getDeletionAuditTrail({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        categories: ['user_data']
      });

      expect(Array.isArray(auditTrail)).toBe(true);
      auditTrail.forEach(entry => {
        expect(entry).toHaveProperty('deletionId');
        expect(entry).toHaveProperty('timestamp');
        expect(entry).toHaveProperty('dataCategory');
        expect(entry).toHaveProperty('policy');
        expect(entry).toHaveProperty('approver');
        expect(entry).toHaveProperty('verificationStatus');
      });
    });

    it('should export retention metrics', async () => {
      const metrics = await retentionManager.getRetentionMetrics();
      
      expect(metrics).toHaveProperty('totalDataVolume');
      expect(metrics).toHaveProperty('dataByAge');
      expect(metrics).toHaveProperty('upcomingDeletions');
      expect(metrics).toHaveProperty('storageReclaimed');
      expect(metrics).toHaveProperty('complianceScore');
      expect(metrics).toHaveProperty('trendsOverTime');
    });
  });

  describe('Backup and Archive Integration', () => {
    it('should coordinate with backup systems', async () => {
      const backupCheck = await retentionManager.verifyBackupBeforeDeletion({
        dataIds: ['data-001', 'data-002'],
        requireBackup: true
      });

      expect(backupCheck).toHaveProperty('allBackedUp');
      expect(backupCheck).toHaveProperty('backupStatus');
      backupCheck.backupStatus.forEach(status => {
        expect(status).toHaveProperty('dataId');
        expect(status).toHaveProperty('isBackedUp');
        expect(status).toHaveProperty('backupDate');
        expect(status).toHaveProperty('backupLocation');
      });
    });

    it('should manage archive lifecycle', async () => {
      const archivePolicy = {
        dataCategory: 'financial_records',
        archiveAfter: { value: 2, unit: 'years' as const },
        deleteFromArchiveAfter: { value: 7, unit: 'years' as const }
      };

      const archiveResult = await retentionManager.archiveData({
        dataIds: ['fin-001', 'fin-002'],
        policy: archivePolicy,
        destination: 'cold-storage'
      });

      expect(archiveResult).toHaveProperty('archivedCount');
      expect(archiveResult).toHaveProperty('archiveLocation');
      expect(archiveResult).toHaveProperty('retrievalTime', '24-48 hours');
      expect(archiveResult).toHaveProperty('expiryDate');
    });

    it('should handle archive retrieval requests', async () => {
      const retrievalRequest = await retentionManager.requestArchiveRetrieval({
        archiveId: 'archive-001',
        reason: 'Audit request',
        requestedBy: 'auditor@example.com',
        urgency: 'normal'
      });

      expect(retrievalRequest).toHaveProperty('requestId');
      expect(retrievalRequest).toHaveProperty('status');
      expect(retrievalRequest).toHaveProperty('estimatedAvailability');
      expect(retrievalRequest).toHaveProperty('expiresAt'); // Retrieved data expires
    });
  });

  describe('Cross-System Coordination', () => {
    it('should synchronize with GDPR data subject requests', async () => {
      const gdprDeletion = {
        requestId: 'gdpr-001',
        subjectId: 'user-123',
        requestType: 'deletion'
      };

      const coordination = await retentionManager.coordinateWithGDPR(gdprDeletion);
      
      expect(coordination).toHaveProperty('dataIdentified');
      expect(coordination).toHaveProperty('deletionScheduled');
      expect(coordination).toHaveProperty('exceptions'); // Data that cannot be deleted
      expect(coordination).toHaveProperty('completionEstimate');
    });

    it('should integrate with data classification systems', async () => {
      const classification = await retentionManager.getDataClassification('data-001');
      
      expect(classification).toHaveProperty('sensitivityLevel');
      expect(classification).toHaveProperty('dataType');
      expect(classification).toHaveProperty('applicablePolicies');
      expect(classification).toHaveProperty('specialHandling');
    });

    it('should notify stakeholders of retention actions', async () => {
      const notifications = await retentionManager.sendRetentionNotifications({
        action: 'upcoming_deletion',
        dataCategory: 'user_data',
        affectedCount: 1500,
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      expect(notifications).toHaveProperty('sent');
      expect(notifications.sent).toHaveLength(3); // DPO, IT, Legal
      notifications.sent.forEach(notification => {
        expect(notification).toHaveProperty('recipient');
        expect(notification).toHaveProperty('channel');
        expect(notification).toHaveProperty('status');
      });
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle large-scale deletion operations', async () => {
      const largeDeletion = await retentionManager.executeBulkDeletion({
        estimatedItems: 100000,
        category: 'logs',
        strategy: 'batched',
        batchSize: 1000,
        parallelism: 4
      });

      expect(largeDeletion).toHaveProperty('totalProcessed');
      expect(largeDeletion).toHaveProperty('duration');
      expect(largeDeletion).toHaveProperty('throughput');
      expect(largeDeletion.throughput).toBeGreaterThan(1000); // Items per minute
    });

    it('should recover from deletion failures', async () => {
      const recovery = await retentionManager.recoverFromFailure({
        jobId: 'job-001',
        failurePoint: 5000,
        strategy: 'resume' // or 'restart'
      });

      expect(recovery).toHaveProperty('resumed', true);
      expect(recovery).toHaveProperty('skippedItems', 5000);
      expect(recovery).toHaveProperty('remainingItems');
    });

    it('should optimize retention queries', async () => {
      const startTime = Date.now();
      const candidates = await retentionManager.getDataForDeletion({
        categories: ['logs', 'temp_data', 'cache'],
        limit: 10000
      });
      const queryTime = Date.now() - startTime;

      expect(candidates).toHaveLength(10000);
      expect(queryTime).toBeLessThan(1000); // Query completes in under 1 second
    });
  });
});