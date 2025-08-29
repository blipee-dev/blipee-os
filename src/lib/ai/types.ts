export interface AIProvider {
  name: string;
  complete(
    prompt: string,
    options?: CompletionOptions,
  ): Promise<CompletionResponse>;
  stream(
    prompt: string,
    options?: StreamOptions,
  ): AsyncGenerator<StreamToken, void, unknown>;
}

export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  jsonMode?: boolean;
  structuredOutput?: boolean;
  responseSchema?: ResponseSchema;
  chainOfThought?: boolean;
  allowSimilarCache?: boolean;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  timeout?: number;
}

export interface ResponseSchema {
  type: "object";
  properties: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface SchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  minimum?: number;
  maximum?: number;
  required?: string[];
}

export interface StreamOptions extends CompletionOptions {
  onToken?: (token: string) => void;
}

export interface CompletionResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
}

export interface StreamToken {
  content: string;
  isComplete: boolean;
}

// Structured AI Response Types
export interface StructuredAIResponse {
  message: string;
  reasoning?: string[]; // Chain of thought steps
  metrics?: SustainabilityMetrics;
  actions?: RecommendedAction[];
  visualizations?: VisualizationComponent[];
  alerts?: Alert[];
  confidence?: number; // 0-1 confidence score
}

export interface SustainabilityMetrics {
  energy_usage?: number; // kW
  carbon_emissions?: number; // kg CO2
  cost_impact?: number; // USD
  efficiency_score?: number; // 0-100
  scope1_emissions?: number; // kg CO2
  scope2_emissions?: number; // kg CO2
  scope3_emissions?: number; // kg CO2
  renewable_percentage?: number; // 0-100
}

export interface RecommendedAction {
  id: string;
  type: "immediate" | "scheduled" | "planned";
  description: string;
  impact: {
    energy_savings?: number; // kW
    cost_savings?: number; // USD
    carbon_reduction?: number; // kg CO2
    effort_level: "low" | "medium" | "high";
  };
  timeline?: string; // "5 minutes", "1 hour", "next week"
  confidence: number; // 0-1
  prerequisites?: string[];
}

export interface VisualizationComponent {
  type: "chart" | "gauge" | "map" | "timeline" | "comparison";
  title: string;
  data: Record<string, any>;
  layout?: {
    width?: string;
    height?: string;
    position?: "inline" | "sidebar" | "modal";
  };
  config?: Record<string, any>;
}

export interface Alert {
  id: string;
  type: "info" | "warning" | "error" | "success";
  title: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  source?: string; // "hvac", "lighting", "security", etc.
  action_required?: boolean;
  suggested_action?: string;
}

export interface BuildingContext {
  id: string;
  name: string;
  currentState: {
    energyUsage: number; // watts
    temperature: number; // celsius
    humidity: number; // percentage
    occupancy: number; // people count
  };
  devices: {
    online: number;
    offline: number;
    alerts: number;
  };
  metadata: {
    size: number; // square feet
    type: string;
    location: string;
  };
}
