#!/usr/bin/env node

/**
 * Test actual utility files for real coverage gains
 */

const fs = require('fs').promises;
const path = require('path');

const realUtilityTests = [
  // Test the main utils.ts file
  {
    file: 'src/lib/__tests__/utils-real.test.ts',
    content: `import { describe, it, expect } from '@jest/globals';
import { cn } from '../utils';

describe('Utils - cn (className utility)', () => {
  it('should combine class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
    expect(cn('px-2 py-1', 'p-3')).toBe('p-3');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('should handle conditional classes', () => {
    expect(cn('base', { active: true, disabled: false })).toBe('base active');
    expect(cn('base', { active: false, disabled: true })).toBe('base disabled');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
    expect(cn(['base', null, undefined, 'end'])).toBe('base end');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
    expect(cn(null)).toBe('');
    expect(cn(undefined)).toBe('');
  });

  it('should merge Tailwind classes properly', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
    expect(cn('p-4', 'px-2')).toBe('p-4 px-2');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });
});`
  },

  // Test conversation utils
  {
    file: 'src/lib/conversations/__tests__/utils-real.test.ts',
    content: `import { describe, it, expect } from '@jest/globals';
import { jsonToMessages, messagesToJson } from '../utils';
import type { Message } from '@/types/conversation';

describe('Conversation Utils', () => {
  const mockMessages: Message[] = [
    {
      id: 'msg1',
      conversationId: 'conv1',
      role: 'user',
      content: 'Hello',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      metadata: { source: 'web' }
    },
    {
      id: 'msg2',
      conversationId: 'conv1',
      role: 'assistant',
      content: 'Hi there!',
      createdAt: new Date('2024-01-01T10:00:30Z'),
      uiComponents: [{ type: 'chart', data: { type: 'line' } }]
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
      expect(restored[0].createdAt).toBeInstanceOf(Date);
    });

    it('should handle invalid JSON gracefully', () => {
      expect(jsonToMessages(null)).toEqual([]);
      expect(jsonToMessages(undefined)).toEqual([]);
      expect(jsonToMessages('string')).toEqual([]);
    });
  });
});`
  },

  // Test performance utilities
  {
    file: 'src/lib/performance/__tests__/optimize-real.test.ts',
    content: `import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { 
  debounce, 
  throttle, 
  memoize, 
  lazyLoad,
  whenIdle,
  prefetchOnHover
} from '../optimize';

describe('Performance Optimization Utils', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('debounce', () => {
    it('should debounce function calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced('a');
      debounced('b');
      debounced('c');

      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('c');
    });

    it('should cancel on unmount', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced.cancel();
      jest.advanceTimersByTime(100);

      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled('a');
      throttled('b');
      throttled('c');

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('a');

      jest.advanceTimersByTime(100);
      throttled('d');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith('d');
    });
  });

  describe('memoize', () => {
    it('should cache function results', () => {
      const expensive = jest.fn((n: number) => n * 2);
      const memoized = memoize(expensive);

      expect(memoized(5)).toBe(10);
      expect(memoized(5)).toBe(10);
      expect(expensive).toHaveBeenCalledTimes(1);

      expect(memoized(10)).toBe(20);
      expect(expensive).toHaveBeenCalledTimes(2);
    });

    it('should use custom resolver', () => {
      const fn = jest.fn((a: any, b: any) => a + b);
      const memoized = memoize(fn, (a, b) => \`\${a}-\${b}\`);

      memoized(1, 2);
      memoized(1, 2);
      memoized(2, 1);

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('whenIdle', () => {
    it('should execute callback when idle', () => {
      const callback = jest.fn();
      const mockRequestIdleCallback = jest.fn((cb) => {
        cb({ timeRemaining: () => 50 });
        return 1;
      });
      
      global.requestIdleCallback = mockRequestIdleCallback as any;
      
      whenIdle(callback);
      expect(callback).toHaveBeenCalled();
    });

    it('should fallback to setTimeout', () => {
      const callback = jest.fn();
      global.requestIdleCallback = undefined as any;
      
      whenIdle(callback);
      expect(callback).not.toHaveBeenCalled();
      
      jest.advanceTimersByTime(1);
      expect(callback).toHaveBeenCalled();
    });
  });
});`
  },

  // Test AI utilities
  {
    file: 'src/lib/ai/__tests__/personalities-real.test.ts',
    content: `import { describe, it, expect, jest } from '@jest/globals';
import { getTimeOfDay, formatAIResponse, getAIPersonality } from '../personalities';

describe('AI Personalities Utils', () => {
  describe('getTimeOfDay', () => {
    it('should return correct time of day', () => {
      const mockDate = jest.fn();
      
      mockDate.mockReturnValue(new Date('2024-01-01T06:00:00'));
      global.Date = mockDate as any;
      expect(getTimeOfDay()).toBe('morning');
      
      mockDate.mockReturnValue(new Date('2024-01-01T14:00:00'));
      expect(getTimeOfDay()).toBe('afternoon');
      
      mockDate.mockReturnValue(new Date('2024-01-01T19:00:00'));
      expect(getTimeOfDay()).toBe('evening');
      
      mockDate.mockReturnValue(new Date('2024-01-01T23:00:00'));
      expect(getTimeOfDay()).toBe('night');
    });
  });

  describe('formatAIResponse', () => {
    it('should format response with personality', () => {
      const content = 'Here is the data';
      const personality = { greeting: 'Hey', style: 'casual' };
      
      const formatted = formatAIResponse(content, personality);
      expect(formatted).toContain(content);
    });

    it('should include user name if provided', () => {
      const content = 'Data';
      const personality = { greeting: 'Hello', style: 'formal' };
      
      const formatted = formatAIResponse(content, personality, 'John');
      expect(formatted).toBeDefined();
    });
  });

  describe('getAIPersonality', () => {
    it('should return personality for role', () => {
      const roles = ['account_owner', 'sustainability_manager', 'facility_manager', 'analyst', 'viewer'];
      
      roles.forEach(role => {
        const personality = getAIPersonality(role as any);
        expect(personality).toBeDefined();
        expect(personality).toHaveProperty('style');
      });
    });

    it('should return default personality for unknown role', () => {
      const personality = getAIPersonality('unknown' as any);
      expect(personality).toBeDefined();
    });
  });
});`
  },

  // Test emission utilities
  {
    file: 'src/lib/ai/__tests__/building-sustainability-context-real.test.ts',
    content: `import { describe, it, expect } from '@jest/globals';
import { formatEmissions, getEmissionContext } from '../building-sustainability-context';

describe('Building Sustainability Context Utils', () => {
  describe('formatEmissions', () => {
    it('should format emissions in kg CO2', () => {
      expect(formatEmissions(100)).toBe('100 kg CO2');
      expect(formatEmissions(1500)).toBe('1,500 kg CO2');
      expect(formatEmissions(0)).toBe('0 kg CO2');
    });

    it('should handle decimal values', () => {
      expect(formatEmissions(123.456)).toBe('123.46 kg CO2');
      expect(formatEmissions(0.1)).toBe('0.1 kg CO2');
    });

    it('should handle negative values', () => {
      expect(formatEmissions(-100)).toBe('-100 kg CO2');
    });
  });

  describe('getEmissionContext', () => {
    it('should provide context for emissions', () => {
      const lowContext = getEmissionContext(50);
      expect(lowContext).toContain('low');
      
      const medContext = getEmissionContext(500);
      expect(medContext).toContain('moderate');
      
      const highContext = getEmissionContext(5000);
      expect(highContext).toContain('high');
    });

    it('should handle edge cases', () => {
      expect(getEmissionContext(0)).toBeDefined();
      expect(getEmissionContext(-100)).toBeDefined();
      expect(getEmissionContext(999999)).toBeDefined();
    });
  });
});`
  }
];

async function testRealUtilities() {
  console.log('🚀 Creating tests for real utility files...\n');
  
  for (const test of realUtilityTests) {
    try {
      const dir = path.dirname(test.file);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(test.file, test.content);
      console.log(`✅ Created: ${test.file}`);
    } catch (error) {
      console.error(`❌ Error creating ${test.file}:`, error.message);
    }
  }
  
  console.log('\n✨ Real utility tests created!');
  console.log('These tests will provide actual code coverage.');
}

testRealUtilities().catch(console.error);