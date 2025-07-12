/**
 * Industry Intelligence Module
 * Exports all components for GRI sector standards and industry-specific intelligence
 */

// Core types
export * from './types';

// Base classes
export { IndustryModel } from './base-model';

// Core components
export { GRIStandardsMapper } from './gri-standards-mapper';
export { IndustryOrchestrator } from './industry-orchestrator';
export { BenchmarkEngine } from './benchmark-engine';
export { RegulatoryMapper } from './regulatory-mapper';
export { IndustryIntelligenceAIIntegration } from './ai-integration';

// Industry models
export { OilGasGRI11Model } from './models/oil-gas-gri11';
export { CoalGRI12Model } from './models/coal-gri12';
export { AgricultureGRI13Model } from './models/agriculture-gri13';

// Convenience factory function
import { IndustryOrchestrator } from './industry-orchestrator';
import { BenchmarkEngine } from './benchmark-engine';

/**
 * Create a fully configured industry intelligence system
 */
export function createIndustryIntelligence(config?: {
  enableAutoClassification?: boolean;
  enableBenchmarking?: boolean;
  enableMLPredictions?: boolean;
  cacheResults?: boolean;
  benchmarkConfig?: {
    minSampleSize?: number;
    outlierThreshold?: number;
    requireVerified?: boolean;
    enableAnonymization?: boolean;
  };
}) {
  const orchestrator = new IndustryOrchestrator({
    enableAutoClassification: config?.enableAutoClassification ?? true,
    enableBenchmarking: config?.enableBenchmarking ?? true,
    enableMLPredictions: config?.enableMLPredictions ?? false,
    cacheResults: config?.cacheResults ?? true
  });

  const benchmarkEngine = new BenchmarkEngine(config?.benchmarkConfig);

  return {
    orchestrator,
    benchmarkEngine,
    
    // Convenience methods
    async analyzeOrganization(
      organizationId: string,
      organizationData: Record<string, any>
    ) {
      return orchestrator.analyzeOrganization(organizationId, organizationData);
    },

    async getRecommendations(
      organizationId: string,
      organizationData: Record<string, any>
    ) {
      return orchestrator.getRecommendations(organizationId, organizationData);
    },

    async getMaterialTopics(
      organizationId: string,
      organizationData: Record<string, any>
    ) {
      return orchestrator.getMaterialTopics(organizationId, organizationData);
    },

    async getBenchmarks(
      metricIds: string[],
      filter?: {
        industry?: string;
        region?: string;
        year?: number;
      }
    ) {
      return benchmarkEngine.calculateMultipleBenchmarks(
        metricIds,
        filter || {}
      );
    }
  };
}