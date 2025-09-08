/**
 * Audit Trail Manager Test Suite
 * Tests for comprehensive audit logging and monitoring
 */

import { jest } from '@jest/globals';
import { AuditTrailManager } from '../audit-trail';
import { AuditEvent, AuditFilter, AuditReport, AuditRetentionPolicy } from '../audit-trail';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('ioredis');

describe('AuditTrailManager', () => {
  let auditManager: AuditTrailManager;

  beforeEach(() => {
    jest.clearAllMocks();
    auditManager = new AuditTrailManager();
  });

  describe('Event Recording', () => {
    it('should record audit events with all required fields', async () => {
      const event: AuditEvent = {
        id: 'audit-001',
        timestamp: new Date(),
        actor: {
          type: 'user',
          id: 'user-123',
          name: 'John Doe',
          email: 'john@example.com',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...'
        },
        action: 'data.update',
        resource: {
          type: 'user_profile',
          id: 'profile-456',
          name: 'User Profile'
        },
        result: 'success',
        metadata: {
          changes: { email: { old: 'old@example.com', new: 'new@example.com' } }
        }
      };

      const recorded = await auditManager.recordEvent(event);
      
      expect(recorded).toHaveProperty('id');
      expect(recorded).toHaveProperty('hash'); // For integrity
      expect(recorded).toHaveProperty('previousHash'); // Chain integrity
      expect(recorded).toHaveProperty('sequenceNumber');
      expect(recorded.indexed).toBe(true);
    });

    it('should handle system-generated events', async () => {
      const systemEvent = await auditManager.recordSystemEvent({
        action: 'backup.completed',
        resource: { type: 'database', id: 'db-primary' },
        metadata: { size: '5GB', duration: '300s' }
      });

      expect(systemEvent.actor.type).toBe('system');
      expect(systemEvent.actor.id).toBe('system');
      expect(systemEvent).toHaveProperty('timestamp');
    });

    it('should record failed actions with error details', async () => {
      const failedEvent: AuditEvent = {
        id: 'audit-002',
        timestamp: new Date(),
        actor: {
          type: 'user',
          id: 'user-123',
          ipAddress: '192.168.1.1'
        },
        action: 'auth.login',
        resource: { type: 'authentication', id: 'auth-system' },
        result: 'failure',
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid username or password',
          stackTrace: 'Error at login...'
        }
      };

      const recorded = await auditManager.recordEvent(failedEvent);
      
      expect(recorded.result).toBe('failure');
      expect(recorded.error).toBeDefined();
      expect(recorded.error?.code).toBe('INVALID_CREDENTIALS');
    });

    it('should maintain event chain integrity', async () => {
      const events = [];
      for (let i = 0; i < 5; i++) {
        const event = await auditManager.recordEvent({
          id: `chain-${i}`,
          timestamp: new Date(),
          actor: { type: 'user', id: 'user-123' },
          action: 'test.action',
          resource: { type: 'test', id: `test-${i}` },
          result: 'success'
        });
        events.push(event);
      }

      // Verify chain integrity
      for (let i = 1; i < events.length; i++) {
        expect(events[i].previousHash).toBe(events[i-1].hash);
        expect(events[i].sequenceNumber).toBe(events[i-1].sequenceNumber + 1);
      }

      // Verify chain validation
      const isValid = await auditManager.validateChainIntegrity();
      expect(isValid).toBe(true);
    });
  });

  describe('Event Querying', () => {
    it('should query events by filter criteria', async () => {
      const filter: AuditFilter = {
        startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        endDate: new Date(),
        actors: ['user-123', 'user-456'],
        actions: ['data.update', 'data.delete'],
        resources: ['user_profile', 'organization'],
        results: ['success']
      };

      const events = await auditManager.queryEvents(filter);
      
      expect(Array.isArray(events)).toBe(true);
      events.forEach(event => {
        expect(filter.actors).toContain(event.actor.id);
        expect(filter.actions).toContain(event.action);
        expect(filter.results).toContain(event.result);
      });
    });

    it('should support pagination for large result sets', async () => {
      const page1 = await auditManager.queryEvents({}, { page: 1, limit: 50 });
      const page2 = await auditManager.queryEvents({}, { page: 2, limit: 50 });
      
      expect(page1.events).toHaveLength(50);
      expect(page2.events).toHaveLength(50);
      expect(page1.totalCount).toBe(page2.totalCount);
      expect(page1.events[0].id).not.toBe(page2.events[0].id);
    });

    it('should search events by text content', async () => {
      const results = await auditManager.searchEvents('password reset');
      
      expect(Array.isArray(results)).toBe(true);
      results.forEach(event => {
        const eventText = JSON.stringify(event).toLowerCase();
        expect(eventText).toContain('password');
      });
    });

    it('should aggregate events by various dimensions', async () => {
      const aggregations = await auditManager.aggregateEvents({
        groupBy: ['actor', 'action', 'result'],
        timeRange: 'last_7_days',
        metrics: ['count', 'first_occurrence', 'last_occurrence']
      });

      expect(aggregations).toHaveProperty('byActor');
      expect(aggregations).toHaveProperty('byAction');
      expect(aggregations).toHaveProperty('byResult');
      
      Object.values(aggregations.byAction).forEach(stats => {
        expect(stats).toHaveProperty('count');
        expect(stats).toHaveProperty('firstOccurrence');
        expect(stats).toHaveProperty('lastOccurrence');
      });
    });
  });

  describe('Compliance and Reporting', () => {
    it('should generate compliance audit reports', async () => {
      const report = await auditManager.generateComplianceReport({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        regulations: ['SOC2', 'GDPR', 'HIPAA']
      });

      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('byRegulation');
      expect(report).toHaveProperty('criticalEvents');
      expect(report).toHaveProperty('anomalies');
      expect(report).toHaveProperty('recommendations');
    });

    it('should identify suspicious activity patterns', async () => {
      const anomalies = await auditManager.detectAnomalies({
        lookbackPeriod: 24 * 60 * 60 * 1000, // 24 hours
        thresholds: {
          failedLogins: 5,
          dataExports: 100,
          privilegedActions: 10
        }
      });

      expect(Array.isArray(anomalies)).toBe(true);
      anomalies.forEach(anomaly => {
        expect(anomaly).toHaveProperty('type');
        expect(anomaly).toHaveProperty('severity');
        expect(anomaly).toHaveProperty('actor');
        expect(anomaly).toHaveProperty('pattern');
        expect(anomaly).toHaveProperty('recommendedAction');
      });
    });

    it('should track user activity sessions', async () => {
      const sessions = await auditManager.getUserSessions('user-123', {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: new Date()
      });

      expect(Array.isArray(sessions)).toBe(true);
      sessions.forEach(session => {
        expect(session).toHaveProperty('sessionId');
        expect(session).toHaveProperty('startTime');
        expect(session).toHaveProperty('endTime');
        expect(session).toHaveProperty('duration');
        expect(session).toHaveProperty('actions');
        expect(session).toHaveProperty('ipAddress');
      });
    });

    it('should export audit logs in various formats', async () => {
      const formats = ['json', 'csv', 'syslog', 'cef'] as const;
      
      for (const format of formats) {
        const exported = await auditManager.exportAuditLogs({
          format,
          filter: { startDate: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        expect(exported).toHaveProperty('format', format);
        expect(exported).toHaveProperty('data');
        expect(exported).toHaveProperty('recordCount');
        expect(exported).toHaveProperty('exportDate');
      }
    });
  });

  describe('Retention and Archival', () => {
    it('should apply retention policies', async () => {
      const policy: AuditRetentionPolicy = {
        id: 'policy-001',
        name: 'Standard Retention',
        rules: [
          { eventType: 'auth.*', retentionDays: 365 },
          { eventType: 'data.delete', retentionDays: 2555 }, // 7 years
          { eventType: 'system.*', retentionDays: 90 }
        ],
        defaultRetentionDays: 180
      };

      await auditManager.applyRetentionPolicy(policy);
      const applied = await auditManager.getRetentionPolicy();
      
      expect(applied).toEqual(policy);
    });

    it('should archive old audit events', async () => {
      const archiveResult = await auditManager.archiveOldEvents({
        olderThan: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        destination: 's3://audit-archive/2023/'
      });

      expect(archiveResult).toHaveProperty('archivedCount');
      expect(archiveResult).toHaveProperty('archiveSize');
      expect(archiveResult).toHaveProperty('archiveLocation');
      expect(archiveResult).toHaveProperty('verificationHash');
    });

    it('should prune events according to retention policy', async () => {
      const pruneResult = await auditManager.pruneExpiredEvents();
      
      expect(pruneResult).toHaveProperty('deletedCount');
      expect(pruneResult).toHaveProperty('freedSpace');
      expect(pruneResult).toHaveProperty('prunedCategories');
      
      // Verify critical events are never pruned
      const criticalEvents = await auditManager.queryEvents({
        actions: ['data.delete', 'permission.grant', 'security.breach']
      });
      expect(criticalEvents.length).toBeGreaterThan(0);
    });

    it('should restore archived events when needed', async () => {
      const restoreResult = await auditManager.restoreFromArchive({
        archiveId: 'archive-2023-01',
        filter: { actors: ['user-123'] }
      });

      expect(restoreResult).toHaveProperty('restoredCount');
      expect(restoreResult).toHaveProperty('events');
      expect(restoreResult.verified).toBe(true);
    });
  });

  describe('Real-time Monitoring', () => {
    it('should stream audit events in real-time', async () => {
      const events: AuditEvent[] = [];
      const subscription = auditManager.subscribeToEvents({
        filter: { actions: ['auth.*', 'data.*'] },
        callback: (event) => events.push(event)
      });

      // Simulate some events
      await auditManager.recordEvent({
        timestamp: new Date(),
        actor: { type: 'user', id: 'user-123' },
        action: 'auth.login',
        resource: { type: 'auth', id: 'system' },
        result: 'success'
      });

      // Wait for event propagation
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].action).toBe('auth.login');

      // Cleanup
      subscription.unsubscribe();
    });

    it('should trigger alerts for critical events', async () => {
      const alerts: any[] = [];
      auditManager.onAlert((alert) => alerts.push(alert));

      // Record a critical event
      await auditManager.recordEvent({
        timestamp: new Date(),
        actor: { type: 'user', id: 'user-123' },
        action: 'security.breach_attempt',
        resource: { type: 'system', id: 'api' },
        result: 'failure',
        metadata: { attemptType: 'sql_injection' }
      });

      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0]).toHaveProperty('severity', 'critical');
      expect(alerts[0]).toHaveProperty('event');
      expect(alerts[0]).toHaveProperty('recommendedActions');
    });

    it('should maintain dashboard metrics', async () => {
      const metrics = await auditManager.getDashboardMetrics();
      
      expect(metrics).toHaveProperty('eventsPerHour');
      expect(metrics).toHaveProperty('topActors');
      expect(metrics).toHaveProperty('topActions');
      expect(metrics).toHaveProperty('failureRate');
      expect(metrics).toHaveProperty('avgResponseTime');
      expect(metrics).toHaveProperty('securityScore');
    });
  });

  describe('Integration and Export', () => {
    it('should integrate with SIEM systems', async () => {
      const siemConfig = {
        type: 'splunk' as const,
        endpoint: 'https://splunk.example.com:8088',
        token: 'test-token',
        index: 'audit_logs'
      };

      const integration = await auditManager.configureSIEMIntegration(siemConfig);
      
      expect(integration).toHaveProperty('id');
      expect(integration).toHaveProperty('status', 'active');
      expect(integration).toHaveProperty('lastSync');
      expect(integration).toHaveProperty('syncedEvents');
    });

    it('should support webhook notifications', async () => {
      const webhook = await auditManager.configureWebhook({
        url: 'https://example.com/audit-webhook',
        events: ['security.*', 'compliance.*'],
        headers: { 'X-API-Key': 'test-key' },
        retryPolicy: { maxRetries: 3, backoffMultiplier: 2 }
      });

      expect(webhook).toHaveProperty('id');
      expect(webhook).toHaveProperty('status', 'active');
      expect(webhook).toHaveProperty('deliveryStats');
    });

    it('should generate forensic reports', async () => {
      const forensicReport = await auditManager.generateForensicReport({
        incidentId: 'incident-001',
        timeWindow: {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date()
        },
        actors: ['user-123'],
        includeRelatedEvents: true
      });

      expect(forensicReport).toHaveProperty('timeline');
      expect(forensicReport).toHaveProperty('actorProfile');
      expect(forensicReport).toHaveProperty('affectedResources');
      expect(forensicReport).toHaveProperty('eventSequence');
      expect(forensicReport).toHaveProperty('recommendations');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle high-volume event recording', async () => {
      const events = Array.from({ length: 1000 }, (_, i) => ({
        timestamp: new Date(),
        actor: { type: 'user' as const, id: `user-${i % 10}` },
        action: `action.${i % 20}`,
        resource: { type: 'resource', id: `res-${i}` },
        result: i % 10 === 0 ? 'failure' as const : 'success' as const
      }));

      const startTime = Date.now();
      await auditManager.recordBulkEvents(events);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // Process 1000 events in under 5 seconds
    });

    it('should maintain performance with large datasets', async () => {
      // Query performance test
      const startTime = Date.now();
      const results = await auditManager.queryEvents({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        actions: ['data.update']
      });
      const queryDuration = Date.now() - startTime;

      expect(queryDuration).toBeLessThan(1000); // Query should complete in under 1 second
      expect(results).toBeDefined();
    });

    it('should ensure data durability', async () => {
      const event = await auditManager.recordEvent({
        timestamp: new Date(),
        actor: { type: 'user', id: 'user-123' },
        action: 'test.durability',
        resource: { type: 'test', id: 'test-123' },
        result: 'success'
      });

      // Simulate system restart
      const newManager = new AuditTrailManager();
      const retrieved = await newManager.getEvent(event.id);

      expect(retrieved).toEqual(event);
      expect(retrieved.hash).toBe(event.hash);
    });
  });
});