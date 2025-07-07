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
