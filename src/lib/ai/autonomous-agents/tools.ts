/**
 * Shared Autonomous Agent Tools - Vercel AI SDK Implementation
 *
 * These tools are extracted from the CarbonHunter agent's real database implementations
 * and can be used by ANY autonomous agent (CarbonHunter, ComplianceGuardian, ESG Chief, etc.)
 *
 * Benefits:
 * - ✅ ONE implementation for emissions calculations (vs 8 agent copies)
 * - ✅ Type-safe with Zod validation
 * - ✅ Reusable across all agents
 * - ✅ Easier to test and maintain
 * - ✅ Consistent results across agents
 */

import { tool } from 'ai';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

// Initialize Supabase client
const supabase = createAdminClient();

/**
 * TOOL 1: Calculate Emissions
 *
 * Calculate total emissions by scope and category for a time period.
 * Originally from CarbonHunter.handleCarbonCalculation()
 *
 * Usage: Any agent that needs emissions data
 * - CarbonHunter: Track and verify emissions
 * - ComplianceGuardian: Check compliance thresholds
 * - ESG Chief of Staff: Generate executive summaries
 * - Cost Saving Finder: Calculate carbon tax costs
 */
export const calculateEmissions = tool({
  description: `Calculate total emissions by scope (Scope 1, 2, 3) and category for a time period.

Returns:
- Total emissions by scope (in tCO2e)
- Breakdown by category within each scope
- Overall total emissions
- Number of data points analyzed

Use this when you need to:
- Answer "What are my total emissions?"
- Calculate emissions for compliance reporting
- Compare emissions across time periods
- Identify top emission categories`,

  parameters: z.object({
    organizationId: z.string().uuid().describe('Organization ID'),
    startDate: z.string().optional().describe('Start date (YYYY-MM-DD). Defaults to Jan 1 of current year.'),
    endDate: z.string().optional().describe('End date (YYYY-MM-DD). Defaults to today.'),
    scope: z.enum(['scope_1', 'scope_2', 'scope_3']).optional().describe('Filter by specific scope (optional)')
  }),

  execute: async ({ organizationId, startDate, endDate, scope }) => {
    try {
      const defaultStartDate = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const defaultEndDate = endDate || new Date().toISOString().split('T')[0];

      // Build query
      let query = supabase
        .from('metrics_data')
        .select(`
          co2e_emissions,
          period_start,
          period_end,
          metrics_catalog (
            scope,
            category,
            name
          )
        `)
        .eq('organization_id', organizationId)
        .gte('period_start', defaultStartDate)
        .lte('period_end', defaultEndDate);

      // Optional scope filter
      if (scope) {
        query = query.eq('metrics_catalog.scope', scope);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ calculateEmissions error:', error);
        return {
          success: false,
          error: `Database error: ${error.message}`,
          totalsByScope: {},
          totalEmissions: 0
        };
      }

      if (!data || data.length === 0) {
        return {
          success: true,
          message: 'No emissions data found for the specified period',
          totalsByScope: {},
          byCategory: {},
          totalEmissions: 0,
          dataPoints: 0
        };
      }

      // Calculate totals by scope
      const totalsByScope = data.reduce((acc: any, row: any) => {
        const scopeName = row.metrics_catalog?.scope || 'unknown';
        acc[scopeName] = (acc[scopeName] || 0) + (row.co2e_emissions / 1000); // Convert kg to tonnes
        return acc;
      }, {});

      // Calculate by category within each scope
      const byCategory = data.reduce((acc: any, row: any) => {
        const scopeName = row.metrics_catalog?.scope || 'unknown';
        const category = row.metrics_catalog?.category || 'unknown';
        const key = `${scopeName}_${category}`;
        acc[key] = (acc[key] || 0) + (row.co2e_emissions / 1000);
        return acc;
      }, {});

      const totalEmissions = Object.values(totalsByScope).reduce((sum: number, val: any) => sum + val, 0);

      return {
        success: true,
        totalsByScope,
        byCategory,
        totalEmissions: parseFloat(totalEmissions.toFixed(2)),
        dataPoints: data.length,
        period: { startDate: defaultStartDate, endDate: defaultEndDate }
      };

    } catch (error: any) {
      console.error('❌ calculateEmissions exception:', error);
      return {
        success: false,
        error: error.message,
        totalEmissions: 0
      };
    }
  }
});

/**
 * TOOL 2: Detect Anomalies
 *
 * Detect emission anomalies using statistical analysis (2-sigma threshold).
 * Originally from CarbonHunter.handleAnomalyDetection()
 *
 * Usage: Any agent that needs to identify unusual patterns
 * - CarbonHunter: Hunt down emission spikes
 * - ComplianceGuardian: Flag data quality issues
 * - Predictive Maintenance: Identify equipment failures
 * - Autonomous Optimizer: Find optimization opportunities
 */
export const detectAnomalies = tool({
  description: `Detect emission anomalies using statistical analysis.

Uses 2-sigma threshold by default:
- HIGH_ANOMALY: Emissions > (average + 2 * standard deviation)
- LOW_ANOMALY: Emissions < (average - 2 * standard deviation)
- NORMAL: Within expected range

Returns:
- Total anomalies detected
- High anomaly count
- Low anomaly count
- Top 10 anomalies with details

Use this when you need to:
- Find unusual emission spikes
- Identify data quality issues
- Detect equipment malfunctions
- Flag potential reporting errors`,

  parameters: z.object({
    organizationId: z.string().uuid().describe('Organization ID'),
    category: z.string().optional().describe('Filter by category (e.g., "electricity", "natural_gas")'),
    stdDevThreshold: z.number().optional().default(2).describe('Standard deviation threshold (default: 2)')
  }),

  execute: async ({ organizationId, category, stdDevThreshold = 2 }) => {
    try {
      // SQL query for anomaly detection
      const query = `
        WITH monthly_averages AS (
          SELECT
            DATE_TRUNC('month', period_start) as month,
            mc.category,
            AVG(md.co2e_emissions) as avg_emissions,
            STDDEV(md.co2e_emissions) as stddev_emissions
          FROM metrics_data md
          JOIN metrics_catalog mc ON md.metric_id = mc.id
          WHERE md.organization_id = '${organizationId}'
            ${category ? `AND mc.category = '${category}'` : ''}
          GROUP BY month, mc.category
        )
        SELECT
          md.period_start,
          mc.category,
          mc.name,
          md.co2e_emissions / 1000.0 as co2e_tonnes,
          ma.avg_emissions / 1000.0 as avg_tonnes,
          ma.stddev_emissions / 1000.0 as stddev_tonnes,
          CASE
            WHEN md.co2e_emissions > (ma.avg_emissions + ${stdDevThreshold} * ma.stddev_emissions)
            THEN 'HIGH_ANOMALY'
            WHEN md.co2e_emissions < (ma.avg_emissions - ${stdDevThreshold} * ma.stddev_emissions)
            THEN 'LOW_ANOMALY'
            ELSE 'NORMAL'
          END as anomaly_status
        FROM metrics_data md
        JOIN metrics_catalog mc ON md.metric_id = mc.id
        JOIN monthly_averages ma ON
          DATE_TRUNC('month', md.period_start) = ma.month
          AND mc.category = ma.category
        WHERE md.organization_id = '${organizationId}'
        ORDER BY md.period_start DESC
        LIMIT 1000;
      `;

      const { data: queryData, error } = await supabase.rpc('explore_sustainability_data', {
        query_text: query,
        org_id: organizationId
      });

      if (error) {
        console.error('❌ detectAnomalies error:', error);
        return {
          success: false,
          error: `Database error: ${error.message}`,
          anomalyCount: 0
        };
      }

      const results = queryData?.data || [];
      const anomalies = results.filter((r: any) => r.anomaly_status !== 'NORMAL');
      const highAnomalies = anomalies.filter((a: any) => a.anomaly_status === 'HIGH_ANOMALY');
      const lowAnomalies = anomalies.filter((a: any) => a.anomaly_status === 'LOW_ANOMALY');

      return {
        success: true,
        totalRecords: results.length,
        anomalyCount: anomalies.length,
        highAnomalies: highAnomalies.length,
        lowAnomalies: lowAnomalies.length,
        anomalyRate: results.length > 0 ? ((anomalies.length / results.length) * 100).toFixed(1) + '%' : '0%',
        anomalies: anomalies.slice(0, 10), // Top 10
        stdDevThreshold
      };

    } catch (error: any) {
      console.error('❌ detectAnomalies exception:', error);
      return {
        success: false,
        error: error.message,
        anomalyCount: 0
      };
    }
  }
});

/**
 * TOOL 3: Benchmark Efficiency
 *
 * Compare site efficiency (emissions per sqm) across portfolio.
 * Originally from CarbonHunter.handleEfficiencyAnalysis()
 *
 * Usage: Any agent that needs performance comparison
 * - CarbonHunter: Identify inefficient sites
 * - Cost Saving Finder: Calculate improvement potential
 * - Autonomous Optimizer: Prioritize optimization targets
 * - ESG Chief of Staff: Generate executive dashboards
 */
export const benchmarkEfficiency = tool({
  description: `Benchmark site efficiency by comparing emissions per square meter across all sites.

Returns:
- All sites ranked by efficiency
- Best performer (lowest emissions/sqm)
- Worst performer (highest emissions/sqm)
- Average and median efficiency
- Potential savings if all sites matched best performer

Use this when you need to:
- Compare site performance
- Identify inefficient locations
- Calculate improvement opportunities
- Prioritize optimization efforts`,

  parameters: z.object({
    organizationId: z.string().uuid().describe('Organization ID'),
    startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
    endDate: z.string().optional().describe('End date (YYYY-MM-DD)')
  }),

  execute: async ({ organizationId, startDate, endDate }) => {
    try {
      const defaultStartDate = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
      const defaultEndDate = endDate || new Date().toISOString().split('T')[0];

      // SQL query for site efficiency benchmarking
      const query = `
        WITH site_emissions AS (
          SELECT
            s.id as site_id,
            s.name as site_name,
            s.area_sqm,
            SUM(md.co2e_emissions) / 1000.0 as total_co2e_tonnes
          FROM metrics_data md
          JOIN sites s ON md.site_id = s.id
          WHERE md.organization_id = '${organizationId}'
            AND md.period_start >= '${defaultStartDate}'
            AND md.period_end <= '${defaultEndDate}'
          GROUP BY s.id, s.name, s.area_sqm
        )
        SELECT
          site_name,
          total_co2e_tonnes,
          area_sqm,
          CASE
            WHEN area_sqm > 0 THEN total_co2e_tonnes / area_sqm
            ELSE 0
          END as emissions_per_sqm,
          RANK() OVER (ORDER BY
            CASE
              WHEN area_sqm > 0 THEN total_co2e_tonnes / area_sqm
              ELSE 999999
            END
          ) as efficiency_rank
        FROM site_emissions
        WHERE area_sqm > 0
        ORDER BY efficiency_rank;
      `;

      const { data: queryData, error } = await supabase.rpc('explore_sustainability_data', {
        query_text: query,
        org_id: organizationId
      });

      if (error) {
        console.error('❌ benchmarkEfficiency error:', error);
        return {
          success: false,
          error: `Database error: ${error.message}`,
          totalSites: 0
        };
      }

      const results = queryData?.data || [];

      if (results.length === 0) {
        return {
          success: true,
          message: 'No site data available for efficiency analysis',
          totalSites: 0
        };
      }

      // Calculate statistics
      const avgEfficiency = results.reduce((sum: number, r: any) => sum + r.emissions_per_sqm, 0) / results.length;
      const bestPerformer = results[0];
      const worstPerformer = results[results.length - 1];
      const medianEfficiency = results[Math.floor(results.length / 2)]?.emissions_per_sqm || 0;
      const potentialSavings = (worstPerformer.emissions_per_sqm - bestPerformer.emissions_per_sqm) * worstPerformer.area_sqm;

      return {
        success: true,
        sites: results,
        totalSites: results.length,
        statistics: {
          avgEfficiency: parseFloat(avgEfficiency.toFixed(4)),
          medianEfficiency: parseFloat(medianEfficiency.toFixed(4)),
          bestPerformer: {
            name: bestPerformer.site_name,
            efficiency: parseFloat(bestPerformer.emissions_per_sqm.toFixed(4)),
            totalEmissions: parseFloat(bestPerformer.total_co2e_tonnes.toFixed(2))
          },
          worstPerformer: {
            name: worstPerformer.site_name,
            efficiency: parseFloat(worstPerformer.emissions_per_sqm.toFixed(4)),
            totalEmissions: parseFloat(worstPerformer.total_co2e_tonnes.toFixed(2))
          },
          potentialSavings: parseFloat(potentialSavings.toFixed(2))
        },
        period: { startDate: defaultStartDate, endDate: defaultEndDate }
      };

    } catch (error: any) {
      console.error('❌ benchmarkEfficiency exception:', error);
      return {
        success: false,
        error: error.message,
        totalSites: 0
      };
    }
  }
});

/**
 * TOOL 4: Investigate Sources
 *
 * Drill down into specific emission sources with detailed analysis.
 * Originally from CarbonHunter.handleSourceInvestigation()
 *
 * Usage: Any agent that needs detailed source analysis
 * - CarbonHunter: Investigate emission sources
 * - Supply Chain Investigator: Analyze supplier emissions
 * - Compliance Guardian: Verify data sources
 * - Cost Saving Finder: Identify cost reduction targets
 */
export const investigateSources = tool({
  description: `Investigate emission sources in detail, grouped by scope, category, and site.

Returns:
- Top 50 emission sources ranked by total emissions
- Data point counts for each source
- First and last record dates
- Site locations
- Top emission source identification

Use this when you need to:
- Drill down into emission sources
- Find top contributors to emissions
- Analyze data coverage by source
- Identify targets for reduction efforts`,

  parameters: z.object({
    organizationId: z.string().uuid().describe('Organization ID'),
    category: z.string().optional().describe('Filter by category (e.g., "electricity", "natural_gas")'),
    minEmissions: z.number().optional().default(0).describe('Minimum emissions threshold (tCO2e)')
  }),

  execute: async ({ organizationId, category, minEmissions = 0 }) => {
    try {
      // SQL query for source investigation
      const query = `
        SELECT
          mc.scope,
          mc.category,
          mc.name,
          mc.unit,
          mc.emission_factor,
          s.name as site_name,
          s.location as site_location,
          COUNT(md.id) as data_points,
          SUM(md.co2e_emissions) / 1000.0 as total_co2e_tonnes,
          AVG(md.co2e_emissions) / 1000.0 as avg_co2e_tonnes,
          MIN(md.period_start) as first_record,
          MAX(md.period_end) as last_record
        FROM metrics_data md
        JOIN metrics_catalog mc ON md.metric_id = mc.id
        LEFT JOIN sites s ON md.site_id = s.id
        WHERE md.organization_id = '${organizationId}'
          ${category ? `AND mc.category = '${category}'` : ''}
        GROUP BY mc.scope, mc.category, mc.name, mc.unit, mc.emission_factor, s.name, s.location
        HAVING SUM(md.co2e_emissions) / 1000.0 >= ${minEmissions}
        ORDER BY total_co2e_tonnes DESC
        LIMIT 50;
      `;

      const { data: queryData, error } = await supabase.rpc('explore_sustainability_data', {
        query_text: query,
        org_id: organizationId
      });

      if (error) {
        console.error('❌ investigateSources error:', error);
        return {
          success: false,
          error: `Database error: ${error.message}`,
          totalSources: 0
        };
      }

      const sources = queryData?.data || [];
      const totalInvestigated = sources.reduce((sum: number, s: any) => sum + s.total_co2e_tonnes, 0);
      const topSource = sources[0];

      return {
        success: true,
        sources,
        totalSources: sources.length,
        totalEmissions: parseFloat(totalInvestigated.toFixed(2)),
        topSource: topSource ? {
          name: topSource.name,
          category: topSource.category,
          scope: topSource.scope,
          emissions: parseFloat(topSource.total_co2e_tonnes.toFixed(2)),
          site: topSource.site_name,
          percentage: parseFloat(((topSource.total_co2e_tonnes / totalInvestigated) * 100).toFixed(1))
        } : null,
        filters: { category, minEmissions }
      };

    } catch (error: any) {
      console.error('❌ investigateSources exception:', error);
      return {
        success: false,
        error: error.message,
        totalSources: 0
      };
    }
  }
});

/**
 * TOOL 5: Generate Carbon Report
 *
 * Generate comprehensive carbon report combining all analyses.
 * Originally from CarbonHunter.handleCarbonReporting()
 *
 * Usage: Any agent that needs comprehensive reporting
 * - CarbonHunter: Generate emissions reports
 * - ESG Chief of Staff: Executive summaries
 * - Compliance Guardian: Regulatory reports
 * - All agents: Comprehensive analysis
 */
export const generateCarbonReport = tool({
  description: `Generate comprehensive carbon report combining emissions, anomalies, and efficiency analysis.

Returns:
- Complete emissions summary
- Anomaly analysis
- Efficiency benchmarks
- Executive summary with key metrics

Use this when you need to:
- Generate comprehensive reports
- Provide executive summaries
- Combine multiple analyses
- Create regulatory submissions`,

  parameters: z.object({
    organizationId: z.string().uuid().describe('Organization ID'),
    reportType: z.enum(['comprehensive', 'executive', 'regulatory']).optional().default('comprehensive'),
    startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
    endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
    scope: z.enum(['scope_1', 'scope_2', 'scope_3']).optional().describe('Filter by specific scope')
  }),

  execute: async ({ organizationId, reportType = 'comprehensive', startDate, endDate, scope }) => {
    try {
      // Get emissions summary
      const emissionsResult = await calculateEmissions.execute({
        organizationId,
        startDate,
        endDate,
        scope
      });

      if (!emissionsResult.success) {
        return {
          success: false,
          error: 'Failed to calculate emissions',
          emissionsError: emissionsResult.error
        };
      }

      // Get anomalies
      const anomalyResult = await detectAnomalies.execute({
        organizationId,
        stdDevThreshold: 2
      });

      // Get efficiency metrics
      const efficiencyResult = await benchmarkEfficiency.execute({
        organizationId,
        startDate,
        endDate
      });

      // Compile comprehensive report
      const report = {
        success: true,
        reportType,
        generatedAt: new Date().toISOString(),
        period: {
          startDate: startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
          endDate: endDate || new Date().toISOString().split('T')[0]
        },
        emissions: emissionsResult,
        anomalies: anomalyResult.success ? anomalyResult : null,
        efficiency: efficiencyResult.success ? efficiencyResult : null,
        summary: {
          totalEmissions: emissionsResult.totalEmissions,
          dataQuality: emissionsResult.dataPoints > 100 ? 'high' : emissionsResult.dataPoints > 50 ? 'medium' : 'low',
          anomalyRate: anomalyResult.anomalyRate || 'N/A',
          sitesAnalyzed: efficiencyResult.totalSites || 0,
          dataPoints: emissionsResult.dataPoints
        }
      };

      return report;

    } catch (error: any) {
      console.error('❌ generateCarbonReport exception:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
});

/**
 * Export all tools as a collection for easy import
 */
export const sustainabilityTools = {
  calculateEmissions,
  detectAnomalies,
  benchmarkEfficiency,
  investigateSources,
  generateCarbonReport
};

/**
 * Get tools as Vercel AI SDK compatible object
 * Use this when calling generateText() with tools parameter
 */
export function getSustainabilityTools() {
  return {
    calculateEmissions,
    detectAnomalies,
    benchmarkEfficiency,
    investigateSources,
    generateCarbonReport
  };
}
