import type { 
  AIProvider, 
  AIMessage, 
  AIResponse,
  AIStreamResponse,
  AIContext,
  AIAction
} from '../types';

describe('AI types', () => {
  it('should create valid AIMessage objects', () => {
    const message: AIMessage = {
      role: 'user',
      content: 'What is the energy usage today?',
      timestamp: new Date().toISOString()
    };
    expect(message.role).toBe('user');
    expect(message.content).toBeTruthy();
  });

  it('should create valid AIResponse objects', () => {
    const response: AIResponse = {
      content: 'The energy usage today is 250 kWh',
      actions: [],
      metadata: {
        provider: 'deepseek',
        model: 'deepseek-chat',
        tokens: 150
      }
    };
    expect(response.content).toBeTruthy();
    expect(response.metadata?.provider).toBe('deepseek');
  });

  it('should create valid AIStreamResponse objects', () => {
    const streamResponse: AIStreamResponse = {
      stream: true,
      chunks: ['The energy', ' usage today', ' is 250 kWh'],
      complete: false
    };
    expect(streamResponse.stream).toBe(true);
    expect(streamResponse.chunks).toHaveLength(3);
  });

  it('should create valid AIContext objects', () => {
    const context: AIContext = {
      conversationId: 'conv-123',
      buildingId: 'building-456',
      userId: 'user-789',
      history: [],
      metadata: {
        timezone: 'UTC',
        units: 'metric'
      }
    };
    expect(context.conversationId).toBe('conv-123');
    expect(context.metadata?.units).toBe('metric');
  });

  it('should create valid AIAction objects', () => {
    const action: AIAction = {
      type: 'create_chart',
      parameters: {
        chartType: 'line',
        data: [],
        title: 'Energy Usage Trend'
      }
    };
    expect(action.type).toBe('create_chart');
    expect(action.parameters.chartType).toBe('line');
  });

  it('should handle provider types', () => {
    const providers: AIProvider[] = ['openai', 'deepseek', 'anthropic'];
    providers.forEach(provider => {
      expect(provider).toBeTruthy();
    });
  });
});