/**
 * Blipee Brain - Fully Exploratory AI Data Analyst
 *
 * Philosophy: The AI is a data analyst, not a chatbot.
 * No predefined queries - the AI explores the database freely using SQL.
 *
 * Tools available to the LLM:
 * - exploreData(query, analysisGoal) - Explore ALL internal sustainability data using SQL
 * - searchWeb(query) - Search external web sources
 * - discoverCompanies(sector) - Find companies for benchmarking
 * - parseSustainabilityReport(url) - Extract data from sustainability reports
 * - researchRegulations(topic) - Research regulatory requirements
 *
 * The LLM writes SQL queries to analyze data, find patterns, and answer questions.
 * Think like DeepSeek with a spreadsheet - but with a PostgreSQL database.
 */

import { aiService } from './service';
import { createAdminClient } from '@/lib/supabase/server';

interface Tool {
  name: string;
  description: string;
  parameters: any;
  execute: (params: any) => Promise<any>;
}

interface BlipeeBrainContext {
  userId: string;
  organizationId: string;
  conversationId: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

/**
 * Blipee Brain - The LLM orchestrator
 */
export class BlipeeBrain {
  private supabase = createAdminClient();
  private tools: Map<string, Tool> = new Map();
  private currentContext: BlipeeBrainContext | null = null;

  constructor() {
    this.registerTools();
  }

  /**
   * Register all tools that the LLM can use
   */
  private registerTools() {
    // ❌ REMOVED - Use exploreData instead for fully exploratory analysis
    // Tool: Query Sustainability Metrics (Unified) - DEPRECATED
    // ✅ Handles emissions, energy, water, waste, and transportation
    /* COMMENTED OUT - Fully exploratory mode
    this.tools.set('queryMetrics', {
      name: 'queryMetrics',
      description: `Query sustainability metrics naturally. The AI understands what the user wants - you don't need exact names.

EXAMPLES OF NATURAL QUESTIONS AND HOW TO HANDLE THEM:
- "What are my total emissions?" → metricTypes: ["emissions"]
- "How much energy did we use?" → metricTypes: ["energy"]
- "Show me water and waste data" → metricTypes: ["water", "waste"]
- "Our carbon footprint this year" → metricTypes: ["emissions"]
- "Electricity consumption last month" → metricTypes: ["energy"], period: "1m"
- "How are we doing overall?" → metricTypes: ["emissions", "energy", "water", "waste"]
- "Our environmental impact" → metricTypes: ["emissions", "energy", "water", "waste"]
- "Transportation emissions" → metricTypes: ["emissions"], look in categories for "Business Travel" or "Employee Commuting"

METRIC TYPES:
- "emissions" = Carbon emissions (Scope 1, 2, 3) in tCO2e
- "energy" = Electricity, purchased energy in kWh/MWh
- "water" = Water usage in m³
- "waste" = Waste generated in kg/tons
- Use multiple types when user asks broadly

CATEGORIES IN DATABASE (for reference):
- Emissions: Stationary Combustion, Mobile Combustion, Fugitive Emissions, Purchased Energy, Business Travel, Employee Commuting, etc.
- Energy: Electricity (Purchased, Renewable, EV Charging, Onsite Generation)
- Water: Found in "Purchased Goods & Services" category with unit m³
- Waste: Waste category with various streams
- Transportation: Business Travel, Employee Commuting

TIME PERIODS:
- "this year" / "ytd" → period: "ytd" (January 1 to today)
- "last month" → period: "1m"
- "last quarter" → period: "3m"
- "last year" / "past 12 months" → period: "12m"
- Custom dates: use startDate/endDate for comparisons

For comparisons like "this month vs last year", call this tool twice with different date ranges.`,
      parameters: {
        type: 'object',
        properties: {
          metricTypes: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['emissions', 'energy', 'water', 'waste']
            },
            description: 'Which metrics to query. Choose based on what the user is asking about. Use multiple for broad questions.'
          },
          period: {
            type: 'string',
            enum: ['ytd', '1m', '3m', '6m', '12m', 'all'],
            description: 'Preset time period (optional if startDate/endDate provided)'
          },
          startDate: {
            type: 'string',
            description: 'Custom start date in YYYY-MM-DD format (e.g., "2024-01-01"). Overrides period if provided.'
          },
          endDate: {
            type: 'string',
            description: 'Custom end date in YYYY-MM-DD format (e.g., "2024-01-31"). Overrides period if provided.'
          }
        },
        required: ['metricTypes']
      },
      execute: async (params) => {
        console.log('🔍 queryMetrics tool called with params:', JSON.stringify(params, null, 2));
        console.log('🔍 Current context:', {
          organizationId: this.currentContext?.organizationId,
          userId: this.currentContext?.userId,
          hasContext: !!this.currentContext
        });

        if (!this.currentContext?.organizationId) {
          return {
            error: 'No organization context available',
            emissions: { total: 0, scope1: 0, scope2: 0, scope3: 0 },
            energy: { total: 0, unit: 'MWh' },
            water: { total: 0, unit: 'm³' },
            waste: { total: 0, unit: 'tons' }
          };
        }

        try {
          // ✅ Import all calculator functions
          const {
            getPeriodEmissions,
            getScopeBreakdown,
            getCategoryBreakdown,
            getMonthlyEmissions,
            getEnergyTotal,
            getWaterTotal,
            getWasteTotal
          } = await import('@/lib/sustainability/baseline-calculator');

          let startDateStr: string;
          let endDateStr: string;
          let period = params.period || 'ytd';

          // Check if custom dates are provided (highest priority)
          if (params.startDate && params.endDate) {
            startDateStr = params.startDate;
            endDateStr = params.endDate;
            period = 'custom';
            console.log('🔍 Using custom date range:', { startDateStr, endDateStr });
          } else {
            // Calculate date range based on period
            const endDate = new Date();
            const startDate = new Date();

            switch (period) {
              case 'ytd':
                startDate.setMonth(0); // January 1
                startDate.setDate(1);
                break;
              case '1m':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
              case '3m':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
              case '6m':
                startDate.setMonth(startDate.getMonth() - 6);
                break;
              case '12m':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
              default:
                startDate.setFullYear(2020); // All time
            }

            startDateStr = startDate.toISOString().split('T')[0];
            endDateStr = endDate.toISOString().split('T')[0];
          }

          console.log('🔍 Querying metrics using baseline calculator:', {
            metricTypes: params.metricTypes,
            period,
            startDate: startDateStr,
            endDate: endDateStr,
            organizationId: this.currentContext.organizationId
          });

          const result: any = {
            metadata: {
              period,
              startDate: startDateStr,
              endDate: endDateStr
            }
          };

          // Query only the requested metric types
          const metricTypes = params.metricTypes || ['emissions'];

          // ✅ EMISSIONS
          if (metricTypes.includes('emissions')) {
            const emissions = await getPeriodEmissions(this.currentContext.organizationId, startDateStr, endDateStr);
            const categories = await getCategoryBreakdown(this.currentContext.organizationId, startDateStr, endDateStr);
            const monthlyEmissions = await getMonthlyEmissions(this.currentContext.organizationId, startDateStr, endDateStr);

            result.emissions = {
              current: {
                total: emissions.total,
                scope1: emissions.scope_1,
                scope2: emissions.scope_2,
                scope3: emissions.scope_3,
                unit: 'tCO2e'
              },
              historical: monthlyEmissions.map(month => ({
                month: month.month,
                scope1: month.scope_1,
                scope2: month.scope_2,
                scope3: month.scope_3,
                total: month.emissions
              })),
              byCategory: categories.map(cat => ({
                name: cat.category,
                value: cat.total,
                scope1: cat.scope_1,
                scope2: cat.scope_2,
                scope3: cat.scope_3
              }))
            };

            console.log('✅ Emissions data retrieved:', emissions.total, 'tCO2e');
          }

          // ✅ ENERGY
          if (metricTypes.includes('energy')) {
            const energyTotal = await getEnergyTotal(this.currentContext.organizationId, startDateStr, endDateStr);
            result.energy = {
              total: energyTotal.value,
              unit: energyTotal.unit,
              recordCount: energyTotal.recordCount
            };

            console.log('✅ Energy data retrieved:', energyTotal.value, energyTotal.unit);
          }

          // ✅ WATER
          if (metricTypes.includes('water')) {
            const waterTotal = await getWaterTotal(this.currentContext.organizationId, startDateStr, endDateStr);
            result.water = {
              total: waterTotal.value,
              unit: waterTotal.unit,
              recordCount: waterTotal.recordCount
            };

            console.log('✅ Water data retrieved:', waterTotal.value, waterTotal.unit);
          }

          // ✅ WASTE
          if (metricTypes.includes('waste')) {
            const wasteTotal = await getWasteTotal(this.currentContext.organizationId, startDateStr, endDateStr);
            result.waste = {
              total: wasteTotal.value,
              unit: wasteTotal.unit,
              recordCount: wasteTotal.recordCount
            };

            console.log('✅ Waste data retrieved:', wasteTotal.value, wasteTotal.unit);
          }

          return result;
        } catch (error) {
          console.error('❌ Error querying metrics:', error);
          return {
            error: error instanceof Error ? error.message : 'Failed to fetch metrics data',
            emissions: { total: 0, scope1: 0, scope2: 0, scope3: 0 },
            energy: { total: 0, unit: 'MWh' },
            water: { total: 0, unit: 'm³' },
            waste: { total: 0, unit: 'tons' }
          };
        }
      }
    });
    */ // END queryMetrics - Use exploreData instead

    // ⭐⭐⭐ PRIMARY TOOL - Use this for ALL internal data questions ⭐⭐⭐
    // Tool: Explore Data with SQL (DeepSeek-style data analyst)
    // Think like a data analyst with full database access, not a chatbot with predefined answers
    this.tools.set('exploreData', {
      name: 'exploreData',
      description: `⭐ PRIMARY TOOL - Use this for EVERY question about sustainability data.

You are a data analyst, not a chatbot. When users ask questions:
- "What are my emissions?" → Write SQL to query emissions and analyze trends
- "How are we doing?" → Explore multiple metrics, find insights, calculate rates
- "Why did March spike?" → Investigate correlations, compare periods, find anomalies
- "Which site is best?" → Compare sites across metrics, calculate intensities, rank
- "Show me everything" → Query all metrics, find patterns, suggest improvements

ALWAYS explore data, NEVER just retrieve totals. Think:
1. What does the user really want to know?
2. What SQL will reveal the answer?
3. What patterns or insights can I find?
4. What follow-up analysis would be valuable?

DATABASE SCHEMA:

**metrics_data** (Main sustainability data table)
- metric_id: uuid (foreign key to metrics_catalog)
- site_id: uuid (foreign key to sites)
- organization_id: uuid
- value: numeric (the measurement value)
- co2e_emissions: numeric (CO2 equivalent emissions if applicable)
- unit: text (e.g., 'kWh', 'm³', 'kg', 'tCO2e')
- period_start: date
- period_end: date
- created_at: timestamp
- updated_at: timestamp

**metrics_catalog** (Metric definitions)
- id: uuid
- name: text (e.g., 'Electricity', 'Natural Gas', 'Water - Toilets')
- category: text (e.g., 'Stationary Combustion', 'Purchased Energy', 'Water Consumption')
- scope: text ('scope_1', 'scope_2', 'scope_3', or null)
- unit: text
- emission_factor: numeric
- description: text
- organization_id: uuid

**sites** (Organization locations)
- id: uuid
- name: text
- organization_id: uuid
- address: text
- city: text
- country: text
- area_sqm: numeric
- employees: integer
- created_at: timestamp

COMMON QUERIES:

**Find unusual patterns:**
SELECT
  s.name as site,
  mc.category,
  AVG(md.value) as avg_value,
  STDDEV(md.value) as std_dev
FROM metrics_data md
JOIN metrics_catalog mc ON md.metric_id = mc.id
JOIN sites s ON md.site_id = s.id
WHERE md.organization_id = '[org_id]'
GROUP BY s.name, mc.category
HAVING STDDEV(md.value) > AVG(md.value) * 0.5

**Time series analysis:**
SELECT
  DATE_TRUNC('month', period_start) as month,
  SUM(co2e_emissions) as total_emissions
FROM metrics_data
WHERE organization_id = '[org_id]'
GROUP BY month
ORDER BY month

**Site comparison:**
SELECT
  s.name,
  SUM(md.value) / s.area_sqm as intensity
FROM metrics_data md
JOIN sites s ON md.site_id = s.id
WHERE md.organization_id = '[org_id]'
  AND mc.category = 'Purchased Energy'
GROUP BY s.name, s.area_sqm
ORDER BY intensity DESC

GUIDELINES:
- Always filter by organization_id for data privacy
- Use JOINs to get meaningful context (site names, metric names)
- Aggregate data for insights (SUM, AVG, COUNT, STDDEV)
- Use DATE_TRUNC for time-based grouping
- LIMIT results to prevent overwhelming responses
- Replace [org_id] placeholder with actual organization ID`,

      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'SQL SELECT query to explore data. Must be read-only (SELECT only).'
          },
          analysisGoal: {
            type: 'string',
            description: 'What insight are you trying to find? (helps with error recovery)'
          }
        },
        required: ['query', 'analysisGoal']
      },

      execute: async (params) => {
        console.log('🔍 exploreData tool called with goal:', params.analysisGoal);
        console.log('📊 SQL Query:', params.query);

        if (!this.currentContext?.organizationId) {
          return {
            error: 'No organization context available',
            data: []
          };
        }

        try {
          // Replace [org_id] placeholder with actual org ID
          const query = params.query.replace(/\[org_id\]/g, this.currentContext.organizationId);

          console.log('🔍 [BlipeeBrain] Executing SQL:', query);

          // Call secure SQL execution function
          const { data, error } = await this.supabase
            .rpc('explore_sustainability_data', {
              query_text: query,
              org_id: this.currentContext.organizationId
            });

          if (error) {
            console.error('❌ SQL execution error:', error);
            return {
              error: error.message,
              query: params.query,
              suggestion: 'Try simplifying the query or checking table/column names'
            };
          }

          console.log('✅ Query executed successfully, rows:', data?.row_count);
          console.log('📊 Sample data:', data?.data?.slice(0, 3));

          return {
            success: true,
            data: data?.data || [],
            rowCount: data?.row_count || 0,
            query: params.query,
            analysisGoal: params.analysisGoal,
            executedAt: data?.executed_at
          };

        } catch (error: any) {
          console.error('❌ Error in exploreData:', error);
          return {
            error: error.message,
            query: params.query,
            analysisGoal: params.analysisGoal
          };
        }
      }
    });

    // ❌ REMOVED - Use exploreData instead for fully exploratory analysis
    /* COMMENTED OUT - Fully exploratory mode
    // Tool: Query Compliance Status
    this.tools.set('queryCompliance', {
      name: 'queryCompliance',
      description: 'Check compliance status for various frameworks (GRI, TCFD, SASB, CDP, etc.)',
      parameters: {
        type: 'object',
        properties: {
          framework: { type: 'string', description: 'Framework name or "all"' }
        }
      },
      execute: async (params) => {
        const { data, error } = await this.supabase
          .from('framework_mappings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        return {
          frameworks: data,
          summary: {
            totalFrameworks: data?.length || 0,
            compliant: data?.filter(f => f.compliance_status === 'compliant').length || 0,
            atRisk: data?.filter(f => f.compliance_status === 'at_risk').length || 0
          }
        };
      }
    });
    */ // END queryCompliance - Use exploreData instead

    // ❌ REMOVED - Use exploreData instead for fully exploratory analysis
    /* COMMENTED OUT - Fully exploratory mode
    // Tool: Analyze Trends
    this.tools.set('analyzeTrends', {
      name: 'analyzeTrends',
      description: 'Analyze trends in emissions, costs, or other metrics. Returns statistical analysis.',
      parameters: {
        type: 'object',
        properties: {
          metric: { type: 'string', description: 'What to analyze (emissions, costs, waste, etc.)' },
          timeframe: { type: 'string', description: 'daily, weekly, monthly, yearly' },
          data: { type: 'array', description: 'Time series data to analyze' }
        }
      },
      execute: async (params) => {
        // Handle different data structures
        let dataArray: any[] = params.data;

        // If data is an object with records property (from queryEmissions), extract it
        if (params.data && typeof params.data === 'object' && !Array.isArray(params.data)) {
          dataArray = params.data.records || params.data.data || [];
        }

        if (!dataArray || !Array.isArray(dataArray) || dataArray.length < 2) {
          return {
            trend: 'insufficient_data',
            message: 'Not enough data points for trend analysis (need at least 2)'
          };
        }

        // Calculate trend - use value or co2e_emissions from metrics_data
        const values = dataArray.map((d: any) => d.value || d.co2e_emissions || 0);
        const first = values[0];
        const last = values[values.length - 1];
        const change = last - first;
        const percentChange = first !== 0 ? (change / first) * 100 : 0;

        // Calculate moving average
        const movingAvg = values.map((_, i, arr) => {
          const window = arr.slice(Math.max(0, i - 6), i + 1);
          return window.reduce((sum, v) => sum + v, 0) / window.length;
        });

        return {
          trend: change > 0 ? 'increasing' : change < 0 ? 'decreasing' : 'stable',
          percentChange: Math.abs(percentChange).toFixed(1),
          absolute: Math.abs(change),
          movingAverage: movingAvg,
          dataPoints: values.length,
          volatility: this.calculateVolatility(values)
        };
      }
    });
    */ // END analyzeTrends - Use exploreData instead

    // ❌ REMOVED - Use exploreData instead for fully exploratory analysis
    /* COMMENTED OUT - Fully exploratory mode
    // Tool: Generate Chart Configuration
    this.tools.set('generateChart', {
      name: 'generateChart',
      description: 'Generate chart configuration for visualization. Returns chart config that frontend can render.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['line', 'bar', 'pie', 'area', 'scatter'] },
          title: { type: 'string' },
          data: { type: 'object', description: 'Chart data with labels and datasets' },
          insights: { type: 'string', description: 'Key insight about this chart' }
        }
      },
      execute: async (params) => {
        return {
          type: params.type,
          title: params.title,
          data: params.data,
          insights: params.insights,
          config: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: true },
              tooltip: { enabled: true }
            }
          }
        };
      }
    });
    */ // END generateChart - Use exploreData instead

    // ❌ REMOVED - Use exploreData instead for fully exploratory analysis
    /* COMMENTED OUT - Fully exploratory mode
    // Tool: Query Cost Data
    this.tools.set('queryCosts', {
      name: 'queryCosts',
      description: 'Query cost and financial data related to energy and sustainability',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          category: { type: 'string' }
        }
      },
      execute: async (params) => {
        // Query metrics data with value information
        let query = this.supabase
          .from('metrics_data')
          .select('*, metrics_catalog!inner(name, unit, category)')
          .not('value', 'is', null)
          .order('period_start', { ascending: true });

        if (params.startDate) query = query.gte('period_start', params.startDate);
        if (params.endDate) query = query.lte('period_start', params.endDate);
        if (params.category) query = query.eq('metrics_catalog.category', params.category);

        const { data, error } = await query;
        if (error) throw error;

        // Calculate totals from metrics data (value column)
        const totalValue = data?.reduce((sum, r) => sum + (r.value || 0), 0) || 0;

        return {
          records: data,
          totalValue: totalValue,
          avgValue: data?.length ? totalValue / data.length : 0,
          recordCount: data?.length || 0
        };
      }
    });
    */ // END queryCosts - Use exploreData instead

    // ===================================================================
    // SECTOR INTELLIGENCE TOOLS (MCP-Enhanced)
    // ===================================================================

    // Tool: Search Web for Sustainability Data
    this.tools.set('searchWeb', {
      name: 'searchWeb',
      description: 'Search the web for sustainability reports, regulations, company data. Uses cached results from web intelligence system.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query (e.g., "manufacturing companies sustainability reports 2024")' },
          numResults: { type: 'number', default: 10, description: 'Number of results to return' }
        },
        required: ['query']
      },
      execute: async (params) => {
        // Query cached web search results
        const { data: searchResults } = await this.supabase
          .from('web_intelligence_cache')
          .select('*')
          .textSearch('query', params.query)
          .limit(params.numResults || 10)
          .order('created_at', { ascending: false });

        if (searchResults && searchResults.length > 0) {
          return {
            results: searchResults.map((r: any) => ({
              title: r.title,
              url: r.url,
              summary: r.summary,
              relevance: r.relevance_score
            })),
            cached: true,
            source: 'web_intelligence_cache'
          };
        }

        // If no cached results, return suggestion to build cache
        return {
          results: [],
          message: 'No cached results found. The system can be enhanced with real-time web search via Exa API integration.',
          suggestion: 'Build web intelligence cache using MCP tools for faster future queries'
        };
      }
    });

    // Tool: Discover Companies in Sector
    this.tools.set('discoverCompanies', {
      name: 'discoverCompanies',
      description: 'Discover companies in a specific sector/industry with their sustainability reports. Uses AI search to find 50+ companies in minutes.',
      parameters: {
        type: 'object',
        properties: {
          sector: { type: 'string', description: 'Sector name (e.g., "manufacturing", "oil-gas", "agriculture")' },
          maxCompanies: { type: 'number', default: 50 }
        },
        required: ['sector']
      },
      execute: async (params) => {
        // Query existing sector companies
        const { data: existing } = await this.supabase
          .from('sector_companies')
          .select('*')
          .eq('sector', params.sector)
          .limit(params.maxCompanies);

        return {
          companies: existing || [],
          count: existing?.length || 0,
          sector: params.sector,
          note: 'Install Exa + Coresignal MCPs for automatic company discovery'
        };
      }
    });

    // Tool: Parse Sustainability Report
    this.tools.set('parseSustainabilityReport', {
      name: 'parseSustainabilityReport',
      description: 'Parse a PDF sustainability report and extract structured data (emissions, targets, standards). Queries cached parsed reports or suggests uploading for analysis.',
      parameters: {
        type: 'object',
        properties: {
          reportUrl: { type: 'string', description: 'URL to PDF report' },
          companyName: { type: 'string', description: 'Company name for context' }
        },
        required: ['reportUrl']
      },
      execute: async (params) => {
        // Check if this report has been parsed before
        const { data: cachedReport } = await this.supabase
          .from('parsed_sustainability_reports')
          .select('*')
          .eq('report_url', params.reportUrl)
          .single();

        if (cachedReport) {
          return {
            companyName: cachedReport.company_name,
            reportYear: cachedReport.report_year,
            scope1: cachedReport.scope1_emissions,
            scope2: cachedReport.scope2_emissions,
            scope3: cachedReport.scope3_emissions,
            totalEmissions: cachedReport.total_emissions,
            carbonNeutralTarget: cachedReport.carbon_neutral_target_year,
            reportingStandards: cachedReport.reporting_standards || [],
            targets: cachedReport.targets || [],
            initiatives: cachedReport.initiatives || [],
            cached: true,
            parsedAt: cachedReport.parsed_at
          };
        }

        // If not cached, suggest document upload feature
        return {
          message: 'This report has not been parsed yet.',
          suggestion: 'Upload the report through the document parser for AI-powered extraction of emissions data, targets, and compliance information.',
          reportUrl: params.reportUrl,
          companyName: params.companyName,
          note: 'Enhanced with PaddleOCR MCP for 90% accuracy in table extraction'
        };
      }
    });

    // ❌ REMOVED - Use exploreData instead for fully exploratory analysis
    /* COMMENTED OUT - Fully exploratory mode
    // Tool: Compare to Sector Benchmark
    this.tools.set('compareToBenchmark', {
      name: 'compareToBenchmark',
      description: 'Compare company performance to sector benchmarks. Shows how you rank against peers in emissions, targets, and practices.',
      parameters: {
        type: 'object',
        properties: {
          sector: { type: 'string', description: 'Your sector/industry' },
          yourEmissions: { type: 'number', description: 'Your total emissions (tCO2e)' },
          yourRevenue: { type: 'number', description: 'Annual revenue for intensity calculation' }
        },
        required: ['sector']
      },
      execute: async (params) => {
        // Query sector benchmark
        const { data: benchmark } = await this.supabase
          .from('sector_benchmarks')
          .select('*')
          .eq('sector', params.sector)
          .single();

        if (!benchmark) {
          return {
            message: `No benchmark available for ${params.sector} yet`,
            suggestion: 'Use discoverCompanies tool to build sector benchmark'
          };
        }

        // Calculate comparison
        const yourIntensity = params.yourRevenue
          ? (params.yourEmissions || 0) / params.yourRevenue
          : 0;

        return {
          sector: params.sector,
          yourEmissions: params.yourEmissions,
          sectorAverage: benchmark.avg_scope_1_2_3,
          yourPerformance: yourIntensity < benchmark.avg_emissions_intensity
            ? 'Better than average'
            : 'Below average',
          percentile: this.calculatePercentile(params.yourEmissions, benchmark),
          topPerformers: benchmark.top_performers || [],
          recommendations: [
            'Review top performers strategies',
            'Focus on highest emission sources',
            'Set science-based targets'
          ]
        };
      }
    });
    */ // END compareToBenchmark - Use exploreData instead

    // Tool: Research Latest Regulations
    this.tools.set('researchRegulations', {
      name: 'researchRegulations',
      description: 'Research latest sustainability regulations and compliance requirements. Queries regulatory intelligence database.',
      parameters: {
        type: 'object',
        properties: {
          region: { type: 'string', description: 'Geographic region (e.g., "EU", "US", "Global")' },
          topic: { type: 'string', description: 'Regulation topic (e.g., "carbon border tax", "CSRD", "SEC climate")' }
        }
      },
      execute: async (params) => {
        // Query regulatory intelligence database
        let query = this.supabase
          .from('regulatory_intelligence')
          .select('*')
          .order('effective_date', { ascending: false })
          .limit(10);

        if (params.region) {
          query = query.eq('region', params.region);
        }
        if (params.topic) {
          query = query.textSearch('topic', params.topic);
        }

        const { data: regulations } = await query;

        if (regulations && regulations.length > 0) {
          return {
            regulations: regulations.map((reg: any) => ({
              name: reg.regulation_name,
              region: reg.region,
              status: reg.status,
              effectiveDate: reg.effective_date,
              summary: reg.summary,
              impact: reg.impact_level,
              complianceDeadline: reg.compliance_deadline,
              requirements: reg.requirements || [],
              source: reg.source_url
            })),
            count: regulations.length,
            lastUpdated: regulations[0]?.last_updated
          };
        }

        // If no data, suggest building regulatory intelligence
        return {
          message: 'Regulatory intelligence database is being built.',
          suggestion: 'The system can be enhanced with automated regulatory monitoring using web intelligence MCPs.',
          region: params.region,
          topic: params.topic
        };
      }
    });
  }

  /**
   * Fetch sustainability schema context from database
   * This provides the LLM with domain knowledge for accurate SQL generation
   */
  private async getSchemaContext(): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc('get_sustainability_schema');

      if (error || !data) {
        console.warn('⚠️ Could not fetch schema context:', error);
        return 'Schema context unavailable - using basic database knowledge.';
      }

      // Format the schema context for the LLM
      const domainKnowledge = data.domain_knowledge || {};
      const scopes = domainKnowledge.scopes || {};
      const griStandards = domainKnowledge.gri_standards || [];
      const commonUnits = domainKnowledge.common_units || {};
      const tables = data.tables || {};
      const commonPatterns = data.common_patterns || [];

      return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATABASE SCHEMA CONTEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 SUSTAINABILITY DOMAIN KNOWLEDGE

GHG Protocol Scopes:
• Scope 1: ${scopes.scope_1 || 'Direct emissions'}
• Scope 2: ${scopes.scope_2 || 'Indirect emissions from energy'}
• Scope 3: ${scopes.scope_3 || 'Value chain emissions'}

GRI Standards:
${griStandards.map((std: string) => `• ${std}`).join('\n')}

Common Units:
• Energy: ${(commonUnits.energy || []).join(', ')}
• Emissions: ${(commonUnits.emissions || []).join(', ')}
• Water: ${(commonUnits.water || []).join(', ')}
• Waste: ${(commonUnits.waste || []).join(', ')}

📊 TABLE SCHEMAS

${Object.entries(tables).map(([tableName, tableInfo]: [string, any]) => `
**${tableName}**
${tableInfo.description || ''}
Key columns:
${(tableInfo.key_columns || []).map((col: string) => `  • ${col}`).join('\n')}

Example: ${tableInfo.example_query || 'N/A'}
`).join('\n')}

💡 COMMON SQL PATTERNS

${commonPatterns.map((pattern: string, idx: number) => `${idx + 1}. ${pattern}`).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    } catch (error) {
      console.error('❌ Error fetching schema context:', error);
      return 'Schema context error - using fallback database knowledge.';
    }
  }

  /**
   * Main processing method - LLM orchestrates everything
   * @param streamCallback - Optional callback for streaming progress updates
   */
  async process(
    userMessage: string,
    context: BlipeeBrainContext,
    streamCallback?: (update: { step: string; message: string; data?: any }) => void
  ): Promise<any> {

    // Store context for use in tool execution
    this.currentContext = context;

    // Helper to send stream updates
    const stream = (step: string, message: string, data?: any) => {
      if (streamCallback) {
        streamCallback({ step, message, data });
      }
    };

    // 🆕 Fetch schema context for enhanced SQL generation
    stream('loading', '📚 Loading database schema context...');
    const schemaContext = await this.getSchemaContext();
    stream('loading', '✓ Schema context loaded');

    // Build the system prompt that explains blipee's capabilities
    const systemPrompt = `You are blipee, a conversational data analyst helping users explore their sustainability data.

${schemaContext}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AI ANALYST INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MINDSET: You are a data analyst having a conversation, not a chatbot with predefined answers.

AVAILABLE TOOLS:
${Array.from(this.tools.values()).map(tool =>
  `- ${tool.name}: ${tool.description}`
).join('\n')}

DECISION FRAMEWORK:
1. **Do I have enough information to write accurate SQL?**
   - ✓ YES: Use exploreData tool to query and analyze
   - ✗ NO: Ask clarifying questions naturally

2. **When to ask questions:**
   - Vague requests: "show me data" → Ask: "Which metrics interest you?"
   - Ambiguous comparisons: "compare performance" → Ask: "Compare with what?"
   - Missing time periods: "analyze trends" → Ask: "What time period?"
   - Unclear metrics: "how are we doing" → Ask: "In terms of emissions, energy, or water?"

3. **When you have information:**
   - Write SQL to explore the data
   - Find patterns and insights
   - Provide conversational analysis with recommendations

USER CONTEXT:
- Organization: ${context.organizationId}
- User: ${context.userId}

RESPONSE FORMAT:
Always respond in JSON with ONE of these formats:

**Format A - When you need clarification:**
{
  "thinking": "I need to ask about X because...",
  "needsClarification": true,
  "question": "To analyze this properly, I need to know: [specific question]?",
  "options": ["Option 1", "Option 2", "Option 3"] // Optional: suggest choices
}

**Format B - When you have enough information:**
{
  "thinking": "I can answer this by querying...",
  "toolCalls": [
    {
      "tool": "exploreData",
      "params": {
        "query": "SELECT ... FROM metrics_data WHERE ...",
        "analysisGoal": "Find emissions patterns"
      }
    }
  ],
  "response": {
    "greeting": "I analyzed your data...",
    "insights": ["Key finding 1", "Key finding 2"],
    "charts": [/* chart configs if needed */],
    "recommendations": ["Action 1", "Action 2"],
    "specialists": ["blipee-analyst"] // Data analyst mode
  }
}`;

    // First call: LLM plans what tools to use
    stream('analyzing', '🧠 Analyzing your request...');

    const planningPrompt = `${systemPrompt}

USER MESSAGE: "${userMessage}"

Analyze this request and plan your response. What tools do you need? What data should you query?`;

    stream('planning', '🎯 Planning what data to gather...');
    const plan = await aiService.complete(planningPrompt, {
      temperature: 0.3,
      maxTokens: 2000,
      jsonMode: true
    });
    stream('planning', '✓ Plan ready');

    let planData;
    try {
      planData = JSON.parse(plan);
    } catch (e) {
      // Fallback if JSON parsing fails
      return {
        content: "I'm analyzing your request. Let me gather the relevant data for you.",
        error: "planning_failed"
      };
    }

    // 🆕 Check if LLM needs clarification
    if (planData.needsClarification) {
      stream('clarification', '❓ Asking for clarification...');
      return {
        greeting: planData.question || "I need a bit more information to help you better.",
        insights: [],
        recommendations: [],
        needsClarification: true,
        clarificationQuestion: planData.question,
        clarificationOptions: planData.options || [],
        metadata: {
          thinking: planData.thinking,
          needsClarification: true
        }
      };
    }

    // Execute tool calls
    const toolResults: any = {};
    const totalTools = planData.toolCalls?.length || 0;
    let toolIndex = 0;

    stream('executing', `🔧 Executing ${totalTools} tools...`);

    for (const toolCall of planData.toolCalls || []) {
      toolIndex++;
      const tool = this.tools.get(toolCall.tool);
      if (tool) {
        try {
          stream('executing', `⚡ ${toolIndex}/${totalTools}: ${this.getToolDescription(toolCall.tool)}...`);
          // Replace references to previous results
          const params = this.resolveToolParams(toolCall.params, toolResults);
          toolResults[toolCall.tool] = await tool.execute(params);
          stream('executing', `✓ ${toolCall.tool} complete`);
        } catch (error) {
          console.error(`Error executing tool ${toolCall.tool}:`, error);
          toolResults[toolCall.tool] = { error: 'execution_failed' };
          stream('executing', `⚠️ ${toolCall.tool} failed`);
        }
      }
    }

    stream('executing', '✓ All tools executed');

    // Second call: LLM synthesizes results
    stream('synthesizing', '🎨 Analyzing results and preparing response...');

    // Summarize tool results to avoid token limit issues
    const summarizedResults = this.summarizeToolResults(toolResults);

    const synthesisPrompt = `${systemPrompt}

USER MESSAGE: "${userMessage}"

TOOL RESULTS SUMMARY:
${JSON.stringify(summarizedResults, null, 2)}

Now synthesize these results into a friendly, helpful response with visualizations and recommendations.`;

    stream('synthesizing', '💭 Generating insights and recommendations...');
    const synthesis = await aiService.complete(synthesisPrompt, {
      temperature: 0.7,
      maxTokens: 2000,
      jsonMode: true
    });
    stream('synthesizing', '✓ Response ready');

    let response;
    try {
      response = JSON.parse(synthesis);
    } catch (e) {
      // Fallback response
      return {
        content: "I've analyzed your data. Here's what I found: " + JSON.stringify(toolResults),
        toolResults
      };
    }

    return {
      ...response.response,
      metadata: {
        toolsUsed: Object.keys(toolResults),
        thinking: planData.thinking
      }
    };
  }

  /**
   * Resolve tool parameters that reference previous results
   */
  private resolveToolParams(params: any, results: any): any {
    const resolved = { ...params };
    for (const [key, value] of Object.entries(resolved)) {
      if (typeof value === 'string' && value.startsWith('<results from ')) {
        const toolName = value.match(/<results from (\w+)>/)?.[1];
        if (toolName && results[toolName]) {
          resolved[key] = results[toolName].records || results[toolName];
        }
      }
    }
    return resolved;
  }

  /**
   * Calculate volatility of a time series
   */
  private calculateVolatility(values: number[]): string {
    if (values.length < 2) return 'unknown';

    const changes = values.slice(1).map((v, i) => Math.abs(v - values[i]));
    const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length;
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const volatilityRatio = avgChange / mean;

    if (volatilityRatio < 0.05) return 'low';
    if (volatilityRatio < 0.15) return 'moderate';
    return 'high';
  }

  /**
   * Calculate percentile ranking
   */
  private calculatePercentile(value: number, benchmark: any): string {
    // Simplified percentile calculation
    const avg = benchmark.avg_scope_1_2_3 || 0;
    if (value < avg * 0.5) return 'Top 10% (Excellent)';
    if (value < avg * 0.75) return 'Top 25% (Good)';
    if (value < avg) return 'Top 50% (Average)';
    if (value < avg * 1.5) return 'Bottom 50% (Below Average)';
    return 'Bottom 25% (Needs Improvement)';
  }

  /**
   * Get friendly description for a tool name
   */
  private getToolDescription(toolName: string): string {
    const tool = this.tools.get(toolName);
    if (!tool) return toolName;

    // Extract first sentence from description
    const firstSentence = tool.description.split('.')[0];
    return firstSentence.length > 50 ? firstSentence.substring(0, 47) + '...' : firstSentence;
  }

  /**
   * Summarize tool results to avoid token limit issues
   * Instead of sending 1000+ records, send summaries and samples
   */
  private summarizeToolResults(toolResults: any): any {
    const summarized: any = {};

    for (const [toolName, result] of Object.entries(toolResults)) {
      if (!result || typeof result !== 'object') {
        summarized[toolName] = result;
        continue;
      }

      // Handle error results
      if (result.error) {
        summarized[toolName] = result;
        continue;
      }

      // Summarize based on data structure
      const summary: any = {};

      // Copy non-array fields (summaries, metadata, etc)
      for (const [key, value] of Object.entries(result)) {
        if (!Array.isArray(value)) {
          summary[key] = value;
        } else {
          // For arrays (like records), include summary + sample
          const array = value as any[];
          summary[key] = {
            count: array.length,
            sample: array.slice(0, 5), // First 5 records only
            fields: array.length > 0 ? Object.keys(array[0]) : []
          };
        }
      }

      summarized[toolName] = summary;
    }

    return summarized;
  }
}

// Export singleton
export const blipeeBrain = new BlipeeBrain();
