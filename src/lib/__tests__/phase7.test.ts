/**
 * Phase 7 Test Suite - Advanced Capabilities
 * Tests API versioning, developer portal, PWA, integrations, and security
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { APIVersionManager } from '../api/versioning/version-manager';
import { DeveloperPortalManager } from '../developer-portal/portal-manager';
import { PWAManager } from '../pwa/pwa-manager';
import { IntegrationMarketplace } from '../integrations/marketplace-manager';
import { SecurityManager } from '../security/security-manager';

describe('Phase 7: Advanced Capabilities', () => {
  describe('API Versioning', () => {
    let versionManager: APIVersionManager;

    beforeEach(() => {
      versionManager = new APIVersionManager();
    });

    it('should negotiate API version correctly', () => {
      const request = {
        headers: { 'API-Version': '2024-09-01' },
        url: '/api/test'
      };

      const result = versionManager.negotiateVersion(request);
      expect(result.version).toBe('2024-09-01');
      expect(result.isSupported).toBe(true);
    });

    it('should handle deprecated versions with warnings', () => {
      const request = {
        headers: { 'API-Version': '2024-01-01' },
        url: '/api/test'
      };

      const result = versionManager.negotiateVersion(request);
      expect(result.warnings).toContain('This API version is deprecated');
    });

    it('should provide migration paths', () => {
      const migration = versionManager.getMigrationPath('2024-01-01', '2024-09-01');
      expect(migration).toBeDefined();
      expect(migration?.steps.length).toBeGreaterThan(0);
    });
  });

  describe('Developer Portal', () => {
    let portalManager: DeveloperPortalManager;

    beforeEach(() => {
      portalManager = new DeveloperPortalManager();
    });

    it('should generate API documentation', async () => {
      const docs = await portalManager.generateDocumentation();
      expect(docs.endpoints.length).toBeGreaterThan(0);
      expect(docs.version).toBeDefined();
    });

    it('should create API keys with proper scopes', async () => {
      const apiKey = await portalManager.createAPIKey(
        'test-org',
        'Test Key',
        ['read:buildings', 'write:analytics']
      );
      expect(apiKey.key).toMatch(/^blipee_/);
      expect(apiKey.scopes).toContain('read:buildings');
    });

    it('should track API usage metrics', async () => {
      const metrics = await portalManager.getUsageMetrics('test-org');
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('successRate');
    });

    it('should generate SDK code', () => {
      const sdk = portalManager.generateSDK('typescript');
      expect(sdk.code).toContain('class BlipeeClient');
      expect(sdk.language).toBe('typescript');
    });
  });

  describe('PWA Functionality', () => {
    let pwaManager: PWAManager;

    beforeEach(() => {
      // Mock browser APIs
      global.navigator = {
        serviceWorker: {
          register: jest.fn().mockResolvedValue({}),
          ready: Promise.resolve({})
        }
      } as any;

      pwaManager = new PWAManager();
    });

    it('should register service worker', async () => {
      const result = await pwaManager.registerServiceWorker();
      expect(result).toBe(true);
      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });

    it('should handle offline data syncing', async () => {
      await pwaManager.addToSyncQueue('update_building', { 
        buildingId: '123', 
        data: { name: 'Test Building' } 
      });
      
      const queue = pwaManager.getSyncQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].action).toBe('update_building');
    });

    it('should manage app manifest', () => {
      const manifest = pwaManager.getManifest();
      expect(manifest.name).toBe('Blipee - Autonomous Sustainability Intelligence');
      expect(manifest.start_url).toBe('/dashboard');
      expect(manifest.display).toBe('standalone');
    });
  });

  describe('Integration Marketplace', () => {
    let marketplace: IntegrationMarketplace;

    beforeEach(() => {
      marketplace = new IntegrationMarketplace();
    });

    it('should list available integrations', () => {
      const integrations = marketplace.getAvailableIntegrations();
      expect(integrations.length).toBeGreaterThan(0);
      expect(integrations.find(i => i.id === 'salesforce')).toBeDefined();
    });

    it('should install integration successfully', async () => {
      const result = await marketplace.installIntegration('test-org', 'salesforce', {
        apiKey: 'test-key',
        instanceUrl: 'https://test.salesforce.com'
      });
      
      expect(result.success).toBe(true);
      expect(result.integration?.status).toBe('active');
    });

    it('should manage webhooks', async () => {
      const webhook = await marketplace.createWebhook('test-org', 'salesforce', {
        url: 'https://example.com/webhook',
        events: ['data.updated', 'alert.triggered'],
        secret: 'webhook-secret'
      });

      expect(webhook.id).toBeDefined();
      expect(webhook.events).toContain('data.updated');
    });

    it('should handle webhook delivery with retries', async () => {
      const delivery = await marketplace.deliverWebhook({
        webhookId: 'test-webhook',
        event: 'data.updated',
        payload: { test: 'data' }
      });

      expect(delivery.attempts).toBeLessThanOrEqual(3);
    });
  });

  describe('Security Manager', () => {
    let securityManager: SecurityManager;

    beforeEach(() => {
      securityManager = new SecurityManager();
    });

    it('should validate JWT tokens', async () => {
      const token = await securityManager.generateToken({
        userId: 'user-123',
        organizationId: 'org-456'
      });

      const validated = await securityManager.validateToken(token);
      expect(validated.valid).toBe(true);
      expect(validated.payload?.userId).toBe('user-123');
    });

    it('should enforce password policies', () => {
      const weak = securityManager.validatePassword('password123');
      expect(weak.valid).toBe(false);
      expect(weak.issues).toContain('Must include special characters');

      const strong = securityManager.validatePassword('P@ssw0rd!2024#Secure');
      expect(strong.valid).toBe(true);
    });

    it('should detect and prevent threats', async () => {
      // Simulate multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await securityManager.recordFailedLogin('192.168.1.1', 'user-123');
      }

      const threat = await securityManager.detectThreat({
        ip: '192.168.1.1',
        userId: 'user-123',
        action: 'login'
      });

      expect(threat.detected).toBe(true);
      expect(threat.type).toBe('brute_force');
    });

    it('should handle session security', async () => {
      const session = await securityManager.createSession({
        userId: 'user-123',
        organizationId: 'org-456',
        ip: '192.168.1.1'
      });

      expect(session.id).toBeDefined();
      expect(session.expiresAt).toBeDefined();

      const valid = await securityManager.validateSession(session.id);
      expect(valid).toBe(true);
    });

    it('should audit security events', async () => {
      await securityManager.auditEvent({
        type: 'permission_changed',
        userId: 'user-123',
        details: { role: 'admin' }
      });

      const events = await securityManager.getAuditLog('user-123');
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('permission_changed');
    });
  });

  describe('Integration Tests', () => {
    it('should integrate API versioning with developer portal', async () => {
      const versionManager = new APIVersionManager();
      const portalManager = new DeveloperPortalManager();

      const docs = await portalManager.generateDocumentation();
      const latestVersion = versionManager.getLatestVersion();

      expect(docs.version).toBe(latestVersion);
    });

    it('should secure API endpoints with proper authentication', async () => {
      const securityManager = new SecurityManager();
      const portalManager = new DeveloperPortalManager();

      const apiKey = await portalManager.createAPIKey(
        'test-org',
        'Test Key',
        ['read:all']
      );

      const validated = await securityManager.validateAPIKey(apiKey.key);
      expect(validated.valid).toBe(true);
      expect(validated.scopes).toContain('read:all');
    });

    it('should work offline with PWA', async () => {
      const pwaManager = new PWAManager();
      
      // Simulate offline
      (global as any).navigator.onLine = false;

      await pwaManager.addToSyncQueue('create_building', {
        name: 'Offline Building'
      });

      // Simulate coming back online
      (global as any).navigator.onLine = true;
      
      const synced = await pwaManager.syncOfflineData();
      expect(synced.success).toBe(true);
      expect(synced.syncedItems).toBe(1);
    });
  });
});

// Export test utilities
export const phase7TestUtils = {
  createMockRequest: (version: string) => ({
    headers: { 'API-Version': version },
    url: '/api/test',
    method: 'GET'
  }),

  createMockUser: () => ({
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    organizationId: 'org-' + Math.random().toString(36).substr(2, 9),
    role: 'admin'
  }),

  simulateThreatScenario: async (securityManager: SecurityManager) => {
    const scenarios = [
      { type: 'brute_force', action: () => { /* simulate */ } },
      { type: 'data_exfiltration', action: () => { /* simulate */ } },
      { type: 'privilege_escalation', action: () => { /* simulate */ } }
    ];
    
    return scenarios;
  }
};