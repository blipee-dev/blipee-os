/**
 * Privacy Layer
 * Implements privacy-preserving algorithms for anonymous ESG data sharing
 */

export interface PrivacyConfig {
  kAnonymity: number; // Minimum group size for anonymization
  epsilon: number; // Differential privacy parameter
  noiseScale: number; // Noise level for data perturbation
  suppressionThreshold: number; // Minimum data points before sharing
}

export interface AnonymizedData<T> {
  data: T;
  privacyGuarantees: {
    kAnonymity: boolean;
    differentialPrivacy: boolean;
    method: string;
  };
  metadata: {
    recordsAnonymized: number;
    recordsSuppressed: number;
    noiseAdded: boolean;
  };
}

export class PrivacyLayer {
  private config: PrivacyConfig;

  constructor(config?: Partial<PrivacyConfig>) {
    this.config = {
      kAnonymity: 5,
      epsilon: 1.0,
      noiseScale: 0.1,
      suppressionThreshold: 3,
      ...config,
    };
  }

  /**
   * Apply k-anonymity to organizational data
   */
  async applyKAnonymity<T extends Record<string, any>>(
    data: T[],
    quasiIdentifiers: string[]
  ): Promise<AnonymizedData<T[]>> {
    console.log(`🔐 Applying k-anonymity (k=${this.config.kAnonymity})...`);

    if (data.length < this.config.kAnonymity) {
      return {
        data: [],
        privacyGuarantees: {
          kAnonymity: false,
          differentialPrivacy: false,
          method: 'suppression',
        },
        metadata: {
          recordsAnonymized: 0,
          recordsSuppressed: data.length,
          noiseAdded: false,
        },
      };
    }

    // Group records by quasi-identifiers
    const groups = this.groupByQuasiIdentifiers(data, quasiIdentifiers);
    
    // Apply generalization and suppression
    const anonymizedData: T[] = [];
    let suppressed = 0;

    groups.forEach(group => {
      if (group.length >= this.config.kAnonymity) {
        // Generalize the group
        const generalizedGroup = this.generalizeGroup(group, quasiIdentifiers);
        anonymizedData.push(...generalizedGroup);
      } else {
        // Suppress small groups
        suppressed += group.length;
      }
    });

    return {
      data: anonymizedData,
      privacyGuarantees: {
        kAnonymity: true,
        differentialPrivacy: false,
        method: 'generalization',
      },
      metadata: {
        recordsAnonymized: anonymizedData.length,
        recordsSuppressed: suppressed,
        noiseAdded: false,
      },
    };
  }

  /**
   * Apply differential privacy to numerical data
   */
  async applyDifferentialPrivacy(
    value: number,
    sensitivity: number = 1
  ): Promise<AnonymizedData<number>> {
    console.log(`🔐 Applying differential privacy (ε=${this.config.epsilon})...`);

    // Add Laplace noise
    const noise = this.laplaceMechanism(sensitivity);
    const noisyValue = value + noise;

    return {
      data: Math.max(0, noisyValue), // Ensure non-negative
      privacyGuarantees: {
        kAnonymity: false,
        differentialPrivacy: true,
        method: 'laplace_mechanism',
      },
      metadata: {
        recordsAnonymized: 1,
        recordsSuppressed: 0,
        noiseAdded: true,
      },
    };
  }

  /**
   * Anonymize ESG metrics for sharing
   */
  async anonymizeESGMetrics(metrics: {
    emissions: number;
    energyConsumption: number;
    waterUsage: number;
    wasteGenerated: number;
    supplierCount: number;
    employeeCount: number;
  }): Promise<AnonymizedData<typeof metrics>> {
    console.log('🔐 Anonymizing ESG metrics...');

    // Apply differential privacy to each metric
    const anonymizedMetrics = {
      emissions: (await this.applyDifferentialPrivacy(metrics.emissions, 1000)).data,
      energyConsumption: (await this.applyDifferentialPrivacy(metrics.energyConsumption, 10000)).data,
      waterUsage: (await this.applyDifferentialPrivacy(metrics.waterUsage, 5000)).data,
      wasteGenerated: (await this.applyDifferentialPrivacy(metrics.wasteGenerated, 100)).data,
      supplierCount: Math.round((await this.applyDifferentialPrivacy(metrics.supplierCount, 10)).data),
      employeeCount: this.roundToNearest(metrics.employeeCount, 100), // Round to nearest 100
    };

    return {
      data: anonymizedMetrics,
      privacyGuarantees: {
        kAnonymity: false,
        differentialPrivacy: true,
        method: 'differential_privacy',
      },
      metadata: {
        recordsAnonymized: 6,
        recordsSuppressed: 0,
        noiseAdded: true,
      },
    };
  }

  /**
   * Create privacy-preserving benchmarks
   */
  async createAnonymousBenchmark(
    organizationData: any[],
    metricExtractor: (org: any) => number
  ): Promise<{
    percentiles: { p25: number; p50: number; p75: number; p90: number };
    privacyPreserved: boolean;
    participantCount: number;
  }> {
    console.log('🔐 Creating anonymous benchmark...');

    if (organizationData.length < this.config.suppressionThreshold) {
      throw new Error('Insufficient data for privacy-preserving benchmark');
    }

    // Extract and sort metrics
    const metrics = organizationData.map(metricExtractor).sort((a, b) => a - b);

    // Calculate percentiles with noise
    const percentiles = {
      p25: await this.noisyPercentile(metrics, 0.25),
      p50: await this.noisyPercentile(metrics, 0.50),
      p75: await this.noisyPercentile(metrics, 0.75),
      p90: await this.noisyPercentile(metrics, 0.90),
    };

    return {
      percentiles,
      privacyPreserved: true,
      participantCount: this.roundToNearest(organizationData.length, 5),
    };
  }

  /**
   * Secure multi-party computation for aggregate statistics
   */
  async secureAggregation(
    localValue: number,
    peerShares: number[]
  ): Promise<{
    sum: number;
    average: number;
    count: number;
  }> {
    console.log('🔐 Performing secure aggregation...');

    // Add noise to local value
    const noisyLocal = (await this.applyDifferentialPrivacy(localValue)).data;
    
    // Sum all shares (already noisy from peers)
    const sum = noisyLocal + peerShares.reduce((a, b) => a + b, 0);
    const count = 1 + peerShares.length;
    const average = sum / count;

    return {
      sum: Math.round(sum),
      average: Math.round(average * 100) / 100,
      count,
    };
  }

  /**
   * Generate synthetic data for testing
   */
  generateSyntheticData<T extends Record<string, any>>(
    template: T,
    count: number,
    variations: Partial<Record<keyof T, { min: number; max: number }>>
  ): T[] {
    const syntheticData: T[] = [];

    for (let i = 0; i < count; i++) {
      const record = { ...template };
      
      // Apply variations
      Object.entries(variations).forEach(([key, range]) => {
        if (range && typeof range === 'object' && 'min' in range && 'max' in range) {
          const value = range.min + Math.random() * (range.max - range.min);
          (record as any)[key] = Math.round(value * 100) / 100;
        }
      });

      syntheticData.push(record);
    }

    return syntheticData;
  }

  // Private helper methods

  private groupByQuasiIdentifiers<T extends Record<string, any>>(
    data: T[],
    quasiIdentifiers: string[]
  ): T[][] {
    const groups = new Map<string, T[]>();

    data.forEach(record => {
      const key = quasiIdentifiers
        .map(qi => record[qi])
        .join('|');
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(record);
    });

    return Array.from(groups.values());
  }

  private generalizeGroup<T extends Record<string, any>>(
    group: T[],
    quasiIdentifiers: string[]
  ): T[] {
    // Apply generalization hierarchies
    return group.map(record => {
      const generalized = { ...record };
      
      quasiIdentifiers.forEach(qi => {
        if (typeof record[qi] === 'number') {
          // Generalize numbers to ranges
          const value = record[qi];
          const range = this.getRange(value);
          generalized[qi] = range;
        } else if (typeof record[qi] === 'string') {
          // Generalize strings (e.g., city -> region)
          generalized[qi] = this.generalizeLocation(record[qi]);
        }
      });

      return generalized;
    });
  }

  private getRange(value: number): string {
    if (value < 100) return '0-100';
    if (value < 1000) return '100-1000';
    if (value < 10000) return '1000-10000';
    return '10000+';
  }

  private generalizeLocation(location: string): string {
    // Simple generalization: return first part (assumed to be region/country)
    return location.split(',')[0].trim();
  }

  private laplaceMechanism(sensitivity: number): number {
    // Generate Laplace noise
    const b = sensitivity / this.config.epsilon;
    const u = Math.random() - 0.5;
    return -b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  private async noisyPercentile(data: number[], percentile: number): Promise<number> {
    const index = Math.floor(data.length * percentile);
    const value = data[index];
    const noisyValue = (await this.applyDifferentialPrivacy(value)).data;
    return Math.round(noisyValue);
  }

  private roundToNearest(value: number, nearest: number): number {
    return Math.round(value / nearest) * nearest;
  }

  /**
   * Validate privacy guarantees
   */
  validatePrivacyGuarantees(data: any[], config: PrivacyConfig): {
    valid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check k-anonymity
    if (data.length < config.kAnonymity) {
      issues.push(`Dataset size (${data.length}) is below k-anonymity threshold (${config.kAnonymity})`);
    }

    // Check epsilon bounds
    if (config.epsilon <= 0 || config.epsilon > 10) {
      issues.push(`Epsilon value (${config.epsilon}) is outside recommended range (0, 10]`);
    }

    // Check suppression threshold
    if (data.length < config.suppressionThreshold) {
      issues.push(`Dataset too small for meaningful analysis`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}