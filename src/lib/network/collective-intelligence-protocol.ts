import { createClient } from '@supabase/supabase-js';
import { AgentManager } from '../ai/autonomous-agents/agent-manager';
import { MLDeploymentService } from '../ml/model-deployment-service';
import { PeerBenchmarkingService } from './peer-benchmarking-service';

export interface CollectiveInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'best_practice' | 'emerging_trend' | 'risk_signal';
  category: string;
  confidence: number;
  affectedOrganizations: number;
  impact: 'high' | 'medium' | 'low';
  description: string;
  recommendations: string[];
  evidence: Array<{
    source: string;
    strength: number;
  }>;
  discovered: Date;
}

export interface NetworkLearning {
  patterns: CollectiveInsight[];
  predictions: Array<{
    trend: string;
    likelihood: number;
    timeframe: string;
    impact: string;
  }>;
  recommendations: Array<{
    action: string;
    priority: number;
    estimatedImpact: number;
  }>;
}

export class CollectiveIntelligenceProtocol {
  private static instance: CollectiveIntelligenceProtocol;
  private supabase: any;
  private agentManager: AgentManager;
  private mlService: MLDeploymentService;
  private benchmarkService: PeerBenchmarkingService;
  private learningInterval: NodeJS.Timeout | null = null;
  private insightCache: Map<string, CollectiveInsight[]> = new Map();

  private constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    this.agentManager = AgentManager.getInstance();
    this.mlService = MLDeploymentService.getInstance();
    this.benchmarkService = PeerBenchmarkingService.getInstance();
  }

  static getInstance(): CollectiveIntelligenceProtocol {
    if (!CollectiveIntelligenceProtocol.instance) {
      CollectiveIntelligenceProtocol.instance = new CollectiveIntelligenceProtocol();
    }
    return CollectiveIntelligenceProtocol.instance;
  }

  /**
   * Start collective learning process
   */
  async startCollectiveLearning(): Promise<void> {
    console.log('🧠 Starting Collective Intelligence Protocol...');

    // Run learning cycle every hour
    this.learningInterval = setInterval(async () => {
      await this.runLearningCycle();
    }, 3600000); // 1 hour

    // Run initial cycle
    await this.runLearningCycle();
  }

  /**
   * Run a complete learning cycle
   */
  private async runLearningCycle(): Promise<void> {
    try {
      console.log('🔄 Running collective learning cycle...');

      // 1. Collect anonymized data from network
      const networkData = await this.collectNetworkData();

      // 2. Identify patterns and anomalies
      const patterns = await this.identifyPatterns(networkData);

      // 3. Discover best practices
      const bestPractices = await this.discoverBestPractices(networkData);

      // 4. Detect emerging trends
      const trends = await this.detectEmergingTrends(networkData);

      // 5. Identify risk signals
      const risks = await this.identifyRiskSignals(networkData);

      // 6. Generate collective insights
      const insights = [...patterns, ...bestPractices, ...trends, ...risks];

      // 7. Store and distribute insights
      await this.distributeInsights(insights);

      // 8. Update ML models with new learning
      await this.updateMLModels(insights);

      console.log(`✅ Learning cycle complete: ${insights.length} new insights`);

    } catch (error) {
      console.error('❌ Learning cycle error:', error);
    }
  }

  /**
   * Get personalized insights for an organization
   */
  async getPersonalizedInsights(
    organizationId: string,
    categories?: string[]
  ): Promise<NetworkLearning> {
    try {
      // Get organization context
      const orgContext = await this.getOrganizationContext(organizationId);

      // Get relevant collective insights
      const insights = await this.getRelevantInsights(orgContext, categories);

      // Generate predictions based on network patterns
      const predictions = await this.generatePredictions(orgContext, insights);

      // Create personalized recommendations
      const recommendations = await this.createRecommendations(
        organizationId,
        insights,
        predictions
      );

      return {
        patterns: insights,
        predictions,
        recommendations
      };

    } catch (error) {
      console.error('Error getting personalized insights:', error);
      throw error;
    }
  }

  /**
   * Contribute organization's learnings to the network
   */
  async contributeLearning(
    organizationId: string,
    learning: {
      type: 'success' | 'failure' | 'innovation' | 'optimization';
      category: string;
      description: string;
      impact: number;
      actions: string[];
      outcomes: any;
    }
  ): Promise<void> {
    try {
      // Anonymize the learning
      const anonymized = await this.anonymizeLearning(organizationId, learning);

      // Validate and enrich
      const enriched = await this.enrichLearning(anonymized);

      // Store in collective knowledge base
      await this.supabase.from('collective_learnings').insert({
        type: learning.type,
        category: learning.category,
        anonymized_description: anonymized.description,
        impact_score: enriched.impactScore,
        confidence: enriched.confidence,
        contributing_region: anonymized.region,
        contributing_industry: anonymized.industry,
        contributed_at: new Date().toISOString(),
        metadata: enriched.metadata
      });

      // Trigger immediate pattern detection if high impact
      if (enriched.impactScore > 0.8) {
        await this.detectImmediatePattern(enriched);
      }

      console.log('✅ Learning contributed to collective intelligence');

    } catch (error) {
      console.error('Error contributing learning:', error);
      throw error;
    }
  }

  /**
   * Get network effect metrics
   */
  async getNetworkEffectMetrics(organizationId: string): Promise<{
    networkSize: number;
    collectiveInsights: number;
    improvementRate: number;
    peerConnections: number;
    sharedLearnings: number;
    networkValue: number;
  }> {
    // Get network statistics
    const { data: networkStats } = await this.supabase
      .from('network_statistics')
      .select('*')
      .single();

    // Get organization's contribution
    const { data: orgContribution } = await this.supabase
      .from('organization_network_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    // Calculate network value (Metcalfe's law approximation)
    const networkValue = Math.pow(networkStats?.total_organizations || 0, 1.5);

    return {
      networkSize: networkStats?.total_organizations || 0,
      collectiveInsights: networkStats?.total_insights || 0,
      improvementRate: networkStats?.avg_improvement_rate || 0,
      peerConnections: orgContribution?.peer_connections || 0,
      sharedLearnings: orgContribution?.shared_learnings || 0,
      networkValue
    };
  }

  /**
   * Enable swarm intelligence for complex problems
   */
  async enableSwarmIntelligence(
    problemType: 'decarbonization' | 'circular_economy' | 'supply_chain_resilience',
    participants: string[]
  ): Promise<{
    swarmId: string;
    status: 'active' | 'forming' | 'complete';
    participants: number;
    solutions: any[];
  }> {
    // Create swarm instance
    const { data: swarm } = await this.supabase
      .from('swarm_intelligence_sessions')
      .insert({
        problem_type: problemType,
        initiator_count: participants.length,
        status: 'forming',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    // Invite participants
    for (const participantId of participants) {
      await this.supabase.from('swarm_participants').insert({
        swarm_id: swarm.id,
        organization_id: participantId,
        status: 'invited'
      });
    }

    // Start swarm agents
    await this.startSwarmAgents(swarm.id, problemType);

    return {
      swarmId: swarm.id,
      status: 'forming',
      participants: participants.length,
      solutions: []
    };
  }

  /**
   * Private helper methods
   */
  private async collectNetworkData(): Promise<any> {
    // Collect anonymized data from all participating organizations
    const { data: emissions } = await this.supabase
      .from('network_anonymized_metrics')
      .select('*')
      .eq('metric_type', 'emissions')
      .gte('reported_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    const { data: energy } = await this.supabase
      .from('network_anonymized_metrics')
      .select('*')
      .eq('metric_type', 'energy')
      .gte('reported_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    const { data: practices } = await this.supabase
      .from('network_best_practices')
      .select('*')
      .eq('verified', true);

    return {
      emissions,
      energy,
      practices,
      timestamp: new Date()
    };
  }

  private async identifyPatterns(data: any): Promise<CollectiveInsight[]> {
    const patterns: CollectiveInsight[] = [];

    // Use ML to identify patterns
    try {
      // Analyze emissions patterns
      if (data.emissions?.length > 10) {
        const emissionTrends = this.analyzeTimeSeries(
          data.emissions.map((e: any) => ({
            value: e.value,
            timestamp: e.reported_date
          }))
        );

        if (emissionTrends.pattern) {
          patterns.push({
            id: `pattern-${Date.now()}-emissions`,
            type: 'pattern',
            category: 'emissions',
            confidence: emissionTrends.confidence,
            affectedOrganizations: data.emissions.length,
            impact: emissionTrends.impact,
            description: emissionTrends.description,
            recommendations: emissionTrends.recommendations,
            evidence: emissionTrends.evidence,
            discovered: new Date()
          });
        }
      }

      // Analyze energy patterns
      if (data.energy?.length > 10) {
        const energyPatterns = this.findCorrelations(data.energy);
        
        for (const pattern of energyPatterns) {
          patterns.push({
            id: `pattern-${Date.now()}-${pattern.type}`,
            type: 'pattern',
            category: 'energy',
            confidence: pattern.confidence,
            affectedOrganizations: pattern.count,
            impact: pattern.impact,
            description: pattern.description,
            recommendations: pattern.recommendations,
            evidence: pattern.evidence,
            discovered: new Date()
          });
        }
      }

    } catch (error) {
      console.error('Pattern identification error:', error);
    }

    return patterns;
  }

  private async discoverBestPractices(data: any): Promise<CollectiveInsight[]> {
    const bestPractices: CollectiveInsight[] = [];

    // Identify high-performing organizations and their practices
    const topPerformers = data.emissions
      ?.sort((a: any, b: any) => a.value - b.value)
      .slice(0, Math.ceil(data.emissions.length * 0.1)); // Top 10%

    if (topPerformers?.length > 0) {
      // Find common practices among top performers
      const commonPractices = await this.findCommonPractices(topPerformers);

      for (const practice of commonPractices) {
        bestPractices.push({
          id: `practice-${Date.now()}-${practice.category}`,
          type: 'best_practice',
          category: practice.category,
          confidence: practice.confidence,
          affectedOrganizations: practice.adopters,
          impact: 'high',
          description: practice.description,
          recommendations: [practice.implementation],
          evidence: practice.evidence,
          discovered: new Date()
        });
      }
    }

    return bestPractices;
  }

  private async detectEmergingTrends(data: any): Promise<CollectiveInsight[]> {
    const trends: CollectiveInsight[] = [];

    // Detect sudden changes or new patterns
    const recentData = data.emissions?.filter((e: any) => 
      new Date(e.reported_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    if (recentData?.length > 5) {
      const trendAnalysis = this.detectTrends(recentData);

      for (const trend of trendAnalysis) {
        trends.push({
          id: `trend-${Date.now()}-${trend.type}`,
          type: 'emerging_trend',
          category: trend.category,
          confidence: trend.confidence,
          affectedOrganizations: trend.organizations,
          impact: trend.impact,
          description: trend.description,
          recommendations: trend.actions,
          evidence: trend.evidence,
          discovered: new Date()
        });
      }
    }

    return trends;
  }

  private async identifyRiskSignals(data: any): Promise<CollectiveInsight[]> {
    const risks: CollectiveInsight[] = [];

    // Identify organizations showing concerning patterns
    const riskIndicators = this.calculateRiskIndicators(data);

    for (const risk of riskIndicators) {
      if (risk.severity > 0.7) {
        risks.push({
          id: `risk-${Date.now()}-${risk.type}`,
          type: 'risk_signal',
          category: risk.category,
          confidence: risk.confidence,
          affectedOrganizations: risk.affected,
          impact: 'high',
          description: risk.description,
          recommendations: risk.mitigations,
          evidence: risk.evidence,
          discovered: new Date()
        });
      }
    }

    return risks;
  }

  private async distributeInsights(insights: CollectiveInsight[]): Promise<void> {
    // Store insights
    for (const insight of insights) {
      await this.supabase.from('collective_insights').insert({
        insight_id: insight.id,
        type: insight.type,
        category: insight.category,
        confidence: insight.confidence,
        affected_organizations: insight.affectedOrganizations,
        impact: insight.impact,
        description: insight.description,
        recommendations: insight.recommendations,
        evidence: insight.evidence,
        discovered_at: insight.discovered,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
    }

    // Update cache
    this.insightCache.set('latest', insights);

    // Notify affected organizations through agents
    await this.notifyOrganizations(insights);
  }

  private async updateMLModels(insights: CollectiveInsight[]): Promise<void> {
    // Prepare training data from insights
    const trainingData = insights.map(insight => ({
      features: {
        type: insight.type,
        category: insight.category,
        confidence: insight.confidence,
        impact: insight.impact === 'high' ? 1 : insight.impact === 'medium' ? 0.5 : 0.2
      },
      label: insight.affectedOrganizations > 10 ? 1 : 0
    }));

    // Update relevant ML models
    if (trainingData.length > 0) {
      console.log(`📊 Updating ML models with ${trainingData.length} new insights`);
      // This would trigger model retraining in production
    }
  }

  private async getOrganizationContext(organizationId: string): Promise<any> {
    const { data: org } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    const { data: metrics } = await this.supabase
      .from('organization_metrics_summary')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    return {
      organization: org,
      metrics,
      industry: org?.industry,
      size: org?.employee_count,
      region: org?.headquarters_country
    };
  }

  private async getRelevantInsights(
    context: any,
    categories?: string[]
  ): Promise<CollectiveInsight[]> {
    let query = this.supabase
      .from('collective_insights')
      .select('*')
      .gte('expires_at', new Date().toISOString())
      .order('confidence', { ascending: false });

    if (categories?.length) {
      query = query.in('category', categories);
    }

    const { data: insights } = await query.limit(20);

    // Filter by relevance to organization
    return insights?.filter((insight: any) => {
      // Industry relevance
      if (insight.metadata?.industries && !insight.metadata.industries.includes(context.industry)) {
        return false;
      }

      // Size relevance
      if (insight.metadata?.organizationSize) {
        const sizeMatch = this.matchOrganizationSize(context.size, insight.metadata.organizationSize);
        if (!sizeMatch) return false;
      }

      return true;
    }).map((i: any) => ({
      id: i.insight_id,
      type: i.type,
      category: i.category,
      confidence: i.confidence,
      affectedOrganizations: i.affected_organizations,
      impact: i.impact,
      description: i.description,
      recommendations: i.recommendations,
      evidence: i.evidence,
      discovered: new Date(i.discovered_at)
    })) || [];
  }

  private async generatePredictions(
    context: any,
    insights: CollectiveInsight[]
  ): Promise<any[]> {
    const predictions = [];

    // Emission trend prediction
    if (insights.some(i => i.category === 'emissions')) {
      predictions.push({
        trend: 'Industry-wide emissions reduction accelerating',
        likelihood: 0.75,
        timeframe: '6-12 months',
        impact: 'Regulatory pressure will increase for laggards'
      });
    }

    // Energy transition prediction
    if (insights.some(i => i.category === 'energy' && i.type === 'emerging_trend')) {
      predictions.push({
        trend: 'Rapid adoption of renewable energy in your sector',
        likelihood: 0.82,
        timeframe: '12-18 months',
        impact: 'First movers will gain competitive advantage'
      });
    }

    // Risk predictions
    const riskInsights = insights.filter(i => i.type === 'risk_signal');
    if (riskInsights.length > 0) {
      predictions.push({
        trend: 'Supply chain sustainability risks increasing',
        likelihood: 0.68,
        timeframe: '3-6 months',
        impact: 'Proactive supplier engagement critical'
      });
    }

    return predictions;
  }

  private async createRecommendations(
    organizationId: string,
    insights: CollectiveInsight[],
    predictions: any[]
  ): Promise<any[]> {
    const recommendations = [];

    // Aggregate recommendations from insights
    const insightRecs = insights.flatMap(i => i.recommendations);

    // Prioritize based on organization context
    const prioritized = await this.prioritizeRecommendations(
      organizationId,
      insightRecs,
      predictions
    );

    return prioritized.slice(0, 10);
  }

  private async anonymizeLearning(organizationId: string, learning: any): Promise<any> {
    // Get organization context for anonymization
    const { data: org } = await this.supabase
      .from('organizations')
      .select('industry, headquarters_country, employee_count')
      .eq('id', organizationId)
      .single();

    return {
      description: this.generalizeDescription(learning.description),
      region: this.generalizeRegion(org.headquarters_country),
      industry: org.industry,
      sizeCategory: this.categorizeSi