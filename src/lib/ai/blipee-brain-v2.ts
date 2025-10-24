/**
 * Blipee Brain V2 - Vercel AI SDK Implementation
 *
 * Migrated from custom tool calling to Vercel AI SDK for:
 * - Better type safety with Zod schemas
 * - Automatic tool execution
 * - Built-in streaming support
 * - Cleaner code with less manual JSON parsing
 */

import { generateText, tool } from 'ai';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

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

  // Initialize AI model with fallback
  private model = process.env.DEEPSEEK_API_KEY
    ? createDeepSeek({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com'
      })('deepseek-reasoner')
    : createOpenAI({
        apiKey: process.env.OPENAI_API_KEY!,
        compatibility: 'strict'
      })('gpt-4o-mini');

  /**
   * Define all tools using Vercel AI SDK tool() function
   */
  private getTools() {
    const supabase = this.supabase;
    const currentContext = this.currentContext;

    return {
      exploreData: tool({
        description: `Execute SQL queries to explore sustainability data in the database.

WHEN TO USE:
- User asks about emissions, energy, water, waste, or any sustainability metric
- User wants to compare sites, time periods, or categories
- User asks "how are we doing", "show me data", "what happened in March"

DATABASE SCHEMA:
- metrics_data: Main table (organization_id, metric_id, site_id, value, co2e_emissions, period_start, period_end)
- metrics_catalog: Metric definitions (id, name, category, scope, unit, emission_factor)
- sites: Organization locations (id, name, organization_id, area_sqm, employees)

CRITICAL: Always JOIN metrics_data with metrics_catalog to get scope/category:
  FROM metrics_data md
  JOIN metrics_catalog mc ON md.metric_id = mc.id
  WHERE md.organization_id = '[org_id]' AND mc.scope = 'scope_2'

SCOPE VALUES: 'scope_1', 'scope_2', 'scope_3' (TEXT, not integers!)
EMISSIONS UNIT: co2e_emissions is in KILOGRAMS - divide by 1000 for tonnes

EXAMPLE QUERIES:
- Scope 2 emissions YTD:
  SELECT mc.category, SUM(md.co2e_emissions)/1000 as tonnes
  FROM metrics_data md
  JOIN metrics_catalog mc ON md.metric_id = mc.id
  WHERE md.organization_id = '[org_id]'
    AND mc.scope = 'scope_2'
    AND md.period_start >= '2025-01-01'
  GROUP BY mc.category

- Site efficiency comparison:
  SELECT s.name, SUM(md.co2e_emissions)/1000/s.area_sqm as intensity
  FROM metrics_data md
  JOIN sites s ON md.site_id = s.id
  WHERE md.organization_id = '[org_id]'
  GROUP BY s.name, s.area_sqm
  ORDER BY intensity`,

        parameters: z.object({
          query: z.string().describe('SQL SELECT query (read-only). Use [org_id] placeholder for organization ID.'),
          analysisGoal: z.string().describe('What insight are you trying to find? Helps with error recovery.')
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
        parameters: z.object({
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
        parameters: z.object({
          sector: z.string().describe('Sector name (e.g., "manufacturing", "oil-gas", "agriculture")'),
          maxCompanies: z.number().optional().default(50)
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
        description: 'Parse a PDF sustainability report and extract structured data (emissions, targets, standards).',
        parameters: z.object({
          reportUrl: z.string().url().describe('URL to PDF sustainability report'),
          companyName: z.string().optional().describe('Company name for context')
        }),

        execute: async ({ reportUrl, companyName }) => {
          // Check if report has been parsed before
          const { data: cachedReport } = await supabase
            .from('parsed_sustainability_reports')
            .select('*')
            .eq('report_url', reportUrl)
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
              cached: true,
              parsedAt: cachedReport.parsed_at
            };
          }

          return {
            message: 'This report has not been parsed yet.',
            suggestion: 'Upload the report through the document parser for AI-powered extraction.',
            reportUrl,
            companyName
          };
        }
      }),

      researchRegulations: tool({
        description: 'Research latest sustainability regulations and compliance requirements.',
        parameters: z.object({
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
        return 'Schema context unavailable - using basic database knowledge.';
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
`;
    } catch (error) {
      console.error('❌ Error fetching schema context:', error);
      return 'Schema context error - using fallback database knowledge.';
    }
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

      // Build system prompt
      const systemPrompt = `You are blipee, a conversational data analyst for sustainability data.

${schemaContext}

MINDSET: You are a data analyst having a conversation, not a chatbot with predefined answers.

RESPONSE GUIDELINES:
1. When you have enough info, use tools to query data and analyze it
2. When unclear, ask specific clarifying questions
3. Provide insights, not just raw data
4. Include actionable recommendations
5. Be conversational and friendly

USER CONTEXT:
- Organization: ${context.organizationId}
- User: ${context.userId}

Analyze the user's request and respond with helpful insights.`;

      stream('analyzing', '🧠 Analyzing your request...');

      // Use Vercel AI SDK generateText with tools
      const result = await generateText({
        model: this.model,
        system: systemPrompt,
        prompt: userMessage,
        tools: this.getTools(),
        maxToolRoundtrips: 5, // Allow multi-step reasoning
        temperature: 0.7,
        maxTokens: 2000,
        onStepFinish: ({ text, toolCalls, toolResults }) => {
          if (toolCalls && toolCalls.length > 0) {
            stream('executing', `⚡ Executing ${toolCalls.length} tool(s)...`);
            toolCalls.forEach((call, i) => {
              stream('executing', `⚡ ${i + 1}/${toolCalls.length}: ${call.toolName}...`);
            });
          }
          if (toolResults && toolResults.length > 0) {
            stream('executing', `✓ Tools executed successfully`);
          }
        }
      });

      stream('complete', '✓ Analysis complete');

      // Parse response structure
      const responseText = result.text;

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
}
