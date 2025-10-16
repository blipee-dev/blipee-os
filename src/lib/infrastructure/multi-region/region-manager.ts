/**
 * Multi-Region Architecture Manager
 * Manages deployment across us-east-1, eu-west-1, ap-southeast-1
 */

export interface RegionConfig {
  id: string;
  name: string;
  code: string;
  endpoint: string;
  isPrimary: boolean;
  dataResidency: string[];
  capabilities: RegionCapability[];
  healthStatus: 'healthy' | 'degraded' | 'unavailable';
  latencyThreshold: number; // ms
}

export interface RegionCapability {
  service: string;
  enabled: boolean;
  healthStatus: 'healthy' | 'degraded' | 'unavailable';
  lastChecked: Date;
}

export interface RegionLatencyMetrics {
  regionId: string;
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
  throughput: number;
  timestamp: Date;
}

export interface FailoverConfig {
  primaryRegion: string;
  secondaryRegions: string[];
  failoverThreshold: number; // ms
  maxFailoverTime: number; // seconds
  healthCheckInterval: number; // seconds
  enableAutoFailback: boolean;
}

/**
 * Region Manager for enterprise multi-region deployment
 */
export class RegionManager {
  private regions: Map<string, RegionConfig> = new Map();
  private failoverConfig: FailoverConfig;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    this.failoverConfig = this.getDefaultFailoverConfig();
    this.initializeRegions();
  }

  /**
   * Initialize default region configuration
   */
  private initializeRegions(): void {
    const regions: RegionConfig[] = [
      {
        id: 'us-east-1',
        name: 'US East (Virginia)',
        code: 'iad1',
        endpoint: 'https://us-east.blipee.com',
        isPrimary: true,
        dataResidency: ['US', 'CA', 'MX'],
        capabilities: this.getDefaultCapabilities(),
        healthStatus: 'healthy',
        latencyThreshold: 100
      },
      {
        id: 'eu-west-1',
        name: 'EU West (Ireland)', 
        code: 'dub1',
        endpoint: 'https://eu-west.blipee.com',
        isPrimary: false,
        dataResidency: ['EU', 'UK', 'NO', 'CH'],
        capabilities: this.getDefaultCapabilities(),
        healthStatus: 'healthy',
        latencyThreshold: 150
      },
      {
        id: 'ap-southeast-1',
        name: 'Asia Pacific (Singapore)',
        code: 'sin1', 
        endpoint: 'https://ap-southeast.blipee.com',
        isPrimary: false,
        dataResidency: ['SG', 'MY', 'TH', 'ID', 'VN', 'PH'],
        capabilities: this.getDefaultCapabilities(),
        healthStatus: 'healthy',
        latencyThreshold: 200
      }
    ];

    regions.forEach(region => {
      this.regions.set(region.id, region);
    });
  }

  private getDefaultCapabilities(): RegionCapability[] {
    return [
      { service: 'api', enabled: true, healthStatus: 'healthy', lastChecked: new Date() },
      { service: 'database', enabled: true, healthStatus: 'healthy', lastChecked: new Date() },
      { service: 'ai', enabled: true, healthStatus: 'healthy', lastChecked: new Date() },
      { service: 'storage', enabled: true, healthStatus: 'healthy', lastChecked: new Date() },
      { service: 'monitoring', enabled: true, healthStatus: 'healthy', lastChecked: new Date() }
    ];
  }

  private getDefaultFailoverConfig(): FailoverConfig {
    return {
      primaryRegion: 'us-east-1',
      secondaryRegions: ['eu-west-1', 'ap-southeast-1'],
      failoverThreshold: 1000, // 1 second
      maxFailoverTime: 30, // 30 seconds
      healthCheckInterval: 30, // 30 seconds
      enableAutoFailback: true
    };
  }

  /**
   * Get the optimal region for a request based on location and health
   */
  async getOptimalRegion(
    clientLocation?: string,
    requestType?: string
  ): Promise<RegionConfig> {
    const healthyRegions = Array.from(this.regions.values())
      .filter(region => region.healthStatus === 'healthy');

    if (healthyRegions.length === 0) {
      throw new Error('No healthy regions available');
    }

    // If client location provided, find closest region
    if (clientLocation) {
      const closestRegion = this.findClosestRegion(clientLocation, healthyRegions);
      if (closestRegion) {
        return closestRegion;
      }
    }

    // Default to primary region if healthy
    const primaryRegion = healthyRegions.find(r => r.isPrimary);
    if (primaryRegion) {
      return primaryRegion;
    }

    // Return first available healthy region
    return healthyRegions[0];
  }

  /**
   * Find closest region based on client location
   */
  private findClosestRegion(
    clientLocation: string, 
    healthyRegions: RegionConfig[]
  ): RegionConfig | null {
    // Map common country codes to preferred regions
    const locationMapping: Record<string, string> = {
      // Americas
      'US': 'us-east-1',
      'CA': 'us-east-1', 
      'MX': 'us-east-1',
      'BR': 'us-east-1',
      'AR': 'us-east-1',
      
      // Europe
      'GB': 'eu-west-1',
      'IE': 'eu-west-1',
      'DE': 'eu-west-1',
      'FR': 'eu-west-1',
      'ES': 'eu-west-1',
      'IT': 'eu-west-1',
      'NL': 'eu-west-1',
      'BE': 'eu-west-1',
      'CH': 'eu-west-1',
      'AT': 'eu-west-1',
      'NO': 'eu-west-1',
      'SE': 'eu-west-1',
      'DK': 'eu-west-1',
      'FI': 'eu-west-1',
      
      // Asia Pacific
      'SG': 'ap-southeast-1',
      'MY': 'ap-southeast-1',
      'TH': 'ap-southeast-1',
      'ID': 'ap-southeast-1',
      'VN': 'ap-southeast-1',
      'PH': 'ap-southeast-1',
      'AU': 'ap-southeast-1',
      'NZ': 'ap-southeast-1',
      'JP': 'ap-southeast-1',
      'KR': 'ap-southeast-1',
      'IN': 'ap-southeast-1',
      'CN': 'ap-southeast-1'
    };

    const preferredRegionId = locationMapping[clientLocation.toUpperCase()];
    if (preferredRegionId) {
      return healthyRegions.find(r => r.id === preferredRegionId) || null;
    }

    return null;
  }

  /**
   * Check health of all regions
   */
  async performHealthCheck(): Promise<Map<string, RegionLatencyMetrics>> {
    const results = new Map<string, RegionLatencyMetrics>();

    await Promise.all(
      Array.from(this.regions.values()).map(async (region) => {
        try {
          const metrics = await this.checkRegionHealth(region);
          results.set(region.id, metrics);
          
          // Update region health status
          const updatedRegion = { ...region };
          updatedRegion.healthStatus = this.determineHealthStatus(metrics);
          this.regions.set(region.id, updatedRegion);
          
        } catch (error) {
          console.error(`Health check failed for region ${region.id}:`, error);
          
          // Mark region as unavailable
          const updatedRegion = { ...region };
          updatedRegion.healthStatus = 'unavailable';
          this.regions.set(region.id, updatedRegion);
        }
      })
    );

    return results;
  }

  /**
   * Check individual region health
   */
  private async checkRegionHealth(region: RegionConfig): Promise<RegionLatencyMetrics> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${region.endpoint}/api/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'blipee-region-health-checker/1.0'
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      const endTime = Date.now();
      const latency = endTime - startTime;

      return {
        regionId: region.id,
        p50: latency,
        p95: latency * 1.2, // Estimate
        p99: latency * 1.5, // Estimate  
        errorRate: response.ok ? 0 : 1,
        throughput: response.ok ? 1 : 0,
        timestamp: new Date()
      };
      
    } catch (error) {
      const endTime = Date.now();
      return {
        regionId: region.id,
        p50: endTime - startTime,
        p95: endTime - startTime,
        p99: endTime - startTime,
        errorRate: 1,
        throughput: 0,
        timestamp: new Date()
      };
    }
  }

  /**
   * Determine health status from metrics
   */
  private determineHealthStatus(metrics: RegionLatencyMetrics): 'healthy' | 'degraded' | 'unavailable' {
    if (metrics.errorRate === 1) {
      return 'unavailable';
    }
    
    if (metrics.p95 > 2000) { // > 2 seconds
      return 'degraded';
    }

    if (metrics.errorRate > 0.1) { // > 10% error rate
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Trigger failover to secondary region
   */
  async triggerFailover(
    failedRegionId: string,
    reason: string
  ): Promise<{ success: boolean; newPrimaryRegion?: string; error?: string }> {

    try {
      // Find best secondary region
      const healthySecondaryRegions = this.failoverConfig.secondaryRegions
        .map(id => this.regions.get(id))
        .filter(region => region && region.healthStatus === 'healthy');

      if (healthySecondaryRegions.length === 0) {
        return {
          success: false,
          error: 'No healthy secondary regions available for failover'
        };
      }

      // Select best secondary region (first healthy one)
      const newPrimaryRegion = healthySecondaryRegions[0]!;

      // Update failover configuration
      this.failoverConfig.primaryRegion = newPrimaryRegion.id;
      
      // Mark the failed region
      const failedRegion = this.regions.get(failedRegionId);
      if (failedRegion) {
        failedRegion.healthStatus = 'unavailable';
        this.regions.set(failedRegionId, failedRegion);
      }

      // Update new primary
      newPrimaryRegion.isPrimary = true;
      this.regions.set(newPrimaryRegion.id, newPrimaryRegion);


      return {
        success: true,
        newPrimaryRegion: newPrimaryRegion.id
      };

    } catch (error) {
      console.error('❌ Failover failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown failover error'
      };
    }
  }

  /**
   * Start continuous health monitoring
   */
  startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthMetrics = await this.performHealthCheck();
        
        // Check if primary region needs failover
        const primaryRegion = this.regions.get(this.failoverConfig.primaryRegion);
        if (primaryRegion && primaryRegion.healthStatus !== 'healthy') {
          await this.triggerFailover(
            primaryRegion.id,
            `Primary region health status: ${primaryRegion.healthStatus}`
          );
        }
        
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, this.failoverConfig.healthCheckInterval * 1000);

  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * Get all regions
   */
  getAllRegions(): RegionConfig[] {
    return Array.from(this.regions.values());
  }

  /**
   * Get region by ID
   */
  getRegion(regionId: string): RegionConfig | undefined {
    return this.regions.get(regionId);
  }

  /**
   * Get current primary region
   */
  getPrimaryRegion(): RegionConfig | undefined {
    return this.regions.get(this.failoverConfig.primaryRegion);
  }

  /**
   * Get regions by data residency requirement
   */
  getRegionsByDataResidency(countryCode: string): RegionConfig[] {
    return Array.from(this.regions.values())
      .filter(region => region.dataResidency.includes(countryCode));
  }

  /**
   * Update failover configuration
   */
  updateFailoverConfig(config: Partial<FailoverConfig>): void {
    this.failoverConfig = { ...this.failoverConfig, ...config };
  }

  /**
   * Get failover configuration
   */
  getFailoverConfig(): FailoverConfig {
    return { ...this.failoverConfig };
  }
}

/**
 * Global region manager instance
 */
export const regionManager = new RegionManager();