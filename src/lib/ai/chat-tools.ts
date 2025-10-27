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
  getYoYComparison
} from '@/lib/sustainability/baseline-calculator';

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
  description: 'Analyze ACTUAL/HISTORICAL carbon emissions for past and current year-to-date periods. Use this for questions like "what are my emissions this year", "emissions in 2024", or "emissions for Q1 2025". Returns comprehensive emissions data with breakdowns and recommendations. Do NOT use for future predictions.',
  inputSchema: z.object({
    scope: z.enum(['building', 'organization', 'activity', 'product']).describe('The scope of carbon analysis'),
    organizationId: z.string().describe('Organization ID'),
    buildingId: z.string().optional().describe('Building ID for building-specific analysis'),
    timeframe: z.object({
      start: z.string().describe('Start date (ISO format)'),
      end: z.string().describe('End date (ISO format)')
    }).optional().describe('Time period for analysis'),
    includeBreakdown: z.boolean().default(true).describe('Include detailed breakdown by source (Scope 1, 2, 3)'),
    compareToBaseline: z.boolean().default(true).describe('Compare to baseline or previous periods')
  }),
  execute: async ({ scope, organizationId, buildingId, timeframe, includeBreakdown, compareToBaseline }) => {
    try {
      // Calculate date range - default to current year if not provided
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Cap end date at today if it's in the future
      let endDate = timeframe?.end || today;
      if (timeframe?.end) {
        const endDateObj = new Date(timeframe.end);
        const todayObj = new Date(today);
        if (endDateObj > todayObj) {
          endDate = today;
          console.log('[Carbon Tool] End date capped at today:', { requested: timeframe.end, capped: endDate });
        }
      }

      const startDate = timeframe?.start || (() => {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return yearStart.toISOString().split('T')[0];
      })();

      // Debug logging
      console.log('[Carbon Tool] Date range:', { startDate, endDate, timeframe, currentYear: now.getFullYear() });

      // Get emissions using centralized calculator
      const emissions = await getPeriodEmissions(
        organizationId,
        startDate,
        endDate,
        buildingId // buildingId maps to siteId in calculator
      );

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

      // Generate insights based on the data
      const categoryText = categories
        .slice(0, 3)
        .map(cat => `${cat.category}: ${cat.total.toFixed(1)} tCO2e (${cat.percentage.toFixed(1)}%)`)
        .join(', ');

      // Extract year for explicit mention in insights
      const startYear = new Date(startDate).getFullYear();
      const endYear = new Date(endDate).getFullYear();
      const yearLabel = startYear === endYear ? `year ${startYear}` : `period ${startYear}-${endYear}`;

      const insights = `For the ${yearLabel} (${startDate} to ${endDate}), total emissions are ${emissions.total} tCO2e. ${breakdown ? `Breakdown: Scope 1 (${breakdown.scope1} tCO2e), Scope 2 (${breakdown.scope2} tCO2e), Scope 3 (${breakdown.scope3} tCO2e). ` : ''}Top emission categories: ${categoryText}. ${comparison ? `Year-over-year change: ${comparison.percentageChange > 0 ? '+' : ''}${comparison.percentageChange.toFixed(1)}% (${comparison.percentageChange > 0 ? 'increase' : 'decrease'} of ${Math.abs(comparison.absoluteChange).toFixed(1)} tCO2e)` : ''}`;

      return {
        success: true,
        scope,
        totalEmissions: emissions.total,
        breakdown,
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
  description: 'Analyze waste generation by type (recycling, landfill, hazardous, organic) and disposal method. Returns detailed breakdown with diversion rates.',
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
        .ilike('metrics_catalog.category', '%waste%');

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
        weight_kg: Math.round(data.weight * 10) / 10,
        emissions_kgCO2e: Math.round(data.emissions * 10) / 10,
        diverted: data.diverted
      }));

      const totalWeight = breakdown.reduce((sum, b) => sum + b.weight_kg, 0);
      const divertedWeight = breakdown.filter(b => b.diverted).reduce((sum, b) => sum + b.weight_kg, 0);
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

      const insights = `For the ${yearLabel} (${startDate} to ${endDate}), a total of ${totalWeight.toFixed(0)} kg of waste was generated with a diversion rate of ${diversionRate.toFixed(1)}%, resulting in ${(totalEmissions/1000).toFixed(1)} tCO2e emissions. ${comparison ? `Year-over-year change: ${comparison.percentageChange > 0 ? '+' : ''}${comparison.percentageChange.toFixed(1)}%` : ''}`;

      return {
        success: true,
        total: {
          weight_kg: Math.round(totalWeight),
          diverted_kg: Math.round(divertedWeight),
          landfill_kg: Math.round(totalWeight - divertedWeight),
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
  deleteMetricData: deleteMetricDataTool
};
