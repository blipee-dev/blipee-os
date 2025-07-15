import { PeerBenchmarkingService } from './peer-benchmarking-service';
import { CollectiveIntelligenceProtocol } from './collective-intelligence-protocol';
import { initializeNetworkIntelligence, getNetworkStatus } from '../ai/network-intelligence/utils';

export interface NetworkInsight {
  type: 'benchmark' | 'collective' | 'supply_chain' | 'risk';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actions: string[];
  data?: any;
}

export class NetworkIntelligenceService {
  private static instance: NetworkIntelligenceService;
  private benchmarkingService: PeerBenchmarkingService;
  private collectiveIntelligence: CollectiveIntelligenceProtocol;
  private networkInitialized: Map<string, boolean> = new Map();

  private constructor() {
    this.benchmarkingService = PeerBenchmarkingService.getInstance();
    this.collectiveIntelligence = CollectiveIntelligenceProtocol.getInstance();
  }

  static getInstance(): NetworkIntelligenceService {
    if (!NetworkIntelligenceService.instance) {
      NetworkIntelligenceService.instance = new NetworkIntelligenceService();
    }
    return NetworkIntelligenceService.instance;
  }

  /**
   * Initialize network intelligence for an organization
   */
  async initializeForOrganization(organizationId: string): Promise<void> {
    if (this.networkInitialized.get(organizationId)) {
      console.log(`✅ Network already initialized for ${organizationId}`);
      return;
    }

    try {
      console.log(`🌐 Initializing network intelligence for ${organizationId}`);

      // Initialize network graph and privacy layer
      await initializeNetworkIntelligence(organizationId);

      // Start collective learning if not already running
      await this.collectiveIntelligence.startCollectiveLearning();

      this.networkInitialized.set(organizationId, true);
      console.log(`✅ Network intelligence ready for ${organizationId}`);

    } catch (error) {
      console.error('Network initialization error:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive network insights
   */
  async getNetworkInsights(organizationId: string): Promise<NetworkInsight[]> {
    const insights: NetworkInsight[] = [];

    try {
      // Ensure network is initialized
      await this.initializeForOrganization(organizationId);

      // Get benchmark insights
      const benchmarkInsights = await this.getBenchmarkInsights(organizationId);
      insights.push(...benchmarkInsights);

      // Get collective intelligence insights
      const collectiveInsights = await this.getCollectiveInsights(organizationId);
      insights.push(...collectiveInsights);

      // Get supply chain network insights
      const supplyChainInsights = await this.getSupplyChainInsights(organizationId);
      insights.push(...supplyChainInsights);

      // Sort by impact
      return insights.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      });

    } catch (error) {
      console.error('Error getting network insights:', error);
      return [];
    }
  }

  /**
   * Perform peer benchmarking
   */
  async performBenchmarking(
    organizationId: string,
    metric: string,
    category: 'emissions' | 'energy' | 'waste' | 'water' | 'social' | 'governance',
    filters?: any
  ): Promise<any> {
    await this.initializeForOrganization(organizationId);
    
    return this.benchmarkingService.getBenchmark({
      organizationId,
      metric,
      category,
      filters
    });
  }

  /**
   * Get personalized collective intelligence
   */
  async getCollectiveLearning(
    organizationId: string,
    categories?: string[]
  ): Promise<any> {
    await this.initializeForOrganization(organizationId);
    
    return this.collectiveIntelligence.getPersonalizedInsights(
      organizationId,
      categories
    );
  }

  /**
   * Share learning with the network
   */
  async shareLearning(
    organizationId: string,
    learning: any
  ): Promise<void> {
    await this.initializeForOrganization(organizationId);
    
    return this.collectiveIntelligence.contributeLearning(
      organizationId,
      learning
    );
  }

  /**
   * Get network effect metrics
   */
  async getNetworkMetrics(organizationId: string): Promise<any> {
    await this.initializeForOrganization(organizationId);
    
    const [status, effects] = await Promise.all([
      getNetworkStatus(organizationId),
      this.collectiveIntelligence.getNetworkEffectMetrics(organizationId)
    ]);

    return {
      connected: status.connected,
      connections: status.statistics,
      networkEffects: effects,
      benchmarksAvailable: status.availableBenchmarks?.length || 0
    };
  }

  /**
   * Join industry benchmark group
   */
  async joinBenchmarkGroup(
    organizationId: string,
    groupType: 'industry' | 'region' | 'size' | 'custom',
    groupIdentifier: string
  ): Promise<any> {
    await this.initializeForOrganization(organizationId);
    
    return this.benchmarkingService.joinBenchmarkGroup(
      organizationId,
      groupType,
      groupIdentifier
    );
  }

  /**
   * Private helper methods
   */
  private async getBenchmarkInsights(organizationId: string): Promise<NetworkInsight[]> {
    const insights: NetworkInsight[] = [];

    try {
      // Get key metrics for benchmarking
      const metrics = ['total_emissions', 'energy_intensity', 'waste_diverted'];
      
      for (const metric of metrics) {
        const benchmark = await this.benchmarkingService.getBenchmark({
          organizationId,
          metric,
          category: this.getMetricCategory(metric)
        });

        if (benchmark.percentile < 50) {
          insights.push({
            type: 'benchmark',
            title: `Below average ${metric.replace('_', ' ')} performance`,
            description: benchmark.insights[0] || `Your ${metric} is in the ${benchmark.percentile}th percentile`,
            impact: benchmark.percentile < 25 ? 'high' : 'medium',
            actions: benchmark.recommendations.slice(0, 3),
            data: benchmark
          });
        }
      }
    } catch (error) {
      console.error('Benchmark insights error:', error);
    }

    return insights;
  }

  private async getCollectiveInsights(organizationId: string): Promise<NetworkInsight[]> {
    const insights: NetworkInsight[] = [];

    try {
      const learning = await this.collectiveIntelligence.getPersonalizedInsights(
        organizationId,
        ['emissions', 'energy', 'supply_chain']
      );

      // Convert patterns to insights
      for (const pattern of learning.patterns.slice(0, 3)) {
        insights.push({
          type: 'collective',
          title: this.formatPatternTitle(pattern),
          description: pattern.description,
          impact: pattern.impact,
          actions: pattern.recommendations,
          data: pattern
        });
      }

      // Add predictions as insights
      for (const prediction of learning.predictions.slice(0, 2)) {
        if (prediction.likelihood > 0.7) {
          insights.push({
            type: 'collective',
            title: `Predicted: ${prediction.trend}`,
            description: `${prediction.impact} (${Math.round(prediction.likelihood * 100)}% likelihood in ${prediction.timeframe})`,
            impact: 'medium',
            actions: [`Prepare for ${prediction.trend.toLowerCase()}`],
            data: prediction
          });
        }
      }
    } catch (error) {
      console.error('Collective insights error:', error);
    }

    return insights;
  }

  private async getSupplyChainInsights(organizationId: string): Promise<NetworkInsight[]> {
    const insights: NetworkInsight[] = [];

    try {
      const status = await getNetworkStatus(organizationId);
      
      if (status.connected && status.statistics) {
        // Low supplier connections
        if (status.statistics.suppliers < 5) {
          insights.push({
            type: 'supply_chain',
            title: 'Limited supply chain visibility',
            description: `Only ${status.statistics.suppliers} suppliers connected. Industry leaders average 50+ connected suppliers.`,
            impact: 'high',
            actions: [
              'Onboard top 10 suppliers to the network',
              'Request sustainability data sharing',
              'Set up automated supplier assessments'
            ]
          });
        }

        // Risk signals from network
        if (status.recentAssessments?.some((a: any) => a.risk_level === 'high')) {
          insights.push({
            type: 'risk',
            title: 'High-risk suppliers detected',
            description: 'Recent assessments show sustainability risks in your supply chain',
            impact: 'high',
            actions: [
              'Review high-risk supplier assessments',
              'Develop risk mitigation plans',
              'Consider alternative suppliers'
            ]
          });
        }
      }
    } catch (error) {
      console.error('Supply chain insights error:', error);
    }

    return insights;
  }

  private formatPatternTitle(pattern: any): string {
    const typeMap: Record<string, string> = {
      'pattern': 'Pattern Detected',
      'anomaly': 'Anomaly Alert',
      'best_practice': 'Best Practice Discovered',
      'emerging_trend': 'Emerging Trend',
      'risk_signal': 'Risk Signal'
    };

    return `${typeMap[pattern.type] || 'Insight'}: ${pattern.category}`;
  }

  private getMetricCategory(metric: string): 'emissions' | 'energy' | 'waste' | 'water' | 'social' | 'governance' {
    const categoryMap: Record<string, any> = {
      'total_emissions': 'emissions',
      'energy_intensity': 'energy',
      'waste_diverted': 'waste',
      'water_usage': 'water',
      'employee_satisfaction': 'social',
      'board_diversity': 'governance'
    };

    return categoryMap[metric] || 'emissions';
  }
}