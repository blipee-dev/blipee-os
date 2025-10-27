/**
 * Optimization Opportunities Service
 *
 * Analyzes sustainability data to identify cost-saving opportunities:
 * - Energy waste detection
 * - Emission hotspots
 * - Water inefficiencies
 * - Cost reduction opportunities
 * - ROI tracking for applied optimizations
 *
 * Runs: Daily at 4:00 AM UTC
 * Benefits: Proactive recommendations, cost savings, higher customer engagement
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface OptimizationServiceStats {
  opportunitiesFound: number;
  potentialSavings: number; // Total potential $ savings
  opportunitiesApplied: number;
  actualSavings: number; // Realized $ savings
  errors: number;
  lastRunAt: Date | null;
  lastRunDuration: number | null;
}

interface OptimizationOpportunity {
  organization_id: string;
  type: 'energy_waste' | 'emission_hotspot' | 'water_inefficiency' | 'cost_reduction';
  title: string;
  description: string;
  potential_savings: number;
  potential_emission_reduction: number;
  confidence_score: number;
  priority: 'high' | 'medium' | 'low';
  implementation_effort: 'low' | 'medium' | 'high';
  data_source: any;
}

export class OptimizationOpportunitiesService {
  private stats: OptimizationServiceStats = {
    opportunitiesFound: 0,
    potentialSavings: 0,
    opportunitiesApplied: 0,
    actualSavings: 0,
    errors: 0,
    lastRunAt: null,
    lastRunDuration: null,
  };

  getHealth(): OptimizationServiceStats {
    return { ...this.stats };
  }

  async run(): Promise<void> {
    const startTime = Date.now();
    console.log('\n🔍 [Optimization] Analyzing opportunities...');

    try {
      // Get all organizations
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name');

      if (orgsError || !orgs || orgs.length === 0) {
        console.log('⚠️  [Optimization] No organizations found');
        return;
      }

      console.log(`📊 [Optimization] Analyzing ${orgs.length} organizations`);

      for (const org of orgs) {
        try {
          await this.analyzeOrganization(org.id, org.name);
        } catch (error) {
          console.error(`❌ [Optimization] Failed for ${org.name}:`, error);
          this.stats.errors++;
        }
      }

      this.stats.lastRunAt = new Date();
      this.stats.lastRunDuration = Date.now() - startTime;

      console.log(`✅ [Optimization] Completed in ${(this.stats.lastRunDuration / 1000).toFixed(2)}s`);
      console.log(`   • Opportunities found: ${this.stats.opportunitiesFound}`);
      console.log(`   • Potential savings: $${this.stats.potentialSavings.toFixed(2)}`);

    } catch (error) {
      console.error('❌ [Optimization] Analysis failed:', error);
      this.stats.errors++;
      throw error;
    }
  }

  private async analyzeOrganization(orgId: string, orgName: string): Promise<void> {
    console.log(`   Analyzing: ${orgName}`);

    const opportunities: OptimizationOpportunity[] = [];

    // 1. Analyze energy waste
    const energyOpportunities = await this.findEnergyWaste(orgId);
    opportunities.push(...energyOpportunities);

    // 2. Analyze emission hotspots
    const emissionOpportunities = await this.findEmissionHotspots(orgId);
    opportunities.push(...emissionOpportunities);

    // 3. Analyze water inefficiencies
    const waterOpportunities = await this.findWaterInefficiencies(orgId);
    opportunities.push(...waterOpportunities);

    // 4. Find cost reduction opportunities
    const costOpportunities = await this.findCostReductions(orgId);
    opportunities.push(...costOpportunities);

    // Save opportunities to database
    if (opportunities.length > 0) {
      await this.saveOpportunities(opportunities);
      this.stats.opportunitiesFound += opportunities.length;
      this.stats.potentialSavings += opportunities.reduce((sum, o) => sum + o.potential_savings, 0);
      console.log(`     ✅ Found ${opportunities.length} opportunities`);
    }
  }

  private async findEnergyWaste(orgId: string): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    try {
      // Get energy consumption data for last 3 months
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: energyData } = await supabase
        .from('metrics_data')
        .select('*, metrics_catalog!inner(*)')
        .eq('organization_id', orgId)
        .in('metrics_catalog.category', ['Purchased Energy', 'Electricity'])
        .gte('period_start', threeMonthsAgo.toISOString())
        .order('period_start', { ascending: false })
        .limit(100);

      if (!energyData || energyData.length === 0) return opportunities;

      // Simple heuristic: If energy usage increased >20% month-over-month
      if (energyData.length >= 2) {
        const latest = energyData[0];
        const previous = energyData[1];

        if (latest.value > previous.value * 1.2) {
          const increase = latest.value - previous.value;
          const estimatedCost = increase * 0.12; // $0.12/kWh average

          opportunities.push({
            organization_id: orgId,
            type: 'energy_waste',
            title: 'Unusual Energy Consumption Spike Detected',
            description: `Energy consumption increased by ${((increase / previous.value) * 100).toFixed(1)}% from last month. Investigate potential equipment malfunction or inefficient usage patterns.`,
            potential_savings: estimatedCost,
            potential_emission_reduction: increase * 0.4, // kg CO2e per kWh
            confidence_score: 0.75,
            priority: 'high',
            implementation_effort: 'low',
            data_source: { latest_value: latest.value, previous_value: previous.value },
          });
        }
      }

    } catch (error) {
      console.error('     ⚠️  Energy waste analysis failed:', error);
    }

    return opportunities;
  }

  private async findEmissionHotspots(orgId: string): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    try {
      // Get emissions data grouped by scope
      const { data: emissionsData } = await supabase
        .from('metrics_data')
        .select('*, metrics_catalog!inner(*)')
        .eq('organization_id', orgId)
        .not('metrics_catalog.scope', 'is', null)
        .order('value', { ascending: false })
        .limit(50);

      if (!emissionsData || emissionsData.length === 0) return opportunities;

      // Find top emission sources (Scope 3 usually highest)
      const scope3Data = emissionsData.filter((d: any) => d.metrics_catalog?.scope === 3);

      if (scope3Data.length > 0) {
        const topSource = scope3Data[0];
        const totalScope3 = scope3Data.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

        if (topSource.value > totalScope3 * 0.3) {
          // If single source is >30% of Scope 3
          opportunities.push({
            organization_id: orgId,
            type: 'emission_hotspot',
            title: 'High-Impact Emission Source Identified',
            description: `${topSource.metrics_catalog?.name} accounts for ${((topSource.value / totalScope3) * 100).toFixed(1)}% of Scope 3 emissions. Consider supplier optimization or alternative materials.`,
            potential_savings: topSource.value * 25, // Estimated carbon offset cost
            potential_emission_reduction: topSource.value * 0.2, // 20% reduction potential
            confidence_score: 0.8,
            priority: 'high',
            implementation_effort: 'medium',
            data_source: { source: topSource.metrics_catalog?.name, value: topSource.value },
          });
        }
      }

    } catch (error) {
      console.error('     ⚠️  Emission hotspot analysis failed:', error);
    }

    return opportunities;
  }

  private async findWaterInefficiencies(orgId: string): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    try {
      // Get water usage data
      const { data: waterData } = await supabase
        .from('metrics_data')
        .select('*, metrics_catalog!inner(*)')
        .eq('organization_id', orgId)
        .or('metrics_catalog.name.ilike.%water%,metrics_catalog.name.ilike.%wastewater%')
        .order('period_start', { ascending: false })
        .limit(20);

      if (!waterData || waterData.length < 2) return opportunities;

      // Check for increasing water usage trend
      const latest = waterData[0];
      const average = waterData.slice(1, 6).reduce((sum: number, d: any) => sum + d.value, 0) / 5;

      if (latest.value > average * 1.15) {
        opportunities.push({
          organization_id: orgId,
          type: 'water_inefficiency',
          title: 'Water Consumption Above Average',
          description: `Current water usage is ${((latest.value / average - 1) * 100).toFixed(1)}% above 5-month average. Check for leaks or inefficient processes.`,
          potential_savings: (latest.value - average) * 0.005, // $0.005 per gallon
          potential_emission_reduction: 0,
          confidence_score: 0.7,
          priority: 'medium',
          implementation_effort: 'low',
          data_source: { current: latest.value, average },
        });
      }

    } catch (error) {
      console.error('     ⚠️  Water inefficiency analysis failed:', error);
    }

    return opportunities;
  }

  private async findCostReductions(orgId: string): Promise<OptimizationOpportunity[]> {
    const opportunities: OptimizationOpportunity[] = [];

    // Future: Analyze procurement data, energy contracts, waste management costs
    // For now, placeholder for cost optimization logic

    return opportunities;
  }

  private async saveOpportunities(opportunities: OptimizationOpportunity[]): Promise<void> {
    try {
      for (const opp of opportunities) {
        // Map to actual database schema
        const { data: savedOpp } = await supabase
          .from('optimization_opportunities')
          .insert({
            organization_id: opp.organization_id,
            area: opp.type, // type maps to area
            description: `${opp.title}\n\n${opp.description}`,
            improvement_potential: opp.potential_emission_reduction,
            estimated_savings: opp.potential_savings,
            complexity: opp.implementation_effort,
            confidence: opp.confidence_score,
            actions: opp.data_source,
            status: 'pending',
          })
          .select()
          .single();

        // Create agent task result for notification
        // Map priority to notification importance: high->high, medium->medium, low->low
        const importance = opp.priority === 'high' ? 'high' : opp.priority === 'medium' ? 'medium' : 'low';

        if (importance && savedOpp) {
          // Get organization admin for notification
          const { data: orgUsers } = await supabase
            .from('organization_members')
            .select('user_id')
            .eq('organization_id', opp.organization_id)
            .limit(1)
            .single();

          if (orgUsers) {
            await supabase.from('agent_task_results').insert({
              organization_id: opp.organization_id,
              agent_id: 'optimization_agent',
              task_type: 'optimization_opportunity',
              task_id: `opt_${savedOpp.id}`,
              priority: opp.priority,
              success: true,
              execution_time_ms: 0,
              result: {
                user_id: orgUsers.user_id,
                opportunity_id: savedOpp.id,
                area: opp.type,
                title: opp.title,
                message: `💡 ${opp.title}\n\n${opp.description}\n\n💰 Potential savings: $${opp.potential_savings.toFixed(2)}`,
                priority: opp.priority,
                potential_savings: opp.potential_savings,
                potential_emission_reduction: opp.potential_emission_reduction,
              },
              notification_importance: importance,
              notification_sent: false,
            });
          }
        }
      }
    } catch (error) {
      console.error('     ⚠️  Failed to save opportunities:', error);
    }
  }

  resetStats(): void {
    this.stats = {
      opportunitiesFound: 0,
      potentialSavings: 0,
      opportunitiesApplied: 0,
      actualSavings: 0,
      errors: 0,
      lastRunAt: null,
      lastRunDuration: null,
    };
  }
}
