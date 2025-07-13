import { jest } from '@jest/globals';
import { GDPRComplianceService } from '../gdpr';
import { SOC2ComplianceService } from '../soc2';
import { ComplianceService } from '../service';
import {
  ConsentType,
  ConsentStatus,
  ComplianceFramework,
} from '../types';

// Mock dependencies
jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ 
        select: jest.fn(() => ({ 
          single: jest.fn(() => ({ data: {}, error: null })) 
        })),
        error: null 
      })),
      select: jest.fn(() => ({ 
        eq: jest.fn(() => ({ 
          order: jest.fn(() => ({ data: [], error: null })),
          single: jest.fn(() => ({ data: null, error: { code: 'PGRST116' } })),
        })),
        single: jest.fn(() => ({ data: null, error: { code: 'PGRST116' } })),
        data: [],
        error: null,
      })),
      update: jest.fn(() => ({ 
        eq: jest.fn(() => ({ error: null })),
      })),
      upsert: jest.fn(() => ({ 
        select: jest.fn(() => ({ 
          single: jest.fn(() => ({ data: {}, error: null })) 
        })),
      })),
    })),
  },
}));

jest.mock('@/lib/audit/service', () => ({
  auditService: {
    log: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@/lib/monitoring/service', () => ({
  monitoringService: {
    getDashboard: jest.fn(() => Promise.resolve({
      metrics: {
        security: {
          failedLogins: 50,
        },
      },
    })),
  },
}));

describe('GDPRComplianceService', () => {
  let gdprService: GDPRComplianceService;

  beforeEach(() => {
    gdprService = new GDPRComplianceService();
    jest.clearAllMocks();
  });

  describe('recordConsent', () => {
    it('should record user consent successfully', async () => {
      const _userId = 'test-user-123';
      const type = ConsentType.MARKETING;
      const status = ConsentStatus.GRANTED;

      const consent = await gdprService.recordConsent(userId, type, status);

      expect(consent).toHaveProperty('id');
      expect(consent.userId).toBe(userId);
      expect(consent.type).toBe(type);
      expect(consent.status).toBe(status);
      expect(consent.grantedAt).toBeInstanceOf(Date);
    });

    it('should record consent withdrawal', async () => {
      const _userId = 'test-user-123';
      const type = ConsentType.ANALYTICS;
      const status = ConsentStatus.WITHDRAWN;

      const consent = await gdprService.recordConsent(userId, type, status);

      expect(consent.status).toBe(status);
      expect(consent.withdrawnAt).toBeInstanceOf(Date);
    });
  });

  describe('requestDataExport', () => {
    it('should create data export request', async () => {
      const _userId = 'test-user-123';
      const format = 'json';
      const scope = ['profile', 'activities'];

      const _request = await gdprService.requestDataExport(userId, format, scope);

      expect(request).toHaveProperty('id');
      expect(request.userId).toBe(userId);
      expect(request.format).toBe(format);
      expect(request.scope).toEqual(scope);
      expect(request.status).toBe('pending');
    });
  });

  describe('requestAccountDeletion', () => {
    it('should create deletion request', async () => {
      const _userId = 'test-user-123';
      const reason = 'No longer using the service';

      const _request = await gdprService.requestAccountDeletion(userId, reason);

      expect(request).toHaveProperty('id');
      expect(request.userId).toBe(userId);
      expect(request.reason).toBe(reason);
      expect(request.status).toBe('pending');
      expect(request.scheduledFor).toBeInstanceOf(Date);
      
      // Should be scheduled 30 days in the future
      const daysDiff = Math.round(
        (request.scheduledFor.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(30);
    });
  });

  describe('updatePrivacySettings', () => {
    it('should update privacy settings', async () => {
      const _userId = 'test-user-123';
      const settings = {
        dataProcessing: {
          allowAnalytics: true,
          allowMarketing: false,
        },
        communication: {
          emailNotifications: true,
          marketingEmails: false,
        },
      };

      const updated = await gdprService.updatePrivacySettings(userId, settings);

      expect(updated.userId).toBe(userId);
      expect(updated.dataProcessing.allowAnalytics).toBe(true);
      expect(updated.dataProcessing.allowMarketing).toBe(false);
    });
  });
});

describe('SOC2ComplianceService', () => {
  let soc2Service: SOC2ComplianceService;

  beforeEach(() => {
    soc2Service = new SOC2ComplianceService();
    jest.clearAllMocks();
  });

  describe('getSecurityPolicy', () => {
    it('should create default SOC2 policy if none exists', async () => {
      const policy = await soc2Service.getSecurityPolicy();

      expect(policy).toHaveProperty('id');
      expect(policy.framework).toBe(ComplianceFramework.SOC2);
      expect(policy.requirements).toBeInstanceOf(Array);
      expect(policy.requirements.length).toBeGreaterThan(0);
      expect(policy.approved).toBe(true);
    });
  });

  describe('generateComplianceReport', () => {
    it('should generate compliance report', async () => {
      const period = {
        start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        end: new Date(),
      };

      const report = await soc2Service.generateComplianceReport(
        ComplianceFramework.SOC2,
        period
      );

      expect(report).toHaveProperty('id');
      expect(report.framework).toBe(ComplianceFramework.SOC2);
      expect(report.summary).toHaveProperty('complianceScore');
      expect(report.findings).toBeInstanceOf(Array);
      expect(report.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('checkAccessControls', () => {
    it('should check access control issues', async () => {
      const result = await soc2Service.checkAccessControls();

      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('issues');
      expect(result.issues).toBeInstanceOf(Array);
    });
  });
});

describe('ComplianceService', () => {
  let complianceService: ComplianceService;

  beforeEach(() => {
    complianceService = new ComplianceService();
    jest.clearAllMocks();
  });

  describe('getComplianceStatus', () => {
    it('should return overall compliance status', async () => {
      const status = await complianceService.getComplianceStatus();

      expect(status).toHaveProperty('frameworks');
      expect(status).toHaveProperty('overallCompliant');
      expect(status).toHaveProperty('recommendations');
      
      expect(status.frameworks).toHaveProperty(ComplianceFramework.GDPR);
      expect(status.frameworks).toHaveProperty(ComplianceFramework.SOC2);
    });
  });

  describe('validateCompliance', () => {
    it('should validate security config changes', async () => {
      const result = await complianceService.validateCompliance(
        'security_config',
        { mfaRequired: false }
      );

      expect(result.valid).toBe(false);
      expect(result.violations).toContain('Disabling MFA violates SOC2 security requirements');
    });

    it('should validate privacy settings changes', async () => {
      const result = await complianceService.validateCompliance(
        'privacy_settings',
        { dataSharing: true, consent: false }
      );

      expect(result.valid).toBe(false);
      expect(result.violations).toContain('Data sharing requires explicit consent under GDPR');
    });

    it('should provide recommendations for long retention', async () => {
      const result = await complianceService.validateCompliance(
        'retention_policy',
        { retentionDays: 3650 } // 10 years
      );

      expect(result.valid).toBe(true);
      expect(result.recommendations).toContain('Consider if such long retention is necessary');
    });
  });
});