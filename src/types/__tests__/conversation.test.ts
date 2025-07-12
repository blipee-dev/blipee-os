import type { Message, Conversation, UIComponent, ConversationMetadata } from '../conversation';

describe('Conversation types', () => {
  it('should create valid Message objects', () => {
    const message: Message = {
      id: '1',
      conversation_id: 'conv-1',
      role: 'user',
      content: 'Hello',
      created_at: new Date().toISOString(),
      metadata: {}
    };
    expect(message.id).toBe('1');
    expect(message.role).toBe('user');
  });

  it('should create valid Conversation objects', () => {
    const conversation: Conversation = {
      id: 'conv-1',
      user_id: 'user-1',
      organization_id: 'org-1',
      building_id: 'building-1',
      title: 'Test Conversation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {}
    };
    expect(conversation.id).toBe('conv-1');
    expect(conversation.title).toBe('Test Conversation');
  });

  it('should create valid UIComponent objects', () => {
    const component: UIComponent = {
      type: 'chart',
      data: { labels: [], datasets: [] },
      config: {}
    };
    expect(component.type).toBe('chart');
    expect(component.data).toBeDefined();
  });

  it('should handle ConversationMetadata', () => {
    const metadata: ConversationMetadata = {
      tags: ['test', 'demo'],
      priority: 'high',
      custom: { key: 'value' }
    };
    expect(metadata.tags).toHaveLength(2);
    expect(metadata.priority).toBe('high');
  });
});