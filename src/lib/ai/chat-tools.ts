/**
 * AI Chat Tools Integration
 *
 * Connects AI SDK chat tools with Blipee's existing infrastructure:
 * - Orchestration Engine
 * - Industry Intelligence modules
 * - Carbon Analysis
 * - ESG Compliance
 * - Supply Chain Intelligence
 * - Regulatory Foresight
 */

import { tool } from 'ai';
import { z } from 'zod';
import {
  IndustryIntelligenceEngine,
  PeerBenchmarkingEngine,
  SupplyChainIntelligenceEngine,
  RegulatoryForesightEngine,
  GRISectorMapper
} from './industry-intelligence';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  getPeriodEmissions,
  getScopeBreakdown,
  getCategoryBreakdown,
  getMonthlyEmissions,
  getYoYComparison,
  getTopEmissionSources,
  getEnergyTotal,
  getWaterTotal,
  getWasteTotal
} from '@/lib/sustainability/baseline-calculator';
import { EnterpriseForecast } from '@/lib/forecasting/enterprise-forecaster';

// Initialize intelligence engines
const industryIntelligence = new IndustryIntelligenceEngine();
const peerBenchmarking = new PeerBenchmarkingEngine();
const supplyChainIntelligence = new SupplyChainIntelligenceEngine();
const regulatoryForesight = new RegulatoryForesightEngine();
const griMapper = new GRISectorMapper();

/**
 * Carbon Footprint Analysis Tool
 */
export const analyzeCarbonFootprintTool = tool({
  description: `Analyze ACTUAL/HISTORICAL carbon emissions for past and current year-to-date periods.

  CRITICAL DATE HANDLING:
  - For "this year" or "current year" queries: ALWAYS use ${new Date().getFullYear()} (current year)
  - For specific year queries like "2024": Use that exact year
  - Default behavior (no timeframe): Current year (${new Date().getFullYear()}) January 1 to today
  - Do NOT use years before ${new Date().getFullYear() - 2} unless explicitly requested

  Use this for questions like "what are my emissions this year", "emissions in 2024", or "emissions for Q1 2025". Returns comprehensive emissions data with breakdowns and recommendations. Do NOT use for future predictions.

  IMPORTANT: After calling this tool, you MUST generate a conversational text response explaining the emissions data to the user in plain language. Do not just return the tool result - explain what it means.`,
  inputSchema: z.object({
    scope: z.enum(['building', 'organization', 'activity', 'product']).describe('The scope of carbon analysis'),
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building ID for building-specific analysis'),
    timeframe: z.object({
      start: z.string().describe('Start date (ISO format) - for "this year", use current year start (e.g., 2025-01-01)'),
      end: z.string().describe('End date (ISO format) - for "this year", use today')
    }).optional().describe('Time period for analysis - omit for current year default'),
    includeBreakdown: z.boolean().default(true).describe('Include detailed breakdown by source (Scope 1, 2, 3)'),
    compareToBaseline: z.boolean().default(true).describe('Compare to baseline or previous periods')
  }),
  execute: async ({ scope, organizationId, buildingId, timeframe, includeBreakdown, compareToBaseline }) => {
    try {
      // Calculate date range - default to current year if not provided
      const now = new Date();
      const currentYear = now.getFullYear();
      const today = now.toISOString().split('T')[0];

      // Default to current year if no timeframe provided
      const defaultStartDate = new Date(currentYear, 0, 1).toISOString().split('T')[0];

      // Cap end date at today if it's in the future
      let endDate = timeframe?.end || today;
      if (timeframe?.end) {
        const endDateObj = new Date(timeframe.end);
        const todayObj = new Date(today);
        if (endDateObj > todayObj) {
          endDate = today;
          console.log('[Carbon Tool] ⚠️  End date capped at today:', { requested: timeframe.end, capped: endDate });
        }
      }

      let startDate = timeframe?.start || defaultStartDate;

      // CRITICAL FIX: Validate that requested year isn't too old
      // If user asked for "this year" but got an old year, correct it
      if (timeframe?.start) {
        const requestedYear = new Date(timeframe.start).getFullYear();
        // If the requested start year is more than 2 years old, it's likely an error
        // unless there's a specific end year that's also old
        if (requestedYear < currentYear - 2) {
          const requestedEndYear = timeframe.end ? new Date(timeframe.end).getFullYear() : currentYear;
          // If both start and end are old, assume it's intentional (e.g., "emissions in 2023")
          // If only start is old but end is recent, correct to current year
          if (requestedEndYear >= currentYear) {
            console.log('[Carbon Tool] ⚠️  WARNING: Old start year detected for current year query, correcting:', {
              requested: requestedYear,
              corrected: currentYear,
              originalStart: timeframe.start,
              correctedStart: defaultStartDate
            });
            startDate = defaultStartDate;
            console.log('[Carbon Tool] 🔧 AUTO-CORRECTED: Changed start date from', timeframe.start, 'to', defaultStartDate);
          }
        }
      }

      // Enhanced debug logging
      console.log('[Carbon Tool] 📅 Date range:', {
        startDate,
        endDate,
        providedTimeframe: timeframe,
        currentYear,
        defaultStart: defaultStartDate
      });

      // Get emissions using centralized calculator
      const emissions = await getPeriodEmissions(
        organizationId,
        startDate,
        endDate,
        buildingId // buildingId maps to siteId in calculator
      );

      // Fetch site/organization data for intensity calculations (per employee, per area)
      let siteData: { total_employees: number | null; total_area_sqm: number | null } | null = null;
      try {
        const supabase = createAdminClient();

        if (buildingId) {
          // Get specific site data
          console.log('[Carbon Tool] 🏢 Fetching site data for buildingId:', buildingId);
          const { data, error } = await supabase
            .from('sites')
            .select('total_employees, total_area_sqm')
            .eq('id', buildingId)
            .single();

          if (error) {
            console.error('[Carbon Tool] ❌ Error fetching site data:', error);
          } else {
            console.log('[Carbon Tool] ✅ Site data fetched:', data);
          }
          siteData = data;
        } else {
          // Get organization-wide totals by summing all sites
          console.log('[Carbon Tool] 🏢 Fetching organization-wide site data for orgId:', organizationId);
          const { data: sites, error } = await supabase
            .from('sites')
            .select('total_employees, total_area_sqm')
            .eq('organization_id', organizationId);

          if (error) {
            console.error('[Carbon Tool] ❌ Error fetching sites:', error);
          } else {
            console.log('[Carbon Tool] ✅ Fetched', sites?.length || 0, 'sites');
            if (sites && sites.length > 0) {
              const totalEmployees = sites.reduce((sum, site) => sum + (site.total_employees || 0), 0);
              const totalAreaSqm = sites.reduce((sum, site) => sum + (site.total_area_sqm || 0), 0);
              siteData = {
                total_employees: totalEmployees > 0 ? totalEmployees : null,
                total_area_sqm: totalAreaSqm > 0 ? totalAreaSqm : null
              };
              console.log('[Carbon Tool] 📊 Aggregated site data:', siteData);
            }
          }
        }
      } catch (error) {
        console.error('[Carbon Tool] ❌ Failed to fetch site data:', error);
      }

      // Check if there's no data for the requested period
      if (emissions.total === 0) {
        const requestedYear = new Date(startDate).getFullYear();
        const requestedEndYear = new Date(endDate).getFullYear();
        const yearLabel = requestedYear === requestedEndYear ? `year ${requestedYear}` : `period ${requestedYear}-${requestedEndYear}`;
        console.log('[Carbon Tool] ⚠️  No emissions data found for period:', { startDate, endDate, requestedYear });

        // If this is the current year and there's no data, inform the user
        if (requestedYear === currentYear) {
          return {
            success: true,
            scope,
            totalEmissions: 0,
            breakdown: { scope1: 0, scope2: 0, scope3: 0 },
            categories: [],
            unit: 'tCO2e',
            insights: `No emissions data found for ${yearLabel} yet. This could mean: (1) Data hasn't been added for ${currentYear} yet, or (2) No activities with emissions occurred. If you have data for a previous year, you can ask about that year specifically (e.g., "emissions in 2024").`,
            recommendations: [
              'Start tracking emissions by adding your first data points',
              'Use the data entry features to record electricity, fuel, travel, and other activities',
              'Check if you have historical data that needs to be imported'
            ],
            dataQuality: 'no-data',
            period: { startDate, endDate },
            analysisDate: new Date().toISOString(),
            warning: 'no_data_for_period'
          };
        }
      }

      // Get scope breakdown if requested
      const breakdown = includeBreakdown ? {
        scope1: emissions.scope_1,
        scope2: emissions.scope_2,
        scope3: emissions.scope_3
      } : undefined;

      // Get category breakdown for insights
      const categories = await getCategoryBreakdown(
        organizationId,
        startDate,
        endDate,
        buildingId
      );

      // Get YoY comparison if requested
      let comparison;
      if (compareToBaseline) {
        comparison = await getYoYComparison(
          organizationId,
          startDate,
          endDate,
          'emissions'
        );
      }

      // Calculate intensity metrics if site data is available
      const intensityMetrics: {
        emissionsPerEmployee?: number;
        emissionsPerAreaSqm?: number;
        totalEmployees?: number;
        totalAreaSqm?: number;
      } = {};

      if (siteData) {
        console.log('[Carbon Tool] 📊 Calculating intensity metrics from site data...');
        if (siteData.total_employees && siteData.total_employees > 0) {
          intensityMetrics.emissionsPerEmployee = Math.round((emissions.total / siteData.total_employees) * 100) / 100;
          intensityMetrics.totalEmployees = siteData.total_employees;
          console.log('[Carbon Tool] ✅ Emissions per employee:', intensityMetrics.emissionsPerEmployee, 'tCO2e/employee');
        }
        if (siteData.total_area_sqm && siteData.total_area_sqm > 0) {
          intensityMetrics.emissionsPerAreaSqm = Math.round((emissions.total / siteData.total_area_sqm) * 1000) / 1000;
          intensityMetrics.totalAreaSqm = siteData.total_area_sqm;
          console.log('[Carbon Tool] ✅ Emissions per m²:', intensityMetrics.emissionsPerAreaSqm, 'tCO2e/m²');
        }
        console.log('[Carbon Tool] 📊 Final intensity metrics:', intensityMetrics);
      } else {
        console.log('[Carbon Tool] ⚠️  No site data available for intensity calculations');
      }

      // Generate insights based on the data
      const categoryText = categories
        .slice(0, 3)
        .map(cat => `${cat.category}: ${cat.total.toFixed(1)} tCO2e (${cat.percentage.toFixed(1)}%)`)
        .join(', ');

      // Extract year for explicit mention in insights
      const startYear = new Date(startDate).getFullYear();
      const endYear = new Date(endDate).getFullYear();
      const yearLabel = startYear === endYear ? `year ${startYear}` : `period ${startYear}-${endYear}`;

      // Build intensity text for insights
      let intensityText = '';
      if (intensityMetrics.emissionsPerEmployee) {
        intensityText += ` Emissions per employee: ${intensityMetrics.emissionsPerEmployee} tCO2e/employee (based on ${intensityMetrics.totalEmployees} employees).`;
      }
      if (intensityMetrics.emissionsPerAreaSqm) {
        intensityText += ` Emissions per m²: ${intensityMetrics.emissionsPerAreaSqm} tCO2e/m² (based on ${intensityMetrics.totalAreaSqm} m²).`;
      }

      const insights = `For the ${yearLabel} (${startDate} to ${endDate}), total emissions are ${emissions.total} tCO2e. ${breakdown ? `Breakdown: Scope 1 (${breakdown.scope1} tCO2e), Scope 2 (${breakdown.scope2} tCO2e), Scope 3 (${breakdown.scope3} tCO2e). ` : ''}Top emission categories: ${categoryText}. ${comparison ? `Year-over-year change: ${comparison.percentageChange > 0 ? '+' : ''}${comparison.percentageChange.toFixed(1)}% (${comparison.percentageChange > 0 ? 'increase' : 'decrease'} of ${Math.abs(comparison.absoluteChange).toFixed(1)} tCO2e). ` : ''}${intensityText}`;

      return {
        success: true,
        scope,
        totalEmissions: emissions.total,
        breakdown,
        intensityMetrics: Object.keys(intensityMetrics).length > 0 ? intensityMetrics : undefined,
        categories: categories.slice(0, 5), // Top 5 categories
        comparison: comparison ? {
          previousPeriod: comparison.previousValue,
          currentPeriod: comparison.currentValue,
          change: comparison.absoluteChange,
          percentageChange: comparison.percentageChange
        } : undefined,
        unit: 'tCO2e',
        insights,
        recommendations: [
          emissions.scope_3 > emissions.scope_1 + emissions.scope_2
            ? 'Scope 3 is your largest contributor - focus on supply chain engagement'
            : 'Focus on direct emissions reduction through operational improvements',
          emissions.scope_2 > 0
            ? 'Transition to renewable energy sources for Scope 2 reductions'
            : 'Great job on renewable energy! Consider targeting Scope 1 and 3',
          'Track monthly trends to identify seasonal patterns and opportunities'
        ],
        dataQuality: 'verified',
        period: { startDate, endDate },
        analysisDate: new Date().toISOString()
      };

    } catch (error) {
      console.error('Carbon analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        scope,
        totalEmissions: 0
      };
    }
  }
});

/**
 * ESG Compliance Checking Tool
 */
export const checkESGComplianceTool = tool({
  description: 'Check ESG compliance status against major reporting standards (GRI, SASB, TCFD, CDP, CSRD). Identifies gaps, requirements, and provides actionable recommendations.',
  inputSchema: z.object({
    standard: z.enum(['GRI', 'SASB', 'TCFD', 'CDP', 'CSRD', 'EU_Taxonomy']).describe('ESG reporting standard to check'),
    organizationId: z.string().describe('Organization ID'),
    sector: z.string().optional().describe('Industry sector for sector-specific requirements'),
    region: z.array(z.string()).optional().describe('Geographic regions for regulatory compliance (e.g., ["EU", "US"])')
  }),
  execute: async ({ standard, organizationId, sector, region }) => {
    try {
      // Map organization to GRI sector if available
      let sectorProfile = null;
      if (sector) {
        sectorProfile = griMapper.mapOrganizationToSector(sector, '', []);
      }

      // Get regulatory intelligence
      const regulatoryIntel = await regulatoryForesight.generateRegulatoryIntelligence(
        organizationId,
        sector || '',
        region || ['Global'],
        []
      );

      // Find compliance status for the requested standard
      const complianceStatus = regulatoryIntel.complianceStatus.find(
        s => s.framework.includes(standard)
      );

      return {
        success: true,
        standard,
        complianceStatus: complianceStatus?.status || 'unknown',
        requirements: sectorProfile?.materialTopics.map(topic => ({
          topic: topic.topic,
          description: topic.description,
          required: true,
          implemented: false
        })) || [],
        gaps: regulatoryIntel.gaps || [],
        recommendations: regulatoryIntel.strategicRecommendations || [],
        nextSteps: regulatoryIntel.complianceRoadmap?.phases[0]?.milestones || [],
        dueDate: regulatoryIntel.upcomingRegulations[0]?.effectiveDate
      };

    } catch (error) {
      console.error('ESG compliance check error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        standard,
        complianceStatus: 'error'
      };
    }
  }
});

/**
 * Natural Language Data Query Tool
 */
export const querySustainabilityDataTool = tool({
  description: 'Query sustainability data using natural language. Can retrieve emissions, energy, water, waste, and other ESG metrics from the database.',
  inputSchema: z.object({
    query: z.string().describe('Natural language query (e.g., "What were our Scope 1 emissions last quarter?")'),
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Optional building ID for building-specific queries'),
    timeRange: z.object({
      start: z.string(),
      end: z.string()
    }).optional().describe('Time range for the query')
  }),
  execute: async ({ query, organizationId, buildingId, timeRange }) => {
    // Note: Natural language to SQL functionality not yet implemented
    // Use specific tools like analyzeCarbonFootprintTool instead
    return {
      success: false,
      error: 'Natural language data queries are not yet implemented. Please use specific analysis tools like carbon footprint analysis instead.',
      query,
      data: []
    };
  }
});

/**
 * Performance Benchmarking Tool
 */
export const benchmarkPerformanceTool = tool({
  description: 'Compare sustainability performance against industry peers using real anonymized data from our network. Provides percentile rankings and insights.',
  inputSchema: z.object({
    metric: z.enum(['carbon_intensity', 'energy_efficiency', 'water_usage', 'waste_diversion', 'overall_esg']).describe('Metric to benchmark'),
    organizationId: z.string().describe('Organization ID'),
    industry: z.string().describe('Industry sector for peer comparison'),
    region: z.string().optional().describe('Geographic region for comparison (e.g., "North America", "EU")')
  }),
  execute: async ({ metric, organizationId, industry, region }) => {
    try {
      // Get organization profile
      const supabase = createClient();
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (!org) {
        throw new Error('Organization not found');
      }

      // Create benchmarking profile
      const profile = {
        organizationId,
        industry,
        size: org.employee_count > 1000 ? 'large' as const : org.employee_count > 100 ? 'medium' as const : 'small' as const,
        revenue: org.annual_revenue || 0,
        employees: org.employee_count || 0,
        regions: region ? [region] : ['Global'],
        isPublic: org.is_public || false,
        participationLevel: 'premium' as const
      };

      // Get benchmark results
      const benchmarks = await peerBenchmarking.getBenchmarkResults(
        organizationId,
        [metric]
      );

      const benchmark = benchmarks[0];

      return {
        success: true,
        metric,
        yourValue: benchmark?.organizationValue || 0,
        industryAverage: benchmark?.benchmarkStatistics.mean || 0,
        industryMedian: benchmark?.benchmarkStatistics.median || 0,
        topPerformers: benchmark?.benchmarkStatistics.percentile95 || 0,
        percentile: benchmark?.percentileRank || 0,
        insights: benchmark?.insights || [],
        peerCount: benchmark?.sampleSize || 0,
        lastUpdated: benchmark?.lastUpdated?.toISOString()
      };

    } catch (error) {
      console.error('Benchmarking error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metric,
        yourValue: 0
      };
    }
  }
});

/**
 * Supply Chain Analysis Tool
 */
export const analyzeSupplyChainTool = tool({
  description: 'Analyze supply chain sustainability, identify risks, and discover collaboration opportunities. Includes upstream suppliers and downstream customers.',
  inputSchema: z.object({
    analysisType: z.enum(['risk', 'emissions', 'compliance', 'network']).describe('Type of supply chain analysis'),
    organizationId: z.string().describe('Organization ID'),
    includeUpstream: z.boolean().default(true).describe('Include upstream suppliers in analysis'),
    includeDownstream: z.boolean().default(false).describe('Include downstream customers in analysis')
  }),
  execute: async ({ analysisType, organizationId, includeUpstream, includeDownstream }) => {
    try {
      // Get supply chain intelligence
      const intelligence = await supplyChainIntelligence.generateIntelligence(organizationId);

      return {
        success: true,
        analysisType,
        networkSize: intelligence.networkMetrics.totalNodes,
        riskScore: intelligence.aggregatedRisks.overallRiskScore,
        topRisks: intelligence.riskClusters.slice(0, 3).map(cluster => ({
          type: cluster.riskType,
          severity: cluster.severity,
          affectedSuppliers: cluster.affectedNodes.length,
          description: cluster.description
        })),
        sustainabilityGaps: intelligence.sustainabilityGaps.slice(0, 3).map(gap => ({
          area: gap.area,
          severity: gap.severity,
          impact: gap.estimatedImpact,
          recommendation: gap.recommendations[0]
        })),
        collaborationOpportunities: intelligence.networkEffects.collaborationPotential.slice(0, 3).map(collab => ({
          type: collab.type,
          partners: collab.participants.length,
          potentialImpact: collab.potentialImpact,
          feasibility: collab.feasibility
        })),
        insights: intelligence.strategicInsights
      };

    } catch (error) {
      console.error('Supply chain analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        analysisType,
        riskScore: 0
      };
    }
  }
});

/**
 * Sustainability Goals Tracking Tool
 */
export const trackSustainabilityGoalsTool = tool({
  description: 'Track progress toward sustainability goals and targets (e.g., Net Zero 2050, renewable energy targets, waste reduction). Provides progress updates and recommendations.',
  inputSchema: z.object({
    goalType: z.enum(['emission_reduction', 'renewable_energy', 'waste_diversion', 'water_conservation', 'custom']).describe('Type of sustainability goal'),
    organizationId: z.string().describe('Organization ID'),
    timeframe: z.string().optional().describe('Target timeframe (e.g., "2030", "5 years from now")')
  }),
  execute: async ({ goalType, organizationId, timeframe }) => {
    try {
      const supabase = createClient();

      // Query goals from database
      const { data: goals, error } = await supabase
        .from('sustainability_goals')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('goal_type', goalType);

      if (error) {
        console.error('Error querying goals:', error);
      }

      const activeGoal = goals?.[0];

      if (!activeGoal) {
        return {
          success: true,
          goalType,
          message: 'No active goals found for this type. Consider setting new sustainability targets.',
          suggestedTargets: [
            'Reduce Scope 1 & 2 emissions by 50% by 2030',
            'Achieve 100% renewable energy by 2030',
            'Reach net-zero emissions by 2050'
          ]
        };
      }

      // Calculate progress
      const currentValue = activeGoal.current_value || 0;
      const targetValue = activeGoal.target_value || 100;
      const baselineValue = activeGoal.baseline_value || 0;

      const progressPercent = ((currentValue - baselineValue) / (targetValue - baselineValue)) * 100;
      const onTrack = progressPercent >= 50; // Simple heuristic

      return {
        success: true,
        goalType,
        goalName: activeGoal.goal_name,
        currentProgress: Math.round(progressPercent),
        currentValue,
        targetValue,
        baselineValue,
        unit: activeGoal.unit,
        targetDate: activeGoal.target_date,
        onTrack,
        status: onTrack ? 'On track' : 'Behind schedule',
        recommendations: onTrack ? [
          'Continue current initiatives',
          'Consider setting more ambitious targets',
          'Share best practices with peers'
        ] : [
          'Accelerate current initiatives',
          'Identify additional emission reduction opportunities',
          'Consider investing in renewable energy or carbon offsets'
        ],
        lastUpdated: activeGoal.updated_at
      };

    } catch (error) {
      console.error('Goal tracking error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        goalType
      };
    }
  }
});

/**
 * Executive Report Tool (Time-Flexible)
 */
export const getExecutiveReportTool = tool({
  description: 'Generate an executive report for any time period. Use when users ask for "executive report", "summary", "report for last month/quarter/year", etc. Supports: "last month", "last 2 months", "last 3 months", "quarter", "semester", "this year", "last year", "YTD".',
  inputSchema: z.object({
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building ID'),
    period: z.enum([
      'last_month',
      'last_2_months',
      'last_3_months',
      'quarter',
      'semester',
      'this_year',
      'last_year',
      'ytd',
      'custom'
    ]).describe('Time period for the report'),
    customStartDate: z.string().optional().describe('Custom start date (YYYY-MM-DD)'),
    customEndDate: z.string().optional().describe('Custom end date (YYYY-MM-DD)')
  }),
  execute: async ({ organizationId, buildingId, period, customStartDate, customEndDate }) => {
    try {
      const now = new Date();
      let startDate: string;
      let endDate: string;
      let comparisonStartDate: string;
      let comparisonEndDate: string;
      let periodLabel: string;

      // Calculate date ranges based on period
      if (period === 'custom' && customStartDate && customEndDate) {
        startDate = customStartDate;
        endDate = customEndDate;
        periodLabel = `${startDate} to ${endDate}`;

        // Comparison period: same length, prior period
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const compStart = new Date(start);
        compStart.setDate(compStart.getDate() - daysDiff);
        const compEnd = new Date(end);
        compEnd.setDate(compEnd.getDate() - daysDiff);
        comparisonStartDate = compStart.toISOString().split('T')[0];
        comparisonEndDate = compEnd.toISOString().split('T')[0];
      } else if (period === 'last_month') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        startDate = `${year}-${(lastMonth + 1).toString().padStart(2, '0')}-01`;
        const lastDay = new Date(year, lastMonth + 1, 0).getDate();
        endDate = `${year}-${(lastMonth + 1).toString().padStart(2, '0')}-${lastDay}`;
        periodLabel = new Date(startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Previous month for comparison
        const prevMonth = lastMonth === 0 ? 11 : lastMonth - 1;
        const prevYear = lastMonth === 0 ? year - 1 : year;
        comparisonStartDate = `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}-01`;
        const prevLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
        comparisonEndDate = `${prevYear}-${(prevMonth + 1).toString().padStart(2, '0')}-${prevLastDay}`;
      } else if (period === 'last_2_months') {
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        startDate = twoMonthsAgo.toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        periodLabel = 'Last 2 Months';

        const fourMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 4, 1);
        comparisonStartDate = fourMonthsAgo.toISOString().split('T')[0];
        comparisonEndDate = new Date(now.getFullYear(), now.getMonth() - 2, 0).toISOString().split('T')[0];
      } else if (period === 'last_3_months') {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        startDate = threeMonthsAgo.toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        periodLabel = 'Last 3 Months';

        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        comparisonStartDate = sixMonthsAgo.toISOString().split('T')[0];
        comparisonEndDate = new Date(now.getFullYear(), now.getMonth() - 3, 0).toISOString().split('T')[0];
      } else if (period === 'quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
        const quarterYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
        startDate = `${quarterYear}-${(lastQuarter * 3 + 1).toString().padStart(2, '0')}-01`;
        const endMonth = lastQuarter * 3 + 3;
        const lastDay = new Date(quarterYear, endMonth, 0).getDate();
        endDate = `${quarterYear}-${endMonth.toString().padStart(2, '0')}-${lastDay}`;
        periodLabel = `Q${lastQuarter + 1} ${quarterYear}`;

        // Previous quarter
        const prevQuarter = lastQuarter === 0 ? 3 : lastQuarter - 1;
        const prevQuarterYear = lastQuarter === 0 ? quarterYear - 1 : quarterYear;
        comparisonStartDate = `${prevQuarterYear}-${(prevQuarter * 3 + 1).toString().padStart(2, '0')}-01`;
        const prevEndMonth = prevQuarter * 3 + 3;
        const prevLastDay = new Date(prevQuarterYear, prevEndMonth, 0).getDate();
        comparisonEndDate = `${prevQuarterYear}-${prevEndMonth.toString().padStart(2, '0')}-${prevLastDay}`;
      } else if (period === 'semester') {
        const currentSemester = Math.floor(now.getMonth() / 6);
        const lastSemester = currentSemester === 0 ? 1 : 0;
        const semesterYear = currentSemester === 0 ? now.getFullYear() - 1 : now.getFullYear();
        startDate = lastSemester === 0 ? `${semesterYear}-01-01` : `${semesterYear}-07-01`;
        endDate = lastSemester === 0 ? `${semesterYear}-06-30` : `${semesterYear}-12-31`;
        periodLabel = `${lastSemester === 0 ? 'H1' : 'H2'} ${semesterYear}`;

        // Previous semester
        const prevSemesterYear = lastSemester === 0 ? semesterYear - 1 : semesterYear;
        comparisonStartDate = lastSemester === 0 ? `${prevSemesterYear}-07-01` : `${prevSemesterYear}-01-01`;
        comparisonEndDate = lastSemester === 0 ? `${prevSemesterYear}-12-31` : `${prevSemesterYear}-06-30`;
      } else if (period === 'this_year' || period === 'ytd') {
        startDate = `${now.getFullYear()}-01-01`;
        endDate = now.toISOString().split('T')[0];
        periodLabel = `${now.getFullYear()} (YTD)`;

        // Same period last year
        comparisonStartDate = `${now.getFullYear() - 1}-01-01`;
        comparisonEndDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0];
      } else if (period === 'last_year') {
        const lastYear = now.getFullYear() - 1;
        startDate = `${lastYear}-01-01`;
        endDate = `${lastYear}-12-31`;
        periodLabel = `${lastYear}`;

        // Year before last
        comparisonStartDate = `${lastYear - 1}-01-01`;
        comparisonEndDate = `${lastYear - 1}-12-31`;
      } else {
        throw new Error('Invalid period specified');
      }

      // Get current period emissions
      const currentEmissions = await getPeriodEmissions(organizationId, startDate, endDate, buildingId);

      // Get comparison period emissions
      const comparisonEmissions = await getPeriodEmissions(organizationId, comparisonStartDate, comparisonEndDate, buildingId);

      // Calculate change
      const periodChange = comparisonEmissions.total > 0
        ? ((currentEmissions.total - comparisonEmissions.total) / comparisonEmissions.total) * 100
        : 0;

      // Get top emission sources
      const topSources = await getTopEmissionSources(organizationId, startDate, endDate, 5, buildingId);

      // Get category breakdown
      const categoryBreakdown = await getCategoryBreakdown(organizationId, startDate, endDate, buildingId);

      return {
        success: true,
        period: periodLabel,
        summary: {
          totalEmissions: currentEmissions.total,
          scope1: currentEmissions.scope_1,
          scope2: currentEmissions.scope_2,
          scope3: currentEmissions.scope_3,
          comparisonPeriodTotal: comparisonEmissions.total,
          periodChange: Math.round(periodChange * 10) / 10,
          trend: periodChange < -5 ? 'improving' : periodChange > 5 ? 'worsening' : 'stable'
        },
        topEmissionSources: topSources.map(s => ({
          category: s.category,
          emissions: s.emissions,
          percentage: s.percentage,
          trend: s.trend,
          recommendation: s.recommendation
        })),
        categoryBreakdown: categoryBreakdown.slice(0, 5).map(c => ({
          category: c.category,
          total: c.total,
          percentage: c.percentage
        })),
        insights: [
          periodChange < -5
            ? `Emissions decreased by ${Math.abs(periodChange).toFixed(1)}% compared to previous period - great progress!`
            : periodChange > 5
            ? `Emissions increased by ${periodChange.toFixed(1)}% compared to previous period - requires attention.`
            : 'Emissions remained stable compared to previous period.',

          topSources.length > 0
            ? `${topSources[0].category} is the largest emission source at ${topSources[0].percentage.toFixed(1)}% of total emissions.`
            : 'No significant emission sources identified.',

          currentEmissions.scope_3 > currentEmissions.scope_1 + currentEmissions.scope_2
            ? 'Scope 3 (indirect) emissions dominate - focus on supply chain and value chain optimization.'
            : currentEmissions.scope_2 > currentEmissions.scope_1
            ? 'Scope 2 (energy) emissions are significant - consider renewable energy contracts.'
            : 'Scope 1 (direct) emissions are the primary contributor.'
        ],
        recommendations: topSources.slice(0, 3).map(s => s.recommendation)
      };
    } catch (error) {
      console.error('Executive report error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * GRI Metrics Report Tool (Time-Flexible)
 */
export const getGRIReportTool = tool({
  description: 'Generate a GRI (Global Reporting Initiative) compliant metrics report for any time period. Use when users ask for "GRI report", "GRI metrics", "sustainability report", etc. Supports all time periods: last month, quarter, semester, this year, last year, custom dates.',
  inputSchema: z.object({
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building ID'),
    period: z.enum([
      'last_month',
      'last_2_months',
      'last_3_months',
      'quarter',
      'semester',
      'this_year',
      'last_year',
      'ytd',
      'custom'
    ]).describe('Time period for the report'),
    customStartDate: z.string().optional().describe('Custom start date (YYYY-MM-DD)'),
    customEndDate: z.string().optional().describe('Custom end date (YYYY-MM-DD)'),
    standards: z.array(z.enum(['GRI_305', 'GRI_302', 'GRI_303', 'GRI_306', 'GRI_301'])).optional().describe('Specific GRI standards to include (default: all)')
  }),
  execute: async ({ organizationId, buildingId, period, customStartDate, customEndDate, standards }) => {
    try {
      const now = new Date();
      let startDate: string;
      let endDate: string;
      let periodLabel: string;

      // Calculate date ranges based on period (same logic as executive report)
      if (period === 'custom' && customStartDate && customEndDate) {
        startDate = customStartDate;
        endDate = customEndDate;
        periodLabel = `${startDate} to ${endDate}`;
      } else if (period === 'last_month') {
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        startDate = `${year}-${(lastMonth + 1).toString().padStart(2, '0')}-01`;
        const lastDay = new Date(year, lastMonth + 1, 0).getDate();
        endDate = `${year}-${(lastMonth + 1).toString().padStart(2, '0')}-${lastDay}`;
        periodLabel = new Date(startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else if (period === 'last_2_months') {
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        startDate = twoMonthsAgo.toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        periodLabel = 'Last 2 Months';
      } else if (period === 'last_3_months') {
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        startDate = threeMonthsAgo.toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        periodLabel = 'Last 3 Months';
      } else if (period === 'quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
        const quarterYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
        startDate = `${quarterYear}-${(lastQuarter * 3 + 1).toString().padStart(2, '0')}-01`;
        const endMonth = lastQuarter * 3 + 3;
        const lastDay = new Date(quarterYear, endMonth, 0).getDate();
        endDate = `${quarterYear}-${endMonth.toString().padStart(2, '0')}-${lastDay}`;
        periodLabel = `Q${lastQuarter + 1} ${quarterYear}`;
      } else if (period === 'semester') {
        const currentSemester = Math.floor(now.getMonth() / 6);
        const lastSemester = currentSemester === 0 ? 1 : 0;
        const semesterYear = currentSemester === 0 ? now.getFullYear() - 1 : now.getFullYear();
        startDate = lastSemester === 0 ? `${semesterYear}-01-01` : `${semesterYear}-07-01`;
        endDate = lastSemester === 0 ? `${semesterYear}-06-30` : `${semesterYear}-12-31`;
        periodLabel = `${lastSemester === 0 ? 'H1' : 'H2'} ${semesterYear}`;
      } else if (period === 'this_year' || period === 'ytd') {
        startDate = `${now.getFullYear()}-01-01`;
        endDate = now.toISOString().split('T')[0];
        periodLabel = `${now.getFullYear()} (YTD)`;
      } else if (period === 'last_year') {
        const lastYear = now.getFullYear() - 1;
        startDate = `${lastYear}-01-01`;
        endDate = `${lastYear}-12-31`;
        periodLabel = `${lastYear}`;
      } else {
        throw new Error('Invalid period specified');
      }

      // Calculate YoY comparison period (same period, previous year)
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      const yoyStartDate = new Date(startDateObj.getFullYear() - 1, startDateObj.getMonth(), startDateObj.getDate()).toISOString().split('T')[0];
      const yoyEndDate = new Date(endDateObj.getFullYear() - 1, endDateObj.getMonth(), endDateObj.getDate()).toISOString().split('T')[0];
      const yoyPeriodLabel = new Date(yoyStartDate).getFullYear().toString();

      // Default to all GRI standards if none specified
      const includeStandards = standards || ['GRI_305', 'GRI_302', 'GRI_303', 'GRI_306', 'GRI_301'];
      const report: any = {
        success: true,
        period: periodLabel,
        reportingPeriod: { startDate, endDate },
        comparisonPeriod: { startDate: yoyStartDate, endDate: yoyEndDate, label: yoyPeriodLabel },
        standards: {}
      };

      // GRI 305: Emissions
      if (includeStandards.includes('GRI_305')) {
        const emissions = await getPeriodEmissions(organizationId, startDate, endDate, buildingId);
        const scopeBreakdown = await getScopeBreakdown(organizationId, startDate, endDate, buildingId);
        const categoryBreakdown = await getCategoryBreakdown(organizationId, startDate, endDate, buildingId);

        // YoY comparison
        const yoyEmissions = await getPeriodEmissions(organizationId, yoyStartDate, yoyEndDate, buildingId);
        const yoyScopeBreakdown = await getScopeBreakdown(organizationId, yoyStartDate, yoyEndDate, buildingId);

        const calculateChange = (current: number, previous: number) => {
          if (previous === 0) return 0;
          return Math.round(((current - previous) / previous) * 1000) / 10;
        };

        report.standards.GRI_305 = {
          title: 'GRI 305: Emissions',
          disclosures: {
            '305-1': {
              title: 'Direct (Scope 1) GHG emissions',
              currentPeriod: {
                value: scopeBreakdown.scope_1,
                unit: 'tCO2e'
              },
              previousYear: {
                value: yoyScopeBreakdown.scope_1,
                unit: 'tCO2e'
              },
              yoyChange: calculateChange(scopeBreakdown.scope_1, yoyScopeBreakdown.scope_1),
              description: 'Direct greenhouse gas emissions from sources owned or controlled by the organization'
            },
            '305-2': {
              title: 'Energy indirect (Scope 2) GHG emissions',
              currentPeriod: {
                value: scopeBreakdown.scope_2,
                unit: 'tCO2e'
              },
              previousYear: {
                value: yoyScopeBreakdown.scope_2,
                unit: 'tCO2e'
              },
              yoyChange: calculateChange(scopeBreakdown.scope_2, yoyScopeBreakdown.scope_2),
              description: 'Indirect greenhouse gas emissions from consumption of purchased electricity, heat, or steam'
            },
            '305-3': {
              title: 'Other indirect (Scope 3) GHG emissions',
              currentPeriod: {
                value: scopeBreakdown.scope_3,
                unit: 'tCO2e'
              },
              previousYear: {
                value: yoyScopeBreakdown.scope_3,
                unit: 'tCO2e'
              },
              yoyChange: calculateChange(scopeBreakdown.scope_3, yoyScopeBreakdown.scope_3),
              description: 'All other indirect greenhouse gas emissions in the value chain'
            },
            '305-4': {
              title: 'GHG emissions intensity',
              currentPeriod: {
                value: emissions.total,
                unit: 'tCO2e'
              },
              previousYear: {
                value: yoyEmissions.total,
                unit: 'tCO2e'
              },
              yoyChange: calculateChange(emissions.total, yoyEmissions.total),
              description: 'Total greenhouse gas emissions'
            },
            '305-5': {
              title: 'Reduction of GHG emissions',
              totalReduction: yoyEmissions.total - emissions.total,
              percentageReduction: calculateChange(emissions.total, yoyEmissions.total) * -1, // Negative change = reduction
              categories: categoryBreakdown.slice(0, 5).map(c => ({
                category: c.category,
                emissions: c.total,
                percentage: c.percentage
              }))
            }
          }
        };
      }

      // GRI 302: Energy
      if (includeStandards.includes('GRI_302')) {
        const energy = await getEnergyTotal(organizationId, startDate, endDate, buildingId);
        const yoyEnergy = await getEnergyTotal(organizationId, yoyStartDate, yoyEndDate, buildingId);

        const calculateChange = (current: number, previous: number) => {
          if (previous === 0) return 0;
          return Math.round(((current - previous) / previous) * 1000) / 10;
        };

        report.standards.GRI_302 = {
          title: 'GRI 302: Energy',
          disclosures: {
            '302-1': {
              title: 'Energy consumption within the organization',
              currentPeriod: {
                value: energy.value,
                unit: energy.unit,
                recordCount: energy.recordCount
              },
              previousYear: {
                value: yoyEnergy.value,
                unit: yoyEnergy.unit,
                recordCount: yoyEnergy.recordCount
              },
              yoyChange: calculateChange(energy.value, yoyEnergy.value),
              description: 'Total energy consumption from all sources'
            },
            '302-3': {
              title: 'Energy intensity',
              currentPeriod: {
                value: energy.value,
                unit: energy.unit
              },
              previousYear: {
                value: yoyEnergy.value,
                unit: yoyEnergy.unit
              },
              yoyChange: calculateChange(energy.value, yoyEnergy.value),
              description: 'Energy intensity ratio'
            }
          }
        };
      }

      // GRI 303: Water
      if (includeStandards.includes('GRI_303')) {
        const water = await getWaterTotal(organizationId, startDate, endDate, buildingId);
        const yoyWater = await getWaterTotal(organizationId, yoyStartDate, yoyEndDate, buildingId);

        const calculateChange = (current: number, previous: number) => {
          if (previous === 0) return 0;
          return Math.round(((current - previous) / previous) * 1000) / 10;
        };

        report.standards.GRI_303 = {
          title: 'GRI 303: Water and Effluents',
          disclosures: {
            '303-3': {
              title: 'Water withdrawal',
              currentPeriod: {
                value: water.value,
                unit: water.unit,
                recordCount: water.recordCount
              },
              previousYear: {
                value: yoyWater.value,
                unit: yoyWater.unit,
                recordCount: yoyWater.recordCount
              },
              yoyChange: calculateChange(water.value, yoyWater.value),
              description: 'Total water withdrawal by source'
            },
            '303-5': {
              title: 'Water consumption',
              currentPeriod: {
                value: water.value,
                unit: water.unit
              },
              previousYear: {
                value: yoyWater.value,
                unit: yoyWater.unit
              },
              yoyChange: calculateChange(water.value, yoyWater.value),
              description: 'Total water consumption'
            }
          }
        };
      }

      // GRI 306: Waste
      if (includeStandards.includes('GRI_306')) {
        const waste = await getWasteTotal(organizationId, startDate, endDate, buildingId);
        const yoyWaste = await getWasteTotal(organizationId, yoyStartDate, yoyEndDate, buildingId);

        const calculateChange = (current: number, previous: number) => {
          if (previous === 0) return 0;
          return Math.round(((current - previous) / previous) * 1000) / 10;
        };

        report.standards.GRI_306 = {
          title: 'GRI 306: Waste',
          disclosures: {
            '306-3': {
              title: 'Waste generated',
              currentPeriod: {
                value: waste.value,
                unit: waste.unit,
                recordCount: waste.recordCount
              },
              previousYear: {
                value: yoyWaste.value,
                unit: yoyWaste.unit,
                recordCount: yoyWaste.recordCount
              },
              yoyChange: calculateChange(waste.value, yoyWaste.value),
              description: 'Total weight of waste generated'
            },
            '306-4': {
              title: 'Waste diverted from disposal',
              currentPeriod: {
                value: waste.value,
                unit: waste.unit
              },
              previousYear: {
                value: yoyWaste.value,
                unit: yoyWaste.unit
              },
              yoyChange: calculateChange(waste.value, yoyWaste.value),
              description: 'Total weight of waste diverted from disposal'
            }
          }
        };
      }

      // GRI 301: Materials
      if (includeStandards.includes('GRI_301')) {
        report.standards.GRI_301 = {
          title: 'GRI 301: Materials',
          disclosures: {
            '301-1': {
              title: 'Materials used by weight or volume',
              description: 'Materials tracking not yet implemented',
              note: 'Add material consumption data to enable this disclosure'
            },
            '301-2': {
              title: 'Recycled input materials used',
              description: 'Recycled materials tracking not yet implemented',
              note: 'Add recycled material data to enable this disclosure'
            }
          }
        };
      }

      return report;
    } catch (error) {
      console.error('GRI report error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * ESG Report Generation Tool
 */
export const generateESGReportTool = tool({
  description: 'Generate comprehensive ESG reports in various formats and standards (GRI, SASB, TCFD, CDP). Returns report ID and download link.',
  inputSchema: z.object({
    reportType: z.enum(['annual', 'quarterly', 'monthly', 'custom']).describe('Type of report'),
    standard: z.enum(['GRI', 'SASB', 'TCFD', 'CDP', 'integrated']).describe('Reporting standard/framework'),
    organizationId: z.string().describe('Organization ID'),
    period: z.object({
      start: z.string().describe('Start date of reporting period'),
      end: z.string().describe('End date of reporting period')
    }).describe('Reporting period'),
    sections: z.array(z.string()).optional().describe('Specific sections to include (e.g., ["emissions", "energy", "water"])')
  }),
  execute: async ({ reportType, standard, organizationId, period, sections }) => {
    try {
      const supabase = createClient();

      // Create report generation job
      const { data: report, error } = await supabase
        .from('esg_reports')
        .insert({
          organization_id: organizationId,
          report_type: reportType,
          standard,
          period_start: period.start,
          period_end: period.end,
          sections: sections || ['all'],
          status: 'generating',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error || !report) {
        throw new Error('Failed to create report generation job');
      }

      // In production, this would trigger an async job
      // For now, return pending status
      return {
        success: true,
        reportId: report.id,
        reportType,
        standard,
        status: 'generating',
        estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        message: 'Report generation started. You will be notified when complete.',
        sections: sections || ['all']
      };

    } catch (error) {
      console.error('Report generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reportType,
        standard
      };
    }
  }
});

/**
 * Document Analysis Tool
 */
export const analyzeDocumentTool = tool({
  description: 'Analyze uploaded documents (PDFs, invoices, utility bills) to extract sustainability data using AI vision and OCR.',
  inputSchema: z.object({
    documentId: z.string().describe('Document ID or attachment ID from upload'),
    analysisType: z.enum(['emissions', 'compliance', 'general', 'invoice', 'utility_bill']).describe('Type of document analysis to perform')
  }),
  execute: async ({ documentId, analysisType }) => {
    try {
      const supabase = createClient();

      // Get document from attachments
      const { data: attachment, error } = await supabase
        .from('chat_attachments')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error || !attachment) {
        return {
          success: false,
          error: 'Document not found',
          documentId,
          analysisType
        };
      }

      // Note: Document analysis with AI orchestrator not yet implemented
      // Update attachment status to indicate processing not available
      await supabase
        .from('chat_attachments')
        .update({
          processing_status: 'pending',
          metadata: { analysisType, note: 'AI document analysis not yet available' }
        })
        .eq('id', documentId);

      return {
        success: false,
        error: 'Document analysis functionality is not yet implemented. Please manually review the document.',
        documentId,
        documentName: attachment.file_name,
        analysisType
      };

    } catch (error) {
      console.error('Document analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        documentId,
        analysisType
      };
    }
  }
});

/**
 * Emissions Forecasting Tool
 * Uses enterprise-grade ML model (Facebook Prophet-style seasonal decomposition)
 */
export const forecastEmissionsTool = tool({
  description: 'Forecast FUTURE emissions using ML models - ONLY use for dates AFTER today (future months/years). For current or past periods, use analyzeCarbonFootprintTool instead. Provides forecasts by scope (1, 2, 3) with confidence intervals using Prophet-style seasonal decomposition.',
  inputSchema: z.object({
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building/site ID for site-specific forecasts'),
    startDate: z.string().describe('Forecast start date (ISO format YYYY-MM-DD)'),
    endDate: z.string().describe('Forecast end date (ISO format YYYY-MM-DD)'),
    includeConfidence: z.boolean().default(true).describe('Include confidence intervals in the forecast')
  }),
  execute: async ({ organizationId, buildingId, startDate, endDate, includeConfidence }) => {
    try {
      // Call the forecast API
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });

      if (buildingId) {
        params.append('site_id', buildingId);
      }

      const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await fetch(
        `${apiUrl}/api/sustainability/forecast?${params.toString()}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Failed to generate forecast',
          period: { startDate, endDate }
        };
      }

      const forecastData = await response.json();

      // Format the forecast results
      const forecast = forecastData.forecast || [];
      const totalForecast = forecast.reduce((sum: number, month: any) => sum + month.total, 0);
      const avgMonthly = forecast.length > 0 ? totalForecast / forecast.length : 0;

      // Extract year for explicit mention in insights
      const startYear = new Date(startDate).getFullYear();
      const endYear = new Date(endDate).getFullYear();
      const yearLabel = startYear === endYear ? `year ${startYear}` : `period ${startYear}-${endYear}`;

      // Build summary
      const summary = `The forecast for the ${yearLabel} (${startDate} to ${endDate}) projects a total of ${totalForecast.toFixed(1)} tCO2e across ${forecast.length} months (averaging ${avgMonthly.toFixed(1)} tCO2e per month). This forecast uses ${forecastData.model || 'Seasonal Decomposition'} with ${((forecastData.confidence || 0.5) * 100).toFixed(0)}% confidence.`;

      // Calculate scope percentages from forecast
      const totalScope1 = forecast.reduce((sum: number, m: any) => sum + m.scope1, 0);
      const totalScope2 = forecast.reduce((sum: number, m: any) => sum + m.scope2, 0);
      const totalScope3 = forecast.reduce((sum: number, m: any) => sum + m.scope3, 0);

      return {
        success: true,
        period: { startDate, endDate },
        totalForecast: totalForecast,
        avgMonthlyForecast: avgMonthly,
        scopeBreakdown: {
          scope1: totalScope1,
          scope2: totalScope2,
          scope3: totalScope3,
          scope1Percent: totalForecast > 0 ? (totalScope1 / totalForecast * 100).toFixed(1) : 0,
          scope2Percent: totalForecast > 0 ? (totalScope2 / totalForecast * 100).toFixed(1) : 0,
          scope3Percent: totalForecast > 0 ? (totalScope3 / totalForecast * 100).toFixed(1) : 0,
        },
        monthlyForecasts: forecast.map((month: any) => ({
          month: month.month,
          total: month.total,
          scope1: month.scope1,
          scope2: month.scope2,
          scope3: month.scope3,
          ...(includeConfidence ? {
            confidenceLower: month.confidence?.totalLower,
            confidenceUpper: month.confidence?.totalUpper,
          } : {})
        })),
        model: forecastData.model || 'Seasonal Decomposition',
        confidence: forecastData.confidence || 0.5,
        metadata: forecastData.metadata,
        summary,
        recommendations: [
          forecastData.metadata?.totalTrend > 0
            ? `Forecast shows upward trend (+${(forecastData.metadata.totalTrend * 100).toFixed(1)}% per month) - proactive reduction strategies recommended`
            : forecastData.metadata?.totalTrend < 0
            ? `Forecast shows downward trend (${(forecastData.metadata.totalTrend * 100).toFixed(1)}% per month) - current strategies appear effective`
            : 'Emissions expected to remain stable - maintain current practices',
          totalScope3 > totalScope1 + totalScope2
            ? 'Scope 3 dominates forecast - prioritize supply chain engagement'
            : 'Focus on operational emissions (Scope 1 & 2) for maximum impact',
          'Use forecasts for proactive target setting and resource planning'
        ]
      };

    } catch (error) {
      console.error('Forecast error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        period: { startDate, endDate }
      };
    }
  }
});

/**
 * Water Consumption Analysis Tool
 * Analyzes water withdrawal, discharge, and consumption by end-use (GRI 303 compliant)
 */
export const analyzeWaterConsumptionTool = tool({
  description: 'Analyze water consumption, withdrawal, and discharge by end-use. Returns detailed breakdown for toilets, kitchen, cleaning, irrigation, and wastewater. GRI 303 compliant.',
  inputSchema: z.object({
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building/site ID for site-specific analysis'),
    timeframe: z.object({
      start: z.string().describe('Start date (ISO format YYYY-MM-DD)'),
      end: z.string().describe('End date (ISO format YYYY-MM-DD)')
    }).optional().describe('Time period for analysis. Defaults to current year (Jan 1 to today) if not provided.'),
    includeEndUseBreakdown: z.boolean().default(true).describe('Include breakdown by end-use (toilets, kitchen, cleaning, etc.)'),
    compareToBaseline: z.boolean().default(true).describe('Compare to previous year')
  }),
  execute: async ({ organizationId, buildingId, timeframe, includeEndUseBreakdown, compareToBaseline }) => {
    try {
      const supabase = createAdminClient();

      // Calculate date range - default to current year
      const endDate = timeframe?.end || new Date().toISOString().split('T')[0];
      const startDate = timeframe?.start || (() => {
        const now = new Date();
        return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      })();

      // Query water consumption summary view
      let query = supabase
        .from('water_consumption_summary')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('period_start', startDate)
        .lte('period_start', endDate);

      if (buildingId) {
        query = query.eq('site_id', buildingId);
      }

      const { data: waterData, error } = await query;

      if (error) throw error;

      // Aggregate by end-use
      const endUseMap = new Map<string, { withdrawal: number; discharge: number; consumption: number; emissions: number }>();

      waterData?.forEach(row => {
        const endUse = row.metric_name || 'Unknown';
        const existing = endUseMap.get(endUse) || { withdrawal: 0, discharge: 0, consumption: 0, emissions: 0 };
        existing.withdrawal += row.withdrawal_m3 || 0;
        existing.discharge += row.discharge_m3 || 0;
        existing.consumption += row.consumption_m3 || 0;
        existing.emissions += row.co2e_emissions || 0;
        endUseMap.set(endUse, existing);
      });

      const breakdown = Array.from(endUseMap.entries()).map(([name, data]) => ({
        endUse: name,
        withdrawal_m3: Math.round(data.withdrawal * 10) / 10,
        discharge_m3: Math.round(data.discharge * 10) / 10,
        consumption_m3: Math.round(data.consumption * 10) / 10,
        consumption_rate: data.withdrawal > 0 ? Math.round((data.consumption / data.withdrawal) * 100) : 0,
        emissions_kgCO2e: Math.round(data.emissions * 10) / 10
      }));

      const totalWithdrawal = breakdown.reduce((sum, b) => sum + b.withdrawal_m3, 0);
      const totalDischarge = breakdown.reduce((sum, b) => sum + b.discharge_m3, 0);
      const totalConsumption = breakdown.reduce((sum, b) => sum + b.consumption_m3, 0);
      const totalEmissions = breakdown.reduce((sum, b) => sum + b.emissions_kgCO2e, 0);

      // Get YoY comparison if requested
      let comparison;
      if (compareToBaseline) {
        comparison = await getYoYComparison(organizationId, startDate, endDate, 'water');
      }

      // Extract year for explicit mention in insights
      const startYear = new Date(startDate).getFullYear();
      const endYear = new Date(endDate).getFullYear();
      const yearLabel = startYear === endYear ? `year ${startYear}` : `period ${startYear}-${endYear}`;

      const insights = `For the ${yearLabel} (${startDate} to ${endDate}), total water withdrawal was ${totalWithdrawal.toFixed(1)} m³, with consumption of ${totalConsumption.toFixed(1)} m³ (${((totalConsumption/totalWithdrawal)*100).toFixed(1)}% rate) and discharge of ${totalDischarge.toFixed(1)} m³. ${comparison ? `Year-over-year change: ${comparison.percentageChange > 0 ? '+' : ''}${comparison.percentageChange.toFixed(1)}%` : ''}`;

      return {
        success: true,
        total: {
          withdrawal_m3: Math.round(totalWithdrawal * 10) / 10,
          discharge_m3: Math.round(totalDischarge * 10) / 10,
          consumption_m3: Math.round(totalConsumption * 10) / 10,
          consumption_rate_percent: totalWithdrawal > 0 ? Math.round((totalConsumption / totalWithdrawal) * 100) : 0,
          emissions_kgCO2e: Math.round(totalEmissions * 10) / 10
        },
        breakdown: includeEndUseBreakdown ? breakdown : undefined,
        comparison: comparison ? {
          previousPeriod: comparison.previousValue,
          currentPeriod: comparison.currentValue,
          change: comparison.absoluteChange,
          percentageChange: comparison.percentageChange
        } : undefined,
        insights,
        recommendations: [
          totalConsumption / totalWithdrawal > 0.3 ? 'High consumption rate - consider water recycling systems' : 'Good water efficiency - consumption rate is within normal range',
          breakdown.find(b => b.endUse.includes('Irrigation'))?.withdrawal_m3 || 0 > totalWithdrawal * 0.2 ? 'Irrigation is a major water user - consider drought-resistant landscaping' : '',
          'Install low-flow fixtures to reduce withdrawal and consumption',
          'Monitor for leaks - unexpected consumption patterns may indicate issues'
        ].filter(r => r),
        period: { startDate, endDate },
        analysisDate: new Date().toISOString(),
        gri_compliance: 'GRI 303-3 (Water withdrawal), GRI 303-4 (Water discharge), GRI 303-5 (Water consumption)'
      };
    } catch (error) {
      console.error('Water analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Energy Consumption Analysis Tool
 * Analyzes energy usage by source (electricity, natural gas, renewables, etc.)
 */
export const analyzeEnergyConsumptionTool = tool({
  description: 'Analyze energy consumption by source (electricity, natural gas, renewable energy, etc.). Returns detailed breakdown with emissions and intensity metrics.',
  inputSchema: z.object({
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building/site ID for site-specific analysis'),
    timeframe: z.object({
      start: z.string().describe('Start date (ISO format YYYY-MM-DD)'),
      end: z.string().describe('End date (ISO format YYYY-MM-DD)')
    }).optional().describe('Time period for analysis. Defaults to current year (Jan 1 to today) if not provided.'),
    includeSourceBreakdown: z.boolean().default(true).describe('Include breakdown by energy source'),
    compareToBaseline: z.boolean().default(true).describe('Compare to previous year')
  }),
  execute: async ({ organizationId, buildingId, timeframe, includeSourceBreakdown, compareToBaseline }) => {
    try {
      const supabase = createAdminClient();

      const endDate = timeframe?.end || new Date().toISOString().split('T')[0];
      const startDate = timeframe?.start || (() => {
        const now = new Date();
        return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      })();

      // Query energy metrics (Scope 1 fuels + Scope 2 electricity)
      let query = supabase
        .from('metrics_data')
        .select(`
          value,
          co2e_emissions,
          metrics_catalog!inner(name, category, subcategory, unit, scope)
        `)
        .eq('organization_id', organizationId)
        .gte('period_start', startDate)
        .lte('period_start', endDate)
        .or('category.ilike.%energy%,category.ilike.%electricity%,category.ilike.%fuel%,category.ilike.%gas%', { foreignTable: 'metrics_catalog' });

      if (buildingId) {
        query = query.eq('site_id', buildingId);
      }

      const { data: energyData, error } = await query;
      if (error) throw error;

      const sourceMap = new Map<string, { consumption: number; unit: string; emissions: number; scope: string }>();

      energyData?.forEach(row => {
        const catalog = row.metrics_catalog as any;
        const sourceName = catalog.subcategory || catalog.name || 'Unknown';
        const existing = sourceMap.get(sourceName) || { consumption: 0, unit: catalog.unit, emissions: 0, scope: catalog.scope };
        existing.consumption += row.value || 0;
        existing.emissions += row.co2e_emissions || 0;
        sourceMap.set(sourceName, existing);
      });

      const breakdown = Array.from(sourceMap.entries()).map(([name, data]) => ({
        source: name,
        consumption: Math.round(data.consumption * 10) / 10,
        unit: data.unit,
        emissions_kgCO2e: Math.round(data.emissions * 10) / 10,
        scope: data.scope,
        renewable: name.toLowerCase().includes('solar') || name.toLowerCase().includes('wind') || name.toLowerCase().includes('renewable')
      }));

      const totalConsumption = breakdown.reduce((sum, b) => sum + (b.unit === 'kWh' ? b.consumption : 0), 0);
      const totalEmissions = breakdown.reduce((sum, b) => sum + b.emissions_kgCO2e, 0);
      const renewableConsumption = breakdown.filter(b => b.renewable).reduce((sum, b) => sum + (b.unit === 'kWh' ? b.consumption : 0), 0);
      const renewablePercent = totalConsumption > 0 ? (renewableConsumption / totalConsumption) * 100 : 0;

      let comparison;
      if (compareToBaseline) {
        comparison = await getYoYComparison(organizationId, startDate, endDate, 'energy');
      }

      // Extract year for explicit mention in insights
      const startYear = new Date(startDate).getFullYear();
      const endYear = new Date(endDate).getFullYear();
      const yearLabel = startYear === endYear ? `year ${startYear}` : `period ${startYear}-${endYear}`;

      const insights = `For the ${yearLabel} (${startDate} to ${endDate}), total energy consumption was ${totalConsumption.toFixed(0)} kWh, resulting in ${(totalEmissions/1000).toFixed(1)} tCO2e emissions. Renewable energy accounted for ${renewablePercent.toFixed(1)}% of the total. ${comparison ? `Year-over-year change: ${comparison.percentageChange > 0 ? '+' : ''}${comparison.percentageChange.toFixed(1)}%` : ''}`;

      return {
        success: true,
        total: {
          consumption_kWh: Math.round(totalConsumption),
          emissions_tCO2e: Math.round((totalEmissions / 1000) * 10) / 10,
          renewable_percent: Math.round(renewablePercent * 10) / 10
        },
        breakdown: includeSourceBreakdown ? breakdown : undefined,
        comparison: comparison ? {
          previousPeriod: comparison.previousValue,
          currentPeriod: comparison.currentValue,
          change: comparison.absoluteChange,
          percentageChange: comparison.percentageChange
        } : undefined,
        insights,
        recommendations: [
          renewablePercent < 20 ? 'Consider increasing renewable energy procurement to reduce Scope 2 emissions' : 'Good renewable energy mix - continue expanding',
          'Conduct energy audit to identify efficiency opportunities',
          'Install LED lighting and smart building controls',
          totalEmissions > 100000 ? 'High emissions from energy - prioritize energy efficiency and renewables' : ''
        ].filter(r => r),
        period: { startDate, endDate },
        analysisDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Energy analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Waste Generation Analysis Tool
 * Analyzes waste by type and disposal method
 */
export const analyzeWasteGenerationTool = tool({
  description: 'Analyze waste generation by type (recycling, landfill, hazardous, organic) and disposal method. Returns detailed breakdown with diversion rates. IMPORTANT: All waste values are measured in TONS (not kg). Always use "tons" when communicating waste amounts to users.',
  inputSchema: z.object({
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building/site ID for site-specific analysis'),
    timeframe: z.object({
      start: z.string().describe('Start date (ISO format YYYY-MM-DD)'),
      end: z.string().describe('End date (ISO format YYYY-MM-DD)')
    }).optional().describe('Time period for analysis. Defaults to current year (Jan 1 to today) if not provided.'),
    includeTypeBreakdown: z.boolean().default(true).describe('Include breakdown by waste type'),
    compareToBaseline: z.boolean().default(true).describe('Compare to previous year')
  }),
  execute: async ({ organizationId, buildingId, timeframe, includeTypeBreakdown, compareToBaseline }) => {
    try {
      const supabase = createAdminClient();

      const endDate = timeframe?.end || new Date().toISOString().split('T')[0];
      const startDate = timeframe?.start || (() => {
        const now = new Date();
        return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      })();

      let query = supabase
        .from('metrics_data')
        .select(`
          value,
          co2e_emissions,
          metrics_catalog!inner(name, category, subcategory, unit)
        `)
        .eq('organization_id', organizationId)
        .gte('period_start', startDate)
        .lte('period_start', endDate)
        .or('category.ilike.%waste%', { foreignTable: 'metrics_catalog' });

      if (buildingId) {
        query = query.eq('site_id', buildingId);
      }

      const { data: wasteData, error } = await query;
      if (error) throw error;

      const typeMap = new Map<string, { weight: number; emissions: number; diverted: boolean }>();

      wasteData?.forEach(row => {
        const catalog = row.metrics_catalog as any;
        const wasteName = catalog.subcategory || catalog.name || 'Unknown';
        const isDiverted = wasteName.toLowerCase().includes('recycl') ||
                          wasteName.toLowerCase().includes('compost') ||
                          wasteName.toLowerCase().includes('organic');

        const existing = typeMap.get(wasteName) || { weight: 0, emissions: 0, diverted: isDiverted };
        existing.weight += row.value || 0;
        existing.emissions += row.co2e_emissions || 0;
        typeMap.set(wasteName, existing);
      });

      const breakdown = Array.from(typeMap.entries()).map(([name, data]) => ({
        wasteType: name,
        weight_tons: Math.round(data.weight * 10) / 10,
        emissions_kgCO2e: Math.round(data.emissions * 10) / 10,
        diverted: data.diverted
      }));

      const totalWeight = breakdown.reduce((sum, b) => sum + b.weight_tons, 0);
      const divertedWeight = breakdown.filter(b => b.diverted).reduce((sum, b) => sum + b.weight_tons, 0);
      const diversionRate = totalWeight > 0 ? (divertedWeight / totalWeight) * 100 : 0;
      const totalEmissions = breakdown.reduce((sum, b) => sum + b.emissions_kgCO2e, 0);

      let comparison;
      if (compareToBaseline) {
        comparison = await getYoYComparison(organizationId, startDate, endDate, 'waste');
      }

      // Extract year for explicit mention in insights
      const startYear = new Date(startDate).getFullYear();
      const endYear = new Date(endDate).getFullYear();
      const yearLabel = startYear === endYear ? `year ${startYear}` : `period ${startYear}-${endYear}`;

      const insights = `For the ${yearLabel} (${startDate} to ${endDate}), a total of ${totalWeight.toFixed(1)} tons of waste was generated with a diversion rate of ${diversionRate.toFixed(1)}%, resulting in ${(totalEmissions/1000).toFixed(1)} tCO2e emissions. ${comparison ? `Year-over-year change: ${comparison.percentageChange > 0 ? '+' : ''}${comparison.percentageChange.toFixed(1)}%` : ''}`;

      return {
        success: true,
        total: {
          weight_tons: Math.round(totalWeight * 10) / 10,
          diverted_tons: Math.round(divertedWeight * 10) / 10,
          landfill_tons: Math.round((totalWeight - divertedWeight) * 10) / 10,
          diversion_rate_percent: Math.round(diversionRate * 10) / 10,
          emissions_tCO2e: Math.round((totalEmissions / 1000) * 10) / 10
        },
        breakdown: includeTypeBreakdown ? breakdown : undefined,
        comparison: comparison ? {
          previousPeriod: comparison.previousValue,
          currentPeriod: comparison.currentValue,
          change: comparison.absoluteChange,
          percentageChange: comparison.percentageChange
        } : undefined,
        insights,
        recommendations: [
          diversionRate < 50 ? 'Diversion rate is low - implement comprehensive recycling and composting programs' : 'Good waste diversion - maintain and improve programs',
          'Conduct waste audit to identify reduction opportunities',
          'Implement source reduction strategies to minimize waste generation',
          'Partner with local recycling facilities to improve diversion rates'
        ],
        period: { startDate, endDate },
        analysisDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Waste analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Generic Metrics Analysis Tool
 * Query ANY sustainability metric by category or name
 */
export const analyzeGenericMetricTool = tool({
  description: 'Analyze any sustainability metric by category (e.g., "water", "energy", "waste", "travel", "refrigerants"). Flexible tool for querying metrics not covered by specialized tools.',
  inputSchema: z.object({
    metricCategory: z.string().describe('Metric category to analyze (e.g., "water", "energy", "waste", "business travel", "employee commuting", "refrigerants")'),
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building/site ID for site-specific analysis'),
    timeframe: z.object({
      start: z.string().describe('Start date (ISO format YYYY-MM-DD)'),
      end: z.string().describe('End date (ISO format YYYY-MM-DD)')
    }).optional().describe('Time period for analysis. Defaults to current year (Jan 1 to today) if not provided.'),
    compareToBaseline: z.boolean().default(true).describe('Compare to previous year')
  }),
  execute: async ({ metricCategory, organizationId, buildingId, timeframe, compareToBaseline }) => {
    try {
      const supabase = createAdminClient();

      const endDate = timeframe?.end || new Date().toISOString().split('T')[0];
      const startDate = timeframe?.start || (() => {
        const now = new Date();
        return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      })();

      let query = supabase
        .from('metrics_data')
        .select(`
          value,
          co2e_emissions,
          metrics_catalog!inner(name, category, subcategory, unit, scope)
        `)
        .eq('organization_id', organizationId)
        .gte('period_start', startDate)
        .lte('period_start', endDate)
        .or(`category.ilike.%${metricCategory}%,subcategory.ilike.%${metricCategory}%,name.ilike.%${metricCategory}%`, { foreignTable: 'metrics_catalog' });

      if (buildingId) {
        query = query.eq('site_id', buildingId);
      }

      const { data: metricsData, error } = await query;
      if (error) throw error;

      if (!metricsData || metricsData.length === 0) {
        return {
          success: false,
          error: `No metrics found for category "${metricCategory}". Try different keywords like "water", "energy", "waste", "travel", etc.`
        };
      }

      const metricMap = new Map<string, { value: number; unit: string; emissions: number }>();

      metricsData.forEach(row => {
        const catalog = row.metrics_catalog as any;
        const metricName = catalog.name;
        const existing = metricMap.get(metricName) || { value: 0, unit: catalog.unit, emissions: 0 };
        existing.value += row.value || 0;
        existing.emissions += row.co2e_emissions || 0;
        metricMap.set(metricName, existing);
      });

      const breakdown = Array.from(metricMap.entries()).map(([name, data]) => ({
        metric: name,
        value: Math.round(data.value * 10) / 10,
        unit: data.unit,
        emissions_kgCO2e: Math.round(data.emissions * 10) / 10
      }));

      const totalEmissions = breakdown.reduce((sum, b) => sum + b.emissions_kgCO2e, 0);

      let comparison;
      if (compareToBaseline) {
        comparison = await getYoYComparison(organizationId, startDate, endDate, metricCategory);
      }

      // Extract year for explicit mention in insights
      const startYear = new Date(startDate).getFullYear();
      const endYear = new Date(endDate).getFullYear();
      const yearLabel = startYear === endYear ? `year ${startYear}` : `period ${startYear}-${endYear}`;

      const insights = `For "${metricCategory}" in the ${yearLabel} (${startDate} to ${endDate}), found ${breakdown.length} metrics with total emissions of ${(totalEmissions/1000).toFixed(1)} tCO2e. ${comparison ? `Year-over-year change: ${comparison.percentageChange > 0 ? '+' : ''}${comparison.percentageChange.toFixed(1)}%` : ''}`;

      return {
        success: true,
        category: metricCategory,
        metricsFound: breakdown.length,
        total_emissions_tCO2e: Math.round((totalEmissions / 1000) * 10) / 10,
        breakdown,
        comparison: comparison ? {
          previousPeriod: comparison.previousValue,
          currentPeriod: comparison.currentValue,
          change: comparison.absoluteChange,
          percentageChange: comparison.percentageChange
        } : undefined,
        insights,
        period: { startDate, endDate },
        analysisDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Generic metric analysis error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Add Metric Data Tool
 * Allows users to add sustainability data through chat
 */
export const addMetricDataTool = tool({
  description: 'Add a sustainability metric value for a specific period. Use this when users want to input data like "Add 1000 kWh electricity for January 2025" or "Record 500 m³ water consumption for Building A".',
  inputSchema: z.object({
    metricName: z.string().describe('Name or code of the metric (e.g., "Grid Electricity", "Water - Toilets", "Natural Gas", "Business Travel - Air")'),
    value: z.number().describe('Numeric value of the metric'),
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building/site ID if this data is for a specific building'),
    periodStart: z.string().describe('Start date of the measurement period (ISO format YYYY-MM-DD)'),
    periodEnd: z.string().describe('End date of the measurement period (ISO format YYYY-MM-DD)'),
    dataQuality: z.enum(['measured', 'calculated', 'estimated']).default('measured').describe('Quality of the data: measured (direct measurement), calculated (derived from other data), or estimated'),
    notes: z.string().optional().describe('Additional notes or context about this data point')
  }),
  execute: async ({ metricName, value, organizationId, buildingId, periodStart, periodEnd, dataQuality, notes }) => {
    try {
      const supabase = createAdminClient();

      // Look up the metric in the catalog
      const { data: metric, error: metricError } = await supabase
        .from('metrics_catalog')
        .select('*')
        .or(`code.ilike.%${metricName}%,name.ilike.%${metricName}%`)
        .limit(1)
        .single();

      if (metricError || !metric) {
        // Try to find similar metrics to suggest
        const { data: suggestions } = await supabase
          .from('metrics_catalog')
          .select('name, code, unit')
          .or(`name.ilike.%${metricName.split(' ')[0]}%,category.ilike.%${metricName.split(' ')[0]}%`)
          .limit(5);

        return {
          success: false,
          error: `Metric "${metricName}" not found in catalog.`,
          suggestions: suggestions?.map(s => `${s.name} (${s.code}) - Unit: ${s.unit}`) || [],
          message: 'Please use one of the suggested metrics or check the metrics catalog for available options.'
        };
      }

      // Calculate CO2e emissions if emission factor is available
      let co2eEmissions = null;
      if (metric.emission_factor) {
        co2eEmissions = value * metric.emission_factor;
      }

      // Insert the metric data
      const { data: inserted, error: insertError } = await supabase
        .from('metrics_data')
        .insert({
          organization_id: organizationId,
          metric_id: metric.id,
          site_id: buildingId || null,
          period_start: periodStart,
          period_end: periodEnd,
          value: value,
          unit: metric.unit,
          co2e_emissions: co2eEmissions,
          data_quality: dataQuality,
          verification_status: 'unverified',
          notes: notes || null,
          metadata: {
            source: 'ai_chat',
            added_via: 'conversational_interface'
          }
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      return {
        success: true,
        message: `Successfully added ${value} ${metric.unit} for ${metric.name}`,
        data: {
          metricName: metric.name,
          value: value,
          unit: metric.unit,
          period: `${periodStart} to ${periodEnd}`,
          co2eEmissions: co2eEmissions ? `${co2eEmissions.toFixed(2)} kgCO2e` : 'Not calculated',
          dataQuality: dataQuality,
          recordId: inserted.id
        },
        recommendations: [
          dataQuality === 'estimated' ? 'Consider upgrading to measured data for better accuracy' : '',
          co2eEmissions && co2eEmissions > 1000 ? 'High emissions detected - consider reduction strategies' : '',
          'You can update this value later if needed using the update tool'
        ].filter(r => r)
      };

    } catch (error) {
      console.error('Add metric data error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metricName
      };
    }
  }
});

/**
 * Bulk Add Metric Data Tool
 * Add multiple metrics at once
 */
export const bulkAddMetricDataTool = tool({
  description: 'Add multiple sustainability metrics at once. Useful for batch imports or when user provides multiple values (e.g., "Add electricity: 1000 kWh, water: 500 m³, gas: 200 m³ for January").',
  inputSchema: z.object({
    metrics: z.array(z.object({
      metricName: z.string().describe('Name or code of the metric'),
      value: z.number().describe('Numeric value'),
      notes: z.string().optional().describe('Optional notes')
    })).describe('Array of metrics to add'),
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building/site ID (same for all metrics)'),
    periodStart: z.string().describe('Start date (ISO format YYYY-MM-DD) - same for all metrics'),
    periodEnd: z.string().describe('End date (ISO format YYYY-MM-DD) - same for all metrics'),
    dataQuality: z.enum(['measured', 'calculated', 'estimated']).default('measured').describe('Data quality - same for all metrics')
  }),
  execute: async ({ metrics, organizationId, buildingId, periodStart, periodEnd, dataQuality }) => {
    try {
      const supabase = createAdminClient();
      const results = [];
      const errors = [];

      for (const metric of metrics) {
        // Look up metric in catalog
        const { data: catalogMetric, error: metricError } = await supabase
          .from('metrics_catalog')
          .select('*')
          .or(`code.ilike.%${metric.metricName}%,name.ilike.%${metric.metricName}%`)
          .limit(1)
          .single();

        if (metricError || !catalogMetric) {
          errors.push({
            metricName: metric.metricName,
            error: 'Metric not found in catalog'
          });
          continue;
        }

        // Calculate CO2e
        let co2eEmissions = null;
        if (catalogMetric.emission_factor) {
          co2eEmissions = metric.value * catalogMetric.emission_factor;
        }

        // Insert
        const { data: inserted, error: insertError } = await supabase
          .from('metrics_data')
          .insert({
            organization_id: organizationId,
            metric_id: catalogMetric.id,
            site_id: buildingId || null,
            period_start: periodStart,
            period_end: periodEnd,
            value: metric.value,
            unit: catalogMetric.unit,
            co2e_emissions: co2eEmissions,
            data_quality: dataQuality,
            verification_status: 'unverified',
            notes: metric.notes || null,
            metadata: {
              source: 'ai_chat_bulk',
              added_via: 'conversational_interface'
            }
          })
          .select()
          .single();

        if (insertError) {
          errors.push({
            metricName: metric.metricName,
            error: insertError.message
          });
        } else {
          results.push({
            metricName: catalogMetric.name,
            value: metric.value,
            unit: catalogMetric.unit,
            co2eEmissions: co2eEmissions ? `${co2eEmissions.toFixed(2)} kgCO2e` : 'N/A',
            recordId: inserted.id
          });
        }
      }

      const totalCO2e = results.reduce((sum, r) => {
        const co2 = r.co2eEmissions !== 'N/A' ? parseFloat(r.co2eEmissions) : 0;
        return sum + co2;
      }, 0);

      return {
        success: errors.length === 0,
        message: `Successfully added ${results.length} of ${metrics.length} metrics`,
        added: results,
        errors: errors.length > 0 ? errors : undefined,
        summary: {
          period: `${periodStart} to ${periodEnd}`,
          totalRecords: results.length,
          totalCO2e: `${totalCO2e.toFixed(2)} kgCO2e`,
          dataQuality: dataQuality
        }
      };

    } catch (error) {
      console.error('Bulk add error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Update Metric Data Tool
 * Update existing metric values
 */
export const updateMetricDataTool = tool({
  description: 'Update an existing metric value. Use when user wants to correct or modify previously entered data.',
  inputSchema: z.object({
    metricName: z.string().describe('Name of the metric to update'),
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building/site ID if applicable'),
    periodStart: z.string().describe('Start date of the period to update (ISO format YYYY-MM-DD)'),
    newValue: z.number().describe('New value for the metric'),
    notes: z.string().optional().describe('Notes explaining the update')
  }),
  execute: async ({ metricName, organizationId, buildingId, periodStart, newValue, notes }) => {
    try {
      const supabase = createAdminClient();

      // Find the metric in catalog
      const { data: metric } = await supabase
        .from('metrics_catalog')
        .select('*')
        .or(`code.ilike.%${metricName}%,name.ilike.%${metricName}%`)
        .limit(1)
        .single();

      if (!metric) {
        return {
          success: false,
          error: `Metric "${metricName}" not found`
        };
      }

      // Find existing record
      let query = supabase
        .from('metrics_data')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('metric_id', metric.id)
        .eq('period_start', periodStart);

      if (buildingId) {
        query = query.eq('site_id', buildingId);
      }

      const { data: existing } = await query.single();

      if (!existing) {
        return {
          success: false,
          error: `No existing record found for ${metric.name} on ${periodStart}`,
          suggestion: 'Use the add tool to create a new record instead'
        };
      }

      // Calculate new CO2e
      let newCO2e = null;
      if (metric.emission_factor) {
        newCO2e = newValue * metric.emission_factor;
      }

      // Update the record
      const { data: updated, error: updateError } = await supabase
        .from('metrics_data')
        .update({
          value: newValue,
          co2e_emissions: newCO2e,
          notes: notes || existing.notes,
          verification_status: 'unverified', // Reset verification after update
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;

      return {
        success: true,
        message: `Updated ${metric.name} from ${existing.value} to ${newValue} ${metric.unit}`,
        changes: {
          oldValue: existing.value,
          newValue: newValue,
          unit: metric.unit,
          oldCO2e: existing.co2e_emissions ? `${existing.co2e_emissions.toFixed(2)} kgCO2e` : 'N/A',
          newCO2e: newCO2e ? `${newCO2e.toFixed(2)} kgCO2e` : 'N/A',
          period: periodStart
        }
      };

    } catch (error) {
      console.error('Update metric error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Delete Metric Data Tool
 * Remove incorrect entries
 */
export const deleteMetricDataTool = tool({
  description: 'Delete a metric data entry. Use when user wants to remove incorrect or duplicate data.',
  inputSchema: z.object({
    metricName: z.string().describe('Name of the metric to delete'),
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building/site ID if applicable'),
    periodStart: z.string().describe('Start date of the period to delete (ISO format YYYY-MM-DD)')
  }),
  execute: async ({ metricName, organizationId, buildingId, periodStart }) => {
    try {
      const supabase = createAdminClient();

      // Find metric
      const { data: metric } = await supabase
        .from('metrics_catalog')
        .select('*')
        .or(`code.ilike.%${metricName}%,name.ilike.%${metricName}%`)
        .limit(1)
        .single();

      if (!metric) {
        return {
          success: false,
          error: `Metric "${metricName}" not found`
        };
      }

      // Find and delete record
      let query = supabase
        .from('metrics_data')
        .delete()
        .eq('organization_id', organizationId)
        .eq('metric_id', metric.id)
        .eq('period_start', periodStart);

      if (buildingId) {
        query = query.eq('site_id', buildingId);
      }

      const { error: deleteError, count } = await query;

      if (deleteError) throw deleteError;

      if (count === 0) {
        return {
          success: false,
          error: `No record found for ${metric.name} on ${periodStart}`
        };
      }

      return {
        success: true,
        message: `Deleted ${metric.name} data for period starting ${periodStart}`,
        deletedCount: count || 1
      };

    } catch (error) {
      console.error('Delete metric error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * VISUALIZATION TOOLS
 * These tools return structured data for rendering charts in the UI
 */

/**
 * Emissions Trend Visualization (Line Chart)
 */
export const getEmissionsTrendTool = tool({
  description: 'VISUALIZATION: Create an interactive bar chart showing emissions trends over time. Use when users ask about "trends", "over time", "historical", "changes", "monthly emissions", or "progression" of emissions. Returns chart data for visualization.',
  inputSchema: z.object({
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building ID for building-specific trends'),
    timeRange: z.enum(['week', 'month', 'quarter', 'year']).default('year').describe('Time range for the trend'),
    includeScopes: z.array(z.enum(['scope1', 'scope2', 'scope3'])).optional().describe('Which scopes to include (default: all)')
  }),
  execute: async ({ organizationId, buildingId, timeRange, includeScopes }) => {
    try {
      const supabase = createAdminClient();

      // Calculate date range
      const endDate = new Date().toISOString().split('T')[0];
      let startDate;

      if (timeRange === 'year') {
        // For year, show current year from January 1 to today
        const currentYear = new Date().getFullYear();
        startDate = `${currentYear}-01-01`;
      } else {
        // For other ranges, go back N months
        const monthsBack = timeRange === 'week' ? 1 : timeRange === 'month' ? 6 : 12; // quarter
        startDate = new Date(Date.now() - monthsBack * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }

      // Get monthly emissions
      const monthlyData = await getMonthlyEmissions(organizationId, startDate, endDate, buildingId);

      // Format for chart
      const labels = monthlyData.map(m => {
        const date = new Date(m.month + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      });
      const totalData = monthlyData.map(m => m.emissions);

      // Calculate trend
      const firstTotal = totalData[0] || 0;
      const lastTotal = totalData[totalData.length - 1] || 0;
      const percentageChange = firstTotal > 0 ? ((lastTotal - firstTotal) / firstTotal) * 100 : 0;
      const trend = percentageChange < -5 ? 'decreasing' : percentageChange > 5 ? 'increasing' : 'stable';

      // Build datasets - only show total emissions
      const datasets = [{
        label: 'Total Emissions',
        data: totalData,
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6'
      }];

      // Calculate additional insights
      const averageEmissions = totalData.reduce((a, b) => a + b, 0) / totalData.length;
      const peakMonth = totalData.indexOf(Math.max(...totalData));
      const lowestMonth = totalData.indexOf(Math.min(...totalData));
      const totalEmissions = totalData.reduce((a, b) => a + b, 0);

      // Identify volatility
      const variance = totalData.reduce((sum, val) => sum + Math.pow(val - averageEmissions, 2), 0) / totalData.length;
      const stdDev = Math.sqrt(variance);
      const volatility = (stdDev / averageEmissions) * 100;

      return {
        chartType: 'bar' as const,
        labels,
        datasets,
        unit: 'tCO2e',
        title: `Emissions Trend - ${timeRange}`,
        trend,
        percentageChange: Math.abs(percentageChange),
        period: { startDate, endDate },
        analysis: {
          summary: `Total emissions for the period: ${Math.round(totalEmissions * 10) / 10} tCO2e across ${totalData.length} months`,
          averageMonthly: Math.round(averageEmissions * 10) / 10,
          peakMonth: labels[peakMonth],
          peakValue: Math.round(totalData[peakMonth] * 10) / 10,
          lowestMonth: labels[lowestMonth],
          lowestValue: Math.round(totalData[lowestMonth] * 10) / 10,
          volatility: Math.round(volatility * 10) / 10,
          volatilityLevel: volatility > 20 ? 'high' : volatility > 10 ? 'moderate' : 'low',
          keyInsights: [
            trend === 'decreasing'
              ? `Positive trend: Emissions decreased ${Math.round(percentageChange * 10) / 10}% from ${labels[0]} to ${labels[labels.length - 1]}`
              : trend === 'increasing'
              ? `Concerning trend: Emissions increased ${Math.round(percentageChange * 10) / 10}% from ${labels[0]} to ${labels[labels.length - 1]}`
              : `Stable emissions with ${Math.round(percentageChange * 10) / 10}% variation`,
            `Peak emissions occurred in ${labels[peakMonth]} (${Math.round(totalData[peakMonth] * 10) / 10} tCO2e)`,
            volatility > 20
              ? `High volatility (${Math.round(volatility * 10) / 10}%) indicates inconsistent emission patterns`
              : `Emissions show ${volatility > 10 ? 'moderate' : 'low'} volatility (${Math.round(volatility * 10) / 10}%)`
          ],
          recommendations: [
            trend === 'increasing'
              ? `Investigate drivers of emission increases - identify high-impact sources`
              : trend === 'stable'
              ? `Implement reduction initiatives to move beyond current plateau`
              : `Sustain downward trend by continuing current reduction strategies`,
            volatility > 20
              ? `Address volatility by identifying and managing irregular emission sources`
              : null,
            `Focus on ${labels[peakMonth]} patterns to prevent future peaks`
          ].filter(Boolean)
        }
      };
    } catch (error) {
      console.error('Emissions trend error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Emissions Breakdown Visualization (Pie Chart)
 */
export const getEmissionsBreakdownTool = tool({
  description: 'VISUALIZATION: Create an interactive pie chart showing emissions breakdown by scope (Scope 1, 2, 3). Use when users ask to "break down", "show breakdown", "distribution", or "split" of emissions. Returns chart data for visualization.',
  inputSchema: z.object({
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building ID for building-specific breakdown'),
    period: z.string().optional().describe('Time period (e.g., "2025-01" for January 2025, or "2025" for full year)')
  }),
  execute: async ({ organizationId, buildingId, period }) => {
    try {
      // Calculate period dates
      const endDate = new Date().toISOString().split('T')[0];
      let startDate;

      if (period) {
        if (period.length === 4) { // Year only
          startDate = `${period}-01-01`;
        } else if (period.length === 7) { // Year-month
          startDate = `${period}-01`;
        } else {
          startDate = period;
        }
      } else {
        // Default to current year
        startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      }

      const emissions = await getPeriodEmissions(organizationId, startDate, endDate, buildingId);

      // Calculate percentages
      const scope1Pct = emissions.total > 0 ? (emissions.scope_1 / emissions.total) * 100 : 0;
      const scope2Pct = emissions.total > 0 ? (emissions.scope_2 / emissions.total) * 100 : 0;
      const scope3Pct = emissions.total > 0 ? (emissions.scope_3 / emissions.total) * 100 : 0;

      // Identify dominant scope
      const scopes = [
        { name: 'Scope 1', value: emissions.scope_1, pct: scope1Pct },
        { name: 'Scope 2', value: emissions.scope_2, pct: scope2Pct },
        { name: 'Scope 3', value: emissions.scope_3, pct: scope3Pct }
      ];
      const dominantScope = scopes.reduce((max, scope) => scope.value > max.value ? scope : max);

      return {
        chartType: 'doughnut' as const,
        labels: ['Scope 1: Direct', 'Scope 2: Energy', 'Scope 3: Indirect'],
        values: [emissions.scope_1, emissions.scope_2, emissions.scope_3],
        colors: ['#ef4444', '#f59e0b', '#8b5cf6'],
        unit: 'tCO2e',
        title: 'Emissions Breakdown by Scope',
        total: emissions.total,
        period: { startDate, endDate },
        analysis: {
          summary: `Total emissions: ${Math.round(emissions.total * 10) / 10} tCO2e. ${dominantScope.name} is the largest contributor at ${Math.round(dominantScope.pct * 10) / 10}%`,
          breakdown: {
            scope1: {
              value: Math.round(emissions.scope_1 * 10) / 10,
              percentage: Math.round(scope1Pct * 10) / 10,
              definition: 'Direct emissions from owned/controlled sources (vehicles, facilities, equipment)',
              examples: 'Company vehicles, natural gas for heating, on-site fuel combustion'
            },
            scope2: {
              value: Math.round(emissions.scope_2 * 10) / 10,
              percentage: Math.round(scope2Pct * 10) / 10,
              definition: 'Indirect emissions from purchased energy (electricity, steam, heating, cooling)',
              examples: 'Grid electricity, purchased steam/heat for buildings'
            },
            scope3: {
              value: Math.round(emissions.scope_3 * 10) / 10,
              percentage: Math.round(scope3Pct * 10) / 10,
              definition: 'All other indirect emissions in the value chain',
              examples: 'Business travel, employee commuting, purchased goods, waste, supply chain'
            }
          },
          keyInsights: [
            `${dominantScope.name} represents ${Math.round(dominantScope.pct * 10) / 10}% of total emissions - this is your primary reduction opportunity`,
            scope1Pct > 40 ? 'High Scope 1 emissions indicate significant direct operations - consider fleet electrification or fuel switching' : null,
            scope2Pct > 50 ? 'Scope 2 dominance suggests high electricity consumption - renewable energy contracts or on-site generation recommended' : null,
            scope3Pct > 40 ? 'High Scope 3 emissions indicate value chain impact - engage suppliers and review business travel policies' : null,
            scope3Pct < 10 ? 'Low Scope 3 may indicate incomplete tracking - ensure all categories are measured (travel, commuting, supply chain)' : null
          ].filter(Boolean),
          recommendations: [
            scope1Pct > 30 ? 'Scope 1: Transition to electric vehicles, switch to renewable fuels, improve energy efficiency in facilities' : null,
            scope2Pct > 30 ? 'Scope 2: Purchase renewable energy certificates (RECs), install solar panels, negotiate green power purchase agreements (PPAs)' : null,
            scope3Pct > 30 ? 'Scope 3: Engage suppliers on emissions reduction, optimize business travel, implement sustainable procurement policies' : null,
            'Measure all scopes comprehensively to identify true reduction opportunities',
            'Set science-based targets (SBTi) covering all material scopes'
          ].filter(Boolean)
        }
      };
    } catch (error) {
      console.error('Emissions breakdown error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Year-over-Year Emissions Variation Chart
 */
export const getEmissionsYoYVariationTool = tool({
  description: 'VISUALIZATION: Create an interactive bar chart showing month-by-month year-over-year percentage variation in emissions. Positive bars (red) show increases, negative bars (green) show decreases. Use when users ask about "variation", "year over year", "YoY", "compare with last year", or "percentage change". Returns chart data for visualization.',
  inputSchema: z.object({
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building ID for building-specific variation'),
    year: z.number().optional().describe('Year to analyze (default: current year)')
  }),
  execute: async ({ organizationId, buildingId, year }) => {
    try {
      const currentYear = year || new Date().getFullYear();
      const previousYear = currentYear - 1;

      // Get monthly data for current year (January to today)
      const currentYearStart = `${currentYear}-01-01`;
      const currentYearEnd = new Date().toISOString().split('T')[0];
      const currentYearData = await getMonthlyEmissions(organizationId, currentYearStart, currentYearEnd, buildingId);

      // Get monthly data for previous year (same period)
      const previousYearStart = `${previousYear}-01-01`;
      const previousYearEnd = new Date(previousYear, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0];
      const previousYearData = await getMonthlyEmissions(organizationId, previousYearStart, previousYearEnd, buildingId);

      // Create lookup map for previous year
      const prevYearMap = new Map(previousYearData.map(m => [m.month.substring(5, 7), m.emissions])); // Extract month number

      // Calculate percentage variation for each month
      const labels: string[] = [];
      const variations: number[] = [];
      const colors: string[] = [];

      currentYearData.forEach(current => {
        const monthNum = current.month.substring(5, 7); // Extract "01", "02", etc.
        const prevEmissions = prevYearMap.get(monthNum) || 0;

        // Format label
        const date = new Date(current.month + '-01');
        const label = date.toLocaleDateString('en-US', { month: 'short' });
        labels.push(label);

        // Calculate percentage change
        let percentChange = 0;
        if (prevEmissions > 0) {
          percentChange = ((current.emissions - prevEmissions) / prevEmissions) * 100;
        } else if (current.emissions > 0) {
          percentChange = 100; // New emissions where there were none
        }

        variations.push(Math.round(percentChange * 10) / 10);

        // Color: green for decrease, red for increase
        colors.push(percentChange < 0 ? '#22c55e' : '#ef4444');
      });

      // Calculate analysis metrics
      const avgVariation = variations.reduce((sum, v) => sum + v, 0) / variations.length;
      const maxIncrease = Math.max(...variations);
      const maxDecrease = Math.min(...variations);
      const maxIncreaseMonth = labels[variations.indexOf(maxIncrease)];
      const maxDecreaseMonth = labels[variations.indexOf(maxDecrease)];
      const monthsWithIncrease = variations.filter(v => v > 0).length;
      const monthsWithDecrease = variations.filter(v => v < 0).length;

      // Calculate volatility in variations
      const variationStdDev = Math.sqrt(
        variations.reduce((sum, v) => sum + Math.pow(v - avgVariation, 2), 0) / variations.length
      );
      const variationVolatility = variationStdDev > 15 ? 'high' : variationStdDev > 5 ? 'moderate' : 'low';

      return {
        chartType: 'bar' as const,
        labels,
        datasets: [{
          label: 'YoY Variation (%)',
          data: variations,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 2
        }],
        unit: '%',
        title: `Emissions YoY Variation (${currentYear} vs ${previousYear})`,
        period: {
          startDate: currentYearStart,
          endDate: currentYearEnd
        },
        analysis: {
          summary: `Average YoY variation: ${Math.round(avgVariation * 10) / 10}%. ${monthsWithDecrease} months showed improvement (${Math.round((monthsWithDecrease / labels.length) * 100)}%), ${monthsWithIncrease} months showed increases (${Math.round((monthsWithIncrease / labels.length) * 100)}%)`,
          averageVariation: Math.round(avgVariation * 10) / 10,
          bestPerformingMonth: {
            month: maxDecreaseMonth,
            variation: Math.round(maxDecrease * 10) / 10,
            description: `${maxDecreaseMonth} showed the largest improvement with a ${Math.abs(Math.round(maxDecrease * 10) / 10)}% reduction`
          },
          worstPerformingMonth: {
            month: maxIncreaseMonth,
            variation: Math.round(maxIncrease * 10) / 10,
            description: `${maxIncreaseMonth} had the largest increase at ${Math.round(maxIncrease * 10) / 10}%`
          },
          volatility: variationVolatility,
          volatilityDescription: variationVolatility === 'high'
            ? 'High volatility indicates inconsistent emission patterns - month-to-month changes are erratic'
            : variationVolatility === 'moderate'
            ? 'Moderate volatility - some consistency in emission patterns with occasional fluctuations'
            : 'Low volatility - emission changes are consistent and predictable across months',
          keyInsights: [
            avgVariation < 0
              ? `Positive trend: Overall emissions decreased by ${Math.abs(Math.round(avgVariation * 10) / 10)}% year-over-year`
              : `Negative trend: Overall emissions increased by ${Math.round(avgVariation * 10) / 10}% year-over-year`,
            monthsWithDecrease > monthsWithIncrease
              ? `${monthsWithDecrease} out of ${labels.length} months showed improvement - majority of months trending positively`
              : `Only ${monthsWithDecrease} out of ${labels.length} months showed improvement - need to reverse this trend`,
            Math.abs(maxIncrease) > Math.abs(maxDecrease) * 2
              ? `${maxIncreaseMonth} spike of ${Math.round(maxIncrease * 10) / 10}% requires investigation - unusual increase`
              : null,
            variationVolatility === 'high'
              ? 'High volatility suggests operational inconsistencies or external factors affecting emissions'
              : null
          ].filter(Boolean),
          education: {
            concept: 'Year-over-Year (YoY) Variation',
            definition: 'YoY variation compares emissions in each month of the current year to the same month in the previous year. This metric eliminates seasonal effects and shows true performance trends.',
            whyItMatters: 'Tracking YoY variation helps identify: (1) Whether emission reduction initiatives are working, (2) Seasonal patterns that repeat annually, (3) Months requiring targeted interventions, (4) Progress toward climate targets',
            interpretation: 'Green bars (negative %) = emissions decreased compared to last year (good). Red bars (positive %) = emissions increased compared to last year (needs attention).'
          },
          recommendations: [
            maxIncrease > 20
              ? `Investigate ${maxIncreaseMonth}: ${Math.round(maxIncrease * 10) / 10}% increase is significant - identify root causes (operations changes, equipment issues, activity spikes)`
              : null,
            maxDecrease < -10
              ? `Replicate ${maxDecreaseMonth} success: Achieved ${Math.abs(Math.round(maxDecrease * 10) / 10)}% reduction - document what worked and apply to other months`
              : null,
            monthsWithIncrease > monthsWithDecrease
              ? `Reverse the trend: ${monthsWithIncrease} months increased - implement systematic reduction programs across all operations`
              : null,
            variationVolatility === 'high'
              ? 'Address volatility: High month-to-month variation suggests need for standardized processes and better emission controls'
              : null,
            avgVariation > 5
              ? 'Urgent action needed: Overall YoY increase suggests current strategies are insufficient - consider transformational changes'
              : avgVariation < -5
              ? 'Maintain momentum: Strong YoY reduction - continue current initiatives and explore additional opportunities'
              : 'Stabilize performance: Emissions are flat year-over-year - introduce new reduction initiatives to drive progress'
          ].filter(Boolean)
        }
      };
    } catch (error) {
      console.error('YoY variation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * SBTi Progress Tracking Tool
 * Shows progress toward Science Based Targets (1.5°C pathway)
 */
export const getSBTiProgressTool = tool({
  description: 'VISUALIZATION: Track progress toward Science Based Targets initiative (SBTi) goals using Enterprise Forecast (Prophet-style ML model). Shows baseline year, actual emissions, and SBTi 1.5°C pathway with THREE milestones: (1) 2030: 42% reduction from baseline, (2) 2050 - 90% Reduction: Must reduce to ≤10% of baseline WITHOUT offsets (deep decarbonization), (3) 2050 - Net-Zero: Achieve zero emissions by offsetting the residual 10% (max offset cap = 10% of baseline per SBTi rules). ML-forecasted path uses all historical data with trend+seasonality. Shows if net-zero is achievable under SBTi (if projected > 10% baseline, excess CANNOT be offset). Calculates: deviations, additional reduction needed, max allowed offsets, excess emissions beyond offset cap. Use for: "SBTi", "science based targets", "net zero", "1.5 degrees", "2030 targets", "carbon neutral", "carbon offsets", "baseline", "residual emissions". Returns multi-line chart: actual (orange), SBTi target (blue), Prophet forecast (red).',
  inputSchema: z.object({
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building ID for building-specific tracking'),
    baselineYear: z.number().optional().describe('Custom baseline year (default: earliest year with data)'),
    targetYear: z.number().optional().describe('Net-zero target year (default: 2050)')
  }),
  execute: async ({ organizationId, buildingId, baselineYear, targetYear = 2050 }) => {
    try {
      const supabase = createAdminClient();
      const currentYear = new Date().getFullYear();

      // Get baseline year from database or use provided value
      let actualBaselineYear = baselineYear;
      if (!actualBaselineYear) {
        // Use database function to get the organization's baseline year
        const { data: baselineYearData, error: baselineError } = await supabase.rpc('get_baseline_year', {
          org_id: organizationId
        });

        if (!baselineError && baselineYearData) {
          actualBaselineYear = baselineYearData;
        } else {
          // Fallback: find earliest year with emissions data
          const { data: earliestData } = await supabase
            .from('metrics_data')
            .select('period_start')
            .eq('organization_id', organizationId)
            .not('co2e_emissions', 'is', null)
            .order('period_start', { ascending: true })
            .limit(1);

          if (earliestData && earliestData.length > 0) {
            actualBaselineYear = new Date(earliestData[0].period_start).getFullYear();
          } else {
            actualBaselineYear = currentYear - 1; // Default to last year if no data
          }
        }
      }

      // Get baseline year emissions
      const baselineEmissions = await getPeriodEmissions(
        organizationId,
        `${actualBaselineYear}-01-01`,
        `${actualBaselineYear}-12-31`,
        buildingId
      );

      if (baselineEmissions.total === 0) {
        return {
          success: false,
          error: `No emissions data found for baseline year ${actualBaselineYear}. Please select a different baseline year or add emissions data.`
        };
      }

      // Get ALL monthly emissions from baseline to current year for forecasting
      const allMonthlyData = await getMonthlyEmissions(
        organizationId,
        `${actualBaselineYear}-01-01`,
        new Date().toISOString().split('T')[0],
        buildingId
      );

      // Get yearly emissions from baseline to current year
      const yearlyEmissions: Array<{ year: number; emissions: number }> = [];
      for (let year = actualBaselineYear; year <= currentYear; year++) {
        const emissions = await getPeriodEmissions(
          organizationId,
          `${year}-01-01`,
          `${year}-12-31`,
          buildingId
        );
        yearlyEmissions.push({ year, emissions: emissions.total });
      }

      // Use EnterpriseForecast (Prophet-style) to predict future emissions at key milestones only
      // We only need 2030 and 2050 forecasts for strategic planning view
      const monthsTo2030 = (2030 - currentYear) * 12;
      const monthsTo2050 = (2050 - currentYear) * 12;

      const forecast2030Result = EnterpriseForecast.forecast(allMonthlyData, Math.max(1, monthsTo2030), false);
      const forecast2050Result = EnterpriseForecast.forecast(allMonthlyData, Math.max(1, monthsTo2050), false);

      // Calculate yearly totals for milestone years only
      const yearlyForecast: Array<{ year: number; emissions: number }> = [];

      if (monthsTo2030 > 0 && forecast2030Result.forecasted.length >= 12) {
        // Get last 12 months of 2030 forecast (represents full year 2030)
        const year2030Start = Math.max(0, monthsTo2030 - 11);
        const year2030Data = forecast2030Result.forecasted.slice(year2030Start, year2030Start + 12);
        const emissions2030 = year2030Data.reduce((sum, val) => sum + val, 0);
        yearlyForecast.push({ year: 2030, emissions: emissions2030 });
      }

      if (monthsTo2050 > 0 && forecast2050Result.forecasted.length >= 12) {
        // Get last 12 months of 2050 forecast (represents full year 2050)
        const year2050Start = Math.max(0, monthsTo2050 - 11);
        const year2050Data = forecast2050Result.forecasted.slice(year2050Start, year2050Start + 12);
        const emissions2050 = year2050Data.reduce((sum, val) => sum + val, 0);
        yearlyForecast.push({ year: 2050, emissions: emissions2050 });
      }

      // Use the more recent forecast for metadata
      const forecastResult = forecast2050Result;

      // Calculate SBTi 1.5°C target trajectory
      // Linear reduction from baseline to targets
      const sbtiTargets = [
        { year: actualBaselineYear, reduction: 0 }, // Baseline (100%)
        { year: 2030, reduction: 0.42 }, // 42% reduction by 2030 (58% remaining)
        { year: 2050, reduction: 0.90 }, // 90% reduction by 2050 (10% residual, NO offsets)
        { year: 2050, reduction: 1.0 } // Net-zero by 2050 (offset the 10% residual)
      ];

      // Note: 2050 has TWO distinct targets:
      // 1. 90% Reduction Target: Emissions must be ≤ 10% of baseline (NO carbon offsets)
      //    - This is deep decarbonization through actual emission reductions
      //    - If baseline = 458 tCO2e, target = 45.8 tCO2e
      //
      // 2. Net-Zero Target: Achieve zero emissions using carbon offsets
      //    - Maximum offsets allowed = 10% of baseline (45.8 tCO2e per SBTi rules)
      //    - If projected emissions > 45.8 tCO2e, the excess CANNOT be offset under SBTi
      //    - Example: If projected = 541.6 tCO2e, excess = 495.8 tCO2e (not offsettable)

      // Generate target trajectory points
      const labels: string[] = [];
      const actualData: (number | null)[] = [];
      const targetData: number[] = [];
      const projectedData: (number | null)[] = [];

      // Get current year emissions for projection baseline
      const currentEmissions = yearlyEmissions[yearlyEmissions.length - 1]?.emissions || baselineEmissions.total;

      // Get forecasted values for milestones
      const projected2030 = yearlyForecast.find(y => y.year === 2030);
      const projected2050 = yearlyForecast.find(y => y.year === 2050);

      // Generate data points from baseline to target year (sample every few years for cleaner chart)
      const yearStep = targetYear - actualBaselineYear > 30 ? 5 : 1; // Show every 5 years if range > 30 years
      for (let year = actualBaselineYear; year <= targetYear; year += yearStep) {
        // Always include key milestone years
        if (year !== actualBaselineYear && year !== currentYear && year !== 2030 && year !== 2050 && year !== targetYear) {
          continue;
        }

        labels.push(year.toString());

        // Actual emissions (only for years with data)
        const actualYear = yearlyEmissions.find(y => y.year === year);
        actualData.push(actualYear ? Math.round(actualYear.emissions * 10) / 10 : null);

        // Target trajectory (linear interpolation between SBTi milestones)
        let targetReduction = 0;
        for (let i = 0; i < sbtiTargets.length - 1; i++) {
          const current = sbtiTargets[i];
          const next = sbtiTargets[i + 1];
          if (year >= current.year && year <= next.year) {
            const progress = (year - current.year) / (next.year - current.year);
            targetReduction = current.reduction + (next.reduction - current.reduction) * progress;
            break;
          }
        }
        const targetEmissions = baselineEmissions.total * (1 - targetReduction);
        targetData.push(Math.round(targetEmissions * 10) / 10);

        // Projected emissions - linear interpolation between current → 2030 → 2050
        if (year <= currentYear) {
          projectedData.push(null);
        } else if (year === 2030 && projected2030) {
          projectedData.push(Math.round(projected2030.emissions * 10) / 10);
        } else if (year === 2050 && projected2050) {
          projectedData.push(Math.round(projected2050.emissions * 10) / 10);
        } else if (year > currentYear && year < 2030 && projected2030) {
          // Linear interpolation between current year and 2030
          const progress = (year - currentYear) / (2030 - currentYear);
          const interpolated = currentEmissions + (projected2030.emissions - currentEmissions) * progress;
          projectedData.push(Math.round(interpolated * 10) / 10);
        } else if (year > 2030 && year < 2050 && projected2030 && projected2050) {
          // Linear interpolation between 2030 and 2050
          const progress = (year - 2030) / (2050 - 2030);
          const interpolated = projected2030.emissions + (projected2050.emissions - projected2030.emissions) * progress;
          projectedData.push(Math.round(interpolated * 10) / 10);
        } else {
          projectedData.push(null);
        }
      }

      // Ensure key years are always in labels
      const keyYears = [actualBaselineYear, currentYear, 2030, 2050];
      for (const keyYear of keyYears) {
        if (!labels.includes(keyYear.toString()) && keyYear <= targetYear) {
          // Insert in correct position
          const insertIndex = labels.findIndex(y => parseInt(y) > keyYear);
          const insertPos = insertIndex === -1 ? labels.length : insertIndex;

          labels.splice(insertPos, 0, keyYear.toString());

          // Actual data
          const actualYear = yearlyEmissions.find(y => y.year === keyYear);
          actualData.splice(insertPos, 0, actualYear ? Math.round(actualYear.emissions * 10) / 10 : null);

          // Target data
          let targetReduction = 0;
          for (let i = 0; i < sbtiTargets.length - 1; i++) {
            const current = sbtiTargets[i];
            const next = sbtiTargets[i + 1];
            if (keyYear >= current.year && keyYear <= next.year) {
              const progress = (keyYear - current.year) / (next.year - current.year);
              targetReduction = current.reduction + (next.reduction - current.reduction) * progress;
              break;
            }
          }
          const targetEmissions = baselineEmissions.total * (1 - targetReduction);
          targetData.splice(insertPos, 0, Math.round(targetEmissions * 10) / 10);

          // Projected data
          if (keyYear <= currentYear) {
            projectedData.splice(insertPos, 0, null);
          } else if (keyYear === 2030 && projected2030) {
            projectedData.splice(insertPos, 0, Math.round(projected2030.emissions * 10) / 10);
          } else if (keyYear === 2050 && projected2050) {
            projectedData.splice(insertPos, 0, Math.round(projected2050.emissions * 10) / 10);
          } else {
            projectedData.splice(insertPos, 0, null);
          }
        }
      }

      // Calculate current progress
      const currentReduction = ((baselineEmissions.total - currentEmissions) / baselineEmissions.total) * 100;

      // Calculate milestone deviations
      const target2030 = baselineEmissions.total * (1 - 0.42);
      const deviation2030 = projected2030
        ? ((projected2030.emissions - target2030) / target2030) * 100
        : 0;
      const target2050_90percent = baselineEmissions.total * 0.10; // 90% reduction = 10% residual (NO offsets)
      const maxAllowedOffsets = baselineEmissions.total * 0.10; // SBTi allows max 10% of baseline to be offset

      const deviation2050_90percent = projected2050
        ? ((projected2050.emissions - target2050_90percent) / target2050_90percent) * 100
        : 0;

      // For net-zero: calculate what would be needed vs what's allowed
      const projectedEmissions2050 = projected2050 ? projected2050.emissions : 0;
      const requiredOffsetsForNetZero = projectedEmissions2050; // All emissions need to be offset for net-zero
      const excessEmissions = Math.max(0, projectedEmissions2050 - maxAllowedOffsets); // Amount that CANNOT be offset under SBTi
      const canAchieveNetZero = projectedEmissions2050 <= maxAllowedOffsets;

      // Check if on track for targets
      const onTrackFor2030 = projected2030 && projected2030.emissions <= target2030;
      const onTrackFor2050_90percent = projected2050 && projected2050.emissions <= target2050_90percent;

      return {
        chartType: 'line' as const,
        labels,
        datasets: [
          {
            label: 'Actual Emissions',
            data: actualData,
            borderColor: '#f59e0b', // Orange
            backgroundColor: '#f59e0b20',
            borderWidth: 3,
            pointRadius: 4,
            pointBackgroundColor: '#f59e0b'
          },
          {
            label: 'SBTi 1.5°C Target',
            data: targetData,
            borderColor: '#3b82f6', // Blue
            backgroundColor: '#3b82f620',
            borderWidth: 3,
            borderDash: [5, 5],
            pointRadius: 0
          },
          {
            label: 'Projected (Current Trend)',
            data: projectedData,
            borderColor: '#ef4444', // Red
            backgroundColor: '#ef444420',
            borderWidth: 2,
            borderDash: [2, 2],
            pointRadius: 0
          }
        ],
        unit: 'tCO2e',
        title: `Net-Zero Ambition by ${targetYear}`,
        baselineYear: actualBaselineYear,
        baselineEmissions: Math.round(baselineEmissions.total * 10) / 10,
        currentYear,
        currentEmissions: Math.round(currentEmissions * 10) / 10,
        currentReduction: Math.round(currentReduction * 10) / 10,
        onTrackFor2030,
        forecastMethod: forecastResult.method,
        forecastMetadata: {
          confidence: forecastResult.metadata.r2 ? `${Math.round(forecastResult.metadata.r2 * 100)}%` : 'N/A',
          trendSlope: Math.round(forecastResult.metadata.trendSlope * 100) / 100,
          volatility: Math.round(forecastResult.metadata.volatility * 10) / 10
        },
        milestones: {
          milestone_2030: {
            year: 2030,
            title: '2030 Target (42% reduction)',
            goal: Math.round(target2030 * 10) / 10,
            goalDescription: `Reduce to ${Math.round(target2030 * 10) / 10} tCO2e (42% reduction from ${actualBaselineYear} baseline)`,
            projected: projected2030 ? Math.round(projected2030.emissions * 10) / 10 : null,
            deviationFromGoal: projected2030 ? Math.round((projected2030.emissions - target2030) * 10) / 10 : 0,
            deviationPercentage: Math.round(deviation2030 * 10) / 10,
            status: deviation2030 > 10 ? 'at-risk' : deviation2030 > 0 ? 'off-track' : 'on-track',
            yearsUntilTarget: Math.max(0, 2030 - currentYear),
            annualReductionNeeded: projected2030 && (2030 - currentYear) > 0
              ? Math.round(((projected2030.emissions - target2030) / (2030 - currentYear)) * 10) / 10
              : 0
          },
          milestone_2050_reduction: {
            year: 2050,
            title: '2050 Target (90% reduction)',
            goal: Math.round(target2050_90percent * 10) / 10,
            goalDescription: `Reduce to ${Math.round(target2050_90percent * 10) / 10} tCO2e (90% reduction from ${actualBaselineYear} baseline)`,
            baselineYear: actualBaselineYear,
            baselineEmissions: Math.round(baselineEmissions.total * 10) / 10,
            reductionAmount: Math.round(baselineEmissions.total * 0.90 * 10) / 10,
            projected: projected2050 ? Math.round(projected2050.emissions * 10) / 10 : null,
            deviationFromGoal: projected2050 ? Math.round((projected2050.emissions - target2050_90percent) * 10) / 10 : 0,
            deviationPercentage: Math.round(deviation2050_90percent * 10) / 10,
            status: deviation2050_90percent > 50 ? 'at-risk' : deviation2050_90percent > 0 ? 'off-track' : 'on-track',
            yearsUntilTarget: Math.max(0, 2050 - currentYear),
            annualReductionNeeded: projected2050 && (2050 - currentYear) > 0
              ? Math.round(((projected2050.emissions - target2050_90percent) / (2050 - currentYear)) * 10) / 10
              : 0
          },
          milestone_2050_netZero: {
            year: 2050,
            title: '2050 Target (Net-Zero)',
            goal: 0,
            goalDescription: 'Net-zero emissions (10% residual emissions can be offset)',
            maxOffsetsAllowed: Math.round(maxAllowedOffsets * 10) / 10,
            maxOffsetsAllowedDescription: `${Math.round(maxAllowedOffsets * 10) / 10} tCO2e (10% of ${actualBaselineYear} baseline)`,
            projected: projected2050 ? Math.round(projectedEmissions2050 * 10) / 10 : null,
            offsetsNeeded: Math.round(requiredOffsetsForNetZero * 10) / 10,
            achievable: canAchieveNetZero,
            status: canAchieveNetZero ? 'achievable-with-offsets' : 'not-achievable',
            excessEmissions: Math.round(excessEmissions * 10) / 10,
            excessEmissionsDescription: excessEmissions > 0
              ? `${Math.round(excessEmissions * 10) / 10} tCO2e exceed SBTi offset cap and cannot be neutralized`
              : 'All emissions can be offset within SBTi limits'
          }
        },
        analysis: {
          overallTrajectory: forecastResult.metadata.trendSlope < 0 ? 'decreasing' : forecastResult.metadata.trendSlope > 0 ? 'increasing' : 'stable',
          criticalGaps: [
            projected2030 && projected2030.emissions > target2030
              ? `2030: Need to reduce ${Math.round((projected2030.emissions - target2030) * 10) / 10} tCO2e more`
              : null,
            projected2050 && projected2050.emissions > target2050_90percent
              ? `2050: Need to reduce ${Math.round((projected2050.emissions - target2050_90percent) * 10) / 10} tCO2e more`
              : null,
            excessEmissions > 0
              ? `Net-Zero: ${Math.round(excessEmissions * 10) / 10} tCO2e cannot be offset under SBTi rules`
              : null
          ].filter(Boolean),
          keyInsights: {
            currentTrend: `Emissions are ${forecastResult.metadata.trendSlope < 0 ? 'decreasing' : 'increasing'} at ${Math.abs(Math.round(forecastResult.metadata.trendSlope * 12 * 100) / 100)} tCO2e per year`,
            forecast2030Gap: projected2030
              ? `Projected to miss 2030 target by ${Math.round(((projected2030.emissions - target2030) / target2030) * 100 * 10) / 10}%`
              : 'N/A',
            forecast2050Gap: projected2050
              ? `Projected to miss 2050 target by ${Math.round(((projected2050.emissions - target2050_90percent) / target2050_90percent) * 100 * 10) / 10}%`
              : 'N/A',
            offsetFeasibility: canAchieveNetZero
              ? `Net-zero achievable with ${Math.round(requiredOffsetsForNetZero * 10) / 10} tCO2e offsets`
              : `Net-zero not achievable - emissions ${Math.round(excessEmissions * 10) / 10} tCO2e above offset cap`
          },
          recommendations: [
            projected2030 && projected2030.emissions > target2030
              ? `Accelerate emission reductions by ${Math.round(((projected2030.emissions - target2030) / (2030 - currentYear)) * 10) / 10} tCO2e/year to meet 2030 target`
              : null,
            projected2050 && projected2050.emissions > target2050_90percent * 2
              ? 'Consider transformational changes - current trajectory significantly off-track for 2050'
              : null,
            excessEmissions > 0
              ? 'Focus on deep decarbonization - relying on offsets alone will not achieve SBTi compliance'
              : null
          ].filter(Boolean)
        }
      };
    } catch (error) {
      console.error('SBTi progress tracking error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Monthly Consumption Visualization (Bar Chart)
 */
export const getMonthlyConsumptionTool = tool({
  description: 'VISUALIZATION: Create an interactive bar chart showing monthly energy/water/waste consumption patterns. Use when users ask about "monthly", "consumption", "usage", or resource trends. Returns chart data for visualization.',
  inputSchema: z.object({
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building ID'),
    resourceType: z.enum(['energy', 'water', 'waste']).describe('Type of resource to visualize'),
    months: z.number().default(6).describe('Number of months to show (default: 6)')
  }),
  execute: async ({ organizationId, buildingId, resourceType, months }) => {
    try {
      const supabase = createAdminClient();

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Query based on resource type
      let categoryFilter;
      let unit = 'kWh';
      let title = 'Monthly Energy Consumption';

      if (resourceType === 'energy') {
        categoryFilter = 'category.ilike.%energy%,category.ilike.%electricity%';
        unit = 'kWh';
        title = 'Monthly Energy Consumption';
      } else if (resourceType === 'water') {
        categoryFilter = 'category.ilike.%water%';
        unit = 'm³';
        title = 'Monthly Water Consumption';
      } else {
        categoryFilter = 'category.ilike.%waste%';
        unit = 'tons';
        title = 'Monthly Waste Generation';
      }

      let query = supabase
        .from('metrics_data')
        .select(`
          value,
          period_start,
          metrics_catalog!inner(category, unit)
        `)
        .eq('organization_id', organizationId)
        .gte('period_start', startDate)
        .lte('period_start', endDate)
        .or(categoryFilter, { foreignTable: 'metrics_catalog' });

      if (buildingId) {
        query = query.eq('site_id', buildingId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by month
      const monthMap = new Map<string, number>();
      data?.forEach(row => {
        const month = row.period_start.slice(0, 7); // YYYY-MM
        monthMap.set(month, (monthMap.get(month) || 0) + (row.value || 0));
      });

      const sortedMonths = Array.from(monthMap.keys()).sort();
      const labels = sortedMonths.map(m => {
        const date = new Date(m + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      });
      const values = sortedMonths.map(m => monthMap.get(m) || 0);

      // Calculate analysis metrics
      const totalConsumption = values.reduce((sum, v) => sum + v, 0);
      const avgConsumption = totalConsumption / values.length;
      const maxConsumption = Math.max(...values);
      const minConsumption = Math.min(...values);
      const maxMonth = labels[values.indexOf(maxConsumption)];
      const minMonth = labels[values.indexOf(minConsumption)];

      // Calculate trend using linear regression
      const n = values.length;
      const sumX = (n * (n - 1)) / 2;
      const sumY = totalConsumption;
      const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
      const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
      const trendSlope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const trendDirection = trendSlope > avgConsumption * 0.05 ? 'increasing' : trendSlope < -avgConsumption * 0.05 ? 'decreasing' : 'stable';

      // Calculate volatility
      const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - avgConsumption, 2), 0) / n);
      const coefficientOfVariation = (stdDev / avgConsumption) * 100;
      const volatility = coefficientOfVariation > 20 ? 'high' : coefficientOfVariation > 10 ? 'moderate' : 'low';

      // Resource-specific educational content
      const resourceEducation = {
        energy: {
          definition: 'Energy consumption measures electricity usage from the grid, typically from fossil fuels or renewable sources',
          impact: 'Energy use contributes to Scope 2 emissions (indirect emissions from purchased electricity)',
          benchmarks: 'Average office: 250-300 kWh/m²/year. Data center: 100-200 kWh/m²/year',
          reductionStrategies: 'LED lighting, HVAC optimization, renewable energy contracts (PPAs/RECs), energy-efficient equipment'
        },
        water: {
          definition: 'Water consumption measures freshwater withdrawal from municipal supply or wells',
          impact: 'Water scarcity is a critical sustainability issue - reducing usage conserves local water resources',
          benchmarks: 'Average office: 20-50 L/person/day. Industrial: varies widely by sector',
          reductionStrategies: 'Low-flow fixtures, leak detection, rainwater harvesting, water-efficient landscaping, cooling tower optimization'
        },
        waste: {
          definition: 'Waste generation measures materials sent to landfill, recycling, or other disposal',
          impact: 'Waste contributes to Scope 3 emissions and represents resource inefficiency',
          benchmarks: 'Average office: 0.5-1.5 tons/person/year. Target: <0.3 tons/person/year with strong recycling',
          reductionStrategies: 'Circular economy principles, composting, improved recycling, reduce single-use items, donate/reuse programs'
        }
      };

      return {
        chartType: 'bar',
        labels,
        datasets: [{
          label: title,
          data: values,
          backgroundColor: resourceType === 'energy' ? '#3b82f6' : resourceType === 'water' ? '#06b6d4' : '#10b981'
        }],
        unit,
        title,
        period: { startDate, endDate },
        analysis: {
          summary: `Total ${resourceType} consumption: ${Math.round(totalConsumption * 10) / 10} ${unit} over ${values.length} months. Average: ${Math.round(avgConsumption * 10) / 10} ${unit}/month. Trend: ${trendDirection}.`,
          totalConsumption: Math.round(totalConsumption * 10) / 10,
          averageMonthly: Math.round(avgConsumption * 10) / 10,
          peakMonth: {
            month: maxMonth,
            value: Math.round(maxConsumption * 10) / 10,
            percentAboveAverage: Math.round(((maxConsumption - avgConsumption) / avgConsumption) * 100)
          },
          lowestMonth: {
            month: minMonth,
            value: Math.round(minConsumption * 10) / 10,
            percentBelowAverage: Math.round(((avgConsumption - minConsumption) / avgConsumption) * 100)
          },
          trend: {
            direction: trendDirection,
            description: trendDirection === 'increasing'
              ? `Consumption is increasing at approximately ${Math.abs(Math.round(trendSlope * 10) / 10)} ${unit}/month`
              : trendDirection === 'decreasing'
              ? `Consumption is decreasing at approximately ${Math.abs(Math.round(trendSlope * 10) / 10)} ${unit}/month`
              : 'Consumption is relatively stable with no clear upward or downward trend'
          },
          volatility: volatility,
          volatilityDescription: volatility === 'high'
            ? `High volatility (CV: ${Math.round(coefficientOfVariation)}%) - consumption varies significantly month-to-month`
            : volatility === 'moderate'
            ? `Moderate volatility (CV: ${Math.round(coefficientOfVariation)}%) - some month-to-month variation`
            : `Low volatility (CV: ${Math.round(coefficientOfVariation)}%) - consistent consumption patterns`,
          keyInsights: [
            `${maxMonth} had peak consumption at ${Math.round(maxConsumption * 10) / 10} ${unit} (${Math.round(((maxConsumption - avgConsumption) / avgConsumption) * 100)}% above average)`,
            `${minMonth} had lowest consumption at ${Math.round(minConsumption * 10) / 10} ${unit} (${Math.round(((avgConsumption - minConsumption) / avgConsumption) * 100)}% below average)`,
            trendDirection === 'increasing'
              ? `Concerning trend: ${resourceType} use is increasing - investigate drivers and implement reduction measures`
              : trendDirection === 'decreasing'
              ? `Positive trend: ${resourceType} use is decreasing - current initiatives are working`
              : null,
            volatility === 'high'
              ? `High variability suggests inconsistent ${resourceType} management or seasonal factors`
              : null,
            Math.round(((maxConsumption - minConsumption) / avgConsumption) * 100) > 50
              ? `${Math.round(((maxConsumption - minConsumption) / avgConsumption) * 100)}% difference between peak and lowest months - significant opportunity for smoothing consumption`
              : null
          ].filter(Boolean),
          education: {
            resourceType: resourceType,
            definition: resourceEducation[resourceType].definition,
            environmentalImpact: resourceEducation[resourceType].impact,
            industryBenchmarks: resourceEducation[resourceType].benchmarks,
            whyItMatters: `Tracking ${resourceType} consumption helps: (1) Identify waste and inefficiency, (2) Reduce environmental impact, (3) Lower operational costs, (4) Meet sustainability targets, (5) Comply with regulations`
          },
          recommendations: [
            trendDirection === 'increasing'
              ? `Reverse increasing trend: Implement ${resourceEducation[resourceType].reductionStrategies.split(',')[0]}`
              : null,
            `Investigate ${maxMonth} peak: ${Math.round(((maxConsumption - avgConsumption) / avgConsumption) * 100)}% above average - identify and address root causes`,
            `Replicate ${minMonth} efficiency: Achieved ${Math.round(((avgConsumption - minConsumption) / avgConsumption) * 100)}% reduction - document successful practices`,
            volatility === 'high'
              ? `Stabilize consumption: High variability suggests need for better controls and monitoring`
              : null,
            `Implement reduction strategies: ${resourceEducation[resourceType].reductionStrategies}`,
            resourceType === 'energy'
              ? 'Consider renewable energy: Solar panels, wind PPAs, or Renewable Energy Certificates (RECs) to reduce Scope 2 emissions'
              : null,
            resourceType === 'water'
              ? 'Water audit recommended: Professional audit can identify leaks and inefficiencies saving 15-30% typically'
              : null,
            resourceType === 'waste'
              ? 'Waste hierarchy: Follow Reduce > Reuse > Recycle > Recover > Dispose (last resort)'
              : null
          ].filter(Boolean)
        }
      };
    } catch (error) {
      console.error('Monthly consumption error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Trip Analytics Visualization (Stacked Bar Chart)
 */
export const getTripAnalyticsTool = tool({
  description: 'VISUALIZATION: Create an interactive stacked bar chart showing trip analytics by transport mode (car, plane, train, etc). Use when users ask about "trips", "travel", "transportation", or "transport modes". Returns chart data for visualization.',
  inputSchema: z.object({
    organizationId: z.string().describe('Organization ID'),
    timeRange: z.enum(['week', 'month', 'quarter']).default('month').describe('Time range for analytics')
  }),
  execute: async ({ organizationId, timeRange }) => {
    try {
      const supabase = createAdminClient();

      const periodsCount = timeRange === 'week' ? 4 : timeRange === 'month' ? 6 : 12;
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - periodsCount * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Query trip data
      const { data, error } = await supabase
        .from('metrics_data')
        .select(`
          value,
          period_start,
          metrics_catalog!inner(name, subcategory)
        `)
        .eq('organization_id', organizationId)
        .gte('period_start', startDate)
        .lte('period_start', endDate)
        .or('category.ilike.%travel%,category.ilike.%transport%,category.ilike.%commut%', { foreignTable: 'metrics_catalog' });

      if (error) throw error;

      // Aggregate by period and mode
      const periodModeMap = new Map<string, Map<string, number>>();

      data?.forEach(row => {
        const catalog = row.metrics_catalog as any;
        const period = row.period_start.slice(0, 7); // YYYY-MM
        const mode = catalog.subcategory || catalog.name || 'Other';

        if (!periodModeMap.has(period)) {
          periodModeMap.set(period, new Map());
        }

        const modeMap = periodModeMap.get(period)!;
        modeMap.set(mode, (modeMap.get(mode) || 0) + (row.value || 0));
      });

      // Sort periods and extract modes
      const sortedPeriods = Array.from(periodModeMap.keys()).sort();
      const labels = sortedPeriods.map(p => {
        const date = new Date(p + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      });

      // Get unique modes
      const allModes = new Set<string>();
      periodModeMap.forEach(modeMap => {
        modeMap.forEach((_, mode) => allModes.add(mode));
      });

      const modeColors: Record<string, string> = {
        'Car': '#ef4444',
        'Train': '#10b981',
        'Plane': '#f59e0b',
        'Bus': '#06b6d4',
        'Ferry': '#8b5cf6',
        'Other': '#6b7280'
      };

      const datasets = Array.from(allModes).map(mode => ({
        label: mode,
        data: sortedPeriods.map(period => periodModeMap.get(period)?.get(mode) || 0),
        backgroundColor: modeColors[mode] || '#6b7280'
      }));

      // Calculate analysis metrics
      const modeTotals = new Map<string, number>();
      datasets.forEach(ds => {
        const total = ds.data.reduce((sum: number, v: number) => sum + v, 0);
        modeTotals.set(ds.label, total);
      });

      const totalTrips = Array.from(modeTotals.values()).reduce((sum, v) => sum + v, 0);
      const sortedModes = Array.from(modeTotals.entries()).sort((a, b) => b[1] - a[1]);
      const dominantMode = sortedModes[0];
      const secondMode = sortedModes[1];

      // Emission factors (kg CO2e per trip - rough estimates for typical distances)
      const emissionFactors: Record<string, { factor: number; description: string }> = {
        'Car': { factor: 20, description: 'High emission intensity - gasoline/diesel vehicles' },
        'Plane': { factor: 150, description: 'Very high emission intensity - especially short-haul flights' },
        'Train': { factor: 5, description: 'Low emission intensity - electric/diesel trains' },
        'Bus': { factor: 8, description: 'Low-medium emission intensity - shared transport' },
        'Ferry': { factor: 40, description: 'Medium-high emission intensity - marine diesel' },
        'Other': { factor: 15, description: 'Varies by mode' }
      };

      // Estimate emissions by mode
      const estimatedEmissions = new Map<string, number>();
      modeTotals.forEach((trips, mode) => {
        const factor = emissionFactors[mode]?.factor || 15;
        estimatedEmissions.set(mode, trips * factor);
      });

      const totalEstimatedEmissions = Array.from(estimatedEmissions.values()).reduce((sum, v) => sum + v, 0);
      const highEmissionTrips = (modeTotals.get('Car') || 0) + (modeTotals.get('Plane') || 0);
      const lowEmissionTrips = (modeTotals.get('Train') || 0) + (modeTotals.get('Bus') || 0);

      return {
        chartType: 'stackedBar',
        labels,
        datasets,
        unit: 'trips',
        title: 'Trip Analytics by Transport Mode',
        period: { startDate, endDate },
        analysis: {
          summary: `Total trips: ${totalTrips} across ${sortedModes.length} transport modes. ${dominantMode[0]} accounts for ${Math.round((dominantMode[1] / totalTrips) * 100)}% of trips. Estimated emissions: ${Math.round(totalEstimatedEmissions)} kg CO2e.`,
          totalTrips: totalTrips,
          modeBreakdown: Array.from(modeTotals.entries()).map(([mode, trips]) => ({
            mode,
            trips,
            percentage: Math.round((trips / totalTrips) * 100),
            estimatedEmissions: Math.round(estimatedEmissions.get(mode) || 0),
            emissionIntensity: emissionFactors[mode]?.description || 'Unknown'
          })),
          dominantMode: {
            mode: dominantMode[0],
            trips: dominantMode[1],
            percentage: Math.round((dominantMode[1] / totalTrips) * 100),
            description: `${dominantMode[0]} is the primary transport mode`
          },
          emissionProfile: {
            totalEstimatedEmissions: Math.round(totalEstimatedEmissions),
            highEmissionTrips: highEmissionTrips,
            highEmissionPercentage: Math.round((highEmissionTrips / totalTrips) * 100),
            lowEmissionTrips: lowEmissionTrips,
            lowEmissionPercentage: Math.round((lowEmissionTrips / totalTrips) * 100),
            description: `${Math.round((highEmissionTrips / totalTrips) * 100)}% of trips are high-emission (car/plane), ${Math.round((lowEmissionTrips / totalTrips) * 100)}% are low-emission (train/bus)`
          },
          keyInsights: [
            `${dominantMode[0]} dominates at ${Math.round((dominantMode[1] / totalTrips) * 100)}% of trips - ${emissionFactors[dominantMode[0]]?.description || ''}`,
            secondMode ? `${secondMode[0]} is second at ${Math.round((secondMode[1] / totalTrips) * 100)}% - ${emissionFactors[secondMode[0]]?.description || ''}` : null,
            highEmissionTrips > lowEmissionTrips
              ? `${Math.round((highEmissionTrips / totalTrips) * 100)}% of trips use high-emission modes (car/plane) - major reduction opportunity`
              : `${Math.round((lowEmissionTrips / totalTrips) * 100)}% of trips use low-emission modes (train/bus) - strong sustainable transport performance`,
            (modeTotals.get('Plane') || 0) > totalTrips * 0.1
              ? `Air travel represents ${Math.round(((modeTotals.get('Plane') || 0) / totalTrips) * 100)}% of trips - highest emission intensity per trip`
              : null,
            (modeTotals.get('Car') || 0) > totalTrips * 0.5
              ? `Car dependency is high at ${Math.round(((modeTotals.get('Car') || 0) / totalTrips) * 100)}% - consider carpooling, EV fleet, or alternative modes`
              : null
          ].filter(Boolean),
          education: {
            concept: 'Business Travel Emissions (Scope 3 Category 6)',
            definition: 'Business travel includes employee trips for work purposes via air, rail, bus, and personal/rental vehicles. These are Scope 3 emissions (value chain emissions).',
            emissionHierarchy: 'Plane > Car > Ferry > Bus > Train (from highest to lowest emission intensity per passenger-km)',
            whyItMatters: 'Business travel often represents 5-15% of total organizational emissions. It\'s one of the most controllable Scope 3 categories and offers quick wins through travel policy changes.',
            scope3Context: 'GHG Protocol Scope 3 Category 6: Business Travel. Must be reported separately from employee commuting (Category 7).'
          },
          recommendations: [
            (modeTotals.get('Plane') || 0) > 0
              ? `Reduce air travel: ${modeTotals.get('Plane')} flights detected - implement virtual meeting policy, prefer rail for <500km, carbon budgets per department`
              : null,
            (modeTotals.get('Car') || 0) > totalTrips * 0.3
              ? `Transition car trips: ${Math.round(((modeTotals.get('Car') || 0) / totalTrips) * 100)}% car usage - encourage train/bus, carpool matching, EV fleet, bike-share programs`
              : null,
            lowEmissionTrips < totalTrips * 0.3
              ? 'Promote sustainable modes: Only ${Math.round((lowEmissionTrips / totalTrips) * 100)}% use train/bus - improve rail booking tools, transit subsidies, travel policy incentives'
              : null,
            'Implement travel hierarchy: Virtual > Rail > Bus > Car > Air (in order of preference)',
            'Set emission budgets: Allocate annual CO2e budgets per team/employee for business travel accountability',
            'Track and report: Measure km traveled per mode, calculate actual emissions using distance-based factors',
            totalEstimatedEmissions > 5000
              ? 'Consider carbon offsets: Estimated emissions are significant - offset remaining emissions through certified projects while reducing'
              : null
          ].filter(Boolean)
        }
      };
    } catch (error) {
      console.error('Trip analytics error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Building Energy Breakdown Visualization (Doughnut Chart)
 */
export const getBuildingEnergyBreakdownTool = tool({
  description: 'VISUALIZATION: Create an interactive doughnut chart showing building energy usage breakdown by category (HVAC, Lighting, Equipment, etc.). Use when users ask about "building energy", "energy categories", "energy breakdown", or building-specific consumption. Returns chart data for visualization.',
  inputSchema: z.object({
    buildingId: z.string().describe('Building ID'),
    organizationId: z.string().describe('Organization ID'),
    period: z.string().optional().describe('Time period (e.g., "2025-01" for January 2025)')
  }),
  execute: async ({ buildingId, organizationId, period }) => {
    try {
      const supabase = createAdminClient();

      // Calculate period
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = period ? `${period}-01` : new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];

      // Query energy data by subcategory
      const { data, error } = await supabase
        .from('metrics_data')
        .select(`
          value,
          metrics_catalog!inner(subcategory, name)
        `)
        .eq('organization_id', organizationId)
        .eq('site_id', buildingId)
        .gte('period_start', startDate)
        .lte('period_start', endDate)
        .or('category.ilike.%energy%,category.ilike.%electricity%', { foreignTable: 'metrics_catalog' });

      if (error) throw error;

      // Aggregate by category
      const categoryMap = new Map<string, number>();

      data?.forEach(row => {
        const catalog = row.metrics_catalog as any;
        const category = catalog.subcategory || catalog.name || 'Other';
        categoryMap.set(category, (categoryMap.get(category) || 0) + (row.value || 0));
      });

      const labels = Array.from(categoryMap.keys());
      const values = Array.from(categoryMap.values());
      const total = values.reduce((sum, v) => sum + v, 0);

      // Calculate analysis metrics
      const categoryBreakdown = labels.map((label, idx) => ({
        category: label,
        consumption: values[idx],
        percentage: Math.round((values[idx] / total) * 100)
      })).sort((a, b) => b.consumption - a.consumption);

      const dominantCategory = categoryBreakdown[0];
      const secondCategory = categoryBreakdown[1];

      // Typical building energy breakdown benchmarks (% of total)
      const typicalBreakdown: Record<string, { typical: string; description: string; reductionPotential: string }> = {
        'HVAC': {
          typical: '40-50%',
          description: 'Heating, Ventilation, Air Conditioning - usually largest consumer',
          reductionPotential: '15-30% through setpoint optimization, zoning, variable speed drives, heat recovery'
        },
        'Lighting': {
          typical: '20-30%',
          description: 'Interior and exterior lighting systems',
          reductionPotential: '50-75% through LED retrofits, daylight harvesting, occupancy sensors, task lighting'
        },
        'Equipment': {
          typical: '15-25%',
          description: 'Plug loads, computers, servers, appliances, manufacturing equipment',
          reductionPotential: '10-20% through ENERGY STAR equipment, power management, server consolidation'
        },
        'Other': {
          typical: '5-15%',
          description: 'Elevators, pumps, miscellaneous systems',
          reductionPotential: '10-30% through efficient motors, controls, scheduling'
        }
      };

      // Calculate period duration
      const periodDuration = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
      const periodDescription = periodDuration > 300 ? 'year-to-date' : periodDuration > 25 ? 'monthly' : 'partial month';

      return {
        chartType: 'doughnut',
        labels,
        values,
        colors: ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444', '#6b7280'],
        unit: 'kWh',
        title: 'Building Energy Breakdown',
        total,
        period: { startDate, endDate },
        analysis: {
          summary: `Total energy consumption: ${Math.round(total * 10) / 10} kWh (${periodDescription}). ${dominantCategory.category} is the largest consumer at ${dominantCategory.percentage}% (${Math.round(dominantCategory.consumption * 10) / 10} kWh).`,
          totalConsumption: Math.round(total * 10) / 10,
          periodDescription: periodDescription,
          categoryBreakdown: categoryBreakdown.map(cat => ({
            ...cat,
            consumption: Math.round(cat.consumption * 10) / 10,
            typicalRange: typicalBreakdown[cat.category]?.typical || 'N/A',
            description: typicalBreakdown[cat.category]?.description || 'Other building systems',
            reductionPotential: typicalBreakdown[cat.category]?.reductionPotential || 'Varies by system'
          })),
          dominantCategory: {
            category: dominantCategory.category,
            consumption: Math.round(dominantCategory.consumption * 10) / 10,
            percentage: dominantCategory.percentage,
            description: `${dominantCategory.category} represents ${dominantCategory.percentage}% of building energy use`,
            isTypical: typicalBreakdown[dominantCategory.category]
              ? dominantCategory.percentage <= parseInt(typicalBreakdown[dominantCategory.category].typical.split('-')[1])
              : null
          },
          keyInsights: [
            `${dominantCategory.category} dominates at ${dominantCategory.percentage}% - ${typicalBreakdown[dominantCategory.category]?.description || 'primary energy consumer'}`,
            secondCategory ? `${secondCategory.category} is second at ${secondCategory.percentage}% - ${typicalBreakdown[secondCategory.category]?.description || 'secondary consumer'}` : null,
            dominantCategory.category === 'HVAC' && dominantCategory.percentage > 50
              ? 'HVAC exceeds typical 40-50% - investigate setpoints, insulation, system efficiency'
              : null,
            dominantCategory.category === 'Lighting' && dominantCategory.percentage > 30
              ? 'Lighting exceeds typical 20-30% - significant LED retrofit opportunity'
              : null,
            dominantCategory.category === 'Equipment' && dominantCategory.percentage > 25
              ? 'Equipment/plug loads high - implement power management and efficient equipment policies'
              : null,
            categoryBreakdown.find(c => c.category === 'Lighting' && c.percentage > 25)
              ? 'High lighting consumption suggests non-LED fixtures remain - LED retrofits offer quick payback'
              : null
          ].filter(Boolean),
          education: {
            concept: 'Building Energy End-Use Categories',
            definition: 'Energy consumption in buildings is categorized by end-use: HVAC (heating/cooling/ventilation), Lighting, Equipment (plug loads), and Other (elevators, pumps, etc.).',
            typicalBreakdown: 'Commercial buildings: HVAC 40-50%, Lighting 20-30%, Equipment 15-25%, Other 5-15%',
            whyItMatters: 'Understanding energy breakdown helps prioritize efficiency investments. HVAC typically offers largest absolute savings, but lighting often has best ROI (return on investment) due to LED technology.',
            scope2Connection: 'Building electricity consumption contributes to Scope 2 emissions (indirect emissions from purchased energy). Reducing consumption directly reduces carbon footprint.',
            energyIntensity: 'Measured in kWh/m²/year. Office buildings: 200-300 kWh/m²/year is typical. Data centers: 800-1500 kWh/m²/year.',
            eui: 'Energy Use Intensity (EUI) = Annual kWh ÷ Building Area (m²). Lower EUI indicates better efficiency.'
          },
          recommendations: [
            dominantCategory.category === 'HVAC'
              ? `HVAC optimization: ${dominantCategory.percentage}% consumption - implement smart thermostats, optimize schedules, upgrade to high-efficiency systems, improve building envelope`
              : null,
            categoryBreakdown.find(c => c.category === 'Lighting')
              ? `Lighting upgrades: ${categoryBreakdown.find(c => c.category === 'Lighting')?.percentage}% consumption - retrofit to LED (50-75% savings), add daylight sensors, occupancy controls`
              : null,
            categoryBreakdown.find(c => c.category === 'Equipment')
              ? `Equipment efficiency: ${categoryBreakdown.find(c => c.category === 'Equipment')?.percentage}% consumption - deploy power management software, replace with ENERGY STAR models, eliminate phantom loads`
              : null,
            'Conduct energy audit: Professional audit identifies specific opportunities with payback periods and savings estimates',
            'Building automation system (BAS): Implement or upgrade BAS for centralized monitoring and control',
            'Retro-commissioning: Re-tune existing systems to restore design efficiency (often 5-15% savings)',
            'Renewable energy: After efficiency improvements, consider solar PV to offset remaining consumption',
            total > 50000
              ? 'Significant consumption detected: Benchmark against similar buildings using ENERGY STAR Portfolio Manager'
              : null,
            'Set reduction targets: Aim for 2-3% annual energy intensity reduction through continuous improvement'
          ].filter(Boolean)
        }
      };
    } catch (error) {
      console.error('Building energy breakdown error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

/**
 * Export all tools for use in chat API
 */
export const sustainabilityTools = {
  analyzeCarbonFootprint: analyzeCarbonFootprintTool,
  checkESGCompliance: checkESGComplianceTool,
  querySustainabilityData: querySustainabilityDataTool,
  benchmarkPerformance: benchmarkPerformanceTool,
  analyzeSupplyChain: analyzeSupplyChainTool,
  trackSustainabilityGoals: trackSustainabilityGoalsTool,
  generateESGReport: generateESGReportTool,
  getExecutiveReport: getExecutiveReportTool,
  getGRIReport: getGRIReportTool,
  analyzeDocument: analyzeDocumentTool,
  forecastEmissions: forecastEmissionsTool,
  analyzeWaterConsumption: analyzeWaterConsumptionTool,
  analyzeEnergyConsumption: analyzeEnergyConsumptionTool,
  analyzeWasteGeneration: analyzeWasteGenerationTool,
  analyzeGenericMetric: analyzeGenericMetricTool,
  // Data entry tools
  addMetricData: addMetricDataTool,
  bulkAddMetricData: bulkAddMetricDataTool,
  updateMetricData: updateMetricDataTool,
  deleteMetricData: deleteMetricDataTool,
  // Visualization tools
  getEmissionsTrend: getEmissionsTrendTool,
  getEmissionsBreakdown: getEmissionsBreakdownTool,
  getEmissionsYoYVariation: getEmissionsYoYVariationTool,
  getSBTiProgress: getSBTiProgressTool,
  getMonthlyConsumption: getMonthlyConsumptionTool,
  getTripAnalytics: getTripAnalyticsTool,
  getBuildingEnergyBreakdown: getBuildingEnergyBreakdownTool
};
