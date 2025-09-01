/**
 * Tenant Manager Test Suite
 * Tests for multi-tenant management and isolation
 */

import { jest } from '@jest/globals';
import { TenantManager } from '../tenant-manager';
import { 
  Tenant, 
  TenantConfig, 
  TenantPlan,
  TenantUsage,
  TenantIsolation
} from '../tenant-manager';

// Mock dependencies
jest.mock('@supabase/supabase-js');
jest.mock('ioredis');

describe('TenantManager', () => {
  let tenantManager: TenantManager;

  beforeEach(() => {
    jest.clearAllMocks();
    tenantManager = new TenantManager();
  });

  describe('Tenant Creation and Management', () => {
    it('should create new tenant with full configuration', async () => {
      const tenantConfig: TenantConfig = {
        name: 'Acme Corporation',
        slug: 'acme-corp',
        domain: 'acme.blipee.com',
        plan: 'enterprise',
        owner: {
          email: 'admin@acme.com',
          name: 'John Doe',
          role: 'account_owner'
        },
        settings: {
          timezone: 'America/New_York',
          language: 'en',
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          features: {
            aiInsights: true,
            advancedReporting: true,
            apiAccess: true,
            ssoEnabled: true,
            customBranding: true
          }
        },
        limits: {
          users: 1000,
          buildings: 100,
          apiCallsPerMonth: 1000000,
          storageGB: 500,
          dataRetentionDays: 365
        },
        billing: {
          plan: 'enterprise',
          cycle: 'annual',
          paymentMethod: 'invoice',
          billingEmail: 'billing@acme.com'
        }
      };

      const tenant = await tenantManager.createTenant(tenantConfig);
      
      expect(tenant).toHaveProperty('id');
      expect(tenant).toHaveProperty('slug', 'acme-corp');
      expect(tenant).toHaveProperty('status', 'active');
      expect(tenant).toHaveProperty('createdAt');
      expect(tenant).toHaveProperty('database');
      expect(tenant.database).toHaveProperty('schema', 'tenant_acme_corp');
    });

    it('should validate tenant configuration', async () => {
      const validation = await tenantManager.validateTenantConfig({
        slug: 'invalid slug!', // Invalid characters
        domain: 'not-a-domain', // Invalid domain
        plan: 'invalid-plan', // Non-existent plan
        limits: {
          users: -1, // Invalid limit
          storageGB: 10000 // Exceeds maximum
        }
      });

      expect(validation).toHaveProperty('valid', false);
      expect(validation).toHaveProperty('errors');
      expect(validation.errors).toContain('Invalid slug format');
      expect(validation.errors).toContain('Invalid domain format');
      expect(validation.errors).toContain('Invalid plan');
      expect(validation.errors).toContain('Invalid user limit');
    });

    it('should handle tenant provisioning workflow', async () => {
      const provisioning = await tenantManager.provisionTenant('tenant-001');
      
      expect(provisioning).toHaveProperty('steps');
      expect(provisioning.steps).toHaveLength(8);
      
      const expectedSteps = [
        'create_database_schema',
        'apply_migrations',
        'create_admin_user',
        'configure_permissions',
        'setup_default_data',
        'configure_integrations',
        'enable_features',
        'send_welcome_email'
      ];
      
      provisioning.steps.forEach((step, index) => {
        expect(step).toHaveProperty('name', expectedSteps[index]);
        expect(step).toHaveProperty('status', 'completed');
        expect(step).toHaveProperty('duration');
      });
      
      expect(provisioning).toHaveProperty('totalDuration');
      expect(provisioning.totalDuration).toBeLessThan(30000); // Under 30 seconds
    });

    it('should support tenant cloning', async () => {
      const clone = await tenantManager.cloneTenant({
        sourceId: 'tenant-001',
        newSlug: 'acme-subsidiary',
        newName: 'Acme Subsidiary',
        options: {
          cloneData: false,
          cloneUsers: false,
          cloneSettings: true,
          cloneBranding: true
        }
      });

      expect(clone).toHaveProperty('id');
      expect(clone).not.toBe('tenant-001');
      expect(clone.slug).toBe('acme-subsidiary');
      expect(clone.settings).toEqual(expect.objectContaining({
        timezone: 'America/New_York',
        language: 'en'
      }));
    });
  });

  describe('Tenant Isolation', () => {
    it('should enforce database isolation', async () => {
      const isolation = await tenantManager.verifyDatabaseIsolation('tenant-001');
      
      expect(isolation).toHaveProperty('schemaIsolated', true);
      expect(isolation).toHaveProperty('rlsEnabled', true);
      expect(isolation).toHaveProperty('crossTenantQueries', false);
      expect(isolation).toHaveProperty('isolationLevel', 'complete');
      
      expect(isolation).toHaveProperty('tests');
      isolation.tests.forEach(test => {
        expect(test).toHaveProperty('name');
        expect(test).toHaveProperty('passed', true);
      });
    });

    it('should implement row-level security', async () => {
      const rlsConfig = await tenantManager.configureRLS('tenant-001');
      
      expect(rlsConfig).toHaveProperty('policies');
      expect(rlsConfig.policies).toHaveLength(5); // CRUD + admin policies
      
      rlsConfig.policies.forEach(policy => {
        expect(policy).toHaveProperty('name');
        expect(policy).toHaveProperty('table');
        expect(policy).toHaveProperty('operation');
        expect(policy).toHaveProperty('condition');
        expect(policy.condition).toContain('tenant_id');
      });
    });

    it('should isolate file storage', async () => {
      const storageIsolation = await tenantManager.configureStorageIsolation('tenant-001');
      
      expect(storageIsolation).toHaveProperty('bucket', 'tenant-001-files');
      expect(storageIsolation).toHaveProperty('policies');
      expect(storageIsolation.policies).toHaveProperty('read');
      expect(storageIsolation.policies).toHaveProperty('write');
      expect(storageIsolation).toHaveProperty('cors');
      expect(storageIsolation).toHaveProperty('encryption', 'AES-256');
    });

    it('should isolate API access', async () => {
      const apiIsolation = await tenantManager.configureAPIIsolation('tenant-001');
      
      expect(apiIsolation).toHaveProperty('apiKey');
      expect(apiIsolation).toHaveProperty('scopes');
      expect(apiIsolation.scopes).toContain('tenant:tenant-001');
      expect(apiIsolation).toHaveProperty('rateLimits');
      expect(apiIsolation).toHaveProperty('ipWhitelist');
    });
  });

  describe('Tenant Plans and Billing', () => {
    it('should manage tenant plans', async () => {
      const plans: TenantPlan[] = await tenantManager.getAvailablePlans();
      
      expect(plans).toHaveLength(4);
      
      const expectedPlans = ['trial', 'starter', 'professional', 'enterprise'];
      plans.forEach((plan, index) => {
        expect(plan).toHaveProperty('id', expectedPlans[index]);
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('price');
        expect(plan).toHaveProperty('features');
        expect(plan).toHaveProperty('limits');
      });
    });

    it('should handle plan upgrades', async () => {
      const upgrade = await tenantManager.upgradePlan({
        tenantId: 'tenant-001',
        fromPlan: 'starter',
        toPlan: 'professional',
        effectiveDate: new Date()
      });

      expect(upgrade).toHaveProperty('success', true);
      expect(upgrade).toHaveProperty('changes');
      expect(upgrade.changes).toHaveProperty('limits');
      expect(upgrade.changes).toHaveProperty('features');
      expect(upgrade).toHaveProperty('prorated', true);
      expect(upgrade).toHaveProperty('invoiceAdjustment');
    });

    it('should handle plan downgrades', async () => {
      const downgrade = await tenantManager.downgradePlan({
        tenantId: 'tenant-001',
        fromPlan: 'professional',
        toPlan: 'starter',
        effectiveDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });

      expect(downgrade).toHaveProperty('success', true);
      expect(downgrade).toHaveProperty('warnings');
      expect(downgrade.warnings).toContain('Some features will be disabled');
      expect(downgrade).toHaveProperty('dataRetentionPlan');
      expect(downgrade).toHaveProperty('migrationTasks');
    });

    it('should track tenant usage', async () => {
      const usage: TenantUsage = await tenantManager.getTenantUsage('tenant-001', {
        period: 'current_month'
      });

      expect(usage).toHaveProperty('users');
      expect(usage.users).toHaveProperty('active', 45);
      expect(usage.users).toHaveProperty('limit', 100);
      expect(usage.users).toHaveProperty('percentage', 45);
      
      expect(usage).toHaveProperty('storage');
      expect(usage.storage).toHaveProperty('usedGB', 23.5);
      expect(usage.storage).toHaveProperty('limitGB', 100);
      
      expect(usage).toHaveProperty('apiCalls');
      expect(usage).toHaveProperty('buildings');
      expect(usage).toHaveProperty('cost');
    });

    it('should enforce usage limits', async () => {
      const enforcement = await tenantManager.checkUsageLimits('tenant-001');
      
      expect(enforcement).toHaveProperty('withinLimits');
      expect(enforcement).toHaveProperty('nearLimitWarnings');
      
      if (enforcement.nearLimitWarnings.length > 0) {
        enforcement.nearLimitWarnings.forEach(warning => {
          expect(warning).toHaveProperty('resource');
          expect(warning).toHaveProperty('usage');
          expect(warning).toHaveProperty('limit');
          expect(warning).toHaveProperty('percentage');
        });
      }
      
      expect(enforcement).toHaveProperty('actions');
    });
  });

  describe('Tenant Lifecycle Management', () => {
    it('should handle tenant suspension', async () => {
      const suspension = await tenantManager.suspendTenant({
        tenantId: 'tenant-001',
        reason: 'payment_overdue',
        suspendedBy: 'system',
        allowDataExport: true,
        gracePeriodDays: 7
      });

      expect(suspension).toHaveProperty('status', 'suspended');
      expect(suspension).toHaveProperty('suspendedAt');
      expect(suspension).toHaveProperty('gracePeriodEnds');
      expect(suspension).toHaveProperty('restrictions');
      expect(suspension.restrictions).toContain('login_disabled');
      expect(suspension.restrictions).toContain('api_disabled');
    });

    it('should handle tenant reactivation', async () => {
      const reactivation = await tenantManager.reactivateTenant('tenant-001', {
        reason: 'payment_received',
        reactivatedBy: 'admin@blipee.com'
      });

      expect(reactivation).toHaveProperty('status', 'active');
      expect(reactivation).toHaveProperty('reactivatedAt');
      expect(reactivation).toHaveProperty('restored');
      expect(reactivation.restored).toContain('api_access');
      expect(reactivation.restored).toContain('user_access');
    });

    it('should handle tenant deletion', async () => {
      const deletion = await tenantManager.deleteTenant({
        tenantId: 'tenant-001',
        deletionType: 'soft', // or 'hard'
        reason: 'customer_request',
        requestedBy: 'admin@acme.com',
        dataExport: true,
        confirmationCode: 'DELETE-ACME-2024'
      });

      expect(deletion).toHaveProperty('status', 'deleted');
      expect(deletion).toHaveProperty('deletedAt');
      expect(deletion).toHaveProperty('dataExportUrl');
      expect(deletion).toHaveProperty('retentionPeriod', 30);
      expect(deletion).toHaveProperty('permanentDeletionDate');
    });

    it('should handle tenant data export', async () => {
      const export_ = await tenantManager.exportTenantData('tenant-001', {
        format: 'json',
        includeUsers: true,
        includeSettings: true,
        includeData: true,
        includeFiles: true,
        compression: 'gzip'
      });

      expect(export_).toHaveProperty('jobId');
      expect(export_).toHaveProperty('status', 'processing');
      expect(export_).toHaveProperty('estimatedTime');
      expect(export_).toHaveProperty('notificationEmail');
      
      // Check export progress
      const progress = await tenantManager.getExportProgress(export_.jobId);
      expect(progress).toHaveProperty('percentage');
      expect(progress).toHaveProperty('currentStep');
      expect(progress).toHaveProperty('estimatedCompletion');
    });

    it('should handle tenant migration', async () => {
      const migration = await tenantManager.migrateTenant({
        tenantId: 'tenant-001',
        targetRegion: 'eu-west-1',
        targetDatabase: 'postgresql-eu',
        migrationWindow: {
          start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          duration: 4 * 60 * 60 * 1000 // 4 hours
        },
        notifications: ['admin@acme.com', 'ops@blipee.com']
      });

      expect(migration).toHaveProperty('migrationId');
      expect(migration).toHaveProperty('status', 'scheduled');
      expect(migration).toHaveProperty('steps');
      expect(migration).toHaveProperty('estimatedDowntime');
      expect(migration).toHaveProperty('rollbackPlan');
    });
  });

  describe('Multi-Region Support', () => {
    it('should support tenant region selection', async () => {
      const regions = await tenantManager.getAvailableRegions();
      
      expect(regions).toHaveLength(3);
      regions.forEach(region => {
        expect(region).toHaveProperty('id');
        expect(region).toHaveProperty('name');
        expect(region).toHaveProperty('location');
        expect(region).toHaveProperty('dataResidency');
        expect(region).toHaveProperty('compliance');
        expect(region).toHaveProperty('latency');
      });
    });

    it('should handle cross-region replication', async () => {
      const replication = await tenantManager.configureReplication('tenant-001', {
        primaryRegion: 'us-east-1',
        replicaRegions: ['eu-west-1', 'ap-southeast-1'],
        replicationMode: 'async',
        consistencyLevel: 'eventual'
      });

      expect(replication).toHaveProperty('enabled', true);
      expect(replication).toHaveProperty('lag');
      Object.keys(replication.lag).forEach(region => {
        expect(replication.lag[region]).toBeLessThan(1000); // Less than 1 second
      });
    });

    it('should handle region failover', async () => {
      const failover = await tenantManager.performRegionFailover({
        tenantId: 'tenant-001',
        fromRegion: 'us-east-1',
        toRegion: 'eu-west-1',
        reason: 'region_outage'
      });

      expect(failover).toHaveProperty('success', true);
      expect(failover).toHaveProperty('newPrimaryRegion', 'eu-west-1');
      expect(failover).toHaveProperty('failoverTime');
      expect(failover.failoverTime).toBeLessThan(60000); // Under 1 minute
      expect(failover).toHaveProperty('dataConsistency', 'verified');
    });
  });

  describe('Tenant Monitoring and Analytics', () => {
    it('should provide tenant health metrics', async () => {
      const health = await tenantManager.getTenantHealth('tenant-001');
      
      expect(health).toHaveProperty('overall', 'healthy');
      expect(health).toHaveProperty('metrics');
      expect(health.metrics).toHaveProperty('uptime', 99.99);
      expect(health.metrics).toHaveProperty('performance');
      expect(health.metrics).toHaveProperty('errors');
      expect(health.metrics).toHaveProperty('usage');
      
      expect(health).toHaveProperty('alerts', []);
      expect(health).toHaveProperty('recommendations');
    });

    it('should track tenant activity', async () => {
      const activity = await tenantManager.getTenantActivity('tenant-001', {
        period: 'last_7_days',
        groupBy: 'day'
      });

      expect(Array.isArray(activity)).toBe(true);
      activity.forEach(day => {
        expect(day).toHaveProperty('date');
        expect(day).toHaveProperty('activeUsers');
        expect(day).toHaveProperty('apiCalls');
        expect(day).toHaveProperty('dataProcessed');
        expect(day).toHaveProperty('errors');
      });
    });

    it('should generate tenant reports', async () => {
      const report = await tenantManager.generateTenantReport('tenant-001', {
        type: 'monthly',
        month: new Date(),
        sections: ['usage', 'performance', 'billing', 'compliance']
      });

      expect(report).toHaveProperty('tenantId', 'tenant-001');
      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('sections');
      expect(report.sections).toHaveProperty('usage');
      expect(report.sections).toHaveProperty('performance');
      expect(report.sections).toHaveProperty('billing');
      expect(report.sections).toHaveProperty('compliance');
      expect(report).toHaveProperty('summary');
    });

    it('should provide tenant analytics dashboard', async () => {
      const analytics = await tenantManager.getTenantAnalytics('tenant-001');
      
      expect(analytics).toHaveProperty('kpis');
      expect(analytics.kpis).toHaveProperty('userEngagement');
      expect(analytics.kpis).toHaveProperty('featureAdoption');
      expect(analytics.kpis).toHaveProperty('dataGrowth');
      expect(analytics.kpis).toHaveProperty('costEfficiency');
      
      expect(analytics).toHaveProperty('trends');
      expect(analytics).toHaveProperty('predictions');
      expect(analytics).toHaveProperty('insights');
    });
  });

  describe('Tenant Configuration Management', () => {
    it('should manage tenant feature flags', async () => {
      const features = await tenantManager.updateFeatureFlags('tenant-001', {
        newAIDashboard: true,
        advancedAnalytics: true,
        betaFeatures: false,
        customWebhooks: true
      });

      expect(features).toHaveProperty('updated');
      expect(features.updated).toHaveLength(4);
      expect(features).toHaveProperty('effective', 'immediate');
      expect(features).toHaveProperty('requiresRestart', false);
    });

    it('should manage tenant integrations', async () => {
      const integrations = await tenantManager.configureIntegrations('tenant-001', {
        slack: {
          enabled: true,
          webhookUrl: 'https://slack.com/webhook',
          channels: ['#alerts', '#reports']
        },
        teams: {
          enabled: true,
          tenantId: 'ms-tenant-id',
          channels: ['General', 'Sustainability']
        },
        email: {
          provider: 'sendgrid',
          apiKey: 'encrypted-key',
          fromAddress: 'noreply@acme.com'
        }
      });

      expect(integrations).toHaveProperty('configured');
      expect(integrations.configured).toHaveLength(3);
      expect(integrations).toHaveProperty('tested');
      integrations.tested.forEach(test => {
        expect(test).toHaveProperty('integration');
        expect(test).toHaveProperty('status', 'success');
      });
    });

    it('should manage tenant webhooks', async () => {
      const webhooks = await tenantManager.configureWebhooks('tenant-001', [
        {
          url: 'https://acme.com/webhook/events',
          events: ['user.created', 'user.deleted', 'data.updated'],
          headers: { 'X-API-Key': 'secret' },
          retryPolicy: { maxRetries: 3, backoffMultiplier: 2 }
        }
      ]);

      expect(webhooks).toHaveProperty('configured');
      expect(webhooks.configured).toHaveLength(1);
      expect(webhooks).toHaveProperty('validated', true);
      expect(webhooks).toHaveProperty('testResults');
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent tenant operations', async () => {
      const operations = Array.from({ length: 50 }, (_, i) => ({
        tenantId: `tenant-${i}`,
        operation: ['create', 'update', 'read'][i % 3],
        data: { name: `Tenant ${i}` }
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        operations.map(op => tenantManager.performOperation(op))
      );
      const duration = Date.now() - startTime;

      expect(results).toHaveLength(50);
      expect(duration).toBeLessThan(5000); // Handle 50 operations in under 5 seconds
      
      results.forEach(result => {
        expect(result).toHaveProperty('success', true);
      });
    });

    it('should optimize tenant queries', async () => {
      const query = await tenantManager.optimizeTenantQuery({
        tenantId: 'tenant-001',
        query: 'SELECT * FROM large_table WHERE tenant_id = $1',
        explain: true
      });

      expect(query).toHaveProperty('optimized', true);
      expect(query).toHaveProperty('indexesUsed');
      expect(query.indexesUsed).toContain('tenant_id_idx');
      expect(query).toHaveProperty('estimatedCost');
      expect(query).toHaveProperty('executionTime');
      expect(query.executionTime).toBeLessThan(100); // Under 100ms
    });

    it('should handle tenant scaling', async () => {
      const scaling = await tenantManager.scaleTenant({
        tenantId: 'tenant-001',
        scaleType: 'vertical',
        newSize: 'xl',
        schedule: 'immediate'
      });

      expect(scaling).toHaveProperty('success', true);
      expect(scaling).toHaveProperty('fromSize', 'large');
      expect(scaling).toHaveProperty('toSize', 'xl');
      expect(scaling).toHaveProperty('downtime', 0); // Zero downtime scaling
      expect(scaling).toHaveProperty('performanceImprovement');
      expect(scaling.performanceImprovement).toBeGreaterThan(1.5); // 50% improvement
    });
  });
});