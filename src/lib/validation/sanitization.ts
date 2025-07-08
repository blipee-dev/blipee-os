import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitization configurations for different content types
 */
const SANITIZE_CONFIGS = {
  // Basic text - no HTML allowed
  text: {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  },
  
  // Simple formatting - basic text formatting only
  simple: {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 's', 'br'],
    ALLOWED_ATTR: [],
  },
  
  // Rich text - includes links and lists
  rich: {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'u', 's', 'br', 'p',
      'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  },
  
  // Markdown - for markdown rendered content
  markdown: {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'u', 's', 'br', 'p', 'div',
      'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'hr', 'span',
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'target', 'rel', 'class',
      'src', 'alt', 'width', 'height',
      'colspan', 'rowspan',
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  },
};

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(
  html: string,
  type: keyof typeof SANITIZE_CONFIGS = 'simple'
): string {
  const config = SANITIZE_CONFIGS[type];
  
  // Additional security: ensure target="_blank" links have rel="noopener noreferrer"
  const hooks = {
    afterSanitizeAttributes: (node: any) => {
      if ('target' in node && node.getAttribute('target') === '_blank') {
        node.setAttribute('rel', 'noopener noreferrer');
      }
    },
  };
  
  return DOMPurify.sanitize(html, {
    ...config,
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'], // Allow target attribute for links
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    ...hooks,
  });
}

/**
 * Sanitize plain text (removes all HTML)
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, SANITIZE_CONFIGS.text);
}

/**
 * Sanitize user input for display
 */
export function sanitizeUserInput(input: string): string {
  // First, sanitize as text to remove all HTML
  const sanitized = sanitizeText(input);
  
  // Then escape special characters for safe display
  return sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize JSON data by removing potential XSS vectors
 */
export function sanitizeJSON(data: any): any {
  if (typeof data === 'string') {
    return sanitizeText(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeJSON);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Sanitize both keys and values
      const sanitizedKey = sanitizeText(key);
      sanitized[sanitizedKey] = sanitizeJSON(value);
    }
    return sanitized;
  }
  
  return data;
}

/**
 * Sanitize file names to prevent path traversal attacks
 */
export function sanitizeFileName(fileName: string): string {
  // Remove any path separators
  let sanitized = fileName.replace(/[\/\\]/g, '_');
  
  // Remove special characters that could be problematic
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Remove multiple dots to prevent extension confusion
  sanitized = sanitized.replace(/\.{2,}/g, '.');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.substring(0, 250 - ext.length - 1);
    sanitized = `${name}.${ext}`;
  }
  
  return sanitized;
}

/**
 * Sanitize URLs to prevent javascript: and data: URLs
 */
export function sanitizeURL(url: string): string | null {
  try {
    const parsed = new URL(url);
    
    // Only allow http(s) and mailto protocols
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return null;
    }
    
    return url;
  } catch {
    // Invalid URL
    return null;
  }
}

/**
 * Create a content security policy nonce
 */
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Server-side fallback
    const crypto = require('crypto');
    crypto.randomFillSync(array);
  }
  
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
}