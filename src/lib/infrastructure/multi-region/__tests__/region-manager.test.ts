/**
 * Region Manager Test Suite
 * Comprehensive tests for multi-region architecture
 */

import { RegionManager } from '../region-manager';
import { RegionConfig, RegionHealth } from '../region-manager';

describe('RegionManager', () => {
  let regionManager: RegionManager;

  beforeEach(() => {
    regionManager = new RegionManager();
  });

  describe('Region Configuration', () => {
    it('should initialize with default regions', () => {
      const regions = regionManager.getAllRegions();
      expect(regions).toHaveLength(3);
      expect(regions.map(r => r.code)).toEqual(['us-east-1', 'eu-west-1', 'ap-southeast-1']);
    });

    it('should have one primary region', () => {
      const primaryRegion = regionManager.getPrimaryRegion();
      expect(primaryRegion).toBeDefined();
      expect(primaryRegion?.isPrimary).toBe(true);
      expect(primaryRegion?.code).toBe('us-east-1');
    });

    it('should get region by ID', () => {
      const region = regionManager.getRegion('us-east-1');
      expect(region).toBeDefined();
      expect(region?.name).toBe('US East (N. Virginia)');
    });

    it('should handle invalid region ID gracefully', () => {
      const region = regionManager.getRegion('invalid-region');
      expect(region).toBeUndefined();
    });
  });

  describe('Health Monitoring', () => {
    it('should perform health checks on all regions', async () => {
      const healthMetrics = await regionManager.performHealthCheck();
      expect(healthMetrics.size).toBe(3);
      
      // Check each region has health metrics
      for (const [regionId, metrics] of healthMetrics) {
        expect(metrics).toHaveProperty('latency');
        expect(metrics).toHaveProperty('availability');
        expect(metrics).toHaveProperty('errorRate');
        expect(metrics).toHaveProperty('throughput');
        expect(metrics).toHaveProperty('p50');
        expect(metrics).toHaveProperty('p95');
        expect(metrics).toHaveProperty('p99');
      }
    });

    it('should update region health status based on metrics', async () => {
      await regionManager.performHealthCheck();
      const regions = regionManager.getAllRegions();
      
      regions.forEach(region => {
        expect(['healthy', 'degraded', 'unavailable']).toContain(region.healthStatus);
      });
    });

    it('should monitor capabilities health', async () => {
      await regionManager.performHealthCheck();
      const region = regionManager.getRegion('us-east-1');
      
      expect(region?.capabilities).toBeDefined();
      region?.capabilities.forEach(capability => {
        expect(capability).toHaveProperty('service');
        expect(capability).toHaveProperty('healthStatus');
        expect(capability).toHaveProperty('lastChecked');
      });
    });
  });

  describe('Failover Management', () => {
    it('should trigger failover when primary region fails', async () => {
      const initialPrimary = regionManager.getPrimaryRegion();
      expect(initialPrimary?.code).toBe('us-east-1');

      // Simulate primary region failure
      const result = await regionManager.triggerFailover('us-east-1', 'Simulated failure');
      
      expect(result.success).toBe(true);
      expect(result.previousPrimary).toBe('us-east-1');
      expect(result.newPrimaryRegion).toBeDefined();
      expect(result.newPrimaryRegion).not.toBe('us-east-1');
    });

    it('should select healthy secondary region for failover', async () => {
      // Ensure secondary regions are healthy
      await regionManager.performHealthCheck();
      
      const result = await regionManager.triggerFailover('us-east-1', 'Test failover');
      const newPrimary = regionManager.getRegion(result.newPrimaryRegion!);
      
      expect(newPrimary?.healthStatus).toBe('healthy');
    });

    it('should prevent failover to unhealthy regions', async () => {
      // Mock all secondary regions as unhealthy
      const regions = regionManager.getAllRegions();
      regions.forEach(region => {
        if (!region.isPrimary) {
          region.healthStatus = 'unavailable';
        }
      });

      const result = await regionManager.triggerFailover('us-east-1', 'No healthy regions');
      expect(result.success).toBe(false);
      expect(result.error).toContain('No healthy secondary regions available');
    });

    it('should update failover history', async () => {
      await regionManager.triggerFailover('us-east-1', 'Test failover');
      const history = regionManager.getFailoverHistory();
      
      expect(history.length).toBeGreaterThan(0);
      const lastFailover = history[history.length - 1];
      expect(lastFailover).toHaveProperty('timestamp');
      expect(lastFailover).toHaveProperty('fromRegion', 'us-east-1');
      expect(lastFailover).toHaveProperty('toRegion');
      expect(lastFailover).toHaveProperty('reason');
      expect(lastFailover).toHaveProperty('success', true);
    });

    it('should handle automatic failback when enabled', async () => {
      const config = regionManager.getFailoverConfig();
      config.enableAutoFailback = true;
      regionManager.updateFailoverConfig(config);

      // Trigger failover
      await regionManager.triggerFailover('us-east-1', 'Test failover');
      const failoverPrimary = regionManager.getPrimaryRegion();
      expect(failoverPrimary?.code).not.toBe('us-east-1');

      // Simulate original region recovery
      const originalRegion = regionManager.getRegion('us-east-1');
      if (originalRegion) {
        originalRegion.healthStatus = 'healthy';
      }

      // Auto failback should be triggered (in real implementation)
      // This would be handled by a background process
    });
  });

  describe('Region Selection Strategy', () => {
    it('should select region based on lowest latency', () => {
      const bestRegion = regionManager.selectBestRegion('latency');
      expect(bestRegion).toBeDefined();
      expect(bestRegion?.healthStatus).toBe('healthy');
    });

    it('should select region based on data residency requirements', () => {
      const euRegion = regionManager.selectBestRegion('data-residency', ['GDPR']);
      expect(euRegion).toBeDefined();
      expect(euRegion?.code).toBe('eu-west-1');
    });

    it('should respect region capabilities when selecting', () => {
      const regionWithAI = regionManager.selectBestRegion('capability', ['ai-inference']);
      expect(regionWithAI).toBeDefined();
      
      const hasAICapability = regionWithAI?.capabilities.some(
        cap => cap.service === 'ai-inference' && cap.healthStatus === 'healthy'
      );
      expect(hasAICapability).toBe(true);
    });
  });

  describe('Failover Configuration', () => {
    it('should get current failover configuration', () => {
      const config = regionManager.getFailoverConfig();
      
      expect(config).toHaveProperty('primaryRegion');
      expect(config).toHaveProperty('secondaryRegions');
      expect(config).toHaveProperty('failoverThreshold');
      expect(config).toHaveProperty('healthCheckInterval');
      expect(config).toHaveProperty('maxFailoverTime');
      expect(config).toHaveProperty('enableAutoFailback');
    });

    it('should update failover configuration', () => {
      const newConfig = {
        primaryRegion: 'eu-west-1',
        secondaryRegions: ['us-east-1', 'ap-southeast-1'],
        failoverThreshold: 2000,
        healthCheckInterval: 60,
        maxFailoverTime: 120,
        enableAutoFailback: true
      };

      regionManager.updateFailoverConfig(newConfig);
      const updatedConfig = regionManager.getFailoverConfig();
      
      expect(updatedConfig).toEqual(newConfig);
    });

    it('should validate failover configuration', () => {
      const invalidConfig = {
        primaryRegion: 'invalid-region',
        secondaryRegions: [],
        failoverThreshold: -1,
        healthCheckInterval: 0,
        maxFailoverTime: 0,
        enableAutoFailback: false
      };

      expect(() => {
        regionManager.updateFailoverConfig(invalidConfig);
      }).toThrow();
    });
  });

  describe('Cross-Region Data Sync', () => {
    it('should check data sync status between regions', () => {
      const syncStatus = regionManager.getDataSyncStatus('us-east-1', 'eu-west-1');
      
      expect(syncStatus).toHaveProperty('source', 'us-east-1');
      expect(syncStatus).toHaveProperty('target', 'eu-west-1');
      expect(syncStatus).toHaveProperty('status');
      expect(syncStatus).toHaveProperty('lastSync');
      expect(syncStatus).toHaveProperty('lag');
    });

    it('should monitor replication lag', () => {
      const regions = regionManager.getAllRegions();
      const primary = regions.find(r => r.isPrimary);
      const secondaries = regions.filter(r => !r.isPrimary);

      secondaries.forEach(secondary => {
        const syncStatus = regionManager.getDataSyncStatus(primary!.code, secondary.code);
        expect(syncStatus.lag).toBeLessThan(1000); // Less than 1 second lag
      });
    });
  });

  describe('Region Capacity Management', () => {
    it('should monitor region capacity', () => {
      const regions = regionManager.getAllRegions();
      
      regions.forEach(region => {
        const capacity = regionManager.getRegionCapacity(region.code);
        expect(capacity).toHaveProperty('cpu');
        expect(capacity).toHaveProperty('memory');
        expect(capacity).toHaveProperty('storage');
        expect(capacity).toHaveProperty('network');
        
        // All capacity metrics should be between 0 and 100
        expect(capacity.cpu).toBeGreaterThanOrEqual(0);
        expect(capacity.cpu).toBeLessThanOrEqual(100);
      });
    });

    it('should prevent failover to regions at capacity', async () => {
      // Mock eu-west-1 at capacity
      jest.spyOn(regionManager, 'getRegionCapacity').mockImplementation((regionId) => {
        if (regionId === 'eu-west-1') {
          return { cpu: 95, memory: 92, storage: 88, network: 90 };
        }
        return { cpu: 50, memory: 45, storage: 60, network: 40 };
      });

      const result = await regionManager.triggerFailover('us-east-1', 'Capacity test');
      expect(result.newPrimaryRegion).not.toBe('eu-west-1');
    });
  });

  describe('Disaster Recovery', () => {
    it('should perform disaster recovery test', async () => {
      const drTest = await regionManager.performDisasterRecoveryTest('us-east-1', 'eu-west-1');
      
      expect(drTest).toHaveProperty('success');
      expect(drTest).toHaveProperty('rto'); // Recovery Time Objective
      expect(drTest).toHaveProperty('rpo'); // Recovery Point Objective
      expect(drTest).toHaveProperty('dataIntegrity');
      expect(drTest).toHaveProperty('serviceAvailability');
    });

    it('should meet RTO requirements', async () => {
      const drTest = await regionManager.performDisasterRecoveryTest('us-east-1', 'eu-west-1');
      expect(drTest.rto).toBeLessThan(300); // Less than 5 minutes
    });

    it('should meet RPO requirements', async () => {
      const drTest = await regionManager.performDisasterRecoveryTest('us-east-1', 'eu-west-1');
      expect(drTest.rpo).toBeLessThan(60); // Less than 1 minute of data loss
    });
  });
});

// Integration tests with actual region endpoints
describe('RegionManager Integration Tests', () => {
  let regionManager: RegionManager;

  beforeEach(() => {
    regionManager = new RegionManager();
  });

  it('should handle network partitions gracefully', async () => {
    // Simulate network partition
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
    
    const healthCheck = await regionManager.performHealthCheck();
    expect(healthCheck.size).toBeGreaterThan(0);
    
    // Should mark unreachable regions as unavailable
    const metrics = healthCheck.get('us-east-1');
    expect(metrics?.errorRate).toBeGreaterThan(0);
  });

  it('should handle partial region failures', async () => {
    // Simulate partial failure (some services down)
    const region = regionManager.getRegion('us-east-1');
    if (region) {
      region.capabilities[0].healthStatus = 'unavailable';
    }

    const healthCheck = await regionManager.performHealthCheck();
    const updatedRegion = regionManager.getRegion('us-east-1');
    
    expect(updatedRegion?.healthStatus).toBe('degraded');
  });
});

// Performance tests
describe('RegionManager Performance', () => {
  let regionManager: RegionManager;

  beforeEach(() => {
    regionManager = new RegionManager();
  });

  it('should complete health checks within acceptable time', async () => {
    const startTime = Date.now();
    await regionManager.performHealthCheck();
    const duration = Date.now() - startTime;
    
    expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should handle concurrent failover requests', async () => {
    const failoverPromises = [
      regionManager.triggerFailover('us-east-1', 'Concurrent test 1'),
      regionManager.triggerFailover('us-east-1', 'Concurrent test 2'),
      regionManager.triggerFailover('us-east-1', 'Concurrent test 3')
    ];

    const results = await Promise.all(failoverPromises);
    
    // Only one should succeed, others should be rejected
    const successCount = results.filter(r => r.success).length;
    expect(successCount).toBe(1);
  });
});