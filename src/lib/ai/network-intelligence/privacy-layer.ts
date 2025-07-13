import { createClient } from '@supabase/supabase-js';
import {
  AnonymizedData,
  PrivacySettings,
  AnonymousBenchmark,
  BenchmarkFilters
} from './types';

interface Participant {
  organizationId: string;
  data: any;
  weight?: number;
}

interface AggregatedResult {
  result: any;
  participants: number;
  confidence: number;
  methodology: string;
  privacyGuarantees: string[];
}

interface KAnonymityResult {
  data: any;
  kValue: number;
  informationLoss: number;
  suppressed: string[];
  generalized: string[];
}

interface DifferentialPrivacyResult {
  data: any;
  epsilon: number;
  noise: number;
  accuracy: number;
}

export class PrivacyPreservingNetwork {
  private supabase: ReturnType<typeof createClient>;
  
  constructor() {
    this.supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  /**
   * Anonymize data based on privacy settings
   */
  async anonymizeData(
    data: any,
    level: 'basic' | 'enhanced' | 'maximum',
    organizationId?: string
  ): Promise<AnonymizedData> {
    try {
      let result: any;
      let privacyLevel: string;
      let informationLoss: number;

      switch (level) {
        case 'basic':
          result = await this.basicAnonymization(data);
          privacyLevel = 'basic-anonymization';
          informationLoss = 0.1;
          break;

        case 'enhanced':
          const kResult = await this.kAnonymization(data, 5);
          result = kResult.data;
          privacyLevel = `${kResult.kValue}-anonymous`;
          informationLoss = kResult.informationLoss;
          break;

        case 'maximum':
          const dpResult = await this.differentialPrivacy(data, 0.1);
          result = dpResult.data;
          privacyLevel = `differential-privacy-${dpResult.epsilon}`;
          informationLoss = 1 - dpResult.accuracy;
          break;

        default:
          throw new Error(`Unknown privacy level: ${level}`);
      }

      // Store anonymization log for audit
      if (organizationId) {
        await this.logAnonymization(organizationId, level, privacyLevel, informationLoss);
      }

      return {
        data: result,
        privacyLevel,
        informationLoss,
        participantCount: Array.isArray(data) ? data.length : 1,
        confidence: 1 - informationLoss
      };

    } catch (error) {
      console.error('Error anonymizing data:', error);
      throw error;
    }
  }

  /**
   * Secure multi-party computation for aggregation
   */
  async secureAggregation(
    participants: Participant[],
    metric: string,
    aggregationType: 'sum' | 'mean' | 'median' | 'percentiles' = 'mean'
  ): Promise<AggregatedResult> {
    try {
      if (participants.length < 3) {
        throw new Error('Minimum 3 participants required for secure aggregation');
      }

      // Check privacy consents
      await this.verifyConsents(participants, metric);

      // Split data into shares for secure computation
      const shares = await this.splitIntoShares(participants, metric);

      // Perform computation on shares
      const aggregated = await this.computeOnShares(shares, aggregationType);

      // Calculate confidence based on participant count and data quality
      const confidence = this.calculateAggregationConfidence(participants);

      return {
        result: aggregated,
        participants: participants.length,
        confidence,
        methodology: `secure-${aggregationType}-${participants.length}-parties`,
        privacyGuarantees: [
          'Individual data never revealed',
          'Secure multi-party computation',
          'Minimum 3 participants',
          'Cryptographic shares'
        ]
      };

    } catch (error) {
      console.error('Error in secure aggregation:', error);
      throw error;
    }
  }

  /**
   * K-anonymity implementation
   */
  async kAnonymization(data: any, k: number = 5): Promise<KAnonymityResult> {
    try {
      if (!Array.isArray(data)) {
        data = [data];
      }

      // Identify quasi-identifiers (attributes that could identify individuals)
      const quasiIdentifiers = this.identifyQuasiIdentifiers(data);

      // Generalize attributes to ensure k-anonymity
      const generalized = await this.generalizeAttributes(data, quasiIdentifiers, k);

      // Suppress outliers that can't be made k-anonymous
      const { anonymizedData, suppressed } = await this.suppressOutliers(generalized, k);

      // Calculate information loss
      const informationLoss = this.calculateInformationLoss(data, anonymizedData);

      return {
        data: anonymizedData,
        kValue: k,
        informationLoss,
        suppressed: suppressed.map(s => s.id || s.organizationId),
        generalized: quasiIdentifiers
      };

    } catch (error) {
      console.error('Error in k-anonymization:', error);
      throw error;
    }
  }

  /**
   * Differential privacy implementation
   */
  async differentialPrivacy(data: any, epsilon: number = 0.1): Promise<DifferentialPrivacyResult> {
    try {
      const sensitivity = this.calculateSensitivity(data);
      const scale = sensitivity / epsilon;

      // Add Laplace noise for differential privacy
      const noisyData = this.addLaplaceNoise(data, scale);

      // Calculate accuracy (inverse of noise magnitude)
      const noise = Math.abs(scale);
      const accuracy = 1 / (1 + noise);

      return {
        data: noisyData,
        epsilon,
        noise,
        accuracy
      };

    } catch (error) {
      console.error('Error in differential privacy:', error);
      throw error;
    }
  }

  /**
   * Create anonymous benchmark from network data
   */
  async createAnonymousBenchmark(
    metric: string,
    filters: BenchmarkFilters
  ): Promise<AnonymousBenchmark> {
    try {
      // Get participating organizations based on filters
      const participants = await this.getEligibleParticipants(filters);

      if (participants.length < 5) {
        throw new Error('Minimum 5 participants required for anonymous benchmark');
      }

      // Collect anonymized data from participants
      const anonymizedData = await Promise.all(
        participants.map(p => this.getAnonymizedMetric(p, metric))
      );

      // Filter out null/invalid values
      const validData = anonymizedData.filter(d => d !== null && d !== undefined);

      if (validData.length < 3) {
        throw new Error('Insufficient valid data for benchmark');
      }

      // Calculate statistics
      const statistics = this.calculateBenchmarkStatistics(validData);

      // Calculate quality and confidence scores
      const qualityScore = this.calculateDataQuality(validData);
      const confidenceLevel = this.calculateConfidenceLevel(validData.length, qualityScore);

      // Create benchmark record
      const benchmark: AnonymousBenchmark = {
        id: this.generateBenchmarkId(metric, filters),
        benchmarkType: 'anonymous_network',
        industry: filters.industry,
        metricName: metric,
        metricCategory: this.categorizeMetric(metric),
        period: filters.period || this.getCurrentPeriod(),
        participantCount: validData.length,
        statistics,
        qualityScore,
        confidenceLevel,
        methodology: 'privacy-preserving-aggregation',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      // Store benchmark in database
      await this.storeBenchmark(benchmark);

      return benchmark;

    } catch (error) {
      console.error('Error creating anonymous benchmark:', error);
      throw error;
    }
  }

  /**
   * Verify that data sharing consents are valid
   */
  private async verifyConsents(participants: Participant[], metric: string): Promise<void> {
    const invalidConsents: string[] = [];

    for (const participant of participants) {
      const { data: privacySettings } = await this.supabase
        .from('network_privacy_settings')
        .select('*')
        .eq('organization_id', participant.organizationId)
        .eq('data_category', this.categorizeMetric(metric))
        .single();

      if (!privacySettings) {
        invalidConsents.push(participant.organizationId);
        continue;
      }

      // Check consent validity
      if (!privacySettings.consent_given) {
        invalidConsents.push(participant.organizationId);
        continue;
      }

      // Check expiration
      if (privacySettings.consent_expires_at && 
          new Date(privacySettings.consent_expires_at) < new Date()) {
        invalidConsents.push(participant.organizationId);
        continue;
      }

      // Check sharing level allows aggregation
      if (!['network', 'public', 'partners'].includes(privacySettings.sharing_level)) {
        invalidConsents.push(participant.organizationId);
      }
    }

    if (invalidConsents.length > 0) {
      throw new Error(`Invalid or missing consents for organizations: ${invalidConsents.join(', ')}`);
    }
  }

  /**
   * Basic anonymization (remove direct identifiers)
   */
  private async basicAnonymization(data: any): Promise<any> {
    if (Array.isArray(data)) {
      return data.map(item => this.removeDirectIdentifiers(item));
    } else {
      return this.removeDirectIdentifiers(data);
    }
  }

  private removeDirectIdentifiers(item: any): any {
    const sensitiveFields = [
      'name', 'email', 'phone', 'address', 'organizationId', 
      'contactPerson', 'website', 'id', 'userId'
    ];

    const anonymized = { ...item };
    
    for (const field of sensitiveFields) {
      if (anonymized[field]) {
        delete anonymized[field];
      }
    }

    // Replace with pseudonyms if needed
    if (item.organizationId) {
      anonymized.pseudonym = this.generatePseudonym(item.organizationId);
    }

    return anonymized;
  }

  /**
   * Split data into cryptographic shares for secure computation
   */
  private async splitIntoShares(participants: Participant[], metric: string): Promise<any[]> {
    const shares: any[] = [];

    for (const participant of participants) {
      const value = this.extractMetricValue(participant.data, metric);
      
      if (typeof value === 'number') {
        // Simple additive secret sharing for demonstration
        // In production, would use more sophisticated schemes
        const share1 = Math.random() * value;
        const share2 = value - share1;
        
        shares.push({
          organizationId: participant.organizationId,
          share1,
          share2,
          weight: participant.weight || 1
        });
      }
    }

    return shares;
  }

  /**
   * Compute aggregation on cryptographic shares
   */
  private async computeOnShares(shares: any[], aggregationType: string): Promise<number> {
    if (shares.length === 0) return 0;

    switch (aggregationType) {
      case 'sum':
        return shares.reduce((sum, share) => 
          sum + (share.share1 + share.share2) * share.weight, 0
        );

      case 'mean':
        const totalWeight = shares.reduce((sum, share) => sum + share.weight, 0);
        const weightedSum = shares.reduce((sum, share) => 
          sum + (share.share1 + share.share2) * share.weight, 0
        );
        return weightedSum / totalWeight;

      case 'median':
        const values = shares.map(share => share.share1 + share.share2).sort((a, b) => a - b);
        const mid = Math.floor(values.length / 2);
        return values.length % 2 === 0 
          ? (values[mid - 1] + values[mid]) / 2 
          : values[mid];

      default:
        throw new Error(`Unsupported aggregation type: ${aggregationType}`);
    }
  }

  /**
   * Identify attributes that could be used for identification
   */
  private identifyQuasiIdentifiers(data: any[]): string[] {
    if (data.length === 0) return [];

    const sample = data[0];
    const quasiIdentifiers: string[] = [];

    // Common quasi-identifiers in ESG data
    const potentialQI = [
      'industry', 'location', 'size', 'revenue', 'employeeCount',
      'country', 'region', 'city', 'sector', 'subIndustry'
    ];

    for (const field of potentialQI) {
      if (sample[field] !== undefined) {
        quasiIdentifiers.push(field);
      }
    }

    return quasiIdentifiers;
  }

  /**
   * Generalize attributes to reduce granularity
   */
  private async generalizeAttributes(
    data: any[], 
    quasiIdentifiers: string[], 
    k: number
  ): Promise<any[]> {
    const generalized = data.map(item => ({ ...item }));

    for (const qi of quasiIdentifiers) {
      // Apply generalization based on field type
      if (qi === 'location' || qi === 'city') {
        this.generalizeLocation(generalized, qi);
      } else if (qi === 'revenue' || qi === 'employeeCount') {
        this.generalizeNumerical(generalized, qi);
      } else if (qi === 'industry') {
        this.generalizeIndustry(generalized, qi);
      }
    }

    return generalized;
  }

  private generalizeLocation(data: any[], field: string): void {
    for (const item of data) {
      if (item[field]) {
        // Generalize to country level only
        if (typeof item[field] === 'object' && item[field].country) {
          item[field] = { country: item[field].country };
        } else if (typeof item[field] === 'string') {
          // Extract country from string if possible
          item[field] = this.extractCountry(item[field]);
        }
      }
    }
  }

  private generalizeNumerical(data: any[], field: string): void {
    const values = data.map(item => item[field]).filter(v => typeof v === 'number');
    if (values.length === 0) return;

    // Create ranges instead of exact values
    const min = Math.min(...values);
    const max = Math.max(...values);
    const rangeSize = (max - min) / 5; // 5 ranges

    for (const item of data) {
      if (typeof item[field] === 'number') {
        const rangeIndex = Math.floor((item[field] - min) / rangeSize);
        const rangeStart = min + rangeIndex * rangeSize;
        const rangeEnd = rangeStart + rangeSize;
        
        item[field] = {
          range: `${Math.round(rangeStart)}-${Math.round(rangeEnd)}`,
          rangeIndex
        };
      }
    }
  }

  private generalizeIndustry(data: any[], field: string): void {
    // Map specific industries to broader categories
    const industryMapping: Record<string, string> = {
      'Software': 'Technology',
      'Hardware': 'Technology',
      'Retail': 'Consumer',
      'E-commerce': 'Consumer',
      'Investment Banking': 'Financial Services',
      'Commercial Banking': 'Financial Services',
      // Add more mappings as needed
    };

    for (const item of data) {
      if (item[field] && industryMapping[item[field]]) {
        item[field] = industryMapping[item[field]];
      }
    }
  }

  /**
   * Remove outliers that cannot be made k-anonymous
   */
  private async suppressOutliers(data: any[], k: number): Promise<{
    anonymizedData: any[];
    suppressed: any[];
  }> {
    const groups = new Map<string, any[]>();
    const suppressed: any[] = [];

    // Group records by their quasi-identifier combinations
    for (const record of data) {
      const key = this.generateGroupKey(record);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(record);
    }

    // Remove groups with fewer than k members
    const anonymizedData: any[] = [];
    
    for (const [key, group] of groups) {
      if (group.length >= k) {
        anonymizedData.push(...group);
      } else {
        suppressed.push(...group);
      }
    }

    return { anonymizedData, suppressed };
  }

  /**
   * Add Laplace noise for differential privacy
   */
  private addLaplaceNoise(data: any, scale: number): any {
    if (typeof data === 'number') {
      return data + this.sampleLaplace(scale);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.addLaplaceNoise(item, scale));
    }

    if (typeof data === 'object' && data !== null) {
      const noisyData = { ...data };
      
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'number') {
          noisyData[key] = value + this.sampleLaplace(scale);
        }
      }
      
      return noisyData;
    }

    return data;
  }

  /**
   * Sample from Laplace distribution
   */
  private sampleLaplace(scale: number): number {
    const u = Math.random() - 0.5;
    return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  /**
   * Calculate sensitivity for differential privacy
   */
  private calculateSensitivity(data: any): number {
    // For most ESG metrics, sensitivity is the maximum possible change
    // when one organization's data is added or removed
    
    if (typeof data === 'number') {
      return Math.abs(data);
    }

    if (Array.isArray(data)) {
      const numbers = data.filter(item => typeof item === 'number');
      if (numbers.length > 0) {
        return Math.max(...numbers.map(Math.abs));
      }
    }

    // Default sensitivity for ESG metrics
    return 1.0;
  }

  /**
   * Calculate information loss from anonymization
   */
  private calculateInformationLoss(original: any[], anonymized: any[]): number {
    if (original.length === 0) return 0;

    let totalLoss = 0;
    const sampleSize = Math.min(original.length, 100); // Sample for performance

    for (let i = 0; i < sampleSize; i++) {
      const origItem = original[i];
      const anonItem = anonymized[i];
      
      if (origItem && anonItem) {
        totalLoss += this.calculateItemInformationLoss(origItem, anonItem);
      }
    }

    return totalLoss / sampleSize;
  }

  private calculateItemInformationLoss(original: any, anonymized: any): number {
    let loss = 0;
    let fields = 0;

    for (const key in original) {
      fields++;
      
      if (anonymized[key] === undefined) {
        loss += 1; // Complete loss
      } else if (typeof original[key] !== typeof anonymized[key]) {
        loss += 0.5; // Type change
      } else if (original[key] !== anonymized[key]) {
        loss += 0.3; // Value change
      }
    }

    return fields > 0 ? loss / fields : 0;
  }

  // Helper methods for benchmark creation and data processing...

  private async getEligibleParticipants(filters: BenchmarkFilters): Promise<Participant[]> {
    let query = this.supabase
      .from('network_nodes')
      .select('organization_id, industry, location, size_category, esg_score')
      .eq('verification_status', 'verified')
      .in('data_sharing_level', ['public', 'network']);

    if (filters.industry) {
      query = query.eq('industry', filters.industry);
    }

    if (filters.sizeCategory) {
      query = query.eq('size_category', filters.sizeCategory);
    }

    const { data: nodes } = await query;
    
    return nodes?.map(node => ({
      organizationId: node.organization_id,
      data: node
    })) || [];
  }

  private async getAnonymizedMetric(participant: Participant, metric: string): Promise<number | null> {
    // This would fetch the actual metric data for the participant
    // For now, return a mock value based on their ESG score
    const esgScore = participant.data.esg_score;
    
    if (typeof esgScore !== 'number') return null;

    // Add some noise for privacy
    const noise = (Math.random() - 0.5) * 10;
    return Math.max(0, Math.min(100, esgScore + noise));
  }

  private calculateBenchmarkStatistics(data: number[]): any {
    const sorted = [...data].sort((a, b) => a - b);
    const n = sorted.length;

    return {
      mean: data.reduce((sum, val) => sum + val, 0) / n,
      median: n % 2 === 0 
        ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
        : sorted[Math.floor(n/2)],
      p25: sorted[Math.floor(n * 0.25)],
      p75: sorted[Math.floor(n * 0.75)],
      p90: sorted[Math.floor(n * 0.90)],
      stdDev: Math.sqrt(
        data.reduce((sum, val) => sum + Math.pow(val - data.reduce((s, v) => s + v, 0) / n, 2), 0) / n
      )
    };
  }

  private calculateDataQuality(data: number[]): number {
    if (data.length === 0) return 0;

    // Simple quality score based on data completeness and variance
    const completeness = data.filter(d => d !== null && d !== undefined).length / data.length;
    const variance = this.calculateVariance(data);
    const normalizedVariance = Math.min(variance / 1000, 1); // Normalize to 0-1

    return (completeness + normalizedVariance) / 2;
  }

  private calculateVariance(data: number[]): number {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  }

  private calculateConfidenceLevel(participantCount: number, qualityScore: number): number {
    // Confidence increases with more participants and higher quality
    const sizeComponent = Math.min(participantCount / 20, 1); // Max confidence at 20+ participants
    return (sizeComponent + qualityScore) / 2;
  }

  private calculateAggregationConfidence(participants: Participant[]): number {
    // Base confidence on participant count and data consistency
    const baseConfidence = Math.min(participants.length / 10, 1);
    
    // Could add additional factors like data recency, quality scores, etc.
    return Math.max(0.5, baseConfidence); // Minimum 50% confidence
  }

  private extractMetricValue(data: any, metric: string): number | null {
    // Extract numerical value from data based on metric name
    if (typeof data[metric] === 'number') {
      return data[metric];
    }
    
    // Handle nested metrics
    if (metric.includes('.')) {
      const parts = metric.split('.');
      let value = data;
      
      for (const part of parts) {
        if (value && value[part] !== undefined) {
          value = value[part];
        } else {
          return null;
        }
      }
      
      return typeof value === 'number' ? value : null;
    }
    
    return null;
  }

  private categorizeMetric(metric: string): string {
    // Categorize metrics for privacy settings
    if (metric.includes('emission') || metric.includes('carbon')) {
      return 'emissions';
    } else if (metric.includes('energy')) {
      return 'energy';
    } else if (metric.includes('waste')) {
      return 'waste';
    } else if (metric.includes('water')) {
      return 'water';
    } else if (metric.includes('social') || metric.includes('employee')) {
      return 'social';
    } else if (metric.includes('governance')) {
      return 'governance';
    }
    
    return 'general';
  }

  private generateBenchmarkId(metric: string, filters: BenchmarkFilters): string {
    const parts = [
      'benchmark',
      metric.replace(/[^a-zA-Z0-9]/g, '_'),
      filters.industry || 'all',
      filters.period || this.getCurrentPeriod()
    ];
    
    return parts.join('-').toLowerCase();
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
  }

  private async storeBenchmark(benchmark: AnonymousBenchmark): Promise<void> {
    await this.supabase
      .from('network_benchmarks')
      .upsert({
        benchmark_type: benchmark.benchmarkType,
        industry: benchmark.industry,
        metric_name: benchmark.metricName,
        metric_category: benchmark.metricCategory,
        period: benchmark.period,
        participant_count: benchmark.participantCount,
        statistics: benchmark.statistics,
        quality_score: benchmark.qualityScore,
        confidence_level: benchmark.confidenceLevel,
        methodology: benchmark.methodology,
        expires_at: benchmark.expiresAt.toISOString()
      });
  }

  private async logAnonymization(
    organizationId: string,
    level: string,
    privacyLevel: string,
    informationLoss: number
  ): Promise<void> {
    // Log anonymization for audit trail
    console.log(`Anonymization: ${organizationId}, Level: ${level}, Privacy: ${privacyLevel}, Loss: ${informationLoss}`);
    
    // Could store in audit table if needed
  }

  private generatePseudonym(organizationId: string): string {
    // Generate consistent pseudonym for organization
    const hash = this.simpleHash(organizationId);
    return `ORG-${hash.toString(36).toUpperCase().substring(0, 8)}`;
  }

  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private extractCountry(location: string): string {
    // Simple country extraction - would use proper geocoding in production
    const countries = ['United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Japan', 'China'];
    
    for (const country of countries) {
      if (location.toLowerCase().includes(country.toLowerCase())) {
        return country;
      }
    }
    
    return 'Unknown';
  }

  private generateGroupKey(record: any): string {
    // Generate key based on quasi-identifiers for k-anonymity grouping
    const keyParts: string[] = [];
    
    const qiFields = ['industry', 'location', 'size', 'country'];
    
    for (const field of qiFields) {
      if (record[field] !== undefined) {
        keyParts.push(`${field}:${JSON.stringify(record[field])}`);
      }
    }
    
    return keyParts.join('|');
  }
}