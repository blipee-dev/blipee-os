import { createClient } from '@supabase/supabase-js';
import { NetworkMetrics, NetworkTrend, NetworkInsight } from './types';

export class NetworkAnalytics {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    this.supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  /**
   * Analyze network trends
   */
  async analyzeNetworkTrends(
    timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly' = 'monthly'
  ): Promise<NetworkTrend[]> {
    try {
      const trends: NetworkTrend[] = [];
      
      // Growth trend
      const growthRate = await this.calculateNetworkGrowth(timeframe);
      trends.push({
        id: 'network-growth',
        type: 'growth',
        metric: 'Network Size',
        direction: growthRate > 0 ? 'up' : 'down',
        value: Math.abs(growthRate),
        timeframe,
        description: `Network grew by ${growthRate.toFixed(1)}% over the ${timeframe} period`
      });

      // Activity trend
      const activityChange = await this.calculateActivityTrend(timeframe);
      trends.push({
        id: 'network-activity',
        type: 'activity',
        metric: 'Network Activity',
        direction: activityChange > 0 ? 'up' : 'down',
        value: Math.abs(activityChange),
        timeframe,
        description: `Network activity ${activityChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(activityChange).toFixed(1)}%`
      });

      // Collaboration trend
      const collaborationGrowth = await this.calculateCollaborationTrend(timeframe);
      trends.push({
        id: 'collaboration',
        type: 'collaboration',
        metric: 'Cross-Organization Collaboration',
        direction: collaborationGrowth > 0 ? 'up' : 'down',
        value: Math.abs(collaborationGrowth),
        timeframe,
        description: `Collaboration initiatives ${collaborationGrowth > 0 ? 'grew' : 'declined'} by ${Math.abs(collaborationGrowth).toFixed(1)}%`
      });

      return trends;

    } catch (error) {
      console.error('Error analyzing network trends:', error);
      throw error;
    }
  }

  /**
   * Generate network insights
   */
  async generateNetworkInsights(organizationId?: string): Promise<NetworkInsight[]> {
    try {
      const insights: NetworkInsight[] = [];

      // Supply chain concentration risk
      const concentrationRisk = await this.analyzeSupplyChainConcentration();
      if (concentrationRisk.severity > 0.7) {
        insights.push({
          id: 'supply-concentration',
          type: 'risk',
          severity: 'high',
          title: 'High Supply Chain Concentration',
          description: 'Over 60% of suppliers concentrated in single region',
          action: 'Diversify supplier base geographically',
          impact: concentrationRisk.impact,
          confidence: 0.85
        });
      }

      // Sustainability leaders
      const leaders = await this.identifySustainabilityLeaders();
      if (leaders.length > 0) {
        insights.push({
          id: 'sustainability-leaders',
          type: 'opportunity',
          severity: 'medium',
          title: 'Learn from Sustainability Leaders',
          description: `${leaders.length} organizations achieving exceptional ESG performance`,
          action: 'Connect with top performers to learn best practices',
          impact: 0.7,
          confidence: 0.9
        });
      }

      // Emerging risks
      const emergingRisks = await this.detectEmergingRisks();
      for (const risk of emergingRisks) {
        insights.push({
          id: `emerging-risk-${risk.id}`,
          type: 'risk',
          severity: risk.severity as 'high' | 'medium' | 'low',
          title: risk.title,
          description: risk.description,
          action: risk.mitigation,
          impact: risk.impact,
          confidence: risk.confidence
        });
      }

      return insights;

    } catch (error) {
      console.error('Error generating network insights:', error);
      throw error;
    }
  }

  /**
   * Calculate network value
   */
  async calculateNetworkValue(organizationId: string): Promise<{
    directValue: number;
    networkEffects: number;
    totalValue: number;
    breakdown: Record<string, number>;
  }> {
    try {
      // Direct value from data sharing
      const dataValue = await this.calculateDataSharingValue(organizationId);
      
      // Benchmarking value
      const benchmarkingValue = await this.calculateBenchmarkingValue(organizationId);
      
      // Collaboration value
      const collaborationValue = await this.calculateCollaborationValue(organizationId);
      
      // Network effects multiplier
      const networkSize = await this.getNetworkSize();
      const networkMultiplier = Math.log10(networkSize) / 2; // Logarithmic growth

      const directValue = dataValue + benchmarkingValue + collaborationValue;
      const networkEffects = directValue * networkMultiplier;

      return {
        directValue,
        networkEffects,
        totalValue: directValue + networkEffects,
        breakdown: {
          dataSharing: dataValue,
          benchmarking: benchmarkingValue,
          collaboration: collaborationValue,
          networkBonus: networkEffects
        }
      };

    } catch (error) {
      console.error('Error calculating network value:', error);
      throw error;
    }
  }

  /**
   * Predict network evolution
   */
  async predictNetworkEvolution(months: number = 6): Promise<{
    predictedSize: number;
    predictedConnections: number;
    growthRate: number;
    confidenceInterval: { lower: number; upper: number };
  }> {
    try {
      // Get historical data
      const history = await this.getNetworkHistory(12); // 12 months
      
      // Simple linear regression for prediction
      const growthRate = this.calculateGrowthRate(history);
      const currentSize = history[history.length - 1]?.nodeCount || 0;
      
      const predictedSize = currentSize * Math.pow(1 + growthRate, months);
      const predictedConnections = predictedSize * (predictedSize - 1) * 0.1; // Assuming 10% connectivity

      return {
        predictedSize: Math.round(predictedSize),
        predictedConnections: Math.round(predictedConnections),
        growthRate: growthRate * 100,
        confidenceInterval: {
          lower: predictedSize * 0.8,
          upper: predictedSize * 1.2
        }
      };

    } catch (error) {
      console.error('Error predicting network evolution:', error);
      throw error;
    }
  }

  // Private helper methods

  private async calculateNetworkGrowth(timeframe: string): Promise<number> {
    // Simplified - would query actual growth data
    const growthRates: Record<string, number> = {
      'daily': 0.5,
      'weekly': 3.5,
      'monthly': 15.2,
      'quarterly': 48.7
    };
    
    return growthRates[timeframe] || 0;
  }

  private async calculateActivityTrend(timeframe: string): Promise<number> {
    // Simplified - would analyze transaction volumes
    return Math.random() * 20 - 10; // -10% to +10%
  }

  private async calculateCollaborationTrend(timeframe: string): Promise<number> {
    // Simplified - would track collaboration metrics
    return Math.random() * 30 - 5; // -5% to +25%
  }

  private async analyzeSupplyChainConcentration(): Promise<{ severity: number; impact: number }> {
    // Simplified analysis
    return {
      severity: 0.75,
      impact: 0.8
    };
  }

  private async identifySustainabilityLeaders(): Promise<any[]> {
    const { data: leaders } = await this.supabase
      .from('organizations')
      .select('id, name, metrics->esg_score')
      .gt('metrics->esg_score', 90)
      .limit(10);

    return leaders || [];
  }

  private async detectEmergingRisks(): Promise<any[]> {
    // Simplified risk detection
    return [
      {
        id: 'climate-risk-1',
        title: 'Increasing Climate Regulation',
        description: 'New regulations expected in 3 key markets',
        severity: 'high',
        impact: 0.8,
        confidence: 0.75,
        mitigation: 'Proactively enhance climate reporting'
      }
    ];
  }

  private async calculateDataSharingValue(organizationId: string): Promise<number> {
    const { count } = await this.supabase
      .from('data_contributions')
      .select('*', { count: 'exact', head: true })
      .eq('provider_id', organizationId);

    return (count || 0) * 100; // $100 value per contribution
  }

  private async calculateBenchmarkingValue(organizationId: string): Promise<number> {
    const { count } = await this.supabase
      .from('benchmark_contributions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    return (count || 0) * 50; // $50 value per benchmark
  }

  private async calculateCollaborationValue(organizationId: string): Promise<number> {
    const { data: initiatives } = await this.supabase
      .from('collaborative_initiatives')
      .select('*')
      .contains('participants', [organizationId]);

    return (initiatives?.length || 0) * 500; // $500 value per initiative
  }

  private async getNetworkSize(): Promise<number> {
    const { count } = await this.supabase
      .from('network_nodes')
      .select('*', { count: 'exact', head: true });

    return count || 0;
  }

  private async getNetworkHistory(months: number): Promise<any[]> {
    // Simplified - would query historical snapshots
    const history = [];
    let size = 100;
    
    for (let i = 0; i < months; i++) {
      size *= 1.05; // 5% monthly growth
      history.push({
        month: i,
        nodeCount: Math.round(size),
        edgeCount: Math.round(size * 2)
      });
    }
    
    return history;
  }

  private calculateGrowthRate(history: any[]): number {
    if (history.length < 2) return 0;
    
    const first = history[0].nodeCount;
    const last = history[history.length - 1].nodeCount;
    const months = history.length - 1;
    
    return Math.pow(last / first, 1 / months) - 1;
  }
}