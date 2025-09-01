/**
 * Data Residency Manager Test Suite
 * Tests for compliance with data residency requirements
 */

import { DataResidencyManager } from '../data-residency';
import { DataResidencyPolicy, DataClassification } from '../data-residency';

describe('DataResidencyManager', () => {
  let dataResidencyManager: DataResidencyManager;

  beforeEach(() => {
    dataResidencyManager = new DataResidencyManager();
  });

  describe('Policy Management', () => {
    it('should initialize with default policies', () => {
      const policies = dataResidencyManager.getAllPolicies();
      expect(policies.size).toBeGreaterThan(0);
      
      // Check for essential policies
      expect(policies.has('gdpr-eu')).toBe(true);
      expect(policies.has('ccpa-us')).toBe(true);
      expect(policies.has('pdpa-singapore')).toBe(true);
    });

    it('should retrieve policy by ID', () => {
      const gdprPolicy = dataResidencyManager.getPolicy('gdpr-eu');
      expect(gdprPolicy).toBeDefined();
      expect(gdprPolicy?.name).toBe('GDPR - European Union');
      expect(gdprPolicy?.allowedRegions).toContain('eu-west-1');
    });

    it('should create custom policy', () => {
      const customPolicy: DataResidencyPolicy = {
        id: 'custom-policy',
        name: 'Custom Data Policy',
        description: 'Test custom policy',
        allowedRegions: ['us-east-1'],
        restrictedRegions: ['eu-west-1'],
        dataCategories: ['financial'],
        regulations: ['SOX'],
        encryptionRequired: true,
        retentionDays: 365,
        crossBorderTransferAllowed: false,
        auditingRequired: true,
        priority: 5
      };

      dataResidencyManager.addPolicy(customPolicy);
      const retrieved = dataResidencyManager.getPolicy('custom-policy');
      expect(retrieved).toEqual(customPolicy);
    });

    it('should validate policy conflicts', () => {
      const conflictingPolicy: DataResidencyPolicy = {
        id: 'conflict-test',
        name: 'Conflicting Policy',
        description: 'Should conflict with GDPR',
        allowedRegions: ['us-east-1'],
        restrictedRegions: [],
        dataCategories: ['personal'],
        regulations: ['GDPR'],
        encryptionRequired: false, // Conflicts with GDPR requirement
        retentionDays: 0,
        crossBorderTransferAllowed: true, // Conflicts with GDPR
        auditingRequired: false,
        priority: 10
      };

      const conflicts = dataResidencyManager.validatePolicy(conflictingPolicy);
      expect(conflicts).toHaveLength(2);
      expect(conflicts).toContain('GDPR requires encryption for personal data');
      expect(conflicts).toContain('GDPR restricts cross-border transfers');
    });
  });

  describe('Data Classification', () => {
    it('should classify data correctly', () => {
      const testData = [
        { type: 'email', expected: 'personal' },
        { type: 'credit_card', expected: 'financial' },
        { type: 'health_record', expected: 'health' },
        { type: 'api_key', expected: 'technical' },
        { type: 'company_revenue', expected: 'business' }
      ];

      testData.forEach(({ type, expected }) => {
        const classification = dataResidencyManager.classifyData(type);
        expect(classification).toBe(expected);
      });
    });

    it('should determine required regions based on data classification', () => {
      const personalDataRegions = dataResidencyManager.getRequiredRegions('personal', 'EU');
      expect(personalDataRegions).toContain('eu-west-1');
      expect(personalDataRegions).not.toContain('us-east-1');

      const usDataRegions = dataResidencyManager.getRequiredRegions('financial', 'US');
      expect(usDataRegions).toContain('us-east-1');
    });

    it('should validate data location compliance', () => {
      // EU personal data in EU region - compliant
      const euCompliance = dataResidencyManager.validateDataLocation(
        'personal',
        'EU',
        'eu-west-1'
      );
      expect(euCompliance.compliant).toBe(true);

      // EU personal data in US region - non-compliant
      const nonCompliance = dataResidencyManager.validateDataLocation(
        'personal',
        'EU',
        'us-east-1'
      );
      expect(nonCompliance.compliant).toBe(false);
      expect(nonCompliance.violations).toContain('GDPR');
    });
  });

  describe('Cross-Border Transfer Validation', () => {
    it('should validate cross-border transfers', () => {
      // GDPR data transfer within EU - allowed
      const intraEU = dataResidencyManager.validateTransfer(
        'personal',
        'eu-west-1',
        'eu-central-1',
        'GDPR'
      );
      expect(intraEU.allowed).toBe(true);

      // GDPR data transfer to US - requires safeguards
      const euToUS = dataResidencyManager.validateTransfer(
        'personal',
        'eu-west-1',
        'us-east-1',
        'GDPR'
      );
      expect(euToUS.allowed).toBe(false);
      expect(euToUS.requiredSafeguards).toContain('Standard Contractual Clauses');
    });

    it('should enforce encryption for cross-border transfers', () => {
      const transfer = dataResidencyManager.validateTransfer(
        'financial',
        'us-east-1',
        'ap-southeast-1',
        'SOX'
      );
      expect(transfer.encryptionRequired).toBe(true);
      expect(transfer.encryptionLevel).toBe('AES-256');
    });

    it('should track transfer audit trail', () => {
      dataResidencyManager.recordTransfer({
        dataType: 'personal',
        sourceRegion: 'eu-west-1',
        targetRegion: 'eu-central-1',
        timestamp: new Date(),
        authorized: true,
        authorizedBy: 'system',
        purpose: 'Disaster recovery',
        safeguards: ['Encryption', 'Access controls']
      });

      const auditTrail = dataResidencyManager.getTransferAuditTrail();
      expect(auditTrail).toHaveLength(1);
      expect(auditTrail[0].purpose).toBe('Disaster recovery');
    });
  });

  describe('Multi-Regulation Compliance', () => {
    it('should handle overlapping regulations', () => {
      // Data subject to both GDPR and CCPA
      const dualRegulation = dataResidencyManager.getApplicableRegulations(
        'personal',
        ['EU', 'California']
      );
      expect(dualRegulation).toContain('GDPR');
      expect(dualRegulation).toContain('CCPA');

      // Should apply most restrictive requirements
      const requirements = dataResidencyManager.getMostRestrictiveRequirements(dualRegulation);
      expect(requirements.retentionDays).toBe(2555); // GDPR's 7 years
      expect(requirements.encryptionRequired).toBe(true);
      expect(requirements.allowedRegions).toEqual(['eu-west-1']); // Most restrictive
    });

    it('should generate compliance matrix', () => {
      const matrix = dataResidencyManager.generateComplianceMatrix();
      
      expect(matrix).toHaveProperty('personal');
      expect(matrix.personal).toHaveProperty('GDPR');
      expect(matrix.personal.GDPR).toHaveProperty('allowedRegions');
      expect(matrix.personal.GDPR).toHaveProperty('requirements');
    });
  });

  describe('Data Localization', () => {
    it('should determine optimal region for data storage', () => {
      const optimal = dataResidencyManager.determineOptimalRegion(
        'personal',
        'EU',
        ['latency', 'compliance']
      );
      expect(optimal).toBe('eu-west-1');
    });

    it('should suggest data migration when regulations change', () => {
      // Simulate new regulation requiring data localization
      const newPolicy: DataResidencyPolicy = {
        id: 'new-local-law',
        name: 'New Localization Law',
        description: 'Requires data to be stored locally',
        allowedRegions: ['ap-southeast-1'],
        restrictedRegions: ['us-east-1', 'eu-west-1'],
        dataCategories: ['personal', 'financial'],
        regulations: ['LOCAL_LAW'],
        encryptionRequired: true,
        retentionDays: 1825,
        crossBorderTransferAllowed: false,
        auditingRequired: true,
        priority: 10
      };

      dataResidencyManager.addPolicy(newPolicy);
      const migrations = dataResidencyManager.suggestDataMigrations('LOCAL_LAW');
      
      expect(migrations).toHaveLength(2); // personal and financial data
      expect(migrations[0].targetRegion).toBe('ap-southeast-1');
    });
  });

  describe('Encryption Requirements', () => {
    it('should enforce encryption based on data type and region', () => {
      const requirements = dataResidencyManager.getEncryptionRequirements(
        'health',
        'us-east-1'
      );
      expect(requirements.required).toBe(true);
      expect(requirements.algorithm).toBe('AES-256-GCM');
      expect(requirements.keyRotation).toBe(90); // days
    });

    it('should validate encryption compliance', () => {
      const compliant = dataResidencyManager.validateEncryption(
        'financial',
        {
          algorithm: 'AES-256-GCM',
          keyRotationDays: 90,
          atRest: true,
          inTransit: true
        }
      );
      expect(compliant).toBe(true);

      const nonCompliant = dataResidencyManager.validateEncryption(
        'financial',
        {
          algorithm: 'AES-128', // Too weak
          keyRotationDays: 365, // Too long
          atRest: true,
          inTransit: false // Required
        }
      );
      expect(nonCompliant).toBe(false);
    });
  });

  describe('Audit and Reporting', () => {
    it('should generate compliance report', () => {
      const report = dataResidencyManager.generateComplianceReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('policies');
      expect(report).toHaveProperty('dataDistribution');
      expect(report).toHaveProperty('violations');
      expect(report).toHaveProperty('recommendations');
    });

    it('should track policy violations', () => {
      dataResidencyManager.recordViolation({
        timestamp: new Date(),
        dataType: 'personal',
        location: 'us-east-1',
        regulation: 'GDPR',
        severity: 'high',
        description: 'EU personal data stored in US region'
      });

      const violations = dataResidencyManager.getViolations();
      expect(violations).toHaveLength(1);
      expect(violations[0].severity).toBe('high');
    });

    it('should generate audit trail for data access', () => {
      dataResidencyManager.recordAccess({
        timestamp: new Date(),
        dataType: 'financial',
        location: 'us-east-1',
        accessedBy: 'user123',
        purpose: 'Financial reporting',
        authorized: true
      });

      const auditTrail = dataResidencyManager.getAccessAuditTrail('financial');
      expect(auditTrail).toHaveLength(1);
      expect(auditTrail[0].purpose).toBe('Financial reporting');
    });
  });

  describe('Performance and Optimization', () => {
    it('should cache policy decisions', () => {
      const start = Date.now();
      
      // First call - no cache
      dataResidencyManager.validateDataLocation('personal', 'EU', 'eu-west-1');
      const firstCallTime = Date.now() - start;

      // Second call - should use cache
      const cacheStart = Date.now();
      dataResidencyManager.validateDataLocation('personal', 'EU', 'eu-west-1');
      const cachedCallTime = Date.now() - cacheStart;

      expect(cachedCallTime).toBeLessThan(firstCallTime);
    });

    it('should batch validate multiple data items', () => {
      const items = [
        { type: 'personal', origin: 'EU', location: 'eu-west-1' },
        { type: 'financial', origin: 'US', location: 'us-east-1' },
        { type: 'health', origin: 'US', location: 'us-east-1' },
        { type: 'technical', origin: 'Global', location: 'ap-southeast-1' }
      ];

      const results = dataResidencyManager.batchValidate(items);
      expect(results).toHaveLength(4);
      expect(results.every(r => r.hasOwnProperty('compliant'))).toBe(true);
    });
  });
});