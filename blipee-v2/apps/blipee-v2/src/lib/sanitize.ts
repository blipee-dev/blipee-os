/**
 * Input Sanitization Utilities
 * 
 * Provides functions to sanitize user input and prevent XSS, SQL injection,
 * and other injection attacks.
 */

import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content
 * Removes dangerous tags and attributes while preserving safe formatting
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  })
}

/**
 * Sanitize plain text input
 * Strips all HTML tags and potentially dangerous characters
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Remove all HTML tags
  let sanitized = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })

  // Remove null bytes and other control characters
  sanitized = sanitized.replace(/\x00/g, '')
  
  // Trim whitespace
  return sanitized.trim()
}

/**
 * Sanitize email addresses
 * Validates format and removes dangerous characters
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return ''
  }

  // Remove whitespace and convert to lowercase
  let sanitized = email.trim().toLowerCase()
  
  // Remove any HTML/script tags
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
  
  // Basic validation pattern (more thorough validation should use Zod)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    return ''
  }
  
  return sanitized
}

/**
 * Sanitize URL/href attributes
 * Ensures URLs are safe and not javascript: or data: URIs
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') {
    return ''
  }

  const sanitized = url.trim()
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']
  const lowerUrl = sanitized.toLowerCase()
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return ''
    }
  }
  
  // Only allow http, https, mailto, tel
  if (!lowerUrl.match(/^(https?:\/\/|mailto:|tel:|\/)/)) {
    return ''
  }
  
  return sanitized
}

/**
 * Sanitize message/textarea content
 * Allows line breaks but removes dangerous content
 */
export function sanitizeMessage(message: string): string {
  if (!message || typeof message !== 'string') {
    return ''
  }

  // Remove HTML tags but preserve line breaks
  let sanitized = DOMPurify.sanitize(message, {
    ALLOWED_TAGS: ['br'],
    ALLOWED_ATTR: [],
  })
  
  // Convert <br> to \n for storage
  sanitized = sanitized.replace(/<br\s*\/?>/gi, '\n')
  
  // Remove excessive whitespace but preserve single line breaks
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n')
  
  return sanitized.trim()
}

/**
 * Sanitize filename
 * Removes path traversal and dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return ''
  }

  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '')
  
  // Remove path separators
  sanitized = sanitized.replace(/[\/\\]/g, '')
  
  // Remove null bytes
  sanitized = sanitized.replace(/\x00/g, '')
  
  // Only allow alphanumeric, dash, underscore, and period
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_')
  
  return sanitized
}

/**
 * Sanitize database input (additional layer beyond parameterized queries)
 * Removes SQL metacharacters that could be dangerous
 */
export function sanitizeDBInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Remove null bytes
  let sanitized = input.replace(/\x00/g, '')
  
  // Remove SQL comments
  sanitized = sanitized.replace(/--/g, '')
  sanitized = sanitized.replace(/\/\*/g, '')
  sanitized = sanitized.replace(/\*\//g, '')
  
  return sanitized.trim()
}

/**
 * Sanitize search query
 * Prevents search injection attacks
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query || typeof query !== 'string') {
    return ''
  }

  // Remove HTML
  let sanitized = DOMPurify.sanitize(query, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
  
  // Remove special regex characters that could cause ReDoS
  sanitized = sanitized.replace(/[.*+?^${}()|[\]\\]/g, '')
  
  // Limit length to prevent DoS
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100)
  }
  
  return sanitized.trim()
}

/**
 * Sanitize object recursively
 * Applies sanitization to all string properties
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  sanitizer: (value: string) => string = sanitizeText
): T {
  const sanitized = {} as T
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizer(value) as T[keyof T]
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map(item => 
        typeof item === 'string' ? sanitizer(item) : item
      ) as T[keyof T]
    } else if (value && typeof value === 'object') {
      sanitized[key as keyof T] = sanitizeObject(value, sanitizer) as T[keyof T]
    } else {
      sanitized[key as keyof T] = value
    }
  }
  
  return sanitized
}
