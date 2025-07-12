import { describe, it, expect } from '@jest/globals';
import { jsonToMessages, messagesToJson } from '../utils';
import type { Message } from '@/types/conversation';

describe('Conversation Utils', () => {
  const mockMessages: Message[] = [
    {
      id: 'msg1',
      role: 'user',
      content: 'Hello',
      timestamp: new Date('2024-01-01T10:00:00Z')
    },
    {
      id: 'msg2',
      role: 'assistant',
      content: 'Hi there!',
      timestamp: new Date('2024-01-01T10:00:30Z'),
      components: [{ type: 'chart', props: { type: 'line' } }]
    }
  ];

  describe('messagesToJson', () => {
    it('should convert messages to JSON', () => {
      const json = messagesToJson(mockMessages);
      expect(Array.isArray(json)).toBe(true);
      expect(json).toHaveLength(2);
    });

    it('should preserve message properties', () => {
      const json = messagesToJson(mockMessages) as any[];
      expect(json[0].id).toBe('msg1');
      expect(json[0].content).toBe('Hello');
      expect(json[0].role).toBe('user');
    });

    it('should handle empty array', () => {
      const json = messagesToJson([]);
      expect(json).toEqual([]);
    });
  });

  describe('jsonToMessages', () => {
    it('should convert JSON to messages', () => {
      const json = messagesToJson(mockMessages);
      const restored = jsonToMessages(json);
      expect(restored).toHaveLength(2);
      expect(restored[0].id).toBe('msg1');
    });

    it('should convert date strings to Date objects', () => {
      const json = messagesToJson(mockMessages);
      const restored = jsonToMessages(json);
      expect(restored[0].timestamp).toBeInstanceOf(Date);
    });

    it('should handle invalid JSON gracefully', () => {
      expect(jsonToMessages(null)).toEqual([]);
      expect(jsonToMessages(undefined)).toEqual([]);
      expect(jsonToMessages('string')).toEqual([]);
    });
  });
});