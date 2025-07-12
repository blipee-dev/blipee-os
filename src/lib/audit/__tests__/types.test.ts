import { jest } from '@jest/globals';
import { AuditEventType, AuditEventSeverity, AuditEvent } from '../types';

describe('Audit types', () => {
  describe('AuditEventType', () => {
    it('should have authentication event types', () => {
      expect(AuditEventType.AUTH_LOGIN_SUCCESS).toBe('auth.login.success');
      expect(AuditEventType.AUTH_LOGIN_FAILED).toBe('auth.login.failed');
      expect(AuditEventType.AUTH_LOGOUT).toBe('auth.logout');
    });

    it('should have MFA event types', () => {
      expect(AuditEventType.AUTH_MFA_ENABLED).toBe('auth.mfa.enabled');
      expect(AuditEventType.AUTH_MFA_DISABLED).toBe('auth.mfa.disabled');
      expect(AuditEventType.AUTH_MFA_VERIFIED).toBe('auth.mfa.verified');
    });

    it('should have WebAuthn event types', () => {
      expect(AuditEventType.MFA_WEBAUTHN_REGISTRATION_STARTED).toBe('mfa.webauthn.registration.started');
      expect(AuditEventType.MFA_WEBAUTHN_REGISTERED).toBe('mfa.webauthn.registered');
      expect(AuditEventType.MFA_WEBAUTHN_VERIFIED).toBe('mfa.webauthn.verified');
    });

    it('should have user management event types', () => {
      expect(AuditEventType.USER_CREATED).toBe('user.created');
      expect(AuditEventType.USER_UPDATED).toBe('user.updated');
      expect(AuditEventType.USER_DELETED).toBe('user.deleted');
    });

    it('should have organization management event types', () => {
      expect(AuditEventType.ORG_CREATED).toBe('org.created');
      expect(AuditEventType.ORG_UPDATED).toBe('org.updated');
      expect(AuditEventType.ORG_DELETED).toBe('org.deleted');
    });

    it('should have building management event types', () => {
      expect(AuditEventType.BUILDING_CREATED).toBe('building.created');
      expect(AuditEventType.BUILDING_UPDATED).toBe('building.updated');
      expect(AuditEventType.BUILDING_DELETED).toBe('building.deleted');
    });

    it('should have data operation event types', () => {
      expect(AuditEventType.DATA_EXPORTED).toBe('data.exported');
      expect(AuditEventType.DATA_IMPORTED).toBe('data.imported');
      expect(AuditEventType.DATA_DELETED).toBe('data.deleted');
    });

    it('should have security event types', () => {
      expect(AuditEventType.SECURITY_THREAT_DETECTED).toBe('security.threat.detected');
      expect(AuditEventType.SECURITY_RATE_LIMIT_EXCEEDED).toBe('security.rate_limit.exceeded');
      expect(AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY).toBe('security.suspicious.activity');
    });

    it('should have API event types', () => {
      expect(AuditEventType.API_KEY_CREATED).toBe('api.key.created');
      expect(AuditEventType.API_KEY_REVOKED).toBe('api.key.revoked');
      expect(AuditEventType.API_REQUEST_FAILED).toBe('api.request.failed');
    });

    it('should have system event types', () => {
      expect(AuditEventType.SYSTEM_ERROR).toBe('system.error');
      expect(AuditEventType.SYSTEM_MAINTENANCE).toBe('system.maintenance');
      expect(AuditEventType.SYSTEM_CONFIG_CHANGED).toBe('system.config.changed');
    });

    it('should have compliance event types', () => {
      expect(AuditEventType.POLICY_CREATED).toBe('policy.created');
      expect(AuditEventType.POLICY_UPDATED).toBe('policy.updated');
      expect(AuditEventType.REPORT_GENERATED).toBe('report.generated');
    });
  });

  describe('AuditEventSeverity', () => {
    it('should have severity levels', () => {
      expect(AuditEventSeverity.INFO).toBe('info');
      expect(AuditEventSeverity.WARNING).toBe('warning');
      expect(AuditEventSeverity.ERROR).toBe('error');
      expect(AuditEventSeverity.CRITICAL).toBe('critical');
    });
  });

  describe('AuditEvent interface', () => {
    it('should create valid audit event objects', () => {
      const event: AuditEvent = {
        id: 'test-id',
        timestamp: new Date(),
        type: AuditEventType.AUTH_LOGIN_SUCCESS,
        severity: AuditEventSeverity.INFO,
        actor: {
          type: 'user',
          id: 'user-123',
          email: 'test@example.com',
          ip: '127.0.0.1'
        },
        resource: {
          type: 'user',
          id: 'user-123'
        },
        metadata: {
          userAgent: 'test-agent'
        }
      };

      expect(event.id).toBe('test-id');
      expect(event.type).toBe(AuditEventType.AUTH_LOGIN_SUCCESS);
      expect(event.severity).toBe(AuditEventSeverity.INFO);
      expect(event.actor.id).toBe('user-123');
      expect(event.resource?.type).toBe('user');
    });

    it('should handle minimal audit event', () => {
      const minimalEvent: AuditEvent = {
        id: 'minimal-id',
        timestamp: new Date(),
        type: AuditEventType.AUTH_LOGOUT,
        severity: AuditEventSeverity.INFO,
        actor: {
          type: 'user',
          id: 'user-456',
          email: 'minimal@example.com'
        }
      };

      expect(minimalEvent.id).toBe('minimal-id');
      expect(minimalEvent.resource).toBeUndefined();
      expect(minimalEvent.metadata).toBeUndefined();
    });
  });
});
