import { getCacheService, CacheService } from './cache-service';

export interface CachedMetrics {
  buildingId: string;
  metrics: Record<string, any>;
  timestamp: number;
}

export class DataCache {
  private cache: CacheService | null = null;

  async initialize(): Promise<void> {
    this.cache = await getCacheService();
  }

  // Building metrics caching
  async getBuildingMetrics(
    buildingId: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<CachedMetrics | null> {
    if (!this.cache) return null;

    const identifier = timeRange
      ? `${buildingId}:${timeRange.start.toISOString()}:${timeRange.end.toISOString()}`
      : `${buildingId}:current`;

    return await this.cache.get<CachedMetrics>('metrics', identifier);
  }

  async setBuildingMetrics(
    buildingId: string,
    metrics: Record<string, any>,
    timeRange?: { start: Date; end: Date },
    ttl: number = 300 // 5 minutes for real-time data
  ): Promise<void> {
    if (!this.cache) return;

    const identifier = timeRange
      ? `${buildingId}:${timeRange.start.toISOString()}:${timeRange.end.toISOString()}`
      : `${buildingId}:current`;

    const data: CachedMetrics = {
      buildingId,
      metrics,
      timestamp: Date.now(),
    };

    await this.cache.set('metrics', identifier, data, {
      ttl,
      tags: [`building:${buildingId}`, 'metrics'],
    });
  }

  // Organization data caching
  async getOrganizationData(
    orgId: string,
    dataType: string
  ): Promise<any | null> {
    if (!this.cache) return null;

    return await this.cache.get('org-data', `${orgId}:${dataType}`);
  }

  async setOrganizationData(
    orgId: string,
    dataType: string,
    data: any,
    ttl: number = 1800 // 30 minutes
  ): Promise<void> {
    if (!this.cache) return;

    await this.cache.set('org-data', `${orgId}:${dataType}`, data, {
      ttl,
      tags: [`org:${orgId}`, `data-type:${dataType}`],
    });
  }

  // Sustainability report caching
  async getSustainabilityReport(
    orgId: string,
    reportType: string,
    period: string
  ): Promise<any | null> {
    if (!this.cache) return null;

    const identifier = `${orgId}:${reportType}:${period}`;
    return await this.cache.get('reports', identifier);
  }

  async setSustainabilityReport(
    orgId: string,
    reportType: string,
    period: string,
    report: any,
    ttl: number = 86400 // 24 hours for reports
  ): Promise<void> {
    if (!this.cache) return;

    const identifier = `${orgId}:${reportType}:${period}`;
    await this.cache.set('reports', identifier, report, {
      ttl,
      tags: [`org:${orgId}`, `report:${reportType}`, 'sustainability'],
    });
  }

  // External API response caching
  async getExternalAPIResponse(
    apiName: string,
    endpoint: string,
    params: Record<string, any>
  ): Promise<any | null> {
    if (!this.cache) return null;

    const identifier = `${apiName}:${endpoint}:${JSON.stringify(params)}`;
    return await this.cache.get('external-api', identifier);
  }

  async setExternalAPIResponse(
    apiName: string,
    endpoint: string,
    params: Record<string, any>,
    response: any,
    ttl: number = 900 // 15 minutes for external APIs
  ): Promise<void> {
    if (!this.cache) return;

    const identifier = `${apiName}:${endpoint}:${JSON.stringify(params)}`;
    await this.cache.set('external-api', identifier, response, {
      ttl,
      tags: [`api:${apiName}`, 'external'],
    });
  }

  // Weather data caching (short TTL)
  async getWeatherData(
    location: { lat: number; lon: number }
  ): Promise<any | null> {
    if (!this.cache) return null;

    const identifier = `${location.lat}:${location.lon}`;
    return await this.cache.get('weather', identifier);
  }

  async setWeatherData(
    location: { lat: number; lon: number },
    data: any,
    ttl: number = 600 // 10 minutes for weather
  ): Promise<void> {
    if (!this.cache) return;

    const identifier = `${location.lat}:${location.lon}`;
    await this.cache.set('weather', identifier, data, {
      ttl,
      tags: ['weather', 'external'],
    });
  }

  // Invalidation methods
  async invalidateBuildingData(buildingId: string): Promise<void> {
    if (!this.cache) return;
    await this.cache.invalidateByTag(`building:${buildingId}`);
  }

  async invalidateOrganizationData(orgId: string): Promise<void> {
    if (!this.cache) return;
    await this.cache.invalidateByTag(`org:${orgId}`);
  }

  async invalidateExternalAPIs(): Promise<void> {
    if (!this.cache) return;
    await this.cache.invalidateByTag('external');
  }

  // Preload critical data
  async preloadCriticalData(
    orgId: string,
    buildingIds: string[]
  ): Promise<void> {
    // This method can be called during app initialization
    // to warm up the cache with frequently accessed data
    console.log(`Preloading cache for org ${orgId} with ${buildingIds.length} buildings`);
  }
}

// Singleton instance
let dataCache: DataCache | null = null;

export const getDataCache = async (): Promise<DataCache> => {
  if (!dataCache) {
    dataCache = new DataCache();
    await dataCache.initialize();
  }
  return dataCache;
};