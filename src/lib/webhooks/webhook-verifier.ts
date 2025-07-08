import crypto from 'crypto';
import { WebhookEventType, WebhookPayload } from '@/types/webhooks';

export class WebhookVerifier {
  
  /**
   * Verify webhook signature using HMAC-SHA256
   */
  static verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload, 'utf8')
        .digest('hex');
      
      // Support both formats: "sha256=<signature>" and "<signature>"
      const cleanSignature = signature.replace(/^sha256=/, '');
      
      return crypto.timingSafeEqual(
        Buffer.from(cleanSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Generate webhook signature for payload
   */
  static generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('hex');
  }

  /**
   * Validate webhook payload structure
   */
  static validatePayload(payload: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!payload || typeof payload !== 'object') {
      errors.push('Payload must be a valid object');
      return { valid: false, errors };
    }

    // Check required fields
    const requiredFields = ['id', 'type', 'timestamp', 'api_version', 'organization_id'];
    for (const field of requiredFields) {
      if (!payload[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate event type
    if (payload.type && !Object.values(WebhookEventType).includes(payload.type)) {
      errors.push(`Invalid event type: ${payload.type}`);
    }

    // Validate timestamp
    if (payload.timestamp && isNaN(Date.parse(payload.timestamp))) {
      errors.push('Invalid timestamp format');
    }

    // Validate API version
    if (payload.api_version && typeof payload.api_version !== 'string') {
      errors.push('API version must be a string');
    }

    // Validate organization ID
    if (payload.organization_id && typeof payload.organization_id !== 'string') {
      errors.push('Organization ID must be a string');
    }

    // Validate actor if present
    if (payload.actor) {
      if (typeof payload.actor !== 'object') {
        errors.push('Actor must be an object');
      } else {
        if (!payload.actor.type || !['user', 'system', 'api_key'].includes(payload.actor.type)) {
          errors.push('Actor type must be one of: user, system, api_key');
        }
        if (!payload.actor.id || typeof payload.actor.id !== 'string') {
          errors.push('Actor ID must be a non-empty string');
        }
      }
    }

    // Validate data field
    if (!payload.data || typeof payload.data !== 'object') {
      errors.push('Data field must be an object');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate webhook URL
   */
  static validateWebhookUrl(url: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!url || typeof url !== 'string') {
      errors.push('URL must be a non-empty string');
      return { valid: false, errors };
    }

    try {
      const urlObj = new URL(url);
      
      // Must be HTTP or HTTPS
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('URL must use HTTP or HTTPS protocol');
      }

      // Recommend HTTPS for production
      if (urlObj.protocol === 'http:' && process.env.NODE_ENV === 'production') {
        errors.push('HTTPS is recommended for production webhooks');
      }

      // Check for localhost/private IPs in production
      if (process.env.NODE_ENV === 'production') {
        const hostname = urlObj.hostname;
        if (
          hostname === 'localhost' ||
          hostname.startsWith('127.') ||
          hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)
        ) {
          errors.push('Private/local URLs are not allowed in production');
        }
      }

      // Check for reasonable port numbers
      if (urlObj.port && (parseInt(urlObj.port) < 1 || parseInt(urlObj.port) > 65535)) {
        errors.push('Invalid port number');
      }

    } catch (error) {
      errors.push('Invalid URL format');
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate webhook event types
   */
  static validateEventTypes(events: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!Array.isArray(events)) {
      errors.push('Events must be an array');
      return { valid: false, errors };
    }

    if (events.length === 0) {
      errors.push('At least one event type must be selected');
      return { valid: false, errors };
    }

    const validEvents = Object.values(WebhookEventType);
    const invalidEvents = events.filter(event => !validEvents.includes(event as WebhookEventType));
    
    if (invalidEvents.length > 0) {
      errors.push(`Invalid event types: ${invalidEvents.join(', ')}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate webhook headers
   */
  static validateHeaders(headers: Record<string, string>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (headers && typeof headers !== 'object') {
      errors.push('Headers must be an object');
      return { valid: false, errors };
    }

    if (!headers) {
      return { valid: true, errors: [] };
    }

    const forbiddenHeaders = [
      'content-type',
      'x-blipee-signature',
      'x-blipee-event',
      'x-blipee-delivery',
      'user-agent',
      'content-length',
      'host',
    ];

    for (const [key, value] of Object.entries(headers)) {
      if (forbiddenHeaders.includes(key.toLowerCase())) {
        errors.push(`Header "${key}" is reserved and cannot be set`);
      }
      
      if (typeof value !== 'string') {
        errors.push(`Header "${key}" value must be a string`);
      }
      
      if (key.length > 100) {
        errors.push(`Header name "${key}" is too long (max 100 characters)`);
      }
      
      if (value.length > 1000) {
        errors.push(`Header "${key}" value is too long (max 1000 characters)`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Sanitize webhook payload for logging
   */
  static sanitizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    const sanitized = { ...payload };
    
    // Remove or mask sensitive fields
    const sensitiveFields = ['password', 'token', 'key', 'secret', 'private'];
    
    function sanitizeObject(obj: any): any {
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (obj && typeof obj === 'object') {
        const sanitizedObj: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            sanitizedObj[key] = '[REDACTED]';
          } else {
            sanitizedObj[key] = sanitizeObject(value);
          }
        }
        return sanitizedObj;
      }
      
      return obj;
    }
    
    return sanitizeObject(sanitized);
  }

  /**
   * Check if timestamp is within acceptable range
   */
  static validateTimestamp(timestamp: string, toleranceMs: number = 300000): boolean {
    try {
      const eventTime = new Date(timestamp).getTime();
      const currentTime = Date.now();
      const timeDiff = Math.abs(currentTime - eventTime);
      
      return timeDiff <= toleranceMs;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a webhook test payload
   */
  static generateTestPayload(
    organizationId: string,
    eventType: WebhookEventType = WebhookEventType.SYSTEM_HEALTH_CHECK
  ): any {
    return {
      id: crypto.randomUUID(),
      type: eventType,
      timestamp: new Date().toISOString(),
      api_version: '1.0',
      organization_id: organizationId,
      actor: {
        type: 'system',
        id: 'webhook-test',
        name: 'Webhook Test System',
      },
      data: {
        test: {
          message: 'This is a test webhook payload',
          timestamp: new Date().toISOString(),
          version: '1.0',
        },
      },
    };
  }

  /**
   * Mask sensitive data in webhook URLs for logging
   */
  static maskUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Mask password in URL
      if (urlObj.password) {
        urlObj.password = '[REDACTED]';
      }
      
      // Mask query parameters that might contain sensitive data
      const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
      urlObj.searchParams.forEach((value, key) => {
        if (sensitiveParams.some(param => key.toLowerCase().includes(param))) {
          urlObj.searchParams.set(key, '[REDACTED]');
        }
      });
      
      return urlObj.toString();
    } catch (error) {
      return url;
    }
  }
}

export const webhookVerifier = WebhookVerifier;