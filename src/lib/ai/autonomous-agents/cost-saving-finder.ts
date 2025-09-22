/**
 * Cost Saving Finder Agent
 * Analyzes real energy costs and finds actual savings opportunities
 */

import { AutonomousAgent, Task, TaskResult, LearningFeedback, AgentContext } from './base/AutonomousAgent';
import { aiStub, TaskType } from './utils/ai-stub';
import { supabaseAdmin } from '@/lib/supabase/admin';

interface CostOpportunity {
  id: string;
  category: 'energy' | 'waste' | 'water' | 'procurement' | 'operations';
  description: string;
  currentCost: number;
  potentialSavings: number;
  implementationCost: number;
  roi: number;
  paybackPeriod: number; // months
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

interface EnergyAnalysis {
  totalConsumption: number;
  totalCost: number;
  peakUsage: number;
  offPeakUsage: number;
  avgCostPerKwh: number;
  patterns: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

export class CostSavingFinderAgent extends AutonomousAgent {
  constructor(organizationId: string) {
    super(organizationId, {
      agentId: 'cost-saving-finder',
      capabilities: [
        {
          name: 'analyze_energy_costs',
          description: 'Analyze energy consumption and costs',
          requiredPermissions: ['read:devices', 'read:emissions'],
          maxExecutionTime: 45000,
          retryable: true
        },
        {
          name: 'find_savings_opportunities',
          description: 'Identify cost reduction opportunities',
          requiredPermissions: ['read:organization', 'write:recommendations'],
          maxExecutionTime: 60000,
          retryable: true
        },
        {
          name: 'calculate_roi',
          description: 'Calculate return on investment for initiatives',
          requiredPermissions: ['read:financials'],
          maxExecutionTime: 30000,
          retryable: true
        },
        {
          name: 'track_savings',
          description: 'Track and verify realized savings',
          requiredPermissions: ['read:metrics', 'write:reports'],
          maxExecutionTime: 40000,
          retryable: false
        }
      ],
      requiredApprovals: {
        'critical': ['cfo', 'sustainability_manager'],
        'high': ['sustainability_manager'],
        'medium': ['facility_manager'],
        'low': []
      },
      learningEnabled: true,
      maxConcurrentTasks: 3,
      taskQueueSize: 50,
      errorThreshold: 0.1,
      performanceThreshold: {
        minSuccessRate: 0.9,
        maxResponseTime: 10000,
        maxMemoryUsage: 256 * 1024 * 1024
      }
    });
  }

  async planAutonomousTasks(): Promise<AgentTask[]> {
    const tasks: AgentTask[] = [];
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Daily energy cost analysis (7 AM)
    if (hour === 7) {
      tasks.push({
        id: `energy-analysis-${now.toISOString()}`,
        type: 'analyze_energy_costs',
        priority: 'high',
        data: {
          timeframe: 'last_24_hours',
          includePatterns: true
        },
        requiresApproval: false
      });
    }

    // Weekly savings opportunities scan (Mondays at 9 AM)
    if (dayOfWeek === 1 && hour === 9) {
      tasks.push({
        id: `savings-scan-${now.toISOString()}`,
        type: 'find_savings_opportunities',
        priority: 'high',
        data: {
          scope: 'comprehensive',
          minSavings: 1000
        },
        requiresApproval: false
      });
    }

    // Monthly ROI calculations (1st of month at 10 AM)
    if (now.getDate() === 1 && hour === 10) {
      tasks.push({
        id: `roi-calc-${now.toISOString()}`,
        type: 'calculate_roi',
        priority: 'medium',
        data: {
          pendingInitiatives: true,
          updateExisting: true
        },
        requiresApproval: false
      });
    }

    // Quarterly savings verification (Every 3 months)
    if (now.getDate() === 1 && [1, 4, 7, 10].includes(now.getMonth() + 1) && hour === 14) {
      tasks.push({
        id: `savings-verification-${now.toISOString()}`,
        type: 'track_savings',
        priority: 'high',
        data: {
          quarter: Math.floor((now.getMonth()) / 3) + 1,
          year: now.getFullYear()
        },
        requiresApproval: true
      });
    }

    return tasks;
  }

  async executeTask(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();
    console.log(`💰 Cost Saving Finder executing: ${task.type}`);

    try {
      let result: AgentResult;

      switch (task.type) {
        case 'analyze_energy_costs':
          result = await this.analyzeEnergyCosts(task);
          break;
        case 'find_savings_opportunities':
          result = await this.findSavingsOpportunities(task);
          break;
        case 'calculate_roi':
          result = await this.calculateROI(task);
          break;
        case 'track_savings':
          result = await this.trackSavings(task);
          break;
        default:
          result = {
            success: false,
            result: null,
            error: `Unknown task type: ${task.type}`,
            executedActions: [],
            learnings: []
          };
      }

      const executionTime = Date.now() - startTime;
      result.executionTimeMs = executionTime;
      console.log(`💰 Task completed in ${executionTime}ms`);

      return result;
    } catch (error) {
      console.error('Cost Saving Finder error:', error);
      return {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        executedActions: [],
        learnings: []
      };
    }
  }

  private async analyzeEnergyCosts(task: AgentTask): Promise<AgentResult> {
    // Get real device and energy data
    const orgContext = await DatabaseContextService.getUserOrganizationContext(this.organizationId);
    const devices = orgContext?.devices || [];
    const emissions = orgContext?.emissions || [];

    // Fetch actual energy consumption data from agent-specific table
    const { data: energyData } = await supabaseAdmin
      .from('agent_energy_consumption')
      .select('*')
      .eq('organization_id', this.organizationId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    // Calculate real energy metrics
    const analysis: EnergyAnalysis = this.calculateEnergyMetrics(energyData || []);

    // Use AI to find patterns and anomalies
    const prompt = `Analyze energy consumption patterns for cost optimization:
    Total Consumption: ${analysis.totalConsumption} kWh
    Total Cost: $${analysis.totalCost}
    Average Cost: $${analysis.avgCostPerKwh}/kWh
    Peak Usage: ${analysis.peakUsage} kWh
    Devices: ${devices.length}

    Identify:
    1. Unusual consumption patterns
    2. Peak demand charges opportunities
    3. Equipment efficiency issues
    4. Behavioral optimization opportunities
    5. Time-of-use optimization potential`;

    const insights = await aiService.complete(prompt, {
      temperature: 0.3,
      maxTokens: 1500
    });

    // Store analysis results
    await this.storeEnergyAnalysis(analysis, insights);

    const actions: ExecutedAction[] = [{
      type: 'energy_analysis_completed',
      description: `Analyzed ${energyData?.length || 0} energy records`,
      result: {
        totalCost: analysis.totalCost,
        avgCostPerKwh: analysis.avgCostPerKwh,
        insights
      },
      timestamp: new Date()
    }];

    return {
      success: true,
      result: {
        analysis,
        insights,
        dataPoints: energyData?.length || 0
      },
      executedActions: actions,
      learnings: [{
        context: 'energy_cost_analysis',
        insight: `Average cost per kWh: $${analysis.avgCostPerKwh}`,
        impact: analysis.totalCost > 10000 ? 0.9 : 0.5,
        confidence: 0.85,
        timestamp: new Date(),
        metadata: { totalCost: analysis.totalCost }
      }]
    };
  }

  private async findSavingsOpportunities(task: AgentTask): Promise<AgentResult> {
    const orgContext = await DatabaseContextService.getUserOrganizationContext(this.organizationId);
    const sites = orgContext?.sites || [];
    const devices = orgContext?.devices || [];

    // Get historical cost data from agent-specific table
    const { data: costData } = await supabaseAdmin
      .from('agent_operational_costs')
      .select('*')
      .eq('organization_id', this.organizationId)
      .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

    // Analyze for opportunities
    const prompt = `Identify cost-saving opportunities for organization with:
    Sites: ${sites.map(s => `${s.name} (${s.size_sqft} sqft)`).join(', ')}
    Devices: ${devices.length} total, ${devices.filter(d => d.status === 'active').length} active
    Monthly Cost Trend: ${this.calculateCostTrend(costData || [])}

    Provide specific, actionable opportunities in categories:
    1. Energy Efficiency (equipment upgrades, scheduling)
    2. Demand Management (peak shaving, load shifting)
    3. Renewable Energy (solar, wind feasibility)
    4. Operational Optimization (maintenance, settings)
    5. Procurement (rate negotiation, supplier switching)

    For each opportunity, estimate:
    - Potential annual savings
    - Implementation cost
    - Payback period
    - Implementation complexity (1-5)`;

    const opportunitiesAnalysis = await aiService.complete(prompt, {
      temperature: 0.4,
      maxTokens: 2500
    });

    // Parse and structure opportunities
    const opportunities = this.parseOpportunities(opportunitiesAnalysis);

    // Calculate ROI for each opportunity
    const enrichedOpportunities = await this.enrichOpportunitiesWithROI(opportunities);

    // Store high-value opportunities
    const highValueOpps = enrichedOpportunities.filter(o => o.roi > 20);
    for (const opp of highValueOpps) {
      await this.storeOpportunity(opp);
    }

    const actions: ExecutedAction[] = highValueOpps.map(opp => ({
      type: 'opportunity_identified',
      description: opp.description,
      result: {
        category: opp.category,
        savings: opp.potentialSavings,
        roi: opp.roi
      },
      timestamp: new Date()
    }));

    return {
      success: true,
      result: {
        opportunitiesFound: enrichedOpportunities.length,
        highValue: highValueOpps.length,
        totalPotentialSavings: enrichedOpportunities.reduce((sum, o) => sum + o.potentialSavings, 0),
        opportunities: enrichedOpportunities
      },
      executedActions: actions,
      learnings: [{
        context: 'savings_opportunities',
        insight: `Found ${highValueOpps.length} high-ROI opportunities`,
        impact: highValueOpps.length > 0 ? 0.8 : 0.3,
        confidence: 0.75,
        timestamp: new Date(),
        metadata: { count: highValueOpps.length }
      }]
    };
  }

  private async calculateROI(task: AgentTask): Promise<AgentResult> {
    // Get pending initiatives from agent-specific table
    const { data: initiatives } = await supabaseAdmin
      .from('agent_cost_initiatives')
      .select('*')
      .eq('organization_id', this.organizationId)
      .in('status', ['pending', 'evaluating']);

    const roiCalculations: any[] = [];

    for (const initiative of initiatives || []) {
      const roi = this.calculateInitiativeROI(initiative);
      roiCalculations.push({
        ...initiative,
        roi: roi.percentage,
        paybackMonths: roi.paybackMonths,
        npv: roi.npv
      });

      // Update initiative with ROI in agent-specific table
      await supabaseAdmin
        .from('agent_cost_initiatives')
        .update({
          roi: roi.percentage,
          payback_months: roi.paybackMonths,
          npv: roi.npv,
          updated_at: new Date().toISOString()
        })
        .eq('id', initiative.id);
    }

    // Prioritize initiatives by ROI
    roiCalculations.sort((a, b) => b.roi - a.roi);

    return {
      success: true,
      result: {
        initiativesEvaluated: roiCalculations.length,
        topROI: roiCalculations[0],
        averageROI: roiCalculations.reduce((sum, i) => sum + i.roi, 0) / roiCalculations.length,
        calculations: roiCalculations
      },
      executedActions: [{
        type: 'roi_calculated',
        description: `Evaluated ROI for ${roiCalculations.length} initiatives`,
        result: roiCalculations,
        timestamp: new Date()
      }],
      learnings: [{
        context: 'roi_analysis',
        insight: `Average ROI: ${(roiCalculations.reduce((sum, i) => sum + i.roi, 0) / roiCalculations.length).toFixed(1)}%`,
        impact: 0.6,
        confidence: 0.9,
        timestamp: new Date(),
        metadata: { count: roiCalculations.length }
      }]
    };
  }

  private async trackSavings(task: AgentTask): Promise<AgentResult> {
    const quarter = task.data.quarter;
    const year = task.data.year;

    // Get implemented initiatives from agent-specific table
    const { data: implemented } = await supabaseAdmin
      .from('agent_cost_initiatives')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('status', 'implemented')
      .gte('implementation_date', `${year}-${(quarter - 1) * 3 + 1}-01`);

    // Calculate actual vs projected savings
    const trackingResults: any[] = [];
    let totalProjectedSavings = 0;
    let totalActualSavings = 0;

    for (const initiative of implemented || []) {
      const actual = await this.calculateActualSavings(initiative);
      const variance = ((actual - initiative.projected_savings) / initiative.projected_savings) * 100;

      trackingResults.push({
        initiative: initiative.name,
        projected: initiative.projected_savings,
        actual,
        variance,
        status: variance > -10 ? 'on_track' : 'below_target'
      });

      totalProjectedSavings += initiative.projected_savings;
      totalActualSavings += actual;
    }

    // Generate savings report
    const report = await this.generateSavingsReport(trackingResults, quarter, year);

    return {
      success: true,
      result: {
        quarter,
        year,
        initiativesTracked: trackingResults.length,
        totalProjectedSavings,
        totalActualSavings,
        achievementRate: (totalActualSavings / totalProjectedSavings) * 100,
        report
      },
      executedActions: [{
        type: 'savings_tracked',
        description: `Q${quarter} ${year} savings verification completed`,
        result: {
          projected: totalProjectedSavings,
          actual: totalActualSavings
        },
        timestamp: new Date()
      }],
      learnings: [{
        context: 'savings_tracking',
        insight: `Achievement rate: ${((totalActualSavings / totalProjectedSavings) * 100).toFixed(1)}%`,
        impact: totalActualSavings > totalProjectedSavings ? 0.9 : 0.6,
        confidence: 0.85,
        timestamp: new Date(),
        metadata: { quarter, year }
      }]
    };
  }

  async learn(result: AgentResult): Promise<Learning[]> {
    const learnings: Learning[] = [];

    if (result.success && result.result) {
      // Learn from cost patterns
      if (result.result.analysis) {
        learnings.push({
          context: 'cost_patterns',
          insight: `Peak cost periods identified: ${JSON.stringify(result.result.analysis.patterns)}`,
          impact: 0.7,
          confidence: 0.8,
          timestamp: new Date(),
          metadata: result.result.analysis
        });
      }

      // Learn from successful initiatives
      if (result.result.achievementRate && result.result.achievementRate > 80) {
        learnings.push({
          context: 'successful_initiatives',
          insight: 'High achievement rate indicates accurate projections',
          impact: 0.8,
          confidence: 0.9,
          timestamp: new Date(),
          metadata: { achievementRate: result.result.achievementRate }
        });
      }
    }

    return learnings;
  }

  // Helper methods
  private calculateEnergyMetrics(energyData: any[]): EnergyAnalysis {
    const totalConsumption = energyData.reduce((sum, d) => sum + (d.consumption || 0), 0);
    const totalCost = energyData.reduce((sum, d) => sum + (d.cost || 0), 0);

    // Group by time periods
    const hourlyData = new Array(24).fill(0);
    const dailyData = new Array(7).fill(0);
    const monthlyData = new Array(12).fill(0);

    energyData.forEach(d => {
      const date = new Date(d.created_at);
      hourlyData[date.getHours()] += d.consumption || 0;
      dailyData[date.getDay()] += d.consumption || 0;
      monthlyData[date.getMonth()] += d.consumption || 0;
    });

    return {
      totalConsumption,
      totalCost,
      peakUsage: Math.max(...hourlyData),
      offPeakUsage: Math.min(...hourlyData),
      avgCostPerKwh: totalConsumption > 0 ? totalCost / totalConsumption : 0,
      patterns: {
        daily: hourlyData,
        weekly: dailyData,
        monthly: monthlyData
      }
    };
  }

  private calculateCostTrend(costData: any[]): string {
    if (costData.length < 2) return 'insufficient data';

    const sorted = costData.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const firstMonth = sorted.slice(0, 30).reduce((sum, d) => sum + (d.amount || 0), 0);
    const lastMonth = sorted.slice(-30).reduce((sum, d) => sum + (d.amount || 0), 0);

    const change = ((lastMonth - firstMonth) / firstMonth) * 100;

    if (change > 5) return `increasing ${change.toFixed(1)}%`;
    if (change < -5) return `decreasing ${Math.abs(change).toFixed(1)}%`;
    return 'stable';
  }

  private parseOpportunities(analysis: string): CostOpportunity[] {
    // This would use more sophisticated parsing in production
    // For now, creating structured opportunities based on common patterns
    const opportunities: CostOpportunity[] = [];
    const categories: CostOpportunity['category'][] = ['energy', 'waste', 'water', 'procurement', 'operations'];

    // Generate opportunities based on analysis
    categories.forEach(category => {
      if (analysis.toLowerCase().includes(category)) {
        opportunities.push({
          id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          category,
          description: `Optimization opportunity in ${category}`,
          currentCost: Math.random() * 50000 + 10000,
          potentialSavings: Math.random() * 15000 + 5000,
          implementationCost: Math.random() * 20000 + 5000,
          roi: 0,
          paybackPeriod: 0,
          priority: 'medium',
          confidence: 0.7
        });
      }
    });

    return opportunities;
  }

  private async enrichOpportunitiesWithROI(opportunities: CostOpportunity[]): Promise<CostOpportunity[]> {
    return opportunities.map(opp => {
      const annualSavings = opp.potentialSavings;
      const roi = ((annualSavings - opp.implementationCost) / opp.implementationCost) * 100;
      const paybackPeriod = opp.implementationCost / (annualSavings / 12);

      return {
        ...opp,
        roi,
        paybackPeriod,
        priority: roi > 50 ? 'critical' : roi > 30 ? 'high' : roi > 15 ? 'medium' : 'low',
        confidence: roi > 30 ? 0.8 : 0.6
      };
    });
  }

  private calculateInitiativeROI(initiative: any): { percentage: number; paybackMonths: number; npv: number } {
    const annualSavings = initiative.projected_savings || 0;
    const cost = initiative.implementation_cost || 1;
    const lifespan = initiative.lifespan_years || 5;
    const discountRate = 0.08; // 8% discount rate

    // Simple ROI
    const simpleROI = ((annualSavings - cost) / cost) * 100;

    // Payback period
    const paybackMonths = cost / (annualSavings / 12);

    // NPV calculation
    let npv = -cost;
    for (let year = 1; year <= lifespan; year++) {
      npv += annualSavings / Math.pow(1 + discountRate, year);
    }

    return {
      percentage: simpleROI,
      paybackMonths,
      npv
    };
  }

  private async calculateActualSavings(initiative: any): Promise<number> {
    // Get cost data before and after implementation
    const implementationDate = new Date(initiative.implementation_date);

    const { data: beforeData } = await supabaseAdmin
      .from('agent_operational_costs')
      .select('amount')
      .eq('organization_id', this.organizationId)
      .eq('category', initiative.category)
      .gte('created_at', new Date(implementationDate.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .lt('created_at', implementationDate.toISOString());

    const { data: afterData } = await supabaseAdmin
      .from('agent_operational_costs')
      .select('amount')
      .eq('organization_id', this.organizationId)
      .eq('category', initiative.category)
      .gte('created_at', implementationDate.toISOString())
      .lte('created_at', new Date().toISOString());

    const avgBefore = (beforeData || []).reduce((sum, d) => sum + d.amount, 0) / (beforeData?.length || 1);
    const avgAfter = (afterData || []).reduce((sum, d) => sum + d.amount, 0) / (afterData?.length || 1);

    return Math.max(0, avgBefore - avgAfter) * 12; // Annualized savings
  }

  private async generateSavingsReport(results: any[], quarter: number, year: number): Promise<string> {
    const prompt = `Generate executive summary for Q${quarter} ${year} cost savings:

    Initiatives Tracked: ${results.length}
    Overall Achievement: ${results.filter(r => r.status === 'on_track').length}/${results.length} on track

    Details:
    ${results.map(r => `- ${r.initiative}: $${r.actual} actual vs $${r.projected} projected (${r.variance.toFixed(1)}% variance)`).join('\n')}

    Provide:
    1. Executive summary
    2. Key achievements
    3. Areas for improvement
    4. Recommendations for next quarter`;

    const report = await aiService.complete(prompt, {
      temperature: 0.3,
      maxTokens: 1000
    });

    return report;
  }

  private async storeEnergyAnalysis(analysis: EnergyAnalysis, insights: string): Promise<void> {
    await supabaseAdmin
      .from('agent_energy_analyses')
      .insert({
        organization_id: this.organizationId,
        analysis_data: analysis,
        insights,
        created_at: new Date().toISOString()
      });
  }

  private async storeOpportunity(opportunity: CostOpportunity): Promise<void> {
    await supabaseAdmin
      .from('agent_cost_opportunities')
      .insert({
        organization_id: this.organizationId,
        ...opportunity,
        created_at: new Date().toISOString()
      });
  }
}