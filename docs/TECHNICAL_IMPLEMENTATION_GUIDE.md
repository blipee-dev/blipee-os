# Technical Implementation Guide
## ESG Platform Transformation

### Overview
This guide provides detailed technical instructions for implementing the ESG platform transformation. Each section includes code examples, file locations, and step-by-step implementation instructions.

## Phase 1: AI Model Upgrades & Structured Outputs

### 1.1 Model Upgrades

#### OpenAI Provider Update
**File:** `/src/lib/ai/providers/openai.ts`

```typescript
// BEFORE (Current Implementation)
export class OpenAIProvider implements AIProvider {
  async complete(prompt: string, options: CompletionOptions) {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // OLD MODEL
      messages: [{ role: "user", content: prompt }],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1500,
    });
    return response.choices[0].message.content;
  }
}

// AFTER (Updated Implementation)
export class OpenAIProvider implements AIProvider {
  async complete(prompt: string, options: CompletionOptions) {
    const messages = this.buildMessages(prompt, options);
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o", // NEW MODEL
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1500,
      response_format: options.jsonMode ? { type: "json_object" } : undefined,
    });
    
    return this.parseResponse(response, options);
  }

  private buildMessages(prompt: string, options: CompletionOptions) {
    const messages = [];
    
    if (options.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    
    if (options.chainOfThought) {
      messages.push({ 
        role: "system", 
        content: "Think step by step and show your reasoning process." 
      });
    }
    
    messages.push({ role: "user", content: prompt });
    return messages;
  }

  private parseResponse(response: any, options: CompletionOptions) {
    const content = response.choices[0].message.content;
    
    if (options.structuredOutput) {
      try {
        return JSON.parse(content);
      } catch (error) {
        console.error("Failed to parse structured output:", error);
        return { message: content, error: "Invalid JSON structure" };
      }
    }
    
    return content;
  }
}
```

#### Anthropic Provider Update
**File:** `/src/lib/ai/providers/anthropic.ts`

```typescript
// BEFORE
export class AnthropicProvider implements AIProvider {
  async complete(prompt: string, options: CompletionOptions) {
    const response = await this.anthropic.messages.create({
      model: "claude-3-opus-20240229", // OLD MODEL
      max_tokens: options.maxTokens || 1500,
      messages: [{ role: "user", content: prompt }],
    });
    return response.content[0].text;
  }
}

// AFTER
export class AnthropicProvider implements AIProvider {
  async complete(prompt: string, options: CompletionOptions) {
    const messages = this.buildMessages(prompt, options);
    
    const response = await this.anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // NEW MODEL
      max_tokens: options.maxTokens || 1500,
      messages,
      system: options.systemPrompt,
    });
    
    return this.parseResponse(response, options);
  }

  private buildMessages(prompt: string, options: CompletionOptions) {
    let enhancedPrompt = prompt;
    
    if (options.chainOfThought) {
      enhancedPrompt = `Think step by step and show your reasoning:\n\n${prompt}`;
    }
    
    if (options.structuredOutput && options.responseSchema) {
      enhancedPrompt += `\n\nRespond with valid JSON matching this schema: ${JSON.stringify(options.responseSchema)}`;
    }
    
    return [{ role: "user", content: enhancedPrompt }];
  }

  private parseResponse(response: any, options: CompletionOptions) {
    const content = response.content[0].text;
    
    if (options.structuredOutput) {
      try {
        return JSON.parse(content);
      } catch (error) {
        console.error("Failed to parse structured output:", error);
        return { message: content, error: "Invalid JSON structure" };
      }
    }
    
    return content;
  }
}
```

### 1.2 Structured Output Types

#### Enhanced Types
**File:** `/src/lib/ai/types.ts`

```typescript
export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  jsonMode?: boolean;
  structuredOutput?: boolean;
  responseSchema?: ResponseSchema;
  chainOfThought?: boolean;
}

export interface ResponseSchema {
  type: "object";
  properties: Record<string, any>;
  required?: string[];
}

export interface StructuredAIResponse {
  message: string;
  reasoning?: string[];
  metrics?: SustainabilityMetrics;
  actions?: RecommendedAction[];
  visualizations?: VisualizationComponent[];
  alerts?: Alert[];
  confidence?: number;
  metadata?: {
    processingTime: number;
    modelUsed: string;
    inputTokens: number;
    outputTokens: number;
  };
}

export interface SustainabilityMetrics {
  scope1?: number;
  scope2?: number;
  scope3?: number;
  totalEmissions?: number;
  reductionTarget?: number;
  progressToTarget?: number;
  benchmarkPercentile?: number;
}

export interface RecommendedAction {
  title: string;
  description: string;
  impact: {
    emissionsReduction: number;
    costSavings: number;
    timeframe: string;
  };
  priority: "high" | "medium" | "low";
  category: "efficiency" | "renewable" | "process" | "behavioral";
  implementationSteps: string[];
}

export interface VisualizationComponent {
  type: "chart" | "table" | "kpi" | "timeline" | "map";
  title: string;
  data: any;
  config: any;
  insights: string[];
}

export interface Alert {
  type: "critical" | "warning" | "info" | "success";
  title: string;
  message: string;
  actionRequired: boolean;
  suggestedAction?: string;
  deadline?: string;
}
```

### 1.3 Enhanced AI Service

#### Updated Service Implementation
**File:** `/src/lib/ai/service.ts`

```typescript
export class AIService {
  private providers: AIProvider[] = [];
  private currentProviderIndex = 0;
  private cache: Map<string, CachedResponse> = new Map();

  async complete(prompt: string, options: CompletionOptions = {}): Promise<StructuredAIResponse> {
    const cacheKey = this.generateCacheKey(prompt, options);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < 300000) { // 5 minutes
        return cached.response;
      }
    }

    const startTime = Date.now();
    let lastError: Error | null = null;

    // Try each provider with fallback
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[this.currentProviderIndex];
      
      try {
        const rawResponse = await provider.complete(prompt, options);
        
        const structuredResponse = await this.processResponse(
          rawResponse,
          options,
          provider.name,
          Date.now() - startTime
        );

        // Cache successful response
        this.cache.set(cacheKey, {
          response: structuredResponse,
          timestamp: Date.now()
        });

        return structuredResponse;
      } catch (error) {
        console.error(`Provider ${provider.name} failed:`, error);
        lastError = error as Error;
        
        // Move to next provider
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
      }
    }

    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }

  private async processResponse(
    rawResponse: any,
    options: CompletionOptions,
    modelUsed: string,
    processingTime: number
  ): Promise<StructuredAIResponse> {
    // If already structured, return as is
    if (typeof rawResponse === 'object' && rawResponse.message) {
      return {
        ...rawResponse,
        metadata: {
          processingTime,
          modelUsed,
          inputTokens: 0, // TODO: Calculate actual tokens
          outputTokens: 0
        }
      };
    }

    // Parse string response
    const message = typeof rawResponse === 'string' ? rawResponse : rawResponse.message;
    
    // Extract reasoning if chain-of-thought was used
    const reasoning = options.chainOfThought 
      ? this.extractReasoning(message)
      : undefined;

    // Extract metrics, actions, etc. using regex or AI
    const metrics = await this.extractMetrics(message);
    const actions = await this.extractActions(message);
    const visualizations = await this.extractVisualizations(message);
    const alerts = await this.extractAlerts(message);

    return {
      message,
      reasoning,
      metrics,
      actions,
      visualizations,
      alerts,
      confidence: this.calculateConfidence(message),
      metadata: {
        processingTime,
        modelUsed,
        inputTokens: 0,
        outputTokens: 0
      }
    };
  }

  private extractReasoning(message: string): string[] {
    // Extract step-by-step reasoning
    const reasoningMatch = message.match(/(?:Step \d+:|Reasoning:|Analysis:)(.*?)(?=\n\n|$)/gs);
    return reasoningMatch ? reasoningMatch.map(r => r.trim()) : [];
  }

  private async extractMetrics(message: string): Promise<SustainabilityMetrics | undefined> {
    // Use regex to extract numerical metrics
    const scope1Match = message.match(/scope\s*1[:\s]+(\d+(?:\.\d+)?)/i);
    const scope2Match = message.match(/scope\s*2[:\s]+(\d+(?:\.\d+)?)/i);
    const scope3Match = message.match(/scope\s*3[:\s]+(\d+(?:\.\d+)?)/i);
    
    if (!scope1Match && !scope2Match && !scope3Match) return undefined;

    const scope1 = scope1Match ? parseFloat(scope1Match[1]) : undefined;
    const scope2 = scope2Match ? parseFloat(scope2Match[1]) : undefined;
    const scope3 = scope3Match ? parseFloat(scope3Match[1]) : undefined;

    return {
      scope1,
      scope2,
      scope3,
      totalEmissions: (scope1 || 0) + (scope2 || 0) + (scope3 || 0)
    };
  }

  private async extractActions(message: string): Promise<RecommendedAction[]> {
    // Extract action recommendations
    const actionMatches = message.match(/(?:recommend|suggest|action)[:\s]+(.*?)(?=\n|$)/gi);
    if (!actionMatches) return [];

    return actionMatches.map(match => ({
      title: match.replace(/(?:recommend|suggest|action)[:\s]+/i, '').trim(),
      description: match.trim(),
      impact: {
        emissionsReduction: 0,
        costSavings: 0,
        timeframe: "unknown"
      },
      priority: "medium" as const,
      category: "efficiency" as const,
      implementationSteps: []
    }));
  }

  private async extractVisualizations(message: string): Promise<VisualizationComponent[]> {
    // Extract visualization requests
    const vizMatches = message.match(/(?:chart|graph|visualization|dashboard)[:\s]+(.*?)(?=\n|$)/gi);
    if (!vizMatches) return [];

    return vizMatches.map(match => ({
      type: "chart" as const,
      title: match.replace(/(?:chart|graph|visualization|dashboard)[:\s]+/i, '').trim(),
      data: {},
      config: {},
      insights: []
    }));
  }

  private async extractAlerts(message: string): Promise<Alert[]> {
    // Extract alerts and warnings
    const alertMatches = message.match(/(?:alert|warning|critical|urgent)[:\s]+(.*?)(?=\n|$)/gi);
    if (!alertMatches) return [];

    return alertMatches.map(match => ({
      type: "warning" as const,
      title: "System Alert",
      message: match.trim(),
      actionRequired: true
    }));
  }

  private calculateConfidence(message: string): number {
    // Simple confidence calculation based on message content
    let confidence = 0.5;
    
    if (message.includes("certain") || message.includes("confident")) confidence += 0.3;
    if (message.includes("likely") || message.includes("probable")) confidence += 0.2;
    if (message.includes("uncertain") || message.includes("maybe")) confidence -= 0.2;
    if (message.includes("data") || message.includes("analysis")) confidence += 0.1;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  private generateCacheKey(prompt: string, options: CompletionOptions): string {
    return `${prompt.substring(0, 100)}_${JSON.stringify(options)}`;
  }
}
```

## Phase 2: ESG Database Schema

### 2.1 Universal ESG Schema

#### Core ESG Tables
**File:** `/supabase/migrations/20240101_esg_schema.sql`

```sql
-- Universal ESG Schema Migration
-- Drop existing building-focused tables and create ESG-focused schema

BEGIN;

-- Create ESG-specific enums
CREATE TYPE industry_classification AS ENUM (
  'technology',
  'financial_services',
  'healthcare',
  'manufacturing',
  'retail',
  'energy',
  'transportation',
  'real_estate',
  'agriculture',
  'mining',
  'other'
);

CREATE TYPE material_topic_category AS ENUM (
  'environmental',
  'social',
  'governance'
);

CREATE TYPE compliance_framework AS ENUM (
  'gri',
  'sasb',
  'tcfd',
  'issb',
  'eu_taxonomy',
  'un_global_compact',
  'cdp',
  'sec_climate'
);

CREATE TYPE data_quality_rating AS ENUM (
  'excellent',
  'good',
  'fair',
  'poor',
  'missing'
);

CREATE TYPE target_type AS ENUM (
  'absolute',
  'intensity',
  'percentage_reduction'
);

CREATE TYPE sdg_goal AS ENUM (
  'no_poverty',
  'zero_hunger',
  'good_health',
  'quality_education',
  'gender_equality',
  'clean_water',
  'affordable_energy',
  'decent_work',
  'innovation',
  'reduced_inequalities',
  'sustainable_cities',
  'responsible_consumption',
  'climate_action',
  'life_below_water',
  'life_on_land',
  'peace_justice',
  'partnerships'
);

-- Enhanced Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  industry industry_classification NOT NULL,
  sub_industry TEXT,
  headquarters_country TEXT,
  headquarters_city TEXT,
  employee_count INTEGER,
  annual_revenue DECIMAL(15,2),
  fiscal_year_end DATE,
  reporting_currency TEXT DEFAULT 'USD',
  
  -- ESG-specific fields
  sustainability_officer_email TEXT,
  materiality_matrix JSONB,
  last_materiality_assessment DATE,
  
  -- Metadata
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material Topics (Industry-specific)
CREATE TABLE material_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  category material_topic_category NOT NULL,
  description TEXT,
  
  -- Materiality scoring
  business_impact_score DECIMAL(3,2) CHECK (business_impact_score >= 0 AND business_impact_score <= 5),
  stakeholder_concern_score DECIMAL(3,2) CHECK (stakeholder_concern_score >= 0 AND stakeholder_concern_score <= 5),
  materiality_score DECIMAL(3,2) GENERATED ALWAYS AS (
    (business_impact_score + stakeholder_concern_score) / 2
  ) STORED,
  
  -- Industry benchmarks
  industry_benchmark_score DECIMAL(3,2),
  is_industry_material BOOLEAN DEFAULT false,
  
  -- Compliance mapping
  gri_disclosures TEXT[],
  sasb_metrics TEXT[],
  tcfd_recommendations TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESG Metrics (Replaces building-specific metrics)
CREATE TABLE esg_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  material_topic_id UUID REFERENCES material_topics(id) ON DELETE CASCADE,
  
  -- Metric identification
  metric_name TEXT NOT NULL,
  metric_code TEXT, -- e.g., "GRI 305-1", "SASB FB-AG-110a.1"
  metric_description TEXT,
  
  -- Data
  value DECIMAL(15,4),
  unit TEXT,
  data_type TEXT CHECK (data_type IN ('quantitative', 'qualitative', 'binary')),
  
  -- Time context
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  
  -- Data quality
  data_quality data_quality_rating NOT NULL DEFAULT 'fair',
  verification_status TEXT CHECK (verification_status IN ('verified', 'limited_assurance', 'reasonable_assurance', 'unverified')),
  data_source TEXT,
  collection_method TEXT,
  
  -- Scope (for emissions)
  scope INTEGER CHECK (scope IN (1, 2, 3)),
  
  -- Contextual data
  baseline_value DECIMAL(15,4),
  baseline_year INTEGER,
  target_value DECIMAL(15,4),
  target_year INTEGER,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESG Targets
CREATE TABLE esg_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  material_topic_id UUID REFERENCES material_topics(id) ON DELETE CASCADE,
  
  -- Target definition
  target_name TEXT NOT NULL,
  target_description TEXT,
  target_type target_type NOT NULL,
  
  -- Values
  baseline_value DECIMAL(15,4) NOT NULL,
  baseline_year INTEGER NOT NULL,
  target_value DECIMAL(15,4) NOT NULL,
  target_year INTEGER NOT NULL,
  
  -- Progress tracking
  current_value DECIMAL(15,4),
  current_year INTEGER,
  progress_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN target_value = baseline_value THEN 100
      ELSE ((current_value - baseline_value) / (target_value - baseline_value)) * 100
    END
  ) STORED,
  
  -- Science-based validation
  is_science_based BOOLEAN DEFAULT false,
  sbti_approved BOOLEAN DEFAULT false,
  alignment_framework TEXT, -- e.g., "1.5°C", "Well Below 2°C"
  
  -- Status
  status TEXT CHECK (status IN ('active', 'achieved', 'missed', 'revised', 'cancelled')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scenario Planning
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Scenario definition
  scenario_name TEXT NOT NULL,
  scenario_description TEXT,
  scenario_type TEXT CHECK (scenario_type IN ('business_as_usual', 'optimistic', 'pessimistic', 'custom')),
  
  -- Time horizon
  start_year INTEGER NOT NULL,
  end_year INTEGER NOT NULL,
  
  -- Assumptions
  assumptions JSONB NOT NULL DEFAULT '{}',
  external_factors JSONB DEFAULT '{}',
  
  -- Results
  projected_outcomes JSONB DEFAULT '{}',
  impact_assessment JSONB DEFAULT '{}',
  
  -- Analysis
  confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
  risk_factors TEXT[],
  opportunities TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance Tracking
CREATE TABLE compliance_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Framework
  framework compliance_framework NOT NULL,
  requirement_id TEXT NOT NULL, -- e.g., "GRI 305-1"
  requirement_name TEXT NOT NULL,
  requirement_description TEXT,
  
  -- Status
  compliance_status TEXT CHECK (compliance_status IN ('compliant', 'partial', 'non_compliant', 'not_applicable')),
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Data requirements
  required_metrics TEXT[],
  missing_data TEXT[],
  
  -- Deadlines
  reporting_deadline DATE,
  next_review_date DATE,
  
  -- Evidence
  evidence_files TEXT[],
  documentation_links TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- UN SDG Mapping
CREATE TABLE sdg_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  material_topic_id UUID REFERENCES material_topics(id) ON DELETE CASCADE,
  
  -- SDG alignment
  sdg_goal sdg_goal NOT NULL,
  sdg_target TEXT, -- e.g., "7.2"
  alignment_strength TEXT CHECK (alignment_strength IN ('strong', 'moderate', 'weak')),
  
  -- Impact
  impact_type TEXT CHECK (impact_type IN ('positive', 'negative', 'mixed')),
  impact_description TEXT,
  
  -- Measurement
  indicator_name TEXT,
  indicator_value DECIMAL(15,4),
  indicator_unit TEXT,
  
  -- Progress
  baseline_value DECIMAL(15,4),
  current_value DECIMAL(15,4),
  target_value DECIMAL(15,4),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Conversations for ESG context
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Conversation context
  conversation_type TEXT CHECK (conversation_type IN ('general', 'materiality', 'reporting', 'targets', 'compliance', 'benchmarking')),
  messages JSONB DEFAULT '[]',
  
  -- ESG context
  esg_context JSONB DEFAULT '{}',
  active_topics UUID[],
  mentioned_frameworks TEXT[],
  
  -- AI insights
  ai_insights JSONB DEFAULT '{}',
  action_items TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_organizations_industry ON organizations(industry);
CREATE INDEX idx_material_topics_org ON material_topics(organization_id);
CREATE INDEX idx_material_topics_category ON material_topics(category);
CREATE INDEX idx_esg_metrics_org ON esg_metrics(organization_id);
CREATE INDEX idx_esg_metrics_topic ON esg_metrics(material_topic_id);
CREATE INDEX idx_esg_metrics_period ON esg_metrics(reporting_period_start, reporting_period_end);
CREATE INDEX idx_esg_targets_org ON esg_targets(organization_id);
CREATE INDEX idx_scenarios_org ON scenarios(organization_id);
CREATE INDEX idx_compliance_org ON compliance_requirements(organization_id);
CREATE INDEX idx_compliance_framework ON compliance_requirements(framework);
CREATE INDEX idx_sdg_mapping_org ON sdg_mapping(organization_id);
CREATE INDEX idx_conversations_org ON conversations(organization_id);

-- Full-text search indexes
CREATE INDEX idx_material_topics_search ON material_topics USING gin(to_tsvector('english', topic_name || ' ' || description));
CREATE INDEX idx_esg_metrics_search ON esg_metrics USING gin(to_tsvector('english', metric_name || ' ' || metric_description));

COMMIT;
```

### 2.2 Enhanced Context Engine

#### ESG Context Engine
**File:** `/src/lib/ai/esg-context-engine.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export interface ESGContext {
  organization: {
    id: string;
    name: string;
    industry: string;
    subIndustry?: string;
    employeeCount?: number;
    annualRevenue?: number;
    sustainabilityOfficer?: string;
  };
  
  materialTopics: {
    id: string;
    name: string;
    category: 'environmental' | 'social' | 'governance';
    materialityScore: number;
    businessImpact: number;
    stakeholderConcern: number;
    industryBenchmark?: number;
  }[];
  
  currentMetrics: {
    [topicId: string]: {
      value: number;
      unit: string;
      dataQuality: string;
      lastUpdated: Date;
      trendDirection: 'improving' | 'stable' | 'declining';
    };
  };
  
  targets: {
    id: string;
    name: string;
    type: 'absolute' | 'intensity' | 'percentage_reduction';
    baselineValue: number;
    targetValue: number;
    currentValue?: number;
    progress: number;
    isScienceBased: boolean;
    status: 'active' | 'achieved' | 'missed' | 'revised';
  }[];
  
  compliance: {
    framework: string;
    overallStatus: 'compliant' | 'partial' | 'non_compliant';
    completionPercentage: number;
    upcomingDeadlines: {
      requirement: string;
      deadline: Date;
      status: string;
    }[];
  }[];
  
  sdgAlignment: {
    goal: string;
    target: string;
    alignmentStrength: 'strong' | 'moderate' | 'weak';
    impactType: 'positive' | 'negative' | 'mixed';
    currentValue?: number;
    targetValue?: number;
  }[];
  
  industryBenchmarks: {
    metric: string;
    yourValue: number;
    industryAverage: number;
    topQuartile: number;
    percentileRank: number;
  }[];
  
  riskFactors: {
    type: 'regulatory' | 'physical' | 'transition' | 'reputational';
    description: string;
    probability: number;
    impact: number;
    mitigationActions: string[];
  }[];
  
  opportunities: {
    type: 'efficiency' | 'innovation' | 'market' | 'resilience';
    description: string;
    potentialImpact: number;
    implementationEffort: 'low' | 'medium' | 'high';
    timeframe: string;
  }[];
}

export class ESGContextEngine {
  private supabase: ReturnType<typeof createClient>;
  private contextCache: Map<string, { context: ESGContext; timestamp: number }> = new Map();

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async buildESGContext(
    organizationId: string,
    conversationType?: string,
    userQuery?: string
  ): Promise<ESGContext> {
    const cacheKey = `${organizationId}-${conversationType || 'general'}`;
    const cached = this.contextCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.context;
    }

    const context = await this.assembleESGContext(organizationId, userQuery);
    
    this.contextCache.set(cacheKey, {
      context,
      timestamp: Date.now()
    });

    return context;
  }

  private async assembleESGContext(
    organizationId: string,
    userQuery?: string
  ): Promise<ESGContext> {
    // Parallel data fetching for performance
    const [
      organization,
      materialTopics,
      currentMetrics,
      targets,
      compliance,
      sdgAlignment,
      industryBenchmarks,
      riskFactors,
      opportunities
    ] = await Promise.all([
      this.getOrganizationData(organizationId),
      this.getMaterialTopics(organizationId),
      this.getCurrentMetrics(organizationId),
      this.getTargets(organizationId),
      this.getComplianceStatus(organizationId),
      this.getSDGAlignment(organizationId),
      this.getIndustryBenchmarks(organizationId),
      this.getRiskFactors(organizationId),
      this.getOpportunities(organizationId)
    ]);

    return {
      organization,
      materialTopics,
      currentMetrics,
      targets,
      compliance,
      sdgAlignment,
      industryBenchmarks,
      riskFactors,
      opportunities
    };
  }

  private async getOrganizationData(organizationId: string) {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      industry: data.industry,
      subIndustry: data.sub_industry,
      employeeCount: data.employee_count,
      annualRevenue: data.annual_revenue,
      sustainabilityOfficer: data.sustainability_officer_email
    };
  }

  private async getMaterialTopics(organizationId: string) {
    const { data, error } = await this.supabase
      .from('material_topics')
      .select('*')
      .eq('organization_id', organizationId)
      .order('materiality_score', { ascending: false });

    if (error) throw error;

    return data.map(topic => ({
      id: topic.id,
      name: topic.topic_name,
      category: topic.category,
      materialityScore: topic.materiality_score,
      businessImpact: topic.business_impact_score,
      stakeholderConcern: topic.stakeholder_concern_score,
      industryBenchmark: topic.industry_benchmark_score
    }));
  }

  private async getCurrentMetrics(organizationId: string) {
    const { data, error } = await this.supabase
      .from('esg_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .order('reporting_period_end', { ascending: false });

    if (error) throw error;

    const metrics: any = {};
    
    // Group by topic and get latest values
    data.forEach(metric => {
      if (!metrics[metric.material_topic_id]) {
        metrics[metric.material_topic_id] = {
          value: metric.value,
          unit: metric.unit,
          dataQuality: metric.data_quality,
          lastUpdated: new Date(metric.reporting_period_end),
          trendDirection: this.calculateTrendDirection(metric)
        };
      }
    });

    return metrics;
  }

  private async getTargets(organizationId: string) {
    const { data, error } = await this.supabase
      .from('esg_targets')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (error) throw error;

    return data.map(target => ({
      id: target.id,
      name: target.target_name,
      type: target.target_type,
      baselineValue: target.baseline_value,
      targetValue: target.target_value,
      currentValue: target.current_value,
      progress: target.progress_percentage,
      isScienceBased: target.is_science_based,
      status: target.status
    }));
  }

  private async getComplianceStatus(organizationId: string) {
    const { data, error } = await this.supabase
      .from('compliance_requirements')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;

    // Group by framework
    const frameworks = new Map();
    
    data.forEach(req => {
      if (!frameworks.has(req.framework)) {
        frameworks.set(req.framework, {
          framework: req.framework,
          requirements: []
        });
      }
      frameworks.get(req.framework).requirements.push(req);
    });

    return Array.from(frameworks.values()).map(fw => ({
      framework: fw.framework,
      overallStatus: this.calculateOverallStatus(fw.requirements),
      completionPercentage: this.calculateCompletionPercentage(fw.requirements),
      upcomingDeadlines: this.getUpcomingDeadlines(fw.requirements)
    }));
  }

  private async getSDGAlignment(organizationId: string) {
    const { data, error } = await this.supabase
      .from('sdg_mapping')
      .select('*')
      .eq('organization_id', organizationId)
      .order('alignment_strength', { ascending: false });

    if (error) throw error;

    return data.map(mapping => ({
      goal: mapping.sdg_goal,
      target: mapping.sdg_target,
      alignmentStrength: mapping.alignment_strength,
      impactType: mapping.impact_type,
      currentValue: mapping.current_value,
      targetValue: mapping.target_value
    }));
  }

  private async getIndustryBenchmarks(organizationId: string) {
    // This would typically fetch from external benchmarking service
    // For now, return mock data
    return [
      {
        metric: 'Carbon Intensity',
        yourValue: 2.5,
        industryAverage: 3.2,
        topQuartile: 1.8,
        percentileRank: 75
      }
    ];
  }

  private async getRiskFactors(organizationId: string) {
    // This would be enhanced with actual risk analysis
    return [
      {
        type: 'regulatory' as const,
        description: 'Potential carbon tax implementation',
        probability: 0.7,
        impact: 0.8,
        mitigationActions: ['Increase energy efficiency', 'Invest in renewables']
      }
    ];
  }

  private async getOpportunities(organizationId: string) {
    // This would be enhanced with actual opportunity analysis
    return [
      {
        type: 'efficiency' as const,
        description: 'LED lighting upgrade opportunity',
        potentialImpact: 15000,
        implementationEffort: 'low' as const,
        timeframe: '3-6 months'
      }
    ];
  }

  private calculateTrendDirection(metric: any): 'improving' | 'stable' | 'declining' {
    // Simple trend calculation - would be enhanced with historical data
    if (metric.value < metric.baseline_value) return 'improving';
    if (metric.value === metric.baseline_value) return 'stable';
    return 'declining';
  }

  private calculateOverallStatus(requirements: any[]): 'compliant' | 'partial' | 'non_compliant' {
    const compliantCount = requirements.filter(r => r.compliance_status === 'compliant').length;
    const totalCount = requirements.length;
    
    if (compliantCount === totalCount) return 'compliant';
    if (compliantCount > 0) return 'partial';
    return 'non_compliant';
  }

  private calculateCompletionPercentage(requirements: any[]): number {
    const totalCompletion = requirements.reduce((sum, req) => sum + (req.completion_percentage || 0), 0);
    return totalCompletion / requirements.length;
  }

  private getUpcomingDeadlines(requirements: any[]) {
    return requirements
      .filter(req => req.reporting_deadline && new Date(req.reporting_deadline) > new Date())
      .sort((a, b) => new Date(a.reporting_deadline).getTime() - new Date(b.reporting_deadline).getTime())
      .slice(0, 5)
      .map(req => ({
        requirement: req.requirement_name,
        deadline: new Date(req.reporting_deadline),
        status: req.compliance_status
      }));
  }
}
```

This technical implementation guide provides detailed code examples and instructions for the first phases of the ESG platform transformation. The guide continues with similar detail for each subsequent phase, ensuring developers have clear, actionable instructions for every aspect of the implementation.

*Note: This is the first portion of the complete technical guide. The full guide would continue with detailed implementations for materiality assessment, scenario planning, compliance tracking, and all other features outlined in the transformation plan.*