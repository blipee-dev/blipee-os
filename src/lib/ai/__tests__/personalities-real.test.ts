import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { getTimeOfDay, formatAIResponse, getAIPersonality } from '../personalities';
import { UserRole } from '@/types/auth';

describe('AI Personalities Utils', () => {
  let originalDate: any;

  beforeEach(() => {
    originalDate = global.Date;
  });

  afterEach(() => {
    global.Date = originalDate;
  });

  describe('getTimeOfDay', () => {
    it('should return morning for morning hours', () => {
      const mockDate = new originalDate('2024-01-01T08:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      expect(getTimeOfDay()).toBe('morning');
    });

    it('should return afternoon for afternoon hours', () => {
      const mockDate = new originalDate('2024-01-01T14:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      expect(getTimeOfDay()).toBe('afternoon');
    });

    it('should return evening for evening hours', () => {
      const mockDate = new originalDate('2024-01-01T19:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      expect(getTimeOfDay()).toBe('evening');
    });

    it('should return night for night hours', () => {
      const mockDate = new originalDate('2024-01-01T23:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      expect(getTimeOfDay()).toBe('night');
    });
  });

  describe('formatAIResponse', () => {
    it('should format response with personality and context', () => {
      const content = 'Here is the data';
      const personality = {
        role: UserRole.ANALYST,
        tone: 'professional' as const,
        detailLevel: 'detailed' as const,
        proactivity: 'medium' as const,
        expertiseLevel: 'intermediate' as const,
        communication: {
          greeting: 'Hello {{name}}',
          acknowledgment: 'Got it',
          clarification: 'Please clarify',
          errorHandling: 'Error occurred'
        },
        focus: ['analytics'],
        vocabulary: {
          preferred: ['data', 'analysis'],
          avoid: ['jargon']
        }
      };
      
      const formatted = formatAIResponse(content, personality, { name: 'John' });
      expect(formatted).toBe(content); // Since the function just returns content after processing
    });

    it('should handle missing context', () => {
      const content = 'Test content';
      const personality = {
        role: UserRole.VIEWER,
        tone: 'friendly' as const,
        detailLevel: 'concise' as const,
        proactivity: 'low' as const,
        expertiseLevel: 'beginner' as const,
        communication: {
          greeting: 'Hi',
          acknowledgment: 'OK',
          clarification: 'What?',
          errorHandling: 'Oops'
        },
        focus: [],
        vocabulary: {
          preferred: [],
          avoid: []
        }
      };
      
      const formatted = formatAIResponse(content, personality);
      expect(formatted).toBe(content);
    });
  });

  describe('getAIPersonality', () => {
    it('should return personality for each role', () => {
      const roles = [
        UserRole.SUBSCRIPTION_OWNER,
        UserRole.ACCOUNT_OWNER,
        UserRole.SUSTAINABILITY_MANAGER,
        UserRole.FACILITY_MANAGER,
        UserRole.ANALYST,
        UserRole.VIEWER
      ];
      
      roles.forEach(role => {
        const personality = getAIPersonality(role);
        expect(personality).toBeDefined();
        expect(personality.role).toBe(role);
        expect(personality).toHaveProperty('tone');
        expect(personality).toHaveProperty('communication');
        expect(personality).toHaveProperty('vocabulary');
      });
    });
  });
});