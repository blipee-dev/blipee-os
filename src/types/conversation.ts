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
    | "quick-start-upload";
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
  metadata: {
    tokensUsed: number;
    responseTime: number;
    model: string;
    confidence?: number;
    predictions?: number;
    automations?: number;
  };
}

export interface Action {
  type: string;
  description: string;
  data?: any;
}
