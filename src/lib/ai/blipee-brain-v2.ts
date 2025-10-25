/**
 * Blipee Brain V2 - Vercel AI SDK Implementation
 *
 * Migrated from custom tool calling to Vercel AI SDK for:
 * - Better type safety with Zod schemas
 * - Automatic tool execution
 * - Built-in streaming support
 * - Cleaner code with less manual JSON parsing
 */

// ✅ FIXED: Using proper Vercel AI SDK with correct inputSchema property
import { generateText, generateObject, streamText, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * Zod schema for sustainability report emissions extraction
 * Using multi-modal PDF parsing with Vercel AI SDK
 */
const EmissionsDataSchema = z.object({
  companyName: z.string().describe('Company name from the report'),
  reportYear: z.number().describe('Reporting year (e.g., 2023)'),
  scope1Emissions: z.number().nullable().describe('Scope 1 direct emissions in tCO2e'),
  scope2Emissions: z.number().nullable().describe('Scope 2 indirect energy emissions in tCO2e'),
  scope3Emissions: z.number().nullable().describe('Scope 3 value chain emissions in tCO2e'),
  totalEmissions: z.number().nullable().describe('Total GHG emissions in tCO2e'),
  carbonNeutralTargetYear: z.number().nullable().describe('Year company aims to be carbon neutral'),
  netZeroTargetYear: z.number().nullable().describe('Year company aims for net-zero emissions'),
  reportingStandards: z.array(z.string()).describe('Standards used (GRI, CDP, TCFD, etc.)'),
  renewableEnergyPercentage: z.number().nullable().describe('Percentage of renewable energy used'),
  emissionsReductionTarget: z.string().nullable().describe('Emissions reduction target description'),
  keyInitiatives: z.array(z.string()).describe('Key sustainability initiatives mentioned'),
  dataQuality: z.enum(['verified', 'unverified', 'estimated']).describe('Quality of emissions data'),
  reportUrl: z.string().url().describe('URL to the original report')
});

interface BlipeeBrainContext {
  userId: string;
  organizationId: string;
  conversationId: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

interface StreamUpdate {
  step: string;
  message: string;
  data?: any;
}

/**
 * Blipee Brain V2 - Powered by Vercel AI SDK
 */
export class BlipeeBrainV2 {
  private supabase = createAdminClient();
  private currentContext: BlipeeBrainContext | null = null;

  // ✅ FIXED: Using gpt-4o for better tool calling (gpt-4o-mini doesn't continue after tool results)
  private model = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
    compatibility: 'strict'
  })('gpt-4o');

  /**
   * Parse PDF sustainability report using multi-modal AI
   * Uses Vercel SDK's native PDF support - no external parsing needed!
   */
  private async parsePDFReport(reportUrl: string): Promise<z.infer<typeof EmissionsDataSchema>> {
    try {
      // Download PDF
      const response = await fetch(reportUrl);
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      const pdfBuffer = await response.arrayBuffer();
      console.log('📄 [PDF Parser] Downloaded PDF:', reportUrl, `(${pdfBuffer.byteLength} bytes)`);

      // Use generateObject with multi-modal prompt
      const result = await generateObject({
        model: this.model,
        schema: EmissionsDataSchema,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract sustainability and emissions data from this PDF report. Focus on:
- Scope 1, 2, 3 emissions (in tCO2e)
- Reporting standards used (GRI, CDP, TCFD, SASB, etc.)
- Carbon neutral / net-zero target years
- Renewable energy percentage
- Key sustainability initiatives
- Data verification status

Be precise with numbers. If data is not found, use null.`
              },
              {
                type: 'file',
                data: Buffer.from(pdfBuffer),
                mediaType: 'application/pdf'  // ✅ FIXED: Correct property name per SDK docs
              }
            ]
          }
        ],
        temperature: 0, // Deterministic for data extraction
        maxRetries: 2
      });

      console.log('✅ [PDF Parser] Extraction complete:', result.object.companyName);

      return {
        ...result.object,
        reportUrl // Ensure URL is included
      };

    } catch (error: any) {
      console.error('❌ [PDF Parser] Error:', error);
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  /**
   * Define all tools using Vercel AI SDK tool() function
   * 🔧 FIX: Simplified to avoid closure serialization issues
   */
  private getTools() {
    // Capture references for use in execute functions
    const supabase = this.supabase;
    const currentContext = this.currentContext;
    const parsePDFReport = this.parsePDFReport.bind(this); // ✅ Bind for multi-modal PDF parsing

    return {
      exploreData: tool({
        description: 'Execute SQL queries to get sustainability data (emissions, energy, water, waste). Use for any data questions.',
        inputSchema: z.object({
          query: z.string().describe('SQL SELECT query. Use [org_id] placeholder.'),
          analysisGoal: z.string().describe('What insight are you finding?')
        }),
        execute: async ({ query, analysisGoal }) => {
          if (!currentContext?.organizationId) {
            return {
              error: 'No organization context available',
              data: []
            };
          }

          try {
            // Replace [org_id] placeholder with actual org ID
            const finalQuery = query.replace(/\[org_id\]/g, currentContext.organizationId);

            console.log('🔍 [BlipeeBrain V2] Executing SQL:', finalQuery);

            // Call secure SQL execution function
            const { data, error } = await supabase.rpc('explore_sustainability_data', {
              query_text: finalQuery,
              org_id: currentContext.organizationId
            });

            if (error) {
              console.error('❌ SQL execution error:', error);
              return {
                error: error.message,
                query: finalQuery,
                suggestion: 'Try simplifying the query or checking table/column names'
              };
            }

            console.log('✅ Query executed successfully, rows:', data?.row_count);
            console.log('📊 Sample data:', data?.data?.slice(0, 3));

            return {
              success: true,
              data: data?.data || [],
              rowCount: data?.row_count || 0,
              query: finalQuery,
              analysisGoal,
              executedAt: data?.executed_at
            };

          } catch (error: any) {
            console.error('❌ Error in exploreData:', error);
            return {
              error: error.message,
              query,
              analysisGoal
            };
          }
        }
      }),

      searchWeb: tool({
        description: 'Search the web for sustainability reports, regulations, company data. Uses cached web intelligence results.',
        inputSchema: z.object({
          query: z.string().describe('Search query (e.g., "manufacturing companies sustainability reports 2024")'),
          numResults: z.number().optional().default(10).describe('Number of results to return')
        }),

        execute: async ({ query, numResults }) => {
          const { data: searchResults } = await supabase
            .from('web_intelligence_cache')
            .select('*')
            .textSearch('query', query)
            .limit(numResults)
            .order('created_at', { ascending: false });

          if (searchResults && searchResults.length > 0) {
            return {
              results: searchResults.map((r: any) => ({
                title: r.title,
                url: r.url,
                summary: r.summary,
                relevance: r.relevance_score
              })),
              cached: true
            };
          }

          return {
            results: [],
            message: 'No cached results found. Build web intelligence cache for faster queries.'
          };
        }
      }),

      discoverCompanies: tool({
        description: 'Discover companies in a specific sector/industry with sustainability reports.',
        inputSchema: z.object({
          sector: z.string().describe('Sector name (e.g., "manufacturing", "oil-gas", "agriculture")'),
          maxCompanies: z.number().optional().default(50).describe('Maximum number of companies to return')
        }),

        execute: async ({ sector, maxCompanies }) => {
          const { data: companies } = await supabase
            .from('sector_companies')
            .select('*')
            .eq('sector', sector)
            .limit(maxCompanies);

          return {
            companies: companies || [],
            count: companies?.length || 0,
            sector
          };
        }
      }),

      parseSustainabilityReport: tool({
        description: 'Parse a PDF sustainability report and extract structured emissions data using AI. Returns Scope 1/2/3 emissions, targets, and standards.',
        inputSchema: z.object({
          reportUrl: z.string().url().describe('URL to PDF sustainability report'),
          forceRefresh: z.boolean().optional().default(false).describe('Force re-parsing even if cached')
        }),

        execute: async ({ reportUrl, forceRefresh }) => {
          try {
            // Check cache first (unless force refresh)
            if (!forceRefresh) {
              const { data: cachedReport } = await supabase
                .from('parsed_sustainability_reports')
                .select('*')
                .eq('report_url', reportUrl)
                .single();

              if (cachedReport) {
                console.log('✓ [parseSustainabilityReport] Using cached data');
                return {
                  ...cachedReport,
                  cached: true,
                  parsedAt: cachedReport.parsed_at
                };
              }
            }

            // Parse PDF using multi-modal AI
            console.log('🚀 [parseSustainabilityReport] Parsing PDF with AI...');
            const parsedData = await parsePDFReport(reportUrl);

            // Cache results in Supabase
            const { error: insertError } = await supabase
              .from('parsed_sustainability_reports')
              .upsert({
                report_url: reportUrl,
                company_name: parsedData.companyName,
                report_year: parsedData.reportYear,
                scope1_emissions: parsedData.scope1Emissions,
                scope2_emissions: parsedData.scope2Emissions,
                scope3_emissions: parsedData.scope3Emissions,
                total_emissions: parsedData.totalEmissions,
                carbon_neutral_target_year: parsedData.carbonNeutralTargetYear,
                net_zero_target_year: parsedData.netZeroTargetYear,
                reporting_standards: parsedData.reportingStandards,
                renewable_energy_percentage: parsedData.renewableEnergyPercentage,
                emissions_reduction_target: parsedData.emissionsReductionTarget,
                key_initiatives: parsedData.keyInitiatives,
                data_quality: parsedData.dataQuality,
                parsed_at: new Date().toISOString()
              });

            if (insertError) {
              console.error('⚠️ Failed to cache parsed report:', insertError);
            } else {
              console.log('✓ [parseSustainabilityReport] Cached to database');
            }

            return {
              ...parsedData,
              cached: false,
              parsedAt: new Date().toISOString()
            };

          } catch (error: any) {
            console.error('❌ [parseSustainabilityReport] Error:', error);
            return {
              error: error.message,
              reportUrl,
              suggestion: 'Ensure the PDF URL is accessible and contains sustainability data.'
            };
          }
        }
      }),

      researchRegulations: tool({
        description: 'Research latest sustainability regulations and compliance requirements.',
        inputSchema: z.object({
          region: z.string().optional().describe('Geographic region (e.g., "EU", "US", "Global")'),
          topic: z.string().optional().describe('Regulation topic (e.g., "carbon border tax", "CSRD")')
        }),

        execute: async ({ region, topic }) => {
          let query = supabase
            .from('regulatory_intelligence')
            .select('*')
            .order('effective_date', { ascending: false })
            .limit(10);

          if (region) query = query.eq('region', region);
          if (topic) query = query.textSearch('topic', topic);

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
                source: reg.source_url
              })),
              count: regulations.length
            };
          }

          return {
            message: 'Regulatory intelligence database is being built.',
            region,
            topic
          };
        }
      })
    };
  }

  /**
   * Fetch sustainability schema context from database
   */
  private async getSchemaContext(): Promise<string> {
    try {
      const { data, error } = await this.supabase.rpc('get_sustainability_schema');

      if (error || !data) {
        console.warn('⚠️ Could not fetch schema context:', error);
        return this.getFallbackSchema();
      }

      const domainKnowledge = data.domain_knowledge || {};
      const scopes = domainKnowledge.scopes || {};
      const tables = data.tables || {};

      return `
DATABASE SCHEMA CONTEXT

GHG Protocol Scopes:
• Scope 1: ${scopes.scope_1 || 'Direct emissions'}
• Scope 2: ${scopes.scope_2 || 'Indirect emissions from energy'}
• Scope 3: ${scopes.scope_3 || 'Value chain emissions'}

Key Tables:
${Object.entries(tables).map(([tableName, tableInfo]: [string, any]) => `
**${tableName}**: ${tableInfo.description || ''}
Example: ${tableInfo.example_query || 'N/A'}
`).join('\n')}

${this.getFallbackSchema()}
`;
    } catch (error) {
      console.error('❌ Error fetching schema context:', error);
      return this.getFallbackSchema();
    }
  }

  /**
   * Fallback schema with explicit JOIN instructions
   */
  private getFallbackSchema(): string {
    return `
**CRITICAL SCHEMA INFORMATION:**

Table: metrics_data (raw measurements)
- Columns: id, organization_id, metric_id, site_id, period_start, period_end, value, unit, co2e_emissions
- Does NOT have: source, scope, category (these are in metrics_catalog)

Table: metrics_catalog (metric definitions)
- Columns: id, code, name, scope, category, subcategory, unit, emission_factor
- Contains:
  * scope: stored as 'scope_1', 'scope_2', 'scope_3' (lowercase with underscore)
  * category: Energy, Transportation, Waste, Business Travel, etc.

**ALWAYS JOIN TABLES:**
To get scope or category information, you MUST JOIN:
\`\`\`sql
SELECT ... FROM metrics_data md
JOIN metrics_catalog mc ON md.metric_id = mc.id
WHERE md.organization_id = '[org_id]'
\`\`\`

**Common Query Patterns:**
- Top emission sources by category:
  SELECT SUM(md.co2e_emissions) as total, mc.category as source
  FROM metrics_data md JOIN metrics_catalog mc ON md.metric_id = mc.id
  WHERE md.organization_id = '[org_id]' GROUP BY mc.category ORDER BY total DESC

- Emissions by scope:
  SELECT SUM(md.co2e_emissions) as total, mc.scope
  FROM metrics_data md JOIN metrics_catalog mc ON md.metric_id = mc.id
  WHERE md.organization_id = '[org_id]' GROUP BY mc.scope ORDER BY total DESC

- Filter by specific scope (use lowercase with underscore):
  SELECT SUM(md.co2e_emissions) as total
  FROM metrics_data md JOIN metrics_catalog mc ON md.metric_id = mc.id
  WHERE md.organization_id = '[org_id]' AND mc.scope = 'scope_3'
`;
  }

  /**
   * Main processing method using Vercel AI SDK
   */
  async process(
    userMessage: string,
    context: BlipeeBrainContext,
    streamCallback?: (update: StreamUpdate) => void
  ): Promise<any> {

    // Store context for tool execution
    this.currentContext = context;

    const stream = (step: string, message: string, data?: any) => {
      if (streamCallback) {
        streamCallback({ step, message, data });
      }
    };

    try {
      // Fetch schema context
      stream('loading', '📚 Loading database schema context...');
      const schemaContext = await this.getSchemaContext();
      stream('loading', '✓ Schema context loaded');

      // Build system prompt with schema context
      const currentYear = new Date().getFullYear();
      const systemPrompt = `You are blipee, an AI-powered sustainability intelligence assistant.

${schemaContext}

**Your Capabilities:**
- Query sustainability data using SQL (exploreData tool)
- Search web intelligence for reports and regulations (searchWeb tool)
- Discover companies by sector (discoverCompanies tool)
- Parse sustainability reports (parseSustainabilityReport tool)
- Research regulations and compliance (researchRegulations tool)

**Guidelines:**
- Always use tools to get real, accurate data
- Be friendly, professional, and conversational - speak naturally like a helpful colleague
- Provide actionable insights and recommendations
- Show genuine interest in helping users improve their sustainability performance
- Use encouraging language and celebrate progress when appropriate
- Ask follow-up questions to better understand user needs

**TIME FILTERING (CRITICAL):**
- Current date: ${new Date().toISOString().split('T')[0]}
- ALWAYS filter metrics_data by period_start/period_end in your SQL queries
- If no time period specified by user, DEFAULT to current year (${currentYear})
- Parse time expressions: "this year" = ${currentYear}, "last year" = ${currentYear - 1}, "Q1" = Jan-Mar, etc.
- ALWAYS include the time period in your response (e.g., "For 2025, your top sources are...")
- Example query with time filter:
  WHERE md.organization_id = '[org_id]'
    AND md.period_start >= '${currentYear}-01-01'
    AND md.period_end <= '${currentYear}-12-31'

Organization: ${context.organizationId}`;

      stream('analyzing', '🧠 Analyzing your request...');

      // Get all tools using proper Vercel AI SDK pattern
      const tools = this.getTools();

      console.log('✅ [BlipeeBrain V2] Tools loaded:', Object.keys(tools));
      console.log('📝 [BlipeeBrain V2] Processing:', userMessage);

      // Add timeout protection (30 second limit)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        // ✅ FIXED: Build messages array with conversation history
        const messages = [];

        // Add system message
        messages.push({
          role: 'system' as const,
          content: systemPrompt
        });

        // Add conversation history if available
        if (context.conversationHistory && context.conversationHistory.length > 0) {
          messages.push(...context.conversationHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })));
        }

        // Add current user message
        messages.push({
          role: 'user' as const,
          content: userMessage
        });

        console.log('💬 [BlipeeBrain V2] Using conversation history:', messages.length, 'messages');

        // Use Vercel AI SDK generateText with proper configuration
        const result = await generateText({
          model: this.model,
          messages, // ✅ FIXED: Use messages with conversation history
          tools,
          maxToolRoundtrips: 5, // Allow multi-step tool use
          temperature: 0, // ✅ FIXED: Deterministic tool calling
          maxRetries: 3, // ✅ FIXED: Auto-retry on failures (default is 2)
          abortSignal: controller.signal, // ✅ FIXED: Timeout protection
          maxOutputTokens: 2000, // ✅ FIXED: Correct property name per API reference
          onStepFinish: ({ text, toolCalls, toolResults }) => {
            if (toolCalls && toolCalls.length > 0) {
              stream('executing', `⚡ Executing ${toolCalls.length} tool(s)...`);
              toolCalls.forEach((call, i) => {
                console.log(`🔧 [TOOL CALL ${i+1}]:`, call.toolName, call.args);
                stream('executing', `⚡ ${i + 1}/${toolCalls.length}: ${call.toolName}...`);
              });
            }
            if (toolResults && toolResults.length > 0) {
              stream('executing', `✓ Tools executed successfully`);
              console.log('✅ [TOOL RESULTS]:', toolResults);
            }
          }
        });

        console.log('🔧 [RESULT] Total tool calls:', result.toolCalls?.length || 0);
        console.log('🔧 [RESULT] Total roundtrips:', result.roundtrips?.length || 0);
        console.log('🔧 [RESULT] Usage:', result.usage);

        stream('complete', '✓ Analysis complete');

        // Parse response structure
        let responseText = result.text;
        console.log('📝 [RESULT] Response text length:', responseText?.length || 0);
        console.log('📝 [RESULT] Response text preview:', responseText?.substring(0, 200) || '(empty)');

        // ✅ FIX: If response is empty but tools were called, generate response from tool results
        if (!responseText && result.toolResults && result.toolResults.length > 0) {
          console.log('⚠️ [WORKAROUND] Model returned empty text after tool call, generating response from tool results');
          console.log('🔍 [WORKAROUND] Tool results count:', result.toolResults.length);

          // ✅ FIX: Access 'output' property, not 'result'
          const toolResultsData = result.toolResults.map(tr => {
            const data = tr.output; // Use 'output' instead of 'result'
            console.log('🔧 Processing tool result:', tr.toolName, 'output type:', typeof data);
            try {
              const parsed = typeof data === 'string' ? JSON.parse(data) : data;
              console.log('✅ Parsed output:', JSON.stringify(parsed).substring(0, 300));
              return parsed;
            } catch (e) {
              console.log('❌ Parse error:', e);
              return data;
            }
          });

          console.log('🔍 [WORKAROUND] Final tool results data:', toolResultsData[0] ? JSON.stringify(toolResultsData[0]).substring(0, 500) : '(empty)');

          // Generate a natural response based on the tool results
          if (toolResultsData.length > 0) {
            // ✅ FIX: Handle {success: true, data: [...]} response format
            const firstResult = toolResultsData[0];
            const data = firstResult?.data || firstResult; // Access .data if it exists, otherwise use the result directly

            // Handle array of sources (e.g., top 3 emissions)
            if (Array.isArray(data) && data.length > 0 && data[0].source && data[0].total) {
              // Get current year for time context
              const currentYear = new Date().getFullYear();

              // Format emissions data in a friendly, conversational way
              const topSource = data[0];
              const topEmissions = parseFloat(topSource.total) / 1000;

              responseText = `Looking at your ${currentYear} emissions, I can see that ${topSource.source} is your biggest contributor at ${topEmissions.toFixed(1)} tonnes CO2e`;

              if (data.length > 1) {
                responseText += `, followed by ${data[1].source} at ${(parseFloat(data[1].total) / 1000).toFixed(1)} tonnes`;
              }

              if (data.length > 2) {
                responseText += ` and ${data[2].source} at ${(parseFloat(data[2].total) / 1000).toFixed(1)} tonnes`;
              }

              responseText += `. `;

              // Add total with context
              const total = data.reduce((sum: number, item: any) => sum + parseFloat(item.total), 0);
              responseText += `Together, these ${data.length} areas account for ${(total / 1000).toFixed(1)} tonnes CO2e this year.\n\n`;

              // Add friendly, helpful closing
              responseText += `This is valuable insight - understanding where your emissions come from is the first step toward meaningful reduction. Would you like me to suggest some ways to address these areas?`;

              console.log('✅ [WORKAROUND] Generated response successfully:', responseText.length, 'characters');
            }
            // Handle single aggregate result (e.g., total scope 2 emissions)
            else if (Array.isArray(data) && data.length > 0 && data[0].total && !data[0].source) {
              const currentYear = new Date().getFullYear();
              const total = parseFloat(data[0].total) / 1000;
              responseText = `For ${currentYear}, your total in this category is ${total.toFixed(1)} tonnes CO2e.`;
              console.log('✅ [WORKAROUND] Generated aggregate response:', responseText.length, 'characters');
            }
            // Handle direct object result (e.g., {total: 123})
            else if (data && typeof data === 'object' && 'total' in data) {
              const currentYear = new Date().getFullYear();
              const total = parseFloat(data.total) / 1000;
              responseText = `For ${currentYear}, your total in this category is ${total.toFixed(1)} tonnes CO2e.`;
              console.log('✅ [WORKAROUND] Generated direct object response:', responseText.length, 'characters');
            }
            else {
              console.log('⚠️ [WORKAROUND] Data format not recognized:', typeof data, Array.isArray(data), data);
            }
          }

          console.log('✅ [WORKAROUND] Generated response:', responseText ? responseText.substring(0, 200) : '(no response generated)');
        }

        // Extract insights and recommendations from the response
        const insights: string[] = [];
        const recommendations: string[] = [];

        // Simple pattern matching for insights
        const insightPatterns = [
          /(?:insight|finding|discovered|noticed):\s*(.+?)(?:\n|$)/gi,
          /(?:•|-)?\s*(.+?)\s+tCO2e/gi
        ];

        insightPatterns.forEach(pattern => {
          const matches = responseText.matchAll(pattern);
          for (const match of matches) {
            if (match[1] && match[1].trim().length > 10) {
              insights.push(match[1].trim());
            }
          }
        });

        // Pattern matching for recommendations
        const recommendationPatterns = [
          /(?:recommend|suggest|should|consider):\s*(.+?)(?:\n|$)/gi,
          /(?:action|next step):\s*(.+?)(?:\n|$)/gi
        ];

        recommendationPatterns.forEach(pattern => {
          const matches = responseText.matchAll(pattern);
          for (const match of matches) {
            if (match[1] && match[1].trim().length > 10) {
              recommendations.push(match[1].trim());
            }
          }
        });

        return {
          greeting: responseText,
          insights: insights.slice(0, 5), // Limit to top 5
          recommendations: recommendations.slice(0, 3), // Limit to top 3
          charts: [], // Can be populated based on data patterns
          specialists: ['blipee-analyst'],
          metadata: {
            toolsUsed: result.toolCalls?.map(tc => tc.toolName) || [],
            model: 'deepseek-reasoner' || 'gpt-4o-mini',
            totalTokens: result.usage?.totalTokens || 0,
            roundtrips: result.roundtrips?.length || 0
          }
        };

      } finally {
        clearTimeout(timeoutId); // Always clear timeout
      }

    } catch (error: any) {
      console.error('❌ BlipeeBrain V2 error:', error);
      stream('error', `❌ Error: ${error.message}`);

      return {
        greeting: "I encountered an issue analyzing your request. Could you please rephrase or provide more details?",
        insights: [],
        recommendations: [],
        metadata: {
          error: error.message
        }
      };
    }
  }

  /**
   * Streaming version of process() for real-time UI updates
   * Returns a StreamTextResult that can be converted to toUIMessageStreamResponse()
   */
  async processStream(
    userMessage: string,
    context: BlipeeBrainContext
  ) {
    // Store context for tool execution
    this.currentContext = context;

    try {
      // Fetch schema context
      const schemaContext = await this.getSchemaContext();

      // Build system prompt with schema context
      const currentYear = new Date().getFullYear();
      const systemPrompt = `You are blipee, an AI-powered sustainability intelligence assistant.

${schemaContext}

**Your Capabilities:**
- Query sustainability data using SQL (exploreData tool)
- Search web intelligence for reports and regulations (searchWeb tool)
- Discover companies by sector (discoverCompanies tool)
- Parse sustainability reports (parseSustainabilityReport tool)
- Research regulations and compliance (researchRegulations tool)

**Guidelines:**
- Always use tools to get real, accurate data
- Be friendly, professional, and conversational - speak naturally like a helpful colleague
- Provide actionable insights and recommendations
- Show genuine interest in helping users improve their sustainability performance
- Use encouraging language and celebrate progress when appropriate
- Ask follow-up questions to better understand user needs

**TIME FILTERING (CRITICAL):**
- Current date: ${new Date().toISOString().split('T')[0]}
- ALWAYS filter metrics_data by period_start/period_end in your SQL queries
- If no time period specified by user, DEFAULT to current year (${currentYear})
- Parse time expressions: "this year" = ${currentYear}, "last year" = ${currentYear - 1}, "Q1" = Jan-Mar, etc.
- ALWAYS include the time period in your response (e.g., "For 2025, your top sources are...")
- Example query with time filter:
  WHERE md.organization_id = '[org_id]'
    AND md.period_start >= '${currentYear}-01-01'
    AND md.period_end <= '${currentYear}-12-31'

Organization: ${context.organizationId}`;

      // Get all tools
      const tools = this.getTools();

      console.log('✅ [BlipeeBrain V2 Stream] Tools loaded:', Object.keys(tools));
      console.log('📝 [BlipeeBrain V2 Stream] Processing:', userMessage);

      // Add timeout protection (30 second limit)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        // Build messages array with conversation history
        const messages = [];

        // Add system message
        messages.push({
          role: 'system' as const,
          content: systemPrompt
        });

        // Add conversation history if available
        if (context.conversationHistory && context.conversationHistory.length > 0) {
          messages.push(...context.conversationHistory.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })));
        }

        // Add current user message
        messages.push({
          role: 'user' as const,
          content: userMessage
        });

        console.log('💬 [BlipeeBrain V2 Stream] Using conversation history:', messages.length, 'messages');

        // ✅ Use streamText for real-time streaming
        const result = streamText({
          model: this.model,
          messages,
          tools,
          maxToolRoundtrips: 5,
          temperature: 0,
          maxRetries: 3,
          abortSignal: controller.signal,
          maxOutputTokens: 2000,
          onStepFinish: ({ text, toolCalls, toolResults }) => {
            if (toolCalls && toolCalls.length > 0) {
              console.log(`⚡ [Stream] Executing ${toolCalls.length} tool(s)...`);
            }
            if (toolResults && toolResults.length > 0) {
              console.log(`✓ [Stream] ${toolResults.length} tool(s) completed`);
            }
          }
        });

        // Clear timeout once streaming starts
        clearTimeout(timeoutId);

        // Return the stream result (API route will call toUIMessageStreamResponse())
        return result;

      } catch (generateError: any) {
        clearTimeout(timeoutId);
        console.error('❌ BlipeeBrain V2 stream generation error:', generateError);
        throw generateError;
      }

    } catch (error: any) {
      console.error('❌ BlipeeBrain V2 stream error:', error);
      throw error;
    }
  }
}
