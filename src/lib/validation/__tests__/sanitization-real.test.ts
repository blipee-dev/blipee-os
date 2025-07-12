import { describe, it, expect, jest } from '@jest/globals';
import {
  sanitizeHTML,
  sanitizeText,
  sanitizeUserInput,
  sanitizeJSON,
  sanitizeFileName,
  sanitizeURL
} from '../sanitization';

// Mock DOMPurify
jest.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: jest.fn((input, config) => {
      // Simple mock sanitization
      if (typeof input !== 'string') return '';
      
      // Remove script tags
      let cleaned = input.replace(/<script[^>]*>.*?<\/script>/gi, '');
      
      // If ALLOWED_TAGS is specified, simulate tag filtering
      if (config?.ALLOWED_TAGS) {
        const allowedTags = config.ALLOWED_TAGS.join('|');
        const regex = new RegExp(`<(?!\\/?(\${allowedTags})\\\\b)[^>]+>`, 'gi');
        cleaned = cleaned.replace(regex, '');
      }
      
      return cleaned;
    })
  }
}));

describe('Sanitization Utils', () => {
  describe('sanitizeHTML', () => {
    it('should sanitize HTML with default config', () => {
      const dirty = '<p>Hello</p><script>alert("xss")</script>';
      const clean = sanitizeHTML(dirty);
      expect(clean).toBe('<p>Hello</p>');
      expect(clean).not.toContain('<script>');
    });

    it('should apply custom config', () => {
      const dirty = '<p>Text</p><div>More</div><script>bad</script>';
      const clean = sanitizeHTML(dirty, 'basic');
      expect(clean).not.toContain('<script>');
    });

    it('should handle empty input', () => {
      expect(sanitizeHTML('')).toBe('');
      expect(sanitizeHTML(null as any)).toBe('');
      expect(sanitizeHTML(undefined as any)).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('should remove all HTML from text', () => {
      const htmlText = '<p>Hello <b>world</b></p>';
      const clean = sanitizeText(htmlText);
      expect(clean).toBe('Hello world');
      expect(clean).not.toContain('<');
    });

    it('should handle plain text', () => {
      const plain = 'Just plain text';
      expect(sanitizeText(plain)).toBe(plain);
    });
  });

  describe('sanitizeUserInput', () => {
    it('should sanitize user input', () => {
      const input = '  Hello <script>alert("xss")</script> World  ';
      const clean = sanitizeUserInput(input);
      expect(clean).toBe('Hello  World');
      expect(clean).not.toContain('<script>');
    });

    it('should trim whitespace', () => {
      const input = '   trimmed   ';
      expect(sanitizeUserInput(input)).toBe('trimmed');
    });
  });

  describe('sanitizeJSON', () => {
    it('should sanitize JSON data recursively', () => {
      const data = {
        name: '<script>alert("xss")</script>John',
        nested: {
          value: 'Clean <b>text</b>'
        },
        array: ['<img onerror="alert(1)">', 'safe']
      };

      const clean = sanitizeJSON(data);
      expect(clean.name).not.toContain('<script>');
      expect(clean.nested.value).toBe('Clean text');
      expect(clean.array[0]).not.toContain('onerror');
    });

    it('should handle primitive values', () => {
      expect(sanitizeJSON('string')).toBe('string');
      expect(sanitizeJSON(123)).toBe(123);
      expect(sanitizeJSON(true)).toBe(true);
      expect(sanitizeJSON(null)).toBe(null);
    });
  });

  describe('sanitizeFileName', () => {
    it('should sanitize file names', () => {
      expect(sanitizeFileName('file<script>.txt')).not.toContain('<script>');
      expect(sanitizeFileName('../../etc/passwd')).not.toContain('..');
      expect(sanitizeFileName('file name.txt')).toBe('file_name.txt');
    });

    it('should preserve extensions', () => {
      expect(sanitizeFileName('document.pdf')).toContain('.pdf');
      expect(sanitizeFileName('image.jpg')).toContain('.jpg');
    });

    it('should handle special characters', () => {
      const special = 'file*?<>|:name.txt';
      const clean = sanitizeFileName(special);
      expect(clean).not.toMatch(/[*?<>|:]/);
    });
  });

  describe('sanitizeURL', () => {
    it('should sanitize URLs', () => {
      expect(sanitizeURL('https://example.com')).toBe('https://example.com');
      expect(sanitizeURL('javascript:alert(1)')).toBe('');
      expect(sanitizeURL('data:text/html,<script>alert(1)</script>')).toBe('');
    });

    it('should allow safe protocols', () => {
      expect(sanitizeURL('http://example.com')).toBe('http://example.com');
      expect(sanitizeURL('https://example.com')).toBe('https://example.com');
      expect(sanitizeURL('mailto:user@example.com')).toBe('mailto:user@example.com');
    });

    it('should handle invalid URLs', () => {
      expect(sanitizeURL('not a url')).toBe('');
      expect(sanitizeURL('')).toBe('');
    });
  });
});