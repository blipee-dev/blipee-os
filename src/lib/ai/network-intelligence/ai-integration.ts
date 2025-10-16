// Network Intelligence AI Integration
// Connects Stream D network features with the existing AI system

import { supabase } from '@/lib/supabase/client';
import { NetworkGraphEngine } from './graph-engine';
import { PrivacyPreservingNetwork } from './privacy-layer';

export interface NetworkIntelligenceContext {
  organizationId: string;
  supplyChainRisk?: SupplyChainRisk;
  peerBenchmarks?: PeerBenchmark[];
  networkMetrics?: NetworkMetrics;
  marketplaceOpportunities?: MarketplaceOpportunity[];
}

export interface SupplyChainRisk {
  totalConnections: number;
  riskDistribution: {
    low_risk: number;
    medium_risk: number;
    high_risk: number;
  };
  criticalSuppliers: Array<{
    name: string;
    riskScore: number;
    tier: number;
    recommendations: string[];
  }>;
  riskPropagationPaths: Array<{
    path: string[];
    riskLevel: 'low' | 'medium' | 'high';
    impact: string;
  }>;
}

export interface PeerBenchmark {
  metricName: string;
  yourValue?: number;
  industryMean: number;
  industryMedian: number;
  percentile?: number;
  interpretation: string;
}

export interface NetworkMetrics {
  networkSize: number;
  centrality: number;
  clustering: number;
  influence: number;
  sustainability: {
    averageESGScore: number;
    trend: 'improving' | 'stable' | 'declining';
  };
}

export interface MarketplaceOpportunity {
  datasetName: string;
  relevanceScore: number;
  potentialValue: string;
  provider: string;
  description: string;
}

export class NetworkIntelligenceService {
  private graphEngine: NetworkGraphEngine;
  private privacyLayer: PrivacyPreservingNetwork;

  constructor() {
    this.graphEngine = new NetworkGraphEngine();
    this.privacyLayer = new PrivacyPreservingNetwork();
  }

  /**
   * Get comprehensive network intelligence for an organization
   */
  async getNetworkIntelligence(organizationId: string): Promise<NetworkIntelligenceContext> {
    try {
      // Run analyses in parallel for performance
      const [
        supplyChainRisk,
        peerBenchmarks,
        networkMetrics,
        marketplaceOpportunities
      ] = await Promise.all([
        this.analyzeSupplyChainRisk(organizationId),
        this.getPeerBenchmarks(organizationId),
        this.calculateNetworkMetrics(organizationId),
        this.findMarketplaceOpportunities(organizationId)
      ]);

      return {
        organizationId,
        supplyChainRisk,
        peerBenchmarks,
        networkMetrics,
        marketplaceOpportunities
      };
    } catch (error) {
      console.error('Error getting network intelligence:', error);
      return { organizationId };
    }
  }

  /**
   * Analyze supply chain risks using graph algorithms
   */
  private async analyzeSupplyChainRisk(organizationId: string): Promise<SupplyChainRisk | undefined> {
    try {
      // Get organization's network node
      const { data: orgNode, error: nodeError } = await supabase
        .from('network_nodes')
        .select('id')
        .eq('organization_id', organizationId)
        .single();

      if (nodeError || !orgNode) {
        return undefined;
      }

      // Use graph engine for risk analysis
      const riskAnalysis = await this.graphEngine.analyzeSupplyChainRisk(organizationId);

      // Get supplier details for critical suppliers
      const { data: criticalEdges } = await supabase
        .from('network_edges')
        .select(`
          *,
          target_node:network_nodes!target_node_id(node_name, esg_score, verification_status)
        `)
        .eq('source_node_id', orgNode.id)
        .eq('relationship_status', 'active')
        .gte('risk_score', 70)
        .order('risk_score', { ascending: false })
        .limit(5);

      const criticalSuppliers = criticalEdges?.map(edge => ({
        name: edge.target_node?.node_name || 'Unknown',
        riskScore: edge.risk_score || 0,
        tier: edge.tier_level || 1,
        recommendations: [
          'Conduct detailed risk assessment',
          'Implement monitoring protocols',
          'Develop contingency plans'
        ]
      })) || [];

      return {
        totalConnections: riskAnalysis.totalConnections,
        riskDistribution: riskAnalysis.riskDistribution,
        criticalSuppliers,
        riskPropagationPaths: riskAnalysis.propagationPaths
      };
    } catch (error) {
      console.error('Error analyzing supply chain risk:', error);
      return undefined;
    }
  }

  /**
   * Get relevant peer benchmarks for the organization
   */
  private async getPeerBenchmarks(organizationId: string): Promise<PeerBenchmark[]> {
    try {
      // Get organization's industry
      const { data: org } = await supabase
        .from('organizations')
        .select('industry')
        .eq('id', organizationId)
        .single();

      if (!org?.industry) {
        return [];
      }

      // Get relevant benchmarks
      const { data: benchmarks } = await supabase
        .from('network_benchmarks')
        .select('*')
        .eq('industry', org.industry)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      return benchmarks?.map(benchmark => ({
        metricName: benchmark.metric_name,
        industryMean: benchmark.statistics.mean,
        industryMedian: benchmark.statistics.median,
        interpretation: this.interpretBenchmark(benchmark)
      })) || [];
    } catch (error) {
      console.error('Error getting peer benchmarks:', error);
      return [];
    }
  }

  /**
   * Calculate network metrics for the organization
   */
  private async calculateNetworkMetrics(organizationId: string): Promise<NetworkMetrics | undefined> {
    try {
      // Get network metrics using graph engine
      const metrics = await this.graphEngine.calculateNetworkMetrics(organizationId);

      // Get ESG trend
      const { data: sustainabilityData } = await supabase
        .from('network_nodes')
        .select('esg_score, updated_at')
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false })
        .limit(10);

      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (sustainabilityData && sustainabilityData.length >= 2) {
        const recent = sustainabilityData[0].esg_score;
        const older = sustainabilityData[sustainabilityData.length - 1].esg_score;
        if (recent > older + 2) trend = 'improving';
        else if (recent < older - 2) trend = 'declining';
      }

      return {
        networkSize: metrics.networkSize,
        centrality: metrics.centrality,
        clustering: metrics.clustering,
        influence: metrics.influence,
        sustainability: {
          averageESGScore: metrics.averageESGScore,
          trend
        }
      };
    } catch (error) {
      console.error('Error calculating network metrics:', error);
      return undefined;
    }
  }

  /**
   * Find relevant marketplace opportunities
   */
  private async findMarketplaceOpportunities(organizationId: string): Promise<MarketplaceOpportunity[]> {
    try {
      // Get organization's industry and current data gaps
      const { data: org } = await supabase
        .from('organizations')
        .select('industry')
        .eq('id', organizationId)
        .single();

      // Find relevant marketplace listings
      const { data: listings } = await supabase
        .from('network_data_marketplace')
        .select('*')
        .eq('status', 'active')
        .order('quality_score', { ascending: false })
        .limit(5);

      return listings?.map(listing => ({
        datasetName: listing.dataset_name,
        relevanceScore: this.calculateRelevanceScore(listing, org?.industry),
        potentialValue: this.assessPotentialValue(listing),
        provider: 'Network Partner',
        description: listing.description
      })) || [];
    } catch (error) {
      console.error('Error finding marketplace opportunities:', error);
      return [];
    }
  }

  /**
   * Generate AI-friendly summary for conversation context
   */
  generateContextSummary(intelligence: NetworkIntelligenceContext): string {
    const parts = [];

    if (intelligence.supplyChainRisk) {
      const risk = intelligence.supplyChainRisk;
      parts.push(`Supply Chain: ${risk.totalConnections} connections, ${risk.criticalSuppliers.length} high-risk suppliers`);
    }

    if (intelligence.peerBenchmarks && intelligence.peerBenchmarks.length > 0) {
      parts.push(`Benchmarks: ${intelligence.peerBenchmarks.length} industry comparisons available`);
    }

    if (intelligence.networkMetrics) {
      const metrics = intelligence.networkMetrics;
      parts.push(`Network Position: ${metrics.centrality.toFixed(2)} centrality, ESG trend ${metrics.sustainability.trend}`);
    }

    if (intelligence.marketplaceOpportunities && intelligence.marketplaceOpportunities.length > 0) {
      parts.push(`Data Opportunities: ${intelligence.marketplaceOpportunities.length} relevant datasets available`);
    }

    return parts.length > 0 
      ? `Network Intelligence: ${parts.join(' | ')}`
      : 'Network Intelligence: Limited data available';
  }

  /**
   * Get specific network insights for AI responses
   */
  async getNetworkInsights(organizationId: string, query: string): Promise<string[]> {
    const intelligence = await this.getNetworkIntelligence(organizationId);
    const insights = [];

    // Supply chain insights
    if (query.toLowerCase().includes('supply') || query.toLowerCase().includes('supplier')) {
      if (intelligence.supplyChainRisk?.criticalSuppliers.length) {
        insights.push(`You have ${intelligence.supplyChainRisk.criticalSuppliers.length} high-risk suppliers that need attention`);
      }
    }

    // Benchmarking insights
    if (query.toLowerCase().includes('benchmark') || query.toLowerCase().includes('compare')) {
      if (intelligence.peerBenchmarks?.length) {
        insights.push(`I can compare your performance against ${intelligence.peerBenchmarks.length} industry benchmarks`);
      }
    }

    // Network insights
    if (query.toLowerCase().includes('network') || query.toLowerCase().includes('connection')) {
      if (intelligence.networkMetrics) {
        insights.push(`Your network influence score is ${intelligence.networkMetrics.influence.toFixed(2)}`);
      }
    }

    return insights;
  }

  // Helper methods
  private interpretBenchmark(benchmark: any): string {
    const mean = benchmark.statistics.mean;
    const confidence = benchmark.confidence_level;
    
    if (confidence > 0.9) {
      return `High confidence industry average: ${mean.toFixed(1)}`;
    } else if (confidence > 0.7) {
      return `Moderate confidence industry average: ${mean.toFixed(1)}`;
    } else {
      return `Preliminary industry average: ${mean.toFixed(1)}`;
    }
  }

  private calculateRelevanceScore(listing: any, industry?: string): number {
    let score = 0.5; // Base relevance
    
    if (listing.dataset_type === 'emissions') score += 0.3;
    if (listing.quality_score > 0.8) score += 0.2;
    if (industry && listing.industry_relevance?.includes(industry)) score += 0.3;
    
    return Math.min(score, 1.0);
  }

  private assessPotentialValue(listing: any): string {
    if (listing.price_credits === 0) return 'Free';
    if (listing.price_credits < 100) return 'Low cost';
    if (listing.price_credits < 500) return 'Moderate cost';
    return 'Premium dataset';
  }
}

export const networkIntelligence = new NetworkIntelligenceService();