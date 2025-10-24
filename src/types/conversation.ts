export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  components?: UIComponent[];
  suggestions?: string[];
  timestamp: Date;
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url?: string;
  }>;
  artifact?: {
    type: "code" | "document" | "chart" | "table";
    title: string;
    language?: string;
    content: string;
  };
  // ✅ PHASE 3: Agent insights from autonomous AI agents
  agentInsights?: {
    available: boolean;
    agents: string[];
    insights: AgentInsight[];
  };
  // ✅ LLM-generated charts and insights
  charts?: Array<{
    type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
    title: string;
    data: any;
    insights?: string;
  }>;
  insights?: string[];
  recommendations?: string[];
}

export interface AgentInsight {
  agent: string;
  summary: string;
  actions: AgentAction[];
  nextSteps: string[];
  confidence: number;
}

export interface AgentAction {
  type: string;
  description: string;
  impact?: number;
}

export interface UIComponent {
  type:
    | "chart"
    | "control"
    | "3d-view"
    | "report"
    | "table"
    | "energy-dashboard"
    | "optimization-dashboard"
    | "action-panel"
    | "insights-panel"
    | "efficiency-controls"
    | "impact-projection"
    | "building-dashboard"
    | "dashboard"
    | "setup-checklist"
    | "quick-start-upload"
    | "materiality-matrix";
  props: Record<string, any>;
  layout?: {
    width?: string;
    height?: string;
    position?: "inline" | "modal" | "sidebar";
  };
  interactivity?: {
    clickable?: boolean;
    controls?: any[];
    realtime_updates?: boolean;
    animations?: any[];
  };
}

export interface ChatRequest {
  message: string;
  conversationId?: string;
  buildingId: string;
  context?: {
    recentDeviceActivity?: any[];
    userPreferences?: any;
    buildingState?: any;
  };
}

export interface ChatResponse {
  message: string;
  components?: UIComponent[];
  actions?: Action[];
  suggestions?: string[];
  reasoning?: string[]; // Chain-of-thought reasoning steps
  confidence?: number; // Overall confidence in response
  metadata?: {
    tokensUsed?: number;
    responseTime?: number;
    model?: string;
    confidence?: number;
    predictions?: number;
    automations?: number;
    reasoningEnabled?: boolean;
  };
}

export interface Action {
  type: string;
  description: string;
  data?: any;
}
