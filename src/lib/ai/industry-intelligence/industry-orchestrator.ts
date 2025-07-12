/**
 * Industry Orchestrator
 * Automatically determines company industry and routes to appropriate models
 */

import { IndustryModel } from './base-model';
import { OilGasGRI11Model } from './models/oil-gas-gri11';
import { CoalGRI12Model } from './models/coal-gri12';
import { AgricultureGRI13Model } from './models/agriculture-gri13';
import { MiningGRI14Model } from './models/mining-gri14';
import { ConstructionGRI15Model } from './models/construction-gri15';
import { GRIStandardsMapper } from './gri-standards-mapper';
import { RegulatoryMapper } from './regulatory-mapper';
import {
  IndustryClassification,
  IndustryAnalysis,
  IndustryContext,
  GRIMappingResult,
  IndustryRecommendation,
  MaterialTopic
} from './types';

interface IndustryOrchestratorConfig {
  enableAutoClassification: boolean;
  enableBenchmarking: boolean;
  enableMLPredictions: boolean;
  cacheResults: boolean;
}

export class IndustryOrchestrator {
  private models: Map<string, IndustryModel>;
  private griMapper: GRIStandardsMapper;
  private regulatoryMapper: RegulatoryMapper;
  private config: IndustryOrchestratorConfig;
  private cache: Map<string, IndustryAnalysis>;

  constructor(config?: Partial<IndustryOrchestratorConfig>) {
    this.models = new Map();
    this.griMapper = new GRIStandardsMapper();
    this.regulatoryMapper = new RegulatoryMapper();
    this.cache = new Map();
    
    this.config = {
      enableAutoClassification: true,
      enableBenchmarking: true,
      enableMLPredictions: false, // Will enable when ML pipeline is ready
      cacheResults: true,
      ...config
    };

    this.initializeModels();
  }

  /**
   * Initialize all available industry models
   */
  private initializeModels(): void {
    // Phase 1 Models
    const oilGasModel = new OilGasGRI11Model();
    this.models.set('oil-gas', oilGasModel);

    const coalModel = new CoalGRI12Model();
    this.models.set('coal', coalModel);

    const agricultureModel = new AgricultureGRI13Model();
    this.models.set('agriculture', agricultureModel);

    // Phase 2 Models
    const miningModel = new MiningGRI14Model();
    this.models.set('mining', miningModel);

    const constructionModel = new ConstructionGRI15Model();
    this.models.set('construction', constructionModel);

    // TODO: Add remaining Phase 2 models
    // this.models.set('financial-services', new FinancialServicesGRI16Model());
    // this.models.set('public-sector', new PublicSectorGRI17Model());
  }

  /**
   * Classify organization into industry
   */
  async classifyIndustry(
    organizationData: Record<string, any>
  ): Promise<IndustryClassification> {
    // Check if classification is provided
    if (organizationData.industryClassification) {
      return organizationData.industryClassification;
    }

    // Auto-classification based on various signals
    const classification: IndustryClassification = {
      confidence: 0
    };

    // Try NAICS code
    if (organizationData.naicsCode) {
      classification.naicsCode = organizationData.naicsCode;
      classification.confidence = 0.9;
    }

    // Try SIC code
    if (organizationData.sicCode) {
      classification.sicCode = organizationData.sicCode;
      classification.confidence = Math.max(classification.confidence, 0.85);
    }

    // Try company description or activities
    if (organizationData.description || organizationData.activities) {
      const inferredIndustry = await this.inferIndustryFromText(
        organizationData.description || organizationData.activities
      );
      if (inferredIndustry) {
        classification.customCode = inferredIndustry.code;
        classification.naicsCode = classification.naicsCode || inferredIndustry.naics;
        classification.confidence = Math.max(classification.confidence, 0.7);
      }
    }

    // If still no classification, use revenue sources
    if (classification.confidence < 0.5 && organizationData.revenueBreakdown) {
      const primaryRevenue = this.getPrimaryRevenueSource(organizationData.revenueBreakdown);
      if (primaryRevenue) {
        classification.customCode = primaryRevenue;
        classification.confidence = 0.6;
      }
    }

    return classification;
  }

  /**
   * Get applicable industry model for organization
   */
  async getApplicableModel(
    classification: IndustryClassification
  ): Promise<IndustryModel | null> {
    // Check each model for applicability
    for (const [key, model] of this.models) {
      if (await model.isApplicable(classification)) {
        return model;
      }
    }

    return null;
  }

  /**
   * Perform comprehensive industry analysis
   */
  async analyzeOrganization(
    organizationId: string,
    organizationData: Record<string, any>
  ): Promise<IndustryAnalysis> {
    // Check cache
    if (this.config.cacheResults && this.cache.has(organizationId)) {
      const cached = this.cache.get(organizationId)!;
      // Check if cache is still valid (24 hours)
      const cacheAge = Date.now() - (cached as any).timestamp;
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return cached;
      }
    }

    // Classify industry
    const classification = await this.classifyIndustry(organizationData);

    // Get applicable model
    const model = await this.getApplicableModel(classification);

    if (!model) {
      // Return generic analysis if no specific model available
      return this.createGenericAnalysis(organizationId, classification, organizationData);
    }

    // Create industry context
    const context = await this.buildIndustryContext(classification, organizationData);
    model.setContext(context);

    // Perform model-specific analysis
    const analysis = await model.analyze(organizationId, organizationData, classification);

    // Enhance with cross-industry insights if applicable
    if (this.config.enableBenchmarking) {
      analysis.crossIndustryInsights = await this.getCrossIndustryInsights(
        organizationData,
        classification
      );
    }

    // Cache results
    if (this.config.cacheResults) {
      this.cache.set(organizationId, {
        ...analysis,
        timestamp: Date.now()
      } as any);
    }

    return analysis;
  }

  /**
   * Get GRI mapping for organization
   */
  async mapToGRIStandards(
    classification: IndustryClassification
  ): Promise<GRIMappingResult> {
    return this.griMapper.mapToGRIStandards(classification);
  }

  /**
   * Get industry-specific recommendations
   */
  async getRecommendations(
    organizationId: string,
    organizationData: Record<string, any>
  ): Promise<IndustryRecommendation[]> {
    const analysis = await this.analyzeOrganization(organizationId, organizationData);
    return analysis.recommendations;
  }

  /**
   * Get material topics for organization
   */
  async getMaterialTopics(
    organizationId: string,
    organizationData: Record<string, any>
  ): Promise<MaterialTopic[]> {
    const analysis = await this.analyzeOrganization(organizationId, organizationData);
    return analysis.materialTopics;
  }

  /**
   * Compare organization to industry peers
   */
  async compareToPeers(
    organizationId: string,
    organizationData: Record<string, any>,
    peerIds?: string[]
  ): Promise<any> {
    const analysis = await this.analyzeOrganization(organizationId, organizationData);
    
    // If specific peers provided, fetch their data
    if (peerIds && peerIds.length > 0) {
      // In production, this would fetch peer data from database
      const peerData = await this.fetchPeerData(peerIds);
      
      const classification = await this.classifyIndustry(organizationData);
      const model = await this.getApplicableModel(classification);
      
      if (model) {
        return model.compareToPeers(organizationData, peerData);
      }
    }

    return analysis.peerComparison;
  }

  /**
   * Get regulatory compliance assessment
   */
  async getComplianceAssessment(
    organizationId: string,
    organizationData: Record<string, any>,
    jurisdiction: string
  ): Promise<any> {
    const classification = await this.classifyIndustry(organizationData);
    
    return this.regulatoryMapper.assessCompliance(
      organizationId,
      jurisdiction,
      classification,
      organizationData
    );
  }

  /**
   * Get applicable regulations for organization
   */
  async getApplicableRegulations(
    organizationData: Record<string, any>,
    jurisdiction: string
  ): Promise<any> {
    const classification = await this.classifyIndustry(organizationData);
    
    return this.regulatoryMapper.getApplicableRegulations(
      jurisdiction,
      classification
    );
  }

  /**
   * Get upcoming regulatory changes
   */
  async getUpcomingRegulatoryChanges(
    organizationData: Record<string, any>,
    jurisdiction: string,
    timeframe: 'next-year' | 'next-two-years' | 'next-five-years' = 'next-year'
  ): Promise<any> {
    const classification = await this.classifyIndustry(organizationData);
    
    return this.regulatoryMapper.getUpcomingChanges(
      jurisdiction,
      classification,
      timeframe
    );
  }

  /**
   * Get all available industries
   */
  getAvailableIndustries(): string[] {
    return Array.from(this.models.keys());
  }

  /**
   * Register a new industry model
   */
  registerModel(key: string, model: IndustryModel): void {
    this.models.set(key, model);
  }

  /**
   * Build industry context for analysis
   */
  private async buildIndustryContext(
    classification: IndustryClassification,
    organizationData: Record<string, any>
  ): Promise<IndustryContext> {
    // Map to GRI standards
    const griMapping = await this.griMapper.mapToGRIStandards(classification);

    // Build context
    const context: IndustryContext = {
      classification,
      griStandards: griMapping.applicableStandards,
      materialTopics: griMapping.materialTopics,
      currentPerformance: this.extractPerformanceMetrics(organizationData),
      benchmarks: [], // Will be populated by model
      regulations: [], // Will be populated by model
      historicalData: organizationData.historicalData || []
    };

    return context;
  }

  /**
   * Create generic analysis when no specific model available
   */
  private async createGenericAnalysis(
    organizationId: string,
    classification: IndustryClassification,
    organizationData: Record<string, any>
  ): Promise<IndustryAnalysis> {
    // Map to GRI standards
    const griMapping = await this.griMapper.mapToGRIStandards(classification);

    return {
      organizationId,
      industry: classification,
      applicableGRIStandards: griMapping.applicableStandards,
      materialTopics: griMapping.materialTopics,
      requiredDisclosures: griMapping.requiredDisclosures,
      benchmarks: [],
      regulations: [],
      peerComparison: {
        industryAverage: {},
        percentileRank: {},
        topPerformers: [],
        improvementOpportunities: [
          'Industry-specific model not yet available',
          'Using generic ESG framework',
          'Contact support for custom industry configuration'
        ]
      },
      recommendations: [
        {
          type: 'reporting',
          priority: 'medium',
          title: 'Follow GRI Universal Standards',
          description: 'Report according to GRI Universal Standards while industry-specific guidance is being developed',
          impact: 'Ensure baseline compliance with global reporting standards',
          effort: 'medium',
          griAlignment: ['GRI 2', 'GRI 3']
        }
      ]
    };
  }

  /**
   * Infer industry from text description
   */
  private async inferIndustryFromText(
    text: string
  ): Promise<{ code: string; naics?: string } | null> {
    const lowerText = text.toLowerCase();

    // Industry keywords mapping
    const industryKeywords = {
      'oil-gas': {
        keywords: ['oil', 'gas', 'petroleum', 'drilling', 'refining', 'upstream', 'downstream', 'pipeline'],
        naics: '211'
      },
      'coal': {
        keywords: ['coal', 'mining', 'coal-fired', 'lignite', 'anthracite'],
        naics: '2121'
      },
      'agriculture': {
        keywords: ['farming', 'agriculture', 'crops', 'livestock', 'aquaculture', 'fishing'],
        naics: '111'
      },
      'manufacturing': {
        keywords: ['manufacturing', 'factory', 'production', 'assembly', 'industrial'],
        naics: '31'
      },
      'technology': {
        keywords: ['software', 'technology', 'IT', 'cloud', 'SaaS', 'digital', 'internet'],
        naics: '51'
      },
      'financial': {
        keywords: ['bank', 'finance', 'insurance', 'investment', 'lending', 'fintech'],
        naics: '52'
      }
    };

    // Check each industry
    for (const [code, config] of Object.entries(industryKeywords)) {
      const matchCount = config.keywords.filter(keyword => 
        lowerText.includes(keyword)
      ).length;

      if (matchCount >= 2 || (matchCount === 1 && config.keywords.some(k => 
        lowerText.includes(k) && k.length > 6
      ))) {
        return { code, naics: config.naics };
      }
    }

    return null;
  }

  /**
   * Get primary revenue source
   */
  private getPrimaryRevenueSource(revenueBreakdown: Record<string, number>): string | null {
    let maxRevenue = 0;
    let primarySource = null;

    for (const [source, revenue] of Object.entries(revenueBreakdown)) {
      if (revenue > maxRevenue) {
        maxRevenue = revenue;
        primarySource = source;
      }
    }

    return primarySource;
  }

  /**
   * Extract performance metrics from organization data
   */
  private extractPerformanceMetrics(data: Record<string, any>): Record<string, number> {
    const metrics: Record<string, number> = {};

    // Common metric mappings
    const metricMappings = {
      'scope1_emissions': ['scope1', 'scope_1_emissions', 'direct_emissions'],
      'scope2_emissions': ['scope2', 'scope_2_emissions', 'indirect_emissions'],
      'scope3_emissions': ['scope3', 'scope_3_emissions', 'value_chain_emissions'],
      'water_consumption': ['water_use', 'water_consumed', 'freshwater_consumption'],
      'waste_generated': ['total_waste', 'waste_production'],
      'energy_consumption': ['energy_use', 'total_energy'],
      'renewable_energy': ['renewable_percentage', 'clean_energy']
    };

    for (const [standardKey, possibleKeys] of Object.entries(metricMappings)) {
      for (const key of possibleKeys) {
        if (data[key] !== undefined) {
          metrics[standardKey] = data[key];
          break;
        }
      }
    }

    return metrics;
  }

  /**
   * Get cross-industry insights
   */
  private async getCrossIndustryInsights(
    organizationData: Record<string, any>,
    classification: IndustryClassification
  ): Promise<any> {
    // In production, this would aggregate insights across industries
    return {
      position: 'Data pending cross-industry analysis',
      leaders: [],
      trends: []
    };
  }

  /**
   * Fetch peer data (mock implementation)
   */
  private async fetchPeerData(peerIds: string[]): Promise<Array<Record<string, any>>> {
    // In production, this would fetch from database
    return peerIds.map(id => ({
      id,
      name: `Peer Company ${id}`,
      ghg_intensity_upstream: Math.random() * 50,
      methane_intensity: Math.random() * 0.5,
      trir: Math.random() * 1.0
    }));
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.cache.size;
  }
}