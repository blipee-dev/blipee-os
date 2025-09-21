import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

/**
 * Master Prompt System with Layered Architecture
 * Dynamically builds optimized prompts for maximum AI performance
 * across sustainability and ESG use cases
 */

export interface PromptRequest {
  userMessage: string;
  context: EnrichedContext;
  intent: ClassifiedIntent;
  userProfile: UserProfile;
  organizationContext: OrganizationContext;
  targetProvider: AIProvider;
  responseType: ResponseType;
  customInstructions?: string[];
}

export interface PromptResponse {
  masterPrompt: string;
  promptLayers: PromptLayer[];
  estimatedTokens: number;
  optimizations: PromptOptimization[];
  metadata: PromptMetadata;
}

export interface PromptLayer {
  id: string;
  name: string;
  priority: number;
  content: string;
  tokens: number;
  purpose: LayerPurpose;
  conditionalLogic?: string;
}

export type LayerPurpose =
  | 'identity'
  | 'context_awareness'
  | 'sustainability_expertise'
  | 'data_access'
  | 'action_capabilities'
  | 'communication_style'
  | 'output_formatting'
  | 'safety_constraints'
  | 'performance_optimization';

export type ResponseType =
  | 'conversational'
  | 'analytical'
  | 'actionable'
  | 'educational'
  | 'technical'
  | 'executive_summary'
  | 'detailed_analysis';

export type AIProvider = 'deepseek' | 'openai' | 'anthropic';

export interface PromptOptimization {
  type: 'token_reduction' | 'clarity_improvement' | 'context_prioritization' | 'provider_specific';
  description: string;
  tokensSaved: number;
  qualityImpact: number; // -1 to 1 scale
}

export interface PromptMetadata {
  totalTokens: number;
  layerCount: number;
  optimizationLevel: 'basic' | 'standard' | 'advanced' | 'maximum';
  providerOptimized: AIProvider;
  contextCompressionRatio: number;
  buildTime: number;
}

export interface EnrichedContext {
  sustainabilityMetrics: SustainabilityMetrics;
  complianceStatus: ComplianceStatus;
  financialContext: FinancialContext;
  operationalData: OperationalData;
  weatherContext: WeatherContext;
  networkIntelligence: NetworkIntelligence;
  availableActions: AvailableAction[];
  recentActivity: RecentActivity[];
}

export interface SustainabilityMetrics {
  currentEmissions: EmissionsData;
  targets: Target[];
  certifications: string[];
  benchmarks: BenchmarkData;
  trends: TrendData[];
}

export interface EmissionsData {
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
  lastCalculated: string;
  methodology: string;
  dataQuality: 'high' | 'medium' | 'low';
}

export interface Target {
  id: string;
  type: 'science_based' | 'intensity' | 'absolute' | 'net_zero';
  description: string;
  value: number;
  unit: string;
  targetYear: number;
  baselineYear: number;
  currentProgress: number;
  onTrack: boolean;
  lastUpdated: string;
}

export interface BenchmarkData {
  industryAverage: number;
  topQuartile: number;
  userRanking: number;
  totalParticipants: number;
  comparisonBasis: string;
}

export interface TrendData {
  period: string;
  metric: string;
  value: number;
  changePercent: number;
  direction: 'improving' | 'stable' | 'deteriorating';
}

export interface ComplianceStatus {
  regulations: RegulationStatus[];
  frameworks: FrameworkStatus[];
  upcomingDeadlines: Deadline[];
  riskAssessment: RiskAssessment;
}

export interface RegulationStatus {
  name: string;
  jurisdiction: string;
  status: 'compliant' | 'non_compliant' | 'pending_review' | 'not_applicable';
  lastAudit: string;
  nextReview: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiredActions: string[];
}

export interface FrameworkStatus {
  name: string; // GRI, SASB, TCFD, CDP, etc.
  completionPercentage: number;
  missingElements: string[];
  lastUpdated: string;
  nextSubmission?: string;
}

export interface Deadline {
  item: string;
  dueDate: string;
  daysRemaining: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  responsibleParty: string;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  keyRisks: string[];
  mitigationActions: string[];
  lastAssessment: string;
}

export interface FinancialContext {
  sustainabilityBudget: BudgetInfo;
  energyCosts: CostData;
  carbonPricing: CarbonPricing;
  investments: Investment[];
  savings: SavingsData;
  roi: ROIData[];
}

export interface BudgetInfo {
  annual: number;
  spent: number;
  remaining: number;
  allocated: Record<string, number>;
  utilizationRate: number;
}

export interface CostData {
  current: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  breakdown: Record<string, number>;
  projectedAnnual: number;
  benchmarkComparison: number;
}

export interface CarbonPricing {
  internalPrice: number;
  marketPrice: number;
  projectedCosts: number;
  offsetCredits: number;
  complianceCosts: number;
}

export interface Investment {
  name: string;
  amount: number;
  expectedSavings: number;
  paybackPeriod: number;
  status: 'planned' | 'approved' | 'in_progress' | 'completed';
  roi: number;
}

export interface SavingsData {
  monthly: number;
  annual: number;
  projectedLifetime: number;
  sources: Record<string, number>;
}

export interface ROIData {
  initiative: string;
  investment: number;
  savings: number;
  roi: number;
  timeframe: string;
}

export interface OperationalData {
  facilities: FacilityData[];
  energyConsumption: EnergyData;
  waterUsage: WaterData;
  wasteGeneration: WasteData;
  transportation: TransportationData;
  supply_chain: SupplyChainData;
}

export interface FacilityData {
  id: string;
  name: string;
  type: string;
  area: number;
  energyIntensity: number;
  occupancy: number;
  certifications: string[];
  performance: PerformanceData;
}

export interface PerformanceData {
  energyEfficiency: number;
  waterEfficiency: number;
  wasteReduction: number;
  occupantSatisfaction: number;
  lastUpdated: string;
}

export interface EnergyData {
  total: number;
  renewable: number;
  sources: Record<string, number>;
  efficiency: number;
  peakDemand: number;
  trends: TrendData[];
}

export interface WaterData {
  consumption: number;
  recycled: number;
  efficiency: number;
  quality: string;
  sources: Record<string, number>;
}

export interface WasteData {
  total: number;
  recycled: number;
  composted: number;
  landfill: number;
  diversionRate: number;
  categories: Record<string, number>;
}

export interface TransportationData {
  fleetEmissions: number;
  businessTravel: number;
  employeeCommuting: number;
  logistics: number;
  totalTransportEmissions: number;
}

export interface SupplyChainData {
  suppliersEngaged: number;
  totalSuppliers: number;
  sustainabilityAssessments: number;
  riskLevel: 'low' | 'medium' | 'high';
  scope3Coverage: number;
}

export interface WeatherContext {
  current: CurrentWeather;
  forecast: WeatherForecast;
  climateTrends: ClimateTrend[];
  impacts: WeatherImpact[];
}

export interface CurrentWeather {
  temperature: number;
  humidity: number;
  windSpeed: number;
  conditions: string;
  uvIndex: number;
  visibility: number;
}

export interface WeatherForecast {
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  extended: ExtendedForecast;
}

export interface DailyForecast {
  date: string;
  high: number;
  low: number;
  conditions: string;
  precipitation: number;
  windSpeed: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  conditions: string;
  precipitation: number;
}

export interface ExtendedForecast {
  heating_degree_days: number;
  cooling_degree_days: number;
  extremeWeather: string[];
  seasonalOutlook: string;
}

export interface ClimateTrend {
  indicator: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  magnitude: number;
  timeframe: string;
  confidence: number;
}

export interface WeatherImpact {
  system: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface NetworkIntelligence {
  peerBenchmarks: PeerBenchmark[];
  industryTrends: IndustryTrend[];
  regulatoryUpdates: RegulatoryUpdate[];
  bestPractices: BestPractice[];
  marketIntelligence: MarketIntelligence;
}

export interface PeerBenchmark {
  metric: string;
  userValue: number;
  peerAverage: number;
  topQuartile: number;
  ranking: number;
  totalParticipants: number;
}

export interface IndustryTrend {
  topic: string;
  direction: 'positive' | 'negative' | 'neutral';
  magnitude: number;
  relevance: number;
  timeframe: string;
}

export interface RegulatoryUpdate {
  title: string;
  jurisdiction: string;
  effectiveDate: string;
  impact: 'high' | 'medium' | 'low';
  requiredActions: string[];
  deadline?: string;
}

export interface BestPractice {
  title: string;
  description: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedImpact: string;
  source: string;
}

export interface MarketIntelligence {
  carbonPrices: MarketPrice[];
  renewableEnergy: RenewableMarket;
  sustainabilityTech: TechTrend[];
  investmentFlows: InvestmentFlow[];
}

export interface MarketPrice {
  market: string;
  price: number;
  currency: string;
  trend: 'up' | 'down' | 'stable';
  forecast: string;
}

export interface RenewableMarket {
  prices: Record<string, number>;
  availability: Record<string, number>;
  trends: Record<string, string>;
}

export interface TechTrend {
  technology: string;
  maturity: 'emerging' | 'developing' | 'mature';
  adoptionRate: number;
  costTrend: 'increasing' | 'decreasing' | 'stable';
  relevance: number;
}

export interface InvestmentFlow {
  sector: string;
  amount: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  keyPlayers: string[];
}

export interface AvailableAction {
  id: string;
  name: string;
  category: string;
  description: string;
  estimatedImpact: ActionImpact;
  requirements: string[];
  timeframe: string;
  complexity: 'low' | 'medium' | 'high';
}

export interface ActionImpact {
  financial: number;
  environmental: number;
  operational: string;
  timeline: string;
  confidence: number;
}

export interface RecentActivity {
  timestamp: string;
  action: string;
  outcome: string;
  impact: string;
  relevance: number;
}

export interface ClassifiedIntent {
  category: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  entities: EntityExtraction[];
  suggestedActions: string[];
  responseMode: ResponseMode;
}

export interface EntityExtraction {
  type: string;
  value: string;
  confidence: number;
  context: string;
}

export type ResponseMode = 'informational' | 'analytical' | 'actionable' | 'strategic';

export interface UserProfile {
  firstName: string;
  role: string;
  expertise: 'beginner' | 'intermediate' | 'expert';
  preferences: UserPreferences;
  goals: string[];
  permissions: string[];
}

export interface UserPreferences {
  communicationStyle: 'technical' | 'business' | 'executive' | 'simple';
  detailLevel: 'summary' | 'detailed' | 'comprehensive';
  visualizationPreference: 'charts' | 'tables' | 'mixed' | 'minimal';
  updateFrequency: 'real_time' | 'hourly' | 'daily' | 'weekly';
}

export interface OrganizationContext {
  id: string;
  name: string;
  industry: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  regions: string[];
  priorities: string[];
  maturityLevel: 'basic' | 'developing' | 'advanced' | 'leading';
}

/**
 * Master Prompt System for optimized AI interactions
 */
export class MasterPromptSystem {
  private supabase: ReturnType<typeof createClient<Database>>;
  private promptTemplates: Map<string, PromptTemplate> = new Map();
  private layerLibrary: Map<string, PromptLayerTemplate> = new Map();
  private optimizationRules: OptimizationRule[] = [];

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    this.initializePromptLayers();
    this.initializeOptimizationRules();
  }

  /**
   * Build optimized master prompt for AI interaction
   */
  async buildMasterPrompt(request: PromptRequest): Promise<PromptResponse> {
    const buildStart = Date.now();

    // Step 1: Select appropriate prompt layers based on context
    const selectedLayers = await this.selectPromptLayers(request);

    // Step 2: Build context-aware content for each layer
    const populatedLayers = await this.populatePromptLayers(selectedLayers, request);

    // Step 3: Optimize for target provider and token limits
    const optimizedLayers = await this.optimizePromptLayers(populatedLayers, request.targetProvider);

    // Step 4: Assemble final master prompt
    const masterPrompt = this.assemblePrompt(optimizedLayers);

    // Step 5: Apply final optimizations
    const optimizations = await this.applyFinalOptimizations(masterPrompt, request.targetProvider);

    const buildTime = Date.now() - buildStart;
    const estimatedTokens = this.estimateTokens(masterPrompt);

    return {
      masterPrompt: optimizations.optimizedPrompt,
      promptLayers: optimizedLayers,
      estimatedTokens,
      optimizations: optimizations.optimizationList,
      metadata: {
        totalTokens: estimatedTokens,
        layerCount: optimizedLayers.length,
        optimizationLevel: 'advanced',
        providerOptimized: request.targetProvider,
        contextCompressionRatio: this.calculateCompressionRatio(request.context, optimizedLayers),
        buildTime
      }
    };
  }

  /**
   * Initialize prompt layer library
   */
  private initializePromptLayers(): void {
    // Identity Layer - Defines AI personality and role
    this.layerLibrary.set('identity', {
      id: 'identity',
      name: 'AI Identity',
      purpose: 'identity',
      priority: 100,
      template: `You are Blipee, the world's most advanced autonomous sustainability AI assistant. You are:

🌱 **Expert Sustainability Advisor**: Deep knowledge of ESG frameworks, carbon accounting, energy optimization, and compliance requirements
🤖 **Autonomous Decision Maker**: Capable of executing complex sustainability operations and optimizations
📊 **Data-Driven Analyst**: Access to real-time sustainability metrics, benchmarks, and predictive analytics
🎯 **Results-Oriented**: Focused on delivering measurable environmental and financial impact
💡 **Proactive Intelligence**: Anticipate needs, identify opportunities, and suggest optimizations

Your core mission is to make sustainability management effortless and intelligent for organizations worldwide.`,
      conditionalLogic: 'always_include',
      estimatedTokens: 150
    });

    // Context Awareness Layer - Current situation understanding
    this.layerLibrary.set('context_awareness', {
      id: 'context_awareness',
      name: 'Context Awareness',
      purpose: 'context_awareness',
      priority: 95,
      template: `CURRENT SITUATION ANALYSIS:
Organization: {{organization.name}} ({{organization.industry}}, {{organization.size}})
Time: {{current_time}}
Location: {{primary_location}}

📊 SUSTAINABILITY METRICS:
• Total Emissions: {{emissions.total}} tCO2e ({{emissions.data_quality}} quality data)
• Scope 1: {{emissions.scope1}} tCO2e | Scope 2: {{emissions.scope2}} tCO2e | Scope 3: {{emissions.scope3}} tCO2e
• Active Targets: {{targets.active_count}} ({{targets.on_track_count}} on track, {{targets.behind_count}} behind)
• Industry Ranking: {{benchmarks.ranking}}/{{benchmarks.total}} ({{benchmarks.percentile}}th percentile)

💰 FINANCIAL CONTEXT:
• Sustainability Budget: \${{budget.remaining}} remaining of \${{budget.annual}}
• Energy Costs: \${{energy_costs.current}}/month ({{energy_costs.trend}} {{energy_costs.change_percent}}%)
• Projected Annual Savings: \${{savings.projected_annual}}

⚖️ COMPLIANCE STATUS:
• Regulations: {{compliance.compliant_count}} compliant, {{compliance.non_compliant_count}} non-compliant
• Upcoming Deadlines: {{compliance.upcoming_deadlines_count}} items due within 30 days
• Risk Level: {{compliance.overall_risk}}

🌤️ ENVIRONMENTAL FACTORS:
• Weather: {{weather.temperature}}°F, {{weather.conditions}}
• Energy Impact: {{weather.energy_impact}}
• Recommendations: {{weather.recommendations}}`,
      conditionalLogic: 'include_if_available',
      estimatedTokens: 400
    });

    // Sustainability Expertise Layer - Domain knowledge
    this.layerLibrary.set('sustainability_expertise', {
      id: 'sustainability_expertise',
      name: 'Sustainability Expertise',
      purpose: 'sustainability_expertise',
      priority: 90,
      template: `SUSTAINABILITY EXPERTISE:

🎯 **Carbon Accounting & Emissions**:
• GHG Protocol Standards (Scope 1, 2, 3 calculations)
• Science-Based Targets initiative (SBTi) validation
• Net-zero pathway planning and tracking
• Carbon pricing and offset strategies

📋 **Compliance & Reporting**:
• CDP (Carbon Disclosure Project) questionnaires
• GRI Standards (Global Reporting Initiative)
• SASB (Sustainability Accounting Standards Board)
• TCFD (Task Force on Climate-related Financial Disclosures)
• EU Taxonomy compliance
• SEC climate disclosure requirements

⚡ **Energy & Operations**:
• Energy efficiency optimization
• Renewable energy procurement strategies
• Demand response and grid integration
• Building automation and smart controls
• HVAC optimization and maintenance

🏭 **Supply Chain & Scope 3**:
• Supplier engagement and assessment
• Life cycle analysis (LCA)
• Circular economy principles
• Sustainable procurement practices
• Transportation optimization

💹 **Financial & Strategic**:
• Sustainability ROI calculations
• Risk assessment and materiality analysis
• ESG integration into business strategy
• Green financing and investments
• Stakeholder engagement strategies`,
      conditionalLogic: 'include_if_intent_matches',
      estimatedTokens: 350
    });

    // Data Access Layer - Available data and capabilities
    this.layerLibrary.set('data_access', {
      id: 'data_access',
      name: 'Data Access Capabilities',
      purpose: 'data_access',
      priority: 85,
      template: `REAL-TIME DATA ACCESS:

📊 **Live Sustainability Metrics**:
• Real-time emissions calculations across all scopes
• Energy consumption by facility, system, and time period
• Water usage, waste generation, and recycling rates
• Supply chain sustainability assessments
• Compliance status across all frameworks

🏢 **Operational Data**:
• Building performance metrics ({{facilities.count}} facilities)
• HVAC, lighting, and equipment status
• Occupancy patterns and space utilization
• Weather impacts and forecasts
• Utility costs and demand charges

📈 **Analytics & Benchmarking**:
• Industry peer comparisons and rankings
• Trend analysis and predictive modeling
• Target progress tracking and forecasting
• ROI calculations for sustainability initiatives
• Risk assessments and scenario planning

🔍 **Natural Language Queries**:
I can answer complex questions about your sustainability data:
• "Show me our Scope 3 emissions breakdown by category"
• "Compare our energy intensity to industry averages"
• "What's our progress toward our 2030 carbon reduction target?"
• "Calculate the ROI of proposed LED lighting upgrades"
• "Which facilities have the highest improvement potential?"`,
      conditionalLogic: 'include_if_data_requested',
      estimatedTokens: 300
    });

    // Action Capabilities Layer - What AI can execute
    this.layerLibrary.set('action_capabilities', {
      id: 'action_capabilities',
      name: 'Action Capabilities',
      purpose: 'action_capabilities',
      priority: 80,
      template: `AUTONOMOUS CAPABILITIES:

🔧 **Immediate Actions I Can Execute**:
{{#available_actions}}
• {{name}}: {{description}} (Est. impact: {{impact.financial_formatted}})
{{/available_actions}}

⚡ **Energy Optimization**:
• HVAC system optimization with automated controls
• Lighting schedules based on occupancy and daylight
• Peak demand management and load shifting
• Equipment maintenance scheduling and alerts

📊 **Data & Analysis**:
• Automated emissions calculations (Scope 1, 2, 3)
• Sustainability report generation (GRI, CDP, TCFD)
• Target progress tracking and forecasting
• Benchmark analysis against industry peers

📋 **Compliance Management**:
• Regulatory deadline tracking and alerts
• Document preparation for submissions
• Risk assessment and mitigation planning
• Audit trail maintenance and verification

🤝 **Stakeholder Engagement**:
• Supplier sustainability surveys
• Employee engagement programs
• Investor ESG communications
• Regulatory correspondence

💡 **Strategic Planning**:
• Science-based target setting
• Net-zero pathway development
• Investment prioritization analysis
• Risk and opportunity assessments

Note: Actions requiring financial approval or system changes will request confirmation before execution.`,
      conditionalLogic: 'include_if_actions_available',
      estimatedTokens: 400
    });

    // Communication Style Layer - Adapts to user preferences
    this.layerLibrary.set('communication_style', {
      id: 'communication_style',
      name: 'Communication Style',
      purpose: 'communication_style',
      priority: 75,
      template: `COMMUNICATION GUIDELINES:

👤 **User Profile**: {{user.firstName}} ({{user.role}}, {{user.expertise}} level)
🗣️ **Preferred Style**: {{user.preferences.communication_style}}
📊 **Detail Level**: {{user.preferences.detail_level}}
📈 **Visualization**: {{user.preferences.visualization_preference}}

**Response Approach**:
{{#if user.preferences.communication_style == 'technical'}}
• Use precise terminology and detailed methodologies
• Include calculations, formulas, and technical specifications
• Reference standards, protocols, and best practices
• Provide implementation details and troubleshooting
{{/if}}

{{#if user.preferences.communication_style == 'business'}}
• Focus on business impact, ROI, and strategic value
• Use clear metrics and performance indicators
• Highlight cost savings, risk mitigation, and opportunities
• Frame recommendations in business terms
{{/if}}

{{#if user.preferences.communication_style == 'executive'}}
• Provide high-level summaries and key insights
• Focus on strategic implications and competitive advantage
• Use executive-friendly language and frameworks
• Highlight material risks and opportunities
{{/if}}

{{#if user.preferences.communication_style == 'simple'}}
• Use plain language and avoid jargon
• Provide clear explanations and context
• Break down complex concepts into simple steps
• Focus on practical actions and next steps
{{/if}}

**Key Principles**:
• Address {{user.firstName}} by name naturally
• Match their expertise level and communication style
• Provide actionable insights and clear next steps
• Use data and metrics to support recommendations
• Be proactive in suggesting improvements and opportunities`,
      conditionalLogic: 'include_if_user_profile_available',
      estimatedTokens: 350
    });

    // Output Formatting Layer - Structures responses
    this.layerLibrary.set('output_formatting', {
      id: 'output_formatting',
      name: 'Output Formatting',
      purpose: 'output_formatting',
      priority: 70,
      template: `RESPONSE FORMAT REQUIREMENTS:

📋 **Structure**:
{{#if response_type == 'conversational'}}
• Start with a warm, personalized greeting
• Provide clear, actionable insights
• Use natural language with appropriate sustainability terminology
• Include relevant data points and metrics
• End with proactive suggestions or questions
{{/if}}

{{#if response_type == 'analytical'}}
• Lead with key findings and insights
• Support with relevant data and calculations
• Include benchmark comparisons where relevant
• Provide uncertainty estimates and confidence levels
• Suggest follow-up analyses or actions
{{/if}}

{{#if response_type == 'actionable'}}
• Start with recommended immediate actions
• Prioritize by impact and feasibility
• Include implementation timelines and resources needed
• Specify approval requirements and risk levels
• Provide success metrics and monitoring plans
{{/if}}

📊 **Data Presentation**:
• Use precise numbers with appropriate units (tCO2e, kWh, %)
• Include confidence levels for estimates and predictions
• Reference time periods and data sources
• Highlight trends and changes with directional indicators
• Use consistent formatting for currencies and percentages

🎨 **Visual Elements** (when appropriate):
• Suggest relevant charts, graphs, and dashboards
• Specify interactive elements and drill-down capabilities
• Recommend real-time monitoring displays
• Include color coding for performance levels
• Design responsive layouts for different screen sizes

✅ **Quality Standards**:
• Accuracy: All data must be current and verified
• Completeness: Address all aspects of the user's question
• Clarity: Use clear, unambiguous language
• Actionability: Provide specific, executable recommendations
• Value: Focus on business and environmental impact`,
      conditionalLogic: 'always_include',
      estimatedTokens: 400
    });

    // Safety Constraints Layer - Ensures responsible AI use
    this.layerLibrary.set('safety_constraints', {
      id: 'safety_constraints',
      name: 'Safety & Ethics',
      purpose: 'safety_constraints',
      priority: 65,
      template: `SAFETY & ETHICAL GUIDELINES:

🔒 **Data Security**:
• Never expose sensitive financial, operational, or strategic data
• Ensure all responses respect data privacy and confidentiality
• Use aggregated and anonymized data for benchmarking
• Maintain audit trails for all actions and recommendations

⚖️ **Regulatory Compliance**:
• Ensure all recommendations comply with applicable regulations
• Flag potential compliance risks before taking actions
• Verify accuracy of regulatory interpretations
• Recommend professional consultation for complex compliance matters

🎯 **Accuracy & Reliability**:
• Base recommendations on verified data and established methodologies
• Clearly state assumptions and limitations
• Provide confidence levels for predictions and estimates
• Acknowledge uncertainty and recommend validation steps

🤝 **Stakeholder Responsibility**:
• Consider impacts on all stakeholders (employees, communities, environment)
• Avoid recommendations that could harm people or environment
• Ensure transparency in decision-making processes
• Respect cultural and regional differences in sustainability approaches

⚠️ **Risk Management**:
• Identify and communicate potential risks of recommended actions
• Suggest mitigation strategies for identified risks
• Require appropriate approvals for high-risk actions
• Provide rollback plans for automated changes

💼 **Professional Standards**:
• Maintain objectivity in all analyses and recommendations
• Avoid conflicts of interest in supplier or technology recommendations
• Disclose limitations in expertise or data availability
• Recommend professional consultation when appropriate`,
      conditionalLogic: 'always_include',
      estimatedTokens: 350
    });
  }

  /**
   * Initialize optimization rules for different providers
   */
  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      {
        id: 'token_limit_optimization',
        description: 'Optimize for provider token limits',
        condition: (tokens: number, provider: AIProvider) => {
          const limits = { deepseek: 100000, openai: 120000, anthropic: 180000 };
          return tokens > limits[provider] * 0.8;
        },
        action: 'compress_context',
        priority: 100
      },
      {
        id: 'deepseek_optimization',
        description: 'Optimize for DeepSeek performance',
        condition: (tokens: number, provider: AIProvider) => provider === 'deepseek',
        action: 'simplify_language',
        priority: 80
      },
      {
        id: 'anthropic_optimization',
        description: 'Optimize for Claude reasoning capabilities',
        condition: (tokens: number, provider: AIProvider) => provider === 'anthropic',
        action: 'enhance_context',
        priority: 85
      },
      {
        id: 'openai_optimization',
        description: 'Optimize for OpenAI function calling',
        condition: (tokens: number, provider: AIProvider) => provider === 'openai',
        action: 'structure_functions',
        priority: 90
      }
    ];
  }

  // Implementation of core methods continues...
  private async selectPromptLayers(request: PromptRequest): Promise<string[]> {
    const selectedLayers: string[] = [];

    // Always include core layers
    selectedLayers.push('identity', 'output_formatting', 'safety_constraints');

    // Include context awareness if comprehensive context is available
    if (this.hasRichContext(request.context)) {
      selectedLayers.push('context_awareness');
    }

    // Include sustainability expertise for domain-specific queries
    if (this.isSustainabilityQuery(request.intent)) {
      selectedLayers.push('sustainability_expertise');
    }

    // Include data access if user is requesting information or analysis
    if (this.requiresDataAccess(request.intent)) {
      selectedLayers.push('data_access');
    }

    // Include action capabilities if actions are available and relevant
    if (request.context.availableActions.length > 0) {
      selectedLayers.push('action_capabilities');
    }

    // Include communication style if user profile is available
    if (request.userProfile) {
      selectedLayers.push('communication_style');
    }

    return selectedLayers;
  }

  private async populatePromptLayers(layerIds: string[], request: PromptRequest): Promise<PromptLayer[]> {
    const populatedLayers: PromptLayer[] = [];

    for (const layerId of layerIds) {
      const template = this.layerLibrary.get(layerId);
      if (!template) continue;

      const populatedContent = await this.populateTemplate(template.template, request);

      populatedLayers.push({
        id: layerId,
        name: template.name,
        priority: template.priority,
        content: populatedContent,
        tokens: this.estimateTokens(populatedContent),
        purpose: template.purpose,
        conditionalLogic: template.conditionalLogic
      });
    }

    return populatedLayers.sort((a, b) => b.priority - a.priority);
  }

  private async optimizePromptLayers(layers: PromptLayer[], provider: AIProvider): Promise<PromptLayer[]> {
    let optimizedLayers = [...layers];
    const totalTokens = layers.reduce((sum, layer) => sum + layer.tokens, 0);

    // Apply optimization rules
    for (const rule of this.optimizationRules) {
      if (rule.condition(totalTokens, provider)) {
        optimizedLayers = await this.applyOptimizationRule(optimizedLayers, rule);
      }
    }

    return optimizedLayers;
  }

  private assemblePrompt(layers: PromptLayer[]): string {
    return layers
      .map(layer => layer.content)
      .join('\n\n---\n\n');
  }

  private async applyFinalOptimizations(
    prompt: string,
    provider: AIProvider
  ): Promise<{ optimizedPrompt: string; optimizationList: PromptOptimization[] }> {
    let optimizedPrompt = prompt;
    const optimizations: PromptOptimization[] = [];

    // Provider-specific optimizations
    if (provider === 'deepseek') {
      // Simplify language for better DeepSeek performance
      optimizedPrompt = this.simplifyLanguage(optimizedPrompt);
      optimizations.push({
        type: 'clarity_improvement',
        description: 'Simplified language for DeepSeek optimization',
        tokensSaved: 0,
        qualityImpact: 0.1
      });
    }

    if (provider === 'anthropic') {
      // Enhance reasoning context for Claude
      optimizedPrompt = this.enhanceReasoningContext(optimizedPrompt);
      optimizations.push({
        type: 'provider_specific',
        description: 'Enhanced reasoning context for Claude',
        tokensSaved: 0,
        qualityImpact: 0.2
      });
    }

    return { optimizedPrompt, optimizationList: optimizations };
  }

  // Helper methods
  private async populateTemplate(template: string, request: PromptRequest): Promise<string> {
    let populated = template;

    // Replace organization context
    populated = populated.replace(/{{organization\.name}}/g, request.organizationContext.name);
    populated = populated.replace(/{{organization\.industry}}/g, request.organizationContext.industry);
    populated = populated.replace(/{{organization\.size}}/g, request.organizationContext.size);

    // Replace current time
    populated = populated.replace(/{{current_time}}/g, new Date().toLocaleString());

    // Replace sustainability metrics
    if (request.context.sustainabilityMetrics) {
      const metrics = request.context.sustainabilityMetrics;
      populated = populated.replace(/{{emissions\.total}}/g, metrics.currentEmissions.total.toString());
      populated = populated.replace(/{{emissions\.scope1}}/g, metrics.currentEmissions.scope1.toString());
      populated = populated.replace(/{{emissions\.scope2}}/g, metrics.currentEmissions.scope2.toString());
      populated = populated.replace(/{{emissions\.scope3}}/g, metrics.currentEmissions.scope3.toString());
      populated = populated.replace(/{{emissions\.data_quality}}/g, metrics.currentEmissions.dataQuality);
    }

    // Replace user information
    if (request.userProfile) {
      populated = populated.replace(/{{user\.firstName}}/g, request.userProfile.firstName);
      populated = populated.replace(/{{user\.role}}/g, request.userProfile.role);
      populated = populated.replace(/{{user\.expertise}}/g, request.userProfile.expertise);
      populated = populated.replace(/{{user\.preferences\.communication_style}}/g, request.userProfile.preferences.communicationStyle);
      populated = populated.replace(/{{user\.preferences\.detail_level}}/g, request.userProfile.preferences.detailLevel);
      populated = populated.replace(/{{user\.preferences\.visualization_preference}}/g, request.userProfile.preferences.visualizationPreference);
    }

    // Handle conditional logic
    populated = this.processConditionalLogic(populated, request);

    return populated;
  }

  private processConditionalLogic(content: string, request: PromptRequest): string {
    // Simple conditional processing - would be more sophisticated in production
    let processed = content;

    // Remove conditional blocks if conditions aren't met
    const conditionalRegex = /{{#if ([^}]+)}}([\s\S]*?){{\/if}}/g;
    processed = processed.replace(conditionalRegex, (match, condition, content) => {
      if (this.evaluateCondition(condition, request)) {
        return content;
      }
      return '';
    });

    return processed;
  }

  private evaluateCondition(condition: string, request: PromptRequest): boolean {
    // Simple condition evaluation - would be more robust in production
    if (condition.includes('technical')) {
      return request.userProfile?.preferences.communicationStyle === 'technical';
    }
    if (condition.includes('business')) {
      return request.userProfile?.preferences.communicationStyle === 'business';
    }
    if (condition.includes('executive')) {
      return request.userProfile?.preferences.communicationStyle === 'executive';
    }
    if (condition.includes('simple')) {
      return request.userProfile?.preferences.communicationStyle === 'simple';
    }
    return false;
  }

  private hasRichContext(context: EnrichedContext): boolean {
    return !!(
      context.sustainabilityMetrics &&
      context.financialContext &&
      context.operationalData
    );
  }

  private isSustainabilityQuery(intent: ClassifiedIntent): boolean {
    const sustainabilityCategories = [
      'emissions_calculation',
      'compliance_reporting',
      'target_management',
      'energy_optimization'
    ];
    return sustainabilityCategories.includes(intent.category);
  }

  private requiresDataAccess(intent: ClassifiedIntent): boolean {
    return intent.responseMode === 'analytical' || intent.category.includes('data');
  }

  private async applyOptimizationRule(layers: PromptLayer[], rule: OptimizationRule): Promise<PromptLayer[]> {
    // Apply specific optimization based on rule action
    switch (rule.action) {
      case 'compress_context':
        return this.compressContextLayers(layers);
      case 'simplify_language':
        return this.simplifyLanguageLayers(layers);
      case 'enhance_context':
        return this.enhanceContextLayers(layers);
      case 'structure_functions':
        return this.structureFunctionLayers(layers);
      default:
        return layers;
    }
  }

  private compressContextLayers(layers: PromptLayer[]): PromptLayer[] {
    return layers.map(layer => {
      if (layer.purpose === 'context_awareness') {
        // Compress context by removing less critical information
        const compressed = layer.content
          .split('\n')
          .filter(line => !line.includes('•') || line.includes('Total') || line.includes('Risk'))
          .join('\n');

        return {
          ...layer,
          content: compressed,
          tokens: this.estimateTokens(compressed)
        };
      }
      return layer;
    });
  }

  private simplifyLanguageLayers(layers: PromptLayer[]): PromptLayer[] {
    return layers.map(layer => ({
      ...layer,
      content: this.simplifyLanguage(layer.content)
    }));
  }

  private enhanceContextLayers(layers: PromptLayer[]): PromptLayer[] {
    return layers.map(layer => {
      if (layer.purpose === 'context_awareness') {
        const enhanced = layer.content + '\n\nReasoning Framework: Consider multiple perspectives, analyze trade-offs, and provide structured recommendations.';
        return {
          ...layer,
          content: enhanced,
          tokens: this.estimateTokens(enhanced)
        };
      }
      return layer;
    });
  }

  private structureFunctionLayers(layers: PromptLayer[]): PromptLayer[] {
    return layers.map(layer => {
      if (layer.purpose === 'action_capabilities') {
        const structured = layer.content + '\n\nFunction Calling: Use structured function calls for data queries and action execution.';
        return {
          ...layer,
          content: structured,
          tokens: this.estimateTokens(structured)
        };
      }
      return layer;
    });
  }

  private simplifyLanguage(text: string): string {
    return text
      .replace(/utilize/g, 'use')
      .replace(/facilitate/g, 'help')
      .replace(/implement/g, 'do')
      .replace(/optimization/g, 'improvement')
      .replace(/sophisticated/g, 'advanced');
  }

  private enhanceReasoningContext(text: string): string {
    return text + '\n\nThinking Process: 1) Analyze the request, 2) Consider alternatives, 3) Evaluate trade-offs, 4) Recommend optimal solution.';
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  private calculateCompressionRatio(context: EnrichedContext, layers: PromptLayer[]): number {
    // Estimate how much context was compressed into the prompt
    const fullContextSize = JSON.stringify(context).length;
    const promptContextSize = layers
      .filter(l => l.purpose === 'context_awareness')
      .reduce((sum, l) => sum + l.content.length, 0);

    return promptContextSize / fullContextSize;
  }
}

// Supporting interfaces
interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  requiredContext: string[];
  estimatedTokens: number;
}

interface PromptLayerTemplate {
  id: string;
  name: string;
  purpose: LayerPurpose;
  priority: number;
  template: string;
  conditionalLogic?: string;
  estimatedTokens: number;
}

interface OptimizationRule {
  id: string;
  description: string;
  condition: (tokens: number, provider: AIProvider) => boolean;
  action: 'compress_context' | 'simplify_language' | 'enhance_context' | 'structure_functions';
  priority: number;
}

// Export singleton
export const masterPromptSystem = new MasterPromptSystem();