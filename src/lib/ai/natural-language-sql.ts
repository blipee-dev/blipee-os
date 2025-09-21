import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { aiService } from './service';

/**
 * Advanced Natural Language to SQL converter with performance monitoring
 * Optimized for sustainability and ESG data queries
 */

export interface NLQueryRequest {
  query: string;
  userId: string;
  organizationId: string;
  context?: QueryContext;
  maxResults?: number;
  includeExplanation?: boolean;
  performanceMode?: 'fast' | 'accurate' | 'balanced';
}

export interface QueryContext {
  userRole: string;
  availableTables: string[];
  recentQueries: string[];
  dataFilters?: Record<string, any>;
  timeRange?: {
    start: string;
    end: string;
  };
}

export interface NLQueryResult {
  success: boolean;
  sql?: string;
  data?: any[];
  explanation?: string;
  confidence: number;
  performance: QueryPerformance;
  suggestions?: string[];
  errors?: string[];
  cacheable: boolean;
  cacheKey?: string;
}

export interface QueryPerformance {
  parseTime: number;
  generateTime: number;
  executeTime: number;
  totalTime: number;
  rowsReturned: number;
  complexity: 'simple' | 'moderate' | 'complex';
  optimizations: string[];
  warnings: string[];
}

export interface QueryTemplate {
  id: string;
  name: string;
  description: string;
  category: 'emissions' | 'energy' | 'compliance' | 'targets' | 'reporting' | 'general';
  pattern: RegExp;
  sqlTemplate: string;
  parameters: QueryParameter[];
  confidence: number;
}

export interface QueryParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'array';
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    options?: string[];
    pattern?: string;
  };
}

export interface DatabaseSchema {
  tables: TableDefinition[];
  relationships: Relationship[];
  indexes: IndexDefinition[];
  constraints: ConstraintDefinition[];
}

export interface TableDefinition {
  name: string;
  description: string;
  columns: ColumnDefinition[];
  category: 'core' | 'emissions' | 'energy' | 'compliance' | 'reporting' | 'users';
  primaryKey: string[];
  searchable: boolean;
}

export interface ColumnDefinition {
  name: string;
  type: string;
  description: string;
  nullable: boolean;
  searchable: boolean;
  aggregatable: boolean;
}

export interface Relationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
}

export interface IndexDefinition {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  unique: boolean;
}

export interface ConstraintDefinition {
  table: string;
  type: 'foreign_key' | 'check' | 'unique' | 'not_null';
  definition: string;
}

/**
 * High-performance Natural Language to SQL converter
 */
export class NaturalLanguageSQLEngine {
  private supabase: ReturnType<typeof createClient<Database>>;
  private schema: DatabaseSchema;
  private queryTemplates: Map<string, QueryTemplate> = new Map();
  private queryCache: Map<string, { result: NLQueryResult; expiry: number }> = new Map();
  private performanceMetrics: Map<string, QueryPerformance[]> = new Map();

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    this.initializeSchema();
    this.initializeQueryTemplates();
  }

  /**
   * Convert natural language query to SQL and execute
   */
  async processNaturalLanguageQuery(request: NLQueryRequest): Promise<NLQueryResult> {
    const startTime = Date.now();
    const performanceMode = request.performanceMode || 'balanced';

    try {
      // Check cache first for fast mode
      if (performanceMode === 'fast') {
        const cached = this.getCachedResult(request.query, request.organizationId);
        if (cached) {
          return cached;
        }
      }

      // Step 1: Parse and understand the query
      const parseStart = Date.now();
      const queryIntent = await this.parseQueryIntent(request.query, request.context);
      const parseTime = Date.now() - parseStart;

      // Step 2: Generate SQL
      const generateStart = Date.now();
      const sqlGeneration = await this.generateSQL(queryIntent, request);
      const generateTime = Date.now() - generateStart;

      if (!sqlGeneration.success) {
        return {
          success: false,
          confidence: 0,
          errors: sqlGeneration.errors,
          performance: {
            parseTime,
            generateTime,
            executeTime: 0,
            totalTime: Date.now() - startTime,
            rowsReturned: 0,
            complexity: 'simple',
            optimizations: [],
            warnings: []
          },
          cacheable: false
        };
      }

      // Step 3: Optimize SQL for performance
      const optimizedSQL = await this.optimizeSQL(sqlGeneration.sql!, request);

      // Step 4: Execute query with monitoring
      const executeStart = Date.now();
      const executionResult = await this.executeQuery(optimizedSQL, request);
      const executeTime = Date.now() - executeStart;

      // Step 5: Generate explanation if requested
      let explanation = '';
      if (request.includeExplanation) {
        explanation = await this.generateExplanation(request.query, optimizedSQL, executionResult.data);
      }

      const totalTime = Date.now() - startTime;

      const result: NLQueryResult = {
        success: executionResult.success,
        sql: optimizedSQL,
        data: executionResult.data,
        explanation,
        confidence: sqlGeneration.confidence,
        performance: {
          parseTime,
          generateTime,
          executeTime,
          totalTime,
          rowsReturned: executionResult.data?.length || 0,
          complexity: this.assessQueryComplexity(optimizedSQL),
          optimizations: this.getAppliedOptimizations(optimizedSQL),
          warnings: executionResult.warnings || []
        },
        suggestions: await this.generateSuggestions(request.query, optimizedSQL),
        errors: executionResult.errors,
        cacheable: this.isCacheable(request.query),
        cacheKey: this.generateCacheKey(request.query, request.organizationId)
      };

      // Cache successful results
      if (result.success && result.cacheable) {
        this.cacheResult(result.cacheKey!, result);
      }

      // Store performance metrics
      this.storePerformanceMetrics(request.query, result.performance);

      // Log query for analysis
      await this.logQuery(request, result);

      return result;

    } catch (error) {
      const totalTime = Date.now() - startTime;
      return {
        success: false,
        confidence: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        performance: {
          parseTime: 0,
          generateTime: 0,
          executeTime: 0,
          totalTime,
          rowsReturned: 0,
          complexity: 'simple',
          optimizations: [],
          warnings: []
        },
        cacheable: false
      };
    }
  }

  /**
   * Initialize database schema for intelligent query generation
   */
  private initializeSchema() {
    this.schema = {
      tables: [
        {
          name: 'organizations',
          description: 'Organization master data',
          category: 'core',
          primaryKey: ['id'],
          searchable: true,
          columns: [
            { name: 'id', type: 'uuid', description: 'Organization ID', nullable: false, searchable: true, aggregatable: false },
            { name: 'name', type: 'text', description: 'Organization name', nullable: false, searchable: true, aggregatable: false },
            { name: 'industry', type: 'text', description: 'Industry sector', nullable: true, searchable: true, aggregatable: true },
            { name: 'size', type: 'text', description: 'Organization size category', nullable: true, searchable: true, aggregatable: true },
            { name: 'created_at', type: 'timestamp', description: 'Creation date', nullable: false, searchable: false, aggregatable: true }
          ]
        },
        {
          name: 'emissions_calculations',
          description: 'Greenhouse gas emissions data',
          category: 'emissions',
          primaryKey: ['id'],
          searchable: true,
          columns: [
            { name: 'id', type: 'uuid', description: 'Calculation ID', nullable: false, searchable: false, aggregatable: false },
            { name: 'organization_id', type: 'uuid', description: 'Organization ID', nullable: false, searchable: true, aggregatable: false },
            { name: 'scope', type: 'text', description: 'Emission scope (scope_1, scope_2, scope_3)', nullable: false, searchable: true, aggregatable: true },
            { name: 'scope1_emissions', type: 'numeric', description: 'Scope 1 emissions in tCO2e', nullable: true, searchable: false, aggregatable: true },
            { name: 'scope2_emissions', type: 'numeric', description: 'Scope 2 emissions in tCO2e', nullable: true, searchable: false, aggregatable: true },
            { name: 'scope3_emissions', type: 'numeric', description: 'Scope 3 emissions in tCO2e', nullable: true, searchable: false, aggregatable: true },
            { name: 'total_emissions', type: 'numeric', description: 'Total emissions in tCO2e', nullable: false, searchable: false, aggregatable: true },
            { name: 'calculation_period', type: 'text', description: 'Period (monthly, quarterly, yearly)', nullable: false, searchable: true, aggregatable: true },
            { name: 'calculated_at', type: 'timestamp', description: 'Calculation date', nullable: false, searchable: true, aggregatable: true }
          ]
        },
        {
          name: 'energy_consumption',
          description: 'Energy usage data',
          category: 'energy',
          primaryKey: ['id'],
          searchable: true,
          columns: [
            { name: 'id', type: 'uuid', description: 'Consumption record ID', nullable: false, searchable: false, aggregatable: false },
            { name: 'organization_id', type: 'uuid', description: 'Organization ID', nullable: false, searchable: true, aggregatable: false },
            { name: 'facility_id', type: 'uuid', description: 'Facility ID', nullable: true, searchable: true, aggregatable: false },
            { name: 'energy_type', type: 'text', description: 'Type of energy (electricity, gas, etc.)', nullable: false, searchable: true, aggregatable: true },
            { name: 'consumption_amount', type: 'numeric', description: 'Amount consumed', nullable: false, searchable: false, aggregatable: true },
            { name: 'unit', type: 'text', description: 'Unit of measurement', nullable: false, searchable: true, aggregatable: true },
            { name: 'consumption_date', type: 'date', description: 'Consumption date', nullable: false, searchable: true, aggregatable: true },
            { name: 'cost', type: 'numeric', description: 'Cost of consumption', nullable: true, searchable: false, aggregatable: true }
          ]
        },
        {
          name: 'sustainability_targets',
          description: 'Sustainability goals and targets',
          category: 'targets',
          primaryKey: ['id'],
          searchable: true,
          columns: [
            { name: 'id', type: 'uuid', description: 'Target ID', nullable: false, searchable: false, aggregatable: false },
            { name: 'organization_id', type: 'uuid', description: 'Organization ID', nullable: false, searchable: true, aggregatable: false },
            { name: 'target_type', type: 'text', description: 'Type of target', nullable: false, searchable: true, aggregatable: true },
            { name: 'target_value', type: 'numeric', description: 'Target value', nullable: false, searchable: false, aggregatable: true },
            { name: 'current_progress', type: 'numeric', description: 'Current progress towards target', nullable: true, searchable: false, aggregatable: true },
            { name: 'target_year', type: 'integer', description: 'Target achievement year', nullable: false, searchable: true, aggregatable: true },
            { name: 'unit', type: 'text', description: 'Unit of measurement', nullable: false, searchable: true, aggregatable: true },
            { name: 'active', type: 'boolean', description: 'Whether target is active', nullable: false, searchable: true, aggregatable: true }
          ]
        },
        {
          name: 'compliance_tracking',
          description: 'Regulatory compliance tracking',
          category: 'compliance',
          primaryKey: ['id'],
          searchable: true,
          columns: [
            { name: 'id', type: 'uuid', description: 'Compliance record ID', nullable: false, searchable: false, aggregatable: false },
            { name: 'organization_id', type: 'uuid', description: 'Organization ID', nullable: false, searchable: true, aggregatable: false },
            { name: 'regulation_name', type: 'text', description: 'Name of regulation', nullable: false, searchable: true, aggregatable: true },
            { name: 'status', type: 'text', description: 'Compliance status', nullable: false, searchable: true, aggregatable: true },
            { name: 'last_audit', type: 'date', description: 'Last audit date', nullable: true, searchable: true, aggregatable: true },
            { name: 'next_review', type: 'date', description: 'Next review date', nullable: true, searchable: true, aggregatable: true },
            { name: 'risk_level', type: 'text', description: 'Risk level', nullable: false, searchable: true, aggregatable: true }
          ]
        }
      ],
      relationships: [
        {
          fromTable: 'emissions_calculations',
          fromColumn: 'organization_id',
          toTable: 'organizations',
          toColumn: 'id',
          type: 'many_to_one'
        },
        {
          fromTable: 'energy_consumption',
          fromColumn: 'organization_id',
          toTable: 'organizations',
          toColumn: 'id',
          type: 'many_to_one'
        },
        {
          fromTable: 'sustainability_targets',
          fromColumn: 'organization_id',
          toTable: 'organizations',
          toColumn: 'id',
          type: 'many_to_one'
        },
        {
          fromTable: 'compliance_tracking',
          fromColumn: 'organization_id',
          toTable: 'organizations',
          toColumn: 'id',
          type: 'many_to_one'
        }
      ],
      indexes: [
        { table: 'emissions_calculations', columns: ['organization_id', 'calculated_at'], type: 'btree', unique: false },
        { table: 'energy_consumption', columns: ['organization_id', 'consumption_date'], type: 'btree', unique: false },
        { table: 'sustainability_targets', columns: ['organization_id', 'active'], type: 'btree', unique: false }
      ],
      constraints: []
    };
  }

  /**
   * Initialize pre-built query templates for common patterns
   */
  private initializeQueryTemplates() {
    const templates: QueryTemplate[] = [
      {
        id: 'total_emissions',
        name: 'Total Emissions',
        description: 'Get total emissions for an organization',
        category: 'emissions',
        pattern: /(?:what|show|get|total|sum).*(?:emissions?|carbon|co2|ghg)/i,
        sqlTemplate: `
          SELECT
            scope,
            SUM(total_emissions) as total_emissions,
            calculation_period
          FROM emissions_calculations
          WHERE organization_id = $organizationId
            AND calculated_at >= $startDate
            AND calculated_at <= $endDate
          GROUP BY scope, calculation_period
          ORDER BY calculated_at DESC
        `,
        parameters: [
          { name: 'organizationId', type: 'string', required: true },
          { name: 'startDate', type: 'date', required: false, defaultValue: '2024-01-01' },
          { name: 'endDate', type: 'date', required: false, defaultValue: 'now()' }
        ],
        confidence: 0.9
      },
      {
        id: 'energy_consumption_trend',
        name: 'Energy Consumption Trend',
        description: 'Get energy consumption trends over time',
        category: 'energy',
        pattern: /(?:energy|consumption|usage).*(?:trend|over time|history|monthly|yearly)/i,
        sqlTemplate: `
          SELECT
            DATE_TRUNC('month', consumption_date) as month,
            energy_type,
            SUM(consumption_amount) as total_consumption,
            AVG(consumption_amount) as avg_consumption,
            SUM(cost) as total_cost
          FROM energy_consumption
          WHERE organization_id = $organizationId
            AND consumption_date >= $startDate
            AND consumption_date <= $endDate
          GROUP BY DATE_TRUNC('month', consumption_date), energy_type
          ORDER BY month DESC, energy_type
        `,
        parameters: [
          { name: 'organizationId', type: 'string', required: true },
          { name: 'startDate', type: 'date', required: false, defaultValue: '2024-01-01' },
          { name: 'endDate', type: 'date', required: false, defaultValue: 'now()' }
        ],
        confidence: 0.85
      },
      {
        id: 'target_progress',
        name: 'Target Progress',
        description: 'Get progress towards sustainability targets',
        category: 'targets',
        pattern: /(?:target|goal|progress|achievement).*(?:status|progress|how close|tracking)/i,
        sqlTemplate: `
          SELECT
            target_type,
            target_value,
            current_progress,
            (current_progress / target_value * 100) as progress_percentage,
            target_year,
            unit,
            CASE
              WHEN current_progress >= target_value THEN 'Achieved'
              WHEN (current_progress / target_value) >= 0.8 THEN 'On Track'
              WHEN (current_progress / target_value) >= 0.5 THEN 'Behind'
              ELSE 'Significantly Behind'
            END as status
          FROM sustainability_targets
          WHERE organization_id = $organizationId
            AND active = true
          ORDER BY target_year, target_type
        `,
        parameters: [
          { name: 'organizationId', type: 'string', required: true }
        ],
        confidence: 0.9
      },
      {
        id: 'compliance_status',
        name: 'Compliance Status',
        description: 'Get compliance status overview',
        category: 'compliance',
        pattern: /(?:compliance|regulatory|regulation|audit).*(?:status|overview|summary)/i,
        sqlTemplate: `
          SELECT
            regulation_name,
            status,
            risk_level,
            last_audit,
            next_review,
            CASE
              WHEN next_review < CURRENT_DATE THEN 'Overdue'
              WHEN next_review < CURRENT_DATE + INTERVAL '30 days' THEN 'Due Soon'
              ELSE 'On Schedule'
            END as review_status
          FROM compliance_tracking
          WHERE organization_id = $organizationId
          ORDER BY
            CASE status
              WHEN 'non_compliant' THEN 1
              WHEN 'pending_review' THEN 2
              ELSE 3
            END,
            next_review ASC
        `,
        parameters: [
          { name: 'organizationId', type: 'string', required: true }
        ],
        confidence: 0.88
      }
    ];

    templates.forEach(template => {
      this.queryTemplates.set(template.id, template);
    });
  }

  /**
   * Parse natural language query to understand intent
   */
  private async parseQueryIntent(query: string, context?: QueryContext): Promise<any> {
    // Check for template matches first
    for (const template of this.queryTemplates.values()) {
      if (template.pattern.test(query)) {
        return {
          type: 'template',
          templateId: template.id,
          confidence: template.confidence,
          category: template.category
        };
      }
    }

    // Use AI for complex query understanding
    const prompt = `
You are an expert at understanding natural language queries about sustainability and ESG data.

Available database schema:
${JSON.stringify(this.schema.tables.map(t => ({
  name: t.name,
  description: t.description,
  columns: t.columns.map(c => ({ name: c.name, type: c.type, description: c.description }))
})), null, 2)}

User query: "${query}"

Analyze this query and return a JSON object with:
{
  "type": "custom",
  "intent": "description of what user wants",
  "tables": ["tables needed for this query"],
  "columns": ["specific columns needed"],
  "filters": ["any filtering conditions"],
  "aggregations": ["any grouping or calculations needed"],
  "timeRange": "any time-based filtering",
  "confidence": 0.8
}
`;

    try {
      const response = await aiService.complete(prompt, {
        temperature: 0.1,
        maxTokens: 500
      });

      const responseText = typeof response === 'string' ? response : response.content || '';
      return JSON.parse(responseText);
    } catch (error) {
      return {
        type: 'unknown',
        intent: 'Unable to parse query',
        confidence: 0.1
      };
    }
  }

  /**
   * Generate SQL from parsed intent
   */
  private async generateSQL(intent: any, request: NLQueryRequest): Promise<{ success: boolean; sql?: string; confidence: number; errors?: string[] }> {
    if (intent.type === 'template') {
      const template = this.queryTemplates.get(intent.templateId);
      if (!template) {
        return { success: false, confidence: 0, errors: ['Template not found'] };
      }

      // Replace parameters in template
      let sql = template.sqlTemplate;

      // Always include organization filter for security
      sql = sql.replace('$organizationId', `'${request.organizationId}'`);

      // Handle date parameters
      const now = new Date().toISOString();
      const yearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

      sql = sql.replace('$startDate', `'${yearAgo}'`);
      sql = sql.replace('$endDate', `'${now}'`);
      sql = sql.replace(/now\(\)/g, `'${now}'`);

      return {
        success: true,
        sql: sql.trim(),
        confidence: template.confidence
      };
    }

    if (intent.type === 'custom') {
      // Generate SQL using AI for custom queries
      const prompt = `
Generate a PostgreSQL query for this request:

User Intent: ${intent.intent}
Required Tables: ${intent.tables?.join(', ')}
Required Columns: ${intent.columns?.join(', ')}

Database Schema:
${JSON.stringify(this.schema.tables.filter(t => intent.tables?.includes(t.name)), null, 2)}

Requirements:
1. ALWAYS include WHERE organization_id = '${request.organizationId}' for security
2. Use proper PostgreSQL syntax
3. Include appropriate JOINs if multiple tables needed
4. Add LIMIT ${request.maxResults || 100} to prevent large result sets
5. Order results sensibly (usually by date DESC)
6. Handle NULL values appropriately

Return only the SQL query, no explanations.
`;

      try {
        const response = await aiService.complete(prompt, {
          temperature: 0.1,
          maxTokens: 800
        });

        const sql = typeof response === 'string' ? response : response.content || '';

        // Basic SQL injection protection
        if (this.containsSQLInjection(sql)) {
          return { success: false, confidence: 0, errors: ['Potential SQL injection detected'] };
        }

        return {
          success: true,
          sql: sql.trim(),
          confidence: intent.confidence || 0.7
        };
      } catch (error) {
        return { success: false, confidence: 0, errors: ['Failed to generate SQL'] };
      }
    }

    return { success: false, confidence: 0, errors: ['Unknown intent type'] };
  }

  /**
   * Optimize SQL for better performance
   */
  private async optimizeSQL(sql: string, request: NLQueryRequest): Promise<string> {
    let optimized = sql;

    // Add index hints for common patterns
    if (optimized.includes('emissions_calculations')) {
      // Ensure we're using the organization_id + calculated_at index
      if (optimized.includes('calculated_at') && !optimized.includes('ORDER BY')) {
        optimized += ' ORDER BY calculated_at DESC';
      }
    }

    if (optimized.includes('energy_consumption')) {
      // Ensure we're using the organization_id + consumption_date index
      if (optimized.includes('consumption_date') && !optimized.includes('ORDER BY')) {
        optimized += ' ORDER BY consumption_date DESC';
      }
    }

    // Add LIMIT if not present
    if (!optimized.toUpperCase().includes('LIMIT')) {
      optimized += ` LIMIT ${request.maxResults || 100}`;
    }

    return optimized;
  }

  /**
   * Execute SQL query with monitoring
   */
  private async executeQuery(sql: string, request: NLQueryRequest): Promise<{ success: boolean; data?: any[]; warnings?: string[]; errors?: string[] }> {
    try {
      const { data, error } = await this.supabase.rpc('execute_safe_query', {
        query_sql: sql,
        org_id: request.organizationId
      });

      if (error) {
        return { success: false, errors: [error.message] };
      }

      return {
        success: true,
        data: data || [],
        warnings: this.checkQueryWarnings(sql, data?.length || 0)
      };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Query execution failed']
      };
    }
  }

  /**
   * Generate human-readable explanation of the query
   */
  private async generateExplanation(nlQuery: string, sql: string, data?: any[]): Promise<string> {
    const prompt = `
Explain this database query in simple business terms:

User asked: "${nlQuery}"
SQL generated: ${sql}
Results returned: ${data?.length || 0} rows

Provide a clear, non-technical explanation of:
1. What data was retrieved
2. How the data was filtered/aggregated
3. What the results mean for the business

Keep it under 100 words and focused on business value.
`;

    try {
      const response = await aiService.complete(prompt, {
        temperature: 0.3,
        maxTokens: 200
      });

      return typeof response === 'string' ? response : response.content || 'Query executed successfully';
    } catch (error) {
      return 'Query executed successfully';
    }
  }

  /**
   * Generate suggestions for related queries
   */
  private async generateSuggestions(query: string, sql: string): Promise<string[]> {
    // Simple rule-based suggestions for now
    const suggestions: string[] = [];

    if (query.toLowerCase().includes('emissions')) {
      suggestions.push('Show emissions by scope');
      suggestions.push('Compare emissions to last year');
      suggestions.push('Show emissions trend over time');
    }

    if (query.toLowerCase().includes('energy')) {
      suggestions.push('Show energy consumption by type');
      suggestions.push('Compare energy costs this year vs last year');
      suggestions.push('Show peak energy usage times');
    }

    if (query.toLowerCase().includes('target')) {
      suggestions.push('Show all sustainability targets');
      suggestions.push('Which targets are behind schedule?');
      suggestions.push('Show target achievement timeline');
    }

    return suggestions.slice(0, 3);
  }

  // Helper methods
  private getCachedResult(query: string, organizationId: string): NLQueryResult | null {
    const cacheKey = this.generateCacheKey(query, organizationId);
    const cached = this.queryCache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
      return cached.result;
    }

    return null;
  }

  private cacheResult(cacheKey: string, result: NLQueryResult): void {
    const expiry = Date.now() + (15 * 60 * 1000); // 15 minutes
    this.queryCache.set(cacheKey, { result, expiry });
  }

  private generateCacheKey(query: string, organizationId: string): string {
    const normalized = query.toLowerCase().replace(/\s+/g, ' ').trim();
    return `${organizationId}:${Buffer.from(normalized).toString('base64')}`;
  }

  private isCacheable(query: string): boolean {
    // Don't cache queries with "now", "today", "current" etc.
    const noCachePatterns = ['now', 'today', 'current', 'latest', 'recent'];
    return !noCachePatterns.some(pattern => query.toLowerCase().includes(pattern));
  }

  private containsSQLInjection(sql: string): boolean {
    const dangerousPatterns = [
      /;\s*drop\s+/i,
      /;\s*delete\s+/i,
      /;\s*insert\s+/i,
      /;\s*update\s+/i,
      /;\s*create\s+/i,
      /;\s*alter\s+/i,
      /union\s+.*select/i,
      /\/\*[\s\S]*\*\//,
      /--\s*$/m
    ];

    return dangerousPatterns.some(pattern => pattern.test(sql));
  }

  private assessQueryComplexity(sql: string): 'simple' | 'moderate' | 'complex' {
    const joinCount = (sql.match(/\bJOIN\b/gi) || []).length;
    const subqueryCount = (sql.match(/\(\s*SELECT\b/gi) || []).length;
    const aggregateCount = (sql.match(/\b(SUM|COUNT|AVG|MAX|MIN|GROUP BY)\b/gi) || []).length;

    if (joinCount >= 3 || subqueryCount >= 2) return 'complex';
    if (joinCount >= 1 || subqueryCount >= 1 || aggregateCount >= 2) return 'moderate';
    return 'simple';
  }

  private getAppliedOptimizations(sql: string): string[] {
    const optimizations: string[] = [];

    if (sql.includes('ORDER BY')) optimizations.push('Added sorting index hint');
    if (sql.includes('LIMIT')) optimizations.push('Added result limit');
    if (sql.includes('organization_id =')) optimizations.push('Applied security filtering');

    return optimizations;
  }

  private checkQueryWarnings(sql: string, rowCount: number): string[] {
    const warnings: string[] = [];

    if (rowCount > 1000) {
      warnings.push('Large result set returned - consider adding filters');
    }

    if (sql.includes('SELECT *')) {
      warnings.push('Selecting all columns - specify needed columns for better performance');
    }

    if (!sql.includes('LIMIT')) {
      warnings.push('No result limit specified');
    }

    return warnings;
  }

  private storePerformanceMetrics(query: string, performance: QueryPerformance): void {
    const queryKey = query.substring(0, 50);
    if (!this.performanceMetrics.has(queryKey)) {
      this.performanceMetrics.set(queryKey, []);
    }

    const metrics = this.performanceMetrics.get(queryKey)!;
    metrics.push(performance);

    // Keep only last 10 performance records
    if (metrics.length > 10) {
      metrics.splice(0, metrics.length - 10);
    }
  }

  private async logQuery(request: NLQueryRequest, result: NLQueryResult): Promise<void> {
    try {
      await this.supabase.from('query_log').insert({
        user_id: request.userId,
        organization_id: request.organizationId,
        natural_language_query: request.query,
        generated_sql: result.sql,
        success: result.success,
        confidence: result.confidence,
        execution_time: result.performance.totalTime,
        rows_returned: result.performance.rowsReturned,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log query:', error);
    }
  }

  /**
   * Get performance analytics for monitoring
   */
  async getPerformanceAnalytics(timeRange: string = '24h'): Promise<any> {
    try {
      const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720;
      const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

      const { data, error } = await this.supabase
        .from('query_log')
        .select('*')
        .gte('created_at', startTime.toISOString());

      if (error) throw error;

      const totalQueries = data?.length || 0;
      const successfulQueries = data?.filter(q => q.success).length || 0;
      const averageExecutionTime = totalQueries > 0
        ? data!.reduce((sum, q) => sum + q.execution_time, 0) / totalQueries
        : 0;

      return {
        totalQueries,
        successRate: totalQueries > 0 ? successfulQueries / totalQueries : 0,
        averageExecutionTime,
        averageConfidence: totalQueries > 0
          ? data!.reduce((sum, q) => sum + q.confidence, 0) / totalQueries
          : 0,
        queryDistribution: this.getQueryCategoryDistribution(data || [])
      };
    } catch (error) {
      console.error('Failed to get performance analytics:', error);
      return null;
    }
  }

  private getQueryCategoryDistribution(queries: any[]): Record<string, number> {
    const distribution: Record<string, number> = {
      emissions: 0,
      energy: 0,
      targets: 0,
      compliance: 0,
      other: 0
    };

    queries.forEach(query => {
      const nlQuery = query.natural_language_query.toLowerCase();
      if (nlQuery.includes('emission') || nlQuery.includes('carbon')) {
        distribution.emissions++;
      } else if (nlQuery.includes('energy') || nlQuery.includes('consumption')) {
        distribution.energy++;
      } else if (nlQuery.includes('target') || nlQuery.includes('goal')) {
        distribution.targets++;
      } else if (nlQuery.includes('compliance') || nlQuery.includes('regulation')) {
        distribution.compliance++;
      } else {
        distribution.other++;
      }
    });

    return distribution;
  }
}

// Export singleton instance
export const naturalLanguageSQLEngine = new NaturalLanguageSQLEngine();