/**
 * Feature Registry for managing feature metadata and versioning
 */

import { FeatureDefinition, FeatureSet } from './feature-store';

export interface FeatureVersion {
  version: string;
  definition: FeatureDefinition;
  createdAt: Date;
  createdBy: string;
  changeLog: string;
  deprecated?: boolean;
  deprecationReason?: string;
}

export interface FeatureSetVersion {
  version: string;
  featureSet: FeatureSet;
  createdAt: Date;
  createdBy: string;
  changeLog: string;
  compatibility: string[]; // Compatible feature versions
}

export interface FeatureUsage {
  featureName: string;
  modelId: string;
  modelVersion: string;
  lastUsed: Date;
  importance?: number;
  performance?: {
    accuracy?: number;
    latency?: number;
  };
}

export interface FeatureQualityMetrics {
  featureName: string;
  completeness: number; // % of non-null values
  uniqueness: number; // % of unique values
  validity: number; // % of valid values
  freshness: number; // Hours since last update
  consistency: number; // % of consistent values
  timestamp: Date;
}

export class FeatureRegistry {
  private featureVersions: Map<string, FeatureVersion[]> = new Map();
  private featureSetVersions: Map<string, FeatureSetVersion[]> = new Map();
  private featureUsage: Map<string, FeatureUsage[]> = new Map();
  private qualityMetrics: Map<string, FeatureQualityMetrics[]> = new Map();
  private tags: Map<string, Set<string>> = new Map();

  async registerFeatureVersion(
    feature: FeatureDefinition,
    version: string,
    createdBy: string,
    changeLog: string
  ): Promise<void> {
    const versions = this.featureVersions.get(feature.name) || [];
    
    // Check if version exists
    if (versions.some(v => v.version === version)) {
      throw new Error(`Version ${version} already exists for feature ${feature.name}`);
    }

    const featureVersion: FeatureVersion = {
      version,
      definition: { ...feature },
      createdAt: new Date(),
      createdBy,
      changeLog
    };

    versions.push(featureVersion);
    versions.sort((a, b) => this.compareVersions(b.version, a.version));
    
    this.featureVersions.set(feature.name, versions);

    // Update tags
    if (feature.tags) {
      feature.tags.forEach(tag => {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, new Set());
        }
        this.tags.get(tag)!.add(feature.name);
      });
    }
  }

  async registerFeatureSetVersion(
    featureSet: FeatureSet,
    createdBy: string,
    changeLog: string,
    compatibility: string[]
  ): Promise<void> {
    const versions = this.featureSetVersions.get(featureSet.id) || [];
    
    if (versions.some(v => v.version === featureSet.version)) {
      throw new Error(`Version ${featureSet.version} already exists for feature set ${featureSet.id}`);
    }

    const featureSetVersion: FeatureSetVersion = {
      version: featureSet.version,
      featureSet: { ...featureSet },
      createdAt: new Date(),
      createdBy,
      changeLog,
      compatibility
    };

    versions.push(featureSetVersion);
    versions.sort((a, b) => this.compareVersions(b.version, a.version));
    
    this.featureSetVersions.set(featureSet.id, versions);
  }

  getFeatureVersion(featureName: string, version?: string): FeatureVersion | null {
    const versions = this.featureVersions.get(featureName);
    if (!versions || versions.length === 0) return null;

    if (!version) {
      // Return latest non-deprecated version
      return versions.find(v => !v.deprecated) || versions[0];
    }

    return versions.find(v => v.version === version) || null;
  }

  getFeatureSetVersion(featureSetId: string, version?: string): FeatureSetVersion | null {
    const versions = this.featureSetVersions.get(featureSetId);
    if (!versions || versions.length === 0) return null;

    if (!version) {
      return versions[0]; // Latest version
    }

    return versions.find(v => v.version === version) || null;
  }

  getAllVersions(featureName: string): FeatureVersion[] {
    return this.featureVersions.get(featureName) || [];
  }

  deprecateFeature(
    featureName: string,
    version: string,
    reason: string
  ): void {
    const versions = this.featureVersions.get(featureName);
    if (!versions) return;

    const featureVersion = versions.find(v => v.version === version);
    if (featureVersion) {
      featureVersion.deprecated = true;
      featureVersion.deprecationReason = reason;
    }
  }

  trackFeatureUsage(usage: FeatureUsage): void {
    const usages = this.featureUsage.get(usage.featureName) || [];
    
    // Update existing usage or add new
    const existingIdx = usages.findIndex(
      u => u.modelId === usage.modelId && u.modelVersion === usage.modelVersion
    );

    if (existingIdx >= 0) {
      usages[existingIdx] = usage;
    } else {
      usages.push(usage);
    }

    this.featureUsage.set(usage.featureName, usages);
  }

  getFeatureUsage(featureName: string): FeatureUsage[] {
    return this.featureUsage.get(featureName) || [];
  }

  recordQualityMetrics(metrics: FeatureQualityMetrics): void {
    const history = this.qualityMetrics.get(metrics.featureName) || [];
    history.push(metrics);
    
    // Keep only last 30 days of metrics
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    
    const filtered = history.filter(m => m.timestamp > cutoff);
    this.qualityMetrics.set(metrics.featureName, filtered);
  }

  getQualityMetrics(featureName: string): FeatureQualityMetrics | null {
    const history = this.qualityMetrics.get(featureName);
    if (!history || history.length === 0) return null;
    
    // Return latest metrics
    return history[history.length - 1];
  }

  getQualityTrends(featureName: string, days = 7): FeatureQualityMetrics[] {
    const history = this.qualityMetrics.get(featureName) || [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return history.filter(m => m.timestamp > cutoff);
  }

  searchFeatures(query: {
    tags?: string[];
    owner?: string;
    type?: string;
    minQuality?: number;
  }): FeatureDefinition[] {
    const results: FeatureDefinition[] = [];
    
    for (const [featureName, versions] of this.featureVersions) {
      const latest = versions.find(v => !v.deprecated);
      if (!latest) continue;
      
      const definition = latest.definition;
      
      // Filter by tags
      if (query.tags && query.tags.length > 0) {
        const hasAllTags = query.tags.every(tag => 
          definition.tags?.includes(tag)
        );
        if (!hasAllTags) continue;
      }
      
      // Filter by owner
      if (query.owner && definition.owner !== query.owner) {
        continue;
      }
      
      // Filter by type
      if (query.type && definition.type !== query.type) {
        continue;
      }
      
      // Filter by quality
      if (query.minQuality) {
        const metrics = this.getQualityMetrics(featureName);
        if (!metrics) continue;
        
        const avgQuality = (
          metrics.completeness +
          metrics.validity +
          metrics.consistency
        ) / 3;
        
        if (avgQuality < query.minQuality) continue;
      }
      
      results.push(definition);
    }
    
    return results;
  }

  getFeaturesByTag(tag: string): string[] {
    return Array.from(this.tags.get(tag) || []);
  }

  generateCompatibilityReport(
    featureSetId: string,
    targetVersion: string
  ): {
    compatible: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const featureSetVersion = this.getFeatureSetVersion(featureSetId, targetVersion);
    if (!featureSetVersion) {
      return {
        compatible: false,
        issues: [`Feature set version ${targetVersion} not found`],
        recommendations: []
      };
    }

    const issues: string[] = [];
    const recommendations: string[] = [];
    let compatible = true;

    // Check each feature in the set
    for (const featureName of featureSetVersion.featureSet.features) {
      const versions = this.featureVersions.get(featureName);
      if (!versions || versions.length === 0) {
        issues.push(`Feature ${featureName} not found in registry`);
        compatible = false;
        continue;
      }

      // Check if any version is compatible
      const compatibleVersion = versions.find(v => 
        featureSetVersion.compatibility.includes(`${featureName}:${v.version}`)
      );

      if (!compatibleVersion) {
        const latest = versions[0];
        if (latest.deprecated) {
          issues.push(`Feature ${featureName} is deprecated: ${latest.deprecationReason}`);
          compatible = false;
        } else {
          recommendations.push(
            `Consider updating compatibility to include ${featureName}:${latest.version}`
          );
        }
      }
    }

    return { compatible, issues, recommendations };
  }

  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i] || 0;
      const partB = partsB[i] || 0;
      
      if (partA > partB) return 1;
      if (partA < partB) return -1;
    }
    
    return 0;
  }

  exportRegistry(): {
    features: Map<string, FeatureVersion[]>;
    featureSets: Map<string, FeatureSetVersion[]>;
    usage: Map<string, FeatureUsage[]>;
    quality: Map<string, FeatureQualityMetrics[]>;
  } {
    return {
      features: new Map(this.featureVersions),
      featureSets: new Map(this.featureSetVersions),
      usage: new Map(this.featureUsage),
      quality: new Map(this.qualityMetrics)
    };
  }

  importRegistry(data: {
    features: Map<string, FeatureVersion[]>;
    featureSets: Map<string, FeatureSetVersion[]>;
    usage: Map<string, FeatureUsage[]>;
    quality: Map<string, FeatureQualityMetrics[]>;
  }): void {
    this.featureVersions = new Map(data.features);
    this.featureSetVersions = new Map(data.featureSets);
    this.featureUsage = new Map(data.usage);
    this.qualityMetrics = new Map(data.quality);
    
    // Rebuild tags
    this.tags.clear();
    for (const [name, versions] of this.featureVersions) {
      const latest = versions.find(v => !v.deprecated);
      if (latest?.definition.tags) {
        latest.definition.tags.forEach(tag => {
          if (!this.tags.has(tag)) {
            this.tags.set(tag, new Set());
          }
          this.tags.get(tag)!.add(name);
        });
      }
    }
  }
}

// Export singleton registry
export const featureRegistry = new FeatureRegistry();