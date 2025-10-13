/**
 * Smart Recommendation Engine
 *
 * Provides context-aware initiative recommendations based on:
 * - Grid renewable mix (Electricity Maps API)
 * - Building profile and consumption patterns
 * - Industry benchmarks
 * - Historical data trends
 */

import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface Recommendation {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  potentialReduction: number; // tCO2e
  potentialReductionPercent: number; // % of target
  capex?: number; // One-time investment
  annualOpex?: number; // Ongoing costs
  annualSavings?: number; // Cost savings
  paybackYears?: number;
  examples: string[];
  shouldNotRecommendIf?: string[];
  dataSource?: string;
}

export interface MetricContext {
  metricId: string;
  metricCode: string;
  metricName: string;
  scope: string;
  currentAnnualEmissions: number; // tCO2e
  targetReduction: number; // tCO2e
  reductionPercent: number; // %
}

export interface OrganizationContext {
  id: string;
  name: string;
  industry: string;
  squareFeet?: number;
  location?: {
    lat: number;
    lon: number;
    country: string;
  };
  employees?: number;
}

export class SmartRecommendationEngine {

  /**
   * Get contextual recommendations for a specific metric
   */
  static async getRecommendations(
    orgContext: OrganizationContext,
    metricContext: MetricContext
  ): Promise<Recommendation[]> {

    // Route to specific recommendation logic based on metric
    switch (metricContext.metricCode) {
      case 'purchased-electricity':
      case 'electricity-consumption':
        return this.getElectricityRecommendations(orgContext, metricContext);

      case 'natural-gas':
      case 'heating':
      case 'natural-gas-heating':
        return this.getHeatingRecommendations(orgContext, metricContext);

      case 'business-travel':
      case 'employee-commuting':
        return this.getTravelRecommendations(orgContext, metricContext);

      case 'waste':
        return this.getWasteRecommendations(orgContext, metricContext);

      default:
        return this.getGenericRecommendations(orgContext, metricContext);
    }
  }

  /**
   * Electricity-specific recommendations
   */
  private static async getElectricityRecommendations(
    org: OrganizationContext,
    metric: MetricContext
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Get grid renewable percentage (from Electricity Maps or estimate)
    const gridRenewable = await this.getGridRenewablePercentage(org.location);

    // Calculate consumption metrics
    const annualConsumptionKWh = metric.currentAnnualEmissions / 0.0004; // Rough conversion from tCO2e
    const consumptionPerSqft = org.squareFeet
      ? annualConsumptionKWh / org.squareFeet
      : null;

    // Get industry benchmark
    const industryBenchmark = this.getIndustryBenchmark(org.industry, 'electricity');

    // 1. RENEWABLE ENERGY PROCUREMENT
    if (gridRenewable < 80) {
      const renewablePotential = metric.currentAnnualEmissions * ((100 - gridRenewable) / 100);

      recommendations.push({
        id: 'renewable-procurement',
        category: 'Renewable Energy Procurement',
        priority: 'high',
        reasoning: `Your grid is currently ${gridRenewable.toFixed(0)}% renewable. Switching to a 100% renewable energy contract could eliminate ${(100 - gridRenewable).toFixed(0)}% of your electricity emissions.`,
        potentialReduction: renewablePotential,
        potentialReductionPercent: (renewablePotential / metric.targetReduction) * 100,
        capex: 0,
        annualOpex: annualConsumptionKWh * 0.02, // ~$0.02/kWh premium for green energy
        annualSavings: 0,
        examples: [
          'Purchase Renewable Energy Certificates (RECs)',
          'Switch to green energy tariff from your utility',
          'Sign a Power Purchase Agreement (PPA) with a solar or wind farm',
          'Join a community renewable energy program'
        ],
        dataSource: `Grid mix data: ${gridRenewable.toFixed(0)}% renewable`,
        shouldNotRecommendIf: [
          'Already purchasing 100% renewable energy',
          'Grid is >90% renewable'
        ]
      });
    } else {
      // Grid already clean - focus on generation
      recommendations.push({
        id: 'onsite-generation',
        category: 'On-site Renewable Generation',
        priority: 'medium',
        reasoning: `Your grid is already ${gridRenewable.toFixed(0)}% renewable. Focus on generating your own clean power to reduce overall consumption and costs.`,
        potentialReduction: metric.currentAnnualEmissions * 0.15, // Typical solar offset
        potentialReductionPercent: 15,
        capex: org.squareFeet ? org.squareFeet * 10 : 100000, // ~$10/sqft for solar
        annualSavings: annualConsumptionKWh * 0.15 * 0.12, // 15% offset at $0.12/kWh
        paybackYears: 6,
        examples: [
          'Install rooftop solar panels',
          'Battery storage system for load shifting',
          'Small wind turbines (if suitable location)',
          'Community solar subscription'
        ],
        dataSource: `Grid mix data: ${gridRenewable.toFixed(0)}% renewable`
      });
    }

    // 2. ENERGY EFFICIENCY
    if (consumptionPerSqft && industryBenchmark && consumptionPerSqft > industryBenchmark * 1.15) {
      const efficiencyGap = ((consumptionPerSqft / industryBenchmark) - 1) * 100;
      const efficiencyPotential = metric.currentAnnualEmissions * 0.25; // Up to 25% reduction possible

      recommendations.push({
        id: 'energy-efficiency',
        category: 'Energy Efficiency Improvements',
        priority: 'high',
        reasoning: `Your electricity consumption (${consumptionPerSqft.toFixed(1)} kWh/sqft) is ${efficiencyGap.toFixed(0)}% higher than the ${org.industry} industry average. Significant efficiency gains are possible.`,
        potentialReduction: efficiencyPotential,
        potentialReductionPercent: (efficiencyPotential / metric.targetReduction) * 100,
        capex: org.squareFeet ? org.squareFeet * 15 : 150000, // ~$15/sqft for comprehensive upgrade
        annualSavings: annualConsumptionKWh * 0.25 * 0.12, // 25% savings at $0.12/kWh
        paybackYears: 3.5,
        examples: [
          'Complete LED lighting retrofit throughout facility',
          'HVAC system upgrade with high-efficiency models',
          'Install Building Management System (BMS) for smart controls',
          'Improve insulation and seal air leaks',
          'Upgrade to ENERGY STAR certified equipment'
        ],
        dataSource: `Consumption: ${consumptionPerSqft.toFixed(1)} kWh/sqft vs industry avg: ${industryBenchmark.toFixed(1)} kWh/sqft`,
        shouldNotRecommendIf: [
          'Recent major efficiency upgrades completed',
          'Already below industry average consumption'
        ]
      });
    } else if (consumptionPerSqft && industryBenchmark) {
      // Already efficient - suggest operational improvements
      recommendations.push({
        id: 'operational-efficiency',
        category: 'Operational & Behavioral Improvements',
        priority: 'medium',
        reasoning: `Your electricity consumption is already efficient compared to industry peers. Focus on low-cost operational improvements.`,
        potentialReduction: metric.currentAnnualEmissions * 0.08, // 5-10% possible
        potentialReductionPercent: 8,
        capex: 5000, // Training and sensors
        annualSavings: annualConsumptionKWh * 0.08 * 0.12,
        paybackYears: 0.5,
        examples: [
          'Employee energy awareness training program',
          'Optimize HVAC schedules based on occupancy',
          'Implement computer power management policies',
          'Motion sensors for lighting in low-traffic areas',
          'Regular equipment maintenance schedules'
        ],
        dataSource: `Already efficient: ${consumptionPerSqft.toFixed(1)} kWh/sqft vs industry avg: ${industryBenchmark.toFixed(1)} kWh/sqft`
      });
    }

    // 3. DEMAND MANAGEMENT (for all electricity users)
    const demandPotential = metric.currentAnnualEmissions * 0.12;
    recommendations.push({
      id: 'demand-management',
      category: 'Load Shifting & Peak Demand Management',
      priority: 'medium',
      reasoning: `Shifting electricity use to off-peak hours reduces emissions (grid is cleaner) and costs (lower rates).`,
      potentialReduction: demandPotential,
      potentialReductionPercent: (demandPotential / metric.targetReduction) * 100,
      capex: 50000, // Battery storage system
      annualSavings: annualConsumptionKWh * 0.08 * 0.05, // Avoid peak pricing differential
      paybackYears: 5,
      examples: [
        'Battery storage for peak shaving and load shifting',
        'Shift heavy equipment operation to off-peak hours',
        'Time-of-use rate optimization',
        'Smart charging for electric vehicles (if applicable)',
        'Demand response program participation'
      ]
    });

    // Sort by ROI (reduction per dollar invested)
    return recommendations.sort((a, b) => {
      const roiA = a.potentialReduction / (a.capex || 1);
      const roiB = b.potentialReduction / (b.capex || 1);
      return roiB - roiA;
    });
  }

  /**
   * Heating-specific recommendations
   */
  private static async getHeatingRecommendations(
    org: OrganizationContext,
    metric: MetricContext
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // Climate zone matters for heating
    const climateZone = this.getClimateZone(org.location);

    recommendations.push({
      id: 'heat-pump',
      category: 'Electrification',
      priority: 'high',
      reasoning: `Heat pumps are 3-4x more efficient than gas heating and eliminate direct fossil fuel combustion.`,
      potentialReduction: metric.currentAnnualEmissions * 0.70, // Can eliminate 70%+ of gas heating
      potentialReductionPercent: 70,
      capex: org.squareFeet ? org.squareFeet * 12 : 120000,
      annualSavings: metric.currentAnnualEmissions * 50, // $50/tCO2e savings typical
      paybackYears: 7,
      examples: [
        'Replace gas furnaces with air-source heat pumps',
        'Install ground-source (geothermal) heat pumps',
        'Hybrid heat pump system (backup gas for extreme cold)',
        'Heat pump water heaters'
      ],
      dataSource: `Climate zone: ${climateZone}`
    });

    recommendations.push({
      id: 'insulation',
      category: 'Building Envelope Improvements',
      priority: 'high',
      reasoning: `Reducing heat loss is the most cost-effective way to reduce heating emissions.`,
      potentialReduction: metric.currentAnnualEmissions * 0.30,
      potentialReductionPercent: 30,
      capex: org.squareFeet ? org.squareFeet * 5 : 50000,
      annualSavings: metric.currentAnnualEmissions * 60,
      paybackYears: 3,
      examples: [
        'Add or upgrade insulation in walls, roof, and floors',
        'Seal air leaks around windows and doors',
        'Upgrade to high-performance windows',
        'Install weather stripping',
        'Insulate heating pipes and ducts'
      ]
    });

    return recommendations;
  }

  /**
   * Travel-specific recommendations
   */
  private static async getTravelRecommendations(
    org: OrganizationContext,
    metric: MetricContext
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    const employeeCount = org.employees || 50;
    const emissionsPerEmployee = metric.currentAnnualEmissions / employeeCount;

    recommendations.push({
      id: 'travel-policy',
      category: 'Travel Policy & Virtual Alternatives',
      priority: 'high',
      reasoning: `${emissionsPerEmployee.toFixed(2)} tCO2e per employee from business travel. Policy changes can reduce by 30-50% with no capital investment.`,
      potentialReduction: metric.currentAnnualEmissions * 0.40,
      potentialReductionPercent: 40,
      capex: 0,
      annualOpex: 20000, // Video conferencing tools
      examples: [
        'Implement "virtual first" meeting policy',
        'Eliminate short-haul flights under 3 hours',
        'Require sustainability approval for international flights',
        'Upgrade video conferencing capabilities',
        'Set annual flight budgets per department'
      ],
      dataSource: `${emissionsPerEmployee.toFixed(2)} tCO2e per employee`
    });

    recommendations.push({
      id: 'ev-fleet',
      category: 'Fleet Electrification',
      priority: 'medium',
      reasoning: `Switching company vehicles to electric reduces emissions by 60-70% per vehicle.`,
      potentialReduction: metric.currentAnnualEmissions * 0.25,
      potentialReductionPercent: 25,
      capex: 35000, // Per EV (difference from ICE vehicle)
      annualSavings: 2000, // Per vehicle fuel savings
      paybackYears: 5,
      examples: [
        'Replace fleet vehicles with EVs as leases expire',
        'Install EV charging stations at office',
        'EV car-sharing program for employee use',
        'Electric vehicles for delivery/service routes'
      ]
    });

    return recommendations;
  }

  /**
   * Waste-specific recommendations
   */
  private static async getWasteRecommendations(
    org: OrganizationContext,
    metric: MetricContext
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    recommendations.push({
      id: 'waste-diversion',
      category: 'Waste Reduction & Diversion',
      priority: 'high',
      reasoning: `Diverting waste from landfills eliminates methane emissions and reduces disposal costs.`,
      potentialReduction: metric.currentAnnualEmissions * 0.60,
      potentialReductionPercent: 60,
      capex: 15000, // Bins, signage, initial setup
      annualSavings: metric.currentAnnualEmissions * 40, // Lower disposal fees
      paybackYears: 1,
      examples: [
        'Comprehensive recycling program (paper, plastic, metal, glass)',
        'Organic waste composting program',
        'Single-stream recycling for simplicity',
        'Partner with food rescue organization for excess food',
        'E-waste recycling program'
      ]
    });

    return recommendations;
  }

  /**
   * Generic recommendations for any metric
   */
  private static async getGenericRecommendations(
    org: OrganizationContext,
    metric: MetricContext
  ): Promise<Recommendation[]> {
    return [{
      id: 'generic',
      category: 'General Reduction Strategies',
      priority: 'medium',
      reasoning: `Focus on reducing consumption and switching to lower-carbon alternatives for ${metric.metricName}.`,
      potentialReduction: metric.targetReduction * 0.5,
      potentialReductionPercent: 50,
      examples: [
        'Conduct detailed audit of current usage',
        'Identify and eliminate waste',
        'Switch to lower-carbon alternatives',
        'Engage employees in reduction efforts',
        'Monitor and measure progress regularly'
      ]
    }];
  }

  /**
   * Get grid renewable percentage (stub - will integrate with Electricity Maps API)
   */
  private static async getGridRenewablePercentage(
    location?: { lat: number; lon: number; country: string }
  ): Promise<number> {
    // TODO: Integrate with Electricity Maps API
    // For now, return country averages
    if (!location) return 30; // Global average

    const countryAverages: Record<string, number> = {
      'US': 40,
      'GB': 45,
      'DE': 50,
      'FR': 75, // High due to nuclear
      'NO': 98, // Almost all hydro
      'IS': 100, // 100% renewable
      'CN': 30,
      'IN': 25,
      'BR': 85, // High due to hydro
      'ES': 50,
      'IT': 40,
    };

    return countryAverages[location.country] || 35;
  }

  /**
   * Get industry benchmark for consumption
   */
  private static getIndustryBenchmark(
    industry: string,
    metricType: string
  ): number | null {
    // Electricity consumption benchmarks (kWh/sqft/year)
    const electricityBenchmarks: Record<string, number> = {
      'retail': 13.5,
      'office': 15.2,
      'warehouse': 6.4,
      'manufacturing': 25.0,
      'healthcare': 30.5,
      'hospitality': 28.0,
      'education': 12.8,
      'multifamily': 8.5,
      'restaurant': 55.0
    };

    if (metricType === 'electricity') {
      const normalizedIndustry = industry.toLowerCase();
      return electricityBenchmarks[normalizedIndustry] || null;
    }

    return null;
  }

  /**
   * Get climate zone
   */
  private static getClimateZone(
    location?: { lat: number; lon: number; country: string }
  ): string {
    if (!location) return 'temperate';

    const absLat = Math.abs(location.lat);
    if (absLat > 60) return 'polar';
    if (absLat > 45) return 'cold';
    if (absLat > 30) return 'temperate';
    return 'tropical';
  }
}
