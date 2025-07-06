export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  components?: UIComponent[]
  timestamp: Date
}

export interface UIComponent {
  type: 'chart' | 'control' | '3d-view' | 'report' | 'table'
  props: Record<string, any>
  layout?: {
    width?: string
    height?: string
    position?: 'inline' | 'modal' | 'sidebar'
  }
}

export interface ChatRequest {
  message: string
  conversationId?: string
  buildingId: string
  context?: {
    recentDeviceActivity?: any[]
    userPreferences?: any
    buildingState?: any
  }
}

export interface ChatResponse {
  message: string
  components?: UIComponent[]
  actions?: Action[]
  suggestions?: string[]
  metadata: {
    tokensUsed: number
    responseTime: number
    model: string
  }
}

export interface Action {
  type: string
  description: string
  data?: any
}