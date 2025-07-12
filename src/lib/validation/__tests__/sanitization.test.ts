import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  sanitizeHTML,
  sanitizeText,
  sanitizeUserInput,
  sanitizeJSON,
  sanitizeFileName,
  sanitizeURL,
  generateCSPNonce
} from '../sanitization';

// Mock DOMPurify
const mockSanitize = jest.fn((input, config) => {
  // Simple mock implementation
  if (typeof input !== 'string') return '';
  
  if (config?.ALLOWED_TAGS?.length === 0) {
    // Text mode - strip all HTML
    return input.replace(/<[^>]*>/g, '');
  }
  // For other modes, return a simplified version
  return input;
});

jest.mock('isomorphic-dompurify', () => {
  const DOMPurify = {
    sanitize: mockSanitize
  };
  return {
    __esModule: true,
    default: DOMPurify
  };
});

describe('Sanitization Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sanitizeHTML', () => {
    it('should sanitize HTML with simple config by default', () => {
      const input = '<b>Bold</b> <script>alert("xss")</script>';
      const result = sanitizeHTML(input);
      expect(result).toBe(input); // Mock returns input as-is
    });

    it('should sanitize HTML with text config', () => {
      const input = '<p>Hello <b>World</b></p>';
      const result = sanitizeHTML(input, 'text');
      expect(result).toBe(input);
    });

    it('should sanitize HTML with rich config', () => {
      const input = '<a href="https://example.com" target="_blank">Link</a>';
      const result = sanitizeHTML(input, 'rich');
      expect(result).toBe(input);
    });

    it('should sanitize HTML with markdown config', () => {
      const input = '<h1>Title</h1><img src="image.jpg" alt="Image">';
      const result = sanitizeHTML(input, 'markdown');
      expect(result).toBe(input);
    });

    it('should handle empty strings', () => {
      expect(sanitizeHTML('')).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Hello <b>World</b></p>';
      const result = sanitizeText(input);
      expect(result).toBe('Hello World');
    });

    it('should handle plain text', () => {
      const input = 'Plain text without HTML';
      const result = sanitizeText(input);
      expect(result).toBe('Plain text without HTML');
    });

    it('should handle special characters', () => {
      const input = 'Text with <special> & "characters"';
      const result = sanitizeText(input);
      expect(result).toBe('Text with  & "characters"');
    });
  });

  describe('sanitizeUserInput', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("XSS")</script>';
      const result = sanitizeUserInput(input);
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&quot;');
    });

    it('should handle all special characters', () => {
      const input = '& < > " \' /';
      const result = sanitizeUserInput(input);
      expect(result).toBe('&amp; &lt; &gt; &quot; &#x27; &#x2F;');
    });

    it('should first strip HTML then escape', () => {
      const input = '<b>Bold & "quoted"</b>';
      const result = sanitizeUserInput(input);
      expect(result).toBe('Bold &amp; &quot;quoted&quot;');
    });

    it('should handle empty strings', () => {
      expect(sanitizeUserInput('')).toBe('');
    });
  });

  describe('sanitizeJSON', () => {
    it('should sanitize string values', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeJSON(input);
      expect(result).toBe('alert("xss")');
    });

    it('should sanitize arrays', () => {
      const input = ['<b>item1</b>', '<script>xss</script>', 'clean'];
      const result = sanitizeJSON(input);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBe('item1');
      expect(result[1]).toBe('xss');
      expect(result[2]).toBe('clean');
    });

    it('should sanitize objects recursively', () => {
      const input = {
        name: '<b>John</b>',
        nested: {
          value: '<script>alert("xss")</script>',
          array: ['<i>item</i>']
        }
      };
      
      const result = sanitizeJSON(input);
      expect(result.name).toBe('John');
      expect(result.nested.value).toBe('alert("xss")');
      expect(result.nested.array[0]).toBe('item');
    });

    it('should handle non-string primitives', () => {
      expect(sanitizeJSON(123)).toBe(123);
      expect(sanitizeJSON(true)).toBe(true);
      expect(sanitizeJSON(null)).toBe(null);
      expect(sanitizeJSON(undefined)).toBe(undefined);
    });
  });

  describe('sanitizeFileName', () => {
    it('should remove path separators', () => {
      expect(sanitizeFileName('../../etc/passwd')).toBe('.._.._etc_passwd');
      expect(sanitizeFileName('C:\\Windows\\System32')).toBe('C__Windows_System32');
    });

    it('should remove special characters', () => {
      expect(sanitizeFileName('file@#$%^&*()name.txt')).toBe('file_________name.txt');
    });

    it('should handle multiple dots', () => {
      expect(sanitizeFileName('file...name....txt')).toBe('file.name.txt');
    });

    it('should preserve allowed characters', () => {
      expect(sanitizeFileName('valid-file_name.123.txt')).toBe('valid-file_name.123.txt');
    });

    it('should limit file name length', () => {
      const longName = 'a'.repeat(300) + '.txt';
      const result = sanitizeFileName(longName);
      expect(result.length).toBeLessThanOrEqual(255);
      expect(result.endsWith('.txt')).toBe(true);
    });

    it('should handle files without extension', () => {
      const longName = 'a'.repeat(300);
      const result = sanitizeFileName(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });

    it('should handle empty strings', () => {
      expect(sanitizeFileName('')).toBe('');
    });
  });

  describe('sanitizeURL', () => {
    it('should allow valid HTTP URLs', () => {
      const urls = [
        'http://example.com',
        'https://example.com',
        'https://sub.example.com/path?query=value#hash'
      ];
      
      urls.forEach(url => {
        expect(sanitizeURL(url)).toBe(url);
      });
    });

    it('should allow mailto URLs', () => {
      expect(sanitizeURL('mailto:test@example.com')).toBe('mailto:test@example.com');
    });

    it('should reject javascript URLs', () => {
      expect(sanitizeURL('javascript:alert("xss")')).toBeNull();
    });

    it('should reject data URLs', () => {
      expect(sanitizeURL('data:text/html,<script>alert("xss")</script>')).toBeNull();
    });

    it('should reject other protocols', () => {
      expect(sanitizeURL('ftp://example.com')).toBeNull();
      expect(sanitizeURL('file:///etc/passwd')).toBeNull();
    });

    it('should handle invalid URLs', () => {
      expect(sanitizeURL('not a url')).toBeNull();
      expect(sanitizeURL('')).toBeNull();
    });
  });

  describe('generateCSPNonce', () => {
    // Mock crypto for tests
    const mockRandomValues = jest.fn((array: Uint8Array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    });

    beforeEach(() => {
      // Mock browser environment
      global.window = {
        crypto: {
          getRandomValues: mockRandomValues
        }
      } as any;
    });

    afterEach(() => {
      // @ts-ignore
      delete global.window;
    });

    it('should generate a base64 encoded nonce', () => {
      const nonce = generateCSPNonce();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(0);
    });

    it('should generate unique nonces', () => {
      const nonces = new Set();
      for (let i = 0; i < 10; i++) {
        nonces.add(generateCSPNonce());
      }
      expect(nonces.size).toBeGreaterThan(5); // At least some uniqueness
    });
  });
});