/**
 * Structured Logging Utility
 * 
 * Provides consistent logging with automatic redaction of sensitive data
 * and structured JSON output for better monitoring and debugging.
 */

import pino from 'pino'

// Create base logger
const baseLogger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  
  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'token',
      'authorization',
      'cookie',
      'access_token',
      'refresh_token',
      'api_key',
      'secret',
      'private_key',
      '*.password',
      '*.token',
      '*.authorization',
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
    ],
    remove: true,
  },
  
  // Format for development
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  }),
  
  // Base fields
  base: {
    env: process.env.NODE_ENV || 'development',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
  },
  
  // Serializers for common objects
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      // Don't log sensitive headers
      headers: {
        'user-agent': req.headers?.['user-agent'],
        'content-type': req.headers?.['content-type'],
      },
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
})

/**
 * Main logger instance
 * Use this for all logging throughout the application
 */
export const logger = baseLogger

/**
 * Create a child logger with context
 * Useful for adding request ID, user ID, etc.
 */
export function createContextLogger(context: Record<string, any>) {
  return logger.child(context)
}

/**
 * Log levels:
 * - trace: Very detailed, usually only enabled during debugging
 * - debug: Detailed information for debugging
 * - info: General informational messages
 * - warn: Warning messages
 * - error: Error messages
 * - fatal: Fatal errors that cause application shutdown
 */

/**
 * Helper functions for common logging scenarios
 */

export const log = {
  /**
   * Log authentication events
   */
  auth: {
    signIn: (userId: string, method: 'email' | 'oauth') => {
      logger.info({ userId, method, event: 'auth.signin' }, 'User signed in')
    },
    signUp: (userId: string, email: string) => {
      logger.info({ userId, email, event: 'auth.signup' }, 'User signed up')
    },
    signOut: (userId: string) => {
      logger.info({ userId, event: 'auth.signout' }, 'User signed out')
    },
    passwordReset: (email: string) => {
      logger.info({ email, event: 'auth.password_reset' }, 'Password reset requested')
    },
    rateLimitHit: (ip: string, endpoint: string) => {
      logger.warn({ ip, endpoint, event: 'auth.rate_limit' }, 'Rate limit exceeded')
    },
  },

  /**
   * Log API requests
   */
  api: {
    request: (method: string, path: string, ip: string) => {
      logger.debug({ method, path, ip, event: 'api.request' }, 'API request')
    },
    response: (method: string, path: string, statusCode: number, duration: number) => {
      logger.info({ method, path, statusCode, duration, event: 'api.response' }, 'API response')
    },
    error: (method: string, path: string, error: Error) => {
      logger.error({ method, path, error, event: 'api.error' }, 'API error')
    },
  },

  /**
   * Log database operations
   */
  db: {
    query: (table: string, operation: string) => {
      logger.debug({ table, operation, event: 'db.query' }, 'Database query')
    },
    error: (table: string, operation: string, error: Error) => {
      logger.error({ table, operation, error, event: 'db.error' }, 'Database error')
    },
  },

  /**
   * Log email operations
   */
  email: {
    sent: (to: string, subject: string) => {
      logger.info({ to, subject, event: 'email.sent' }, 'Email sent')
    },
    error: (to: string, subject: string, error: Error) => {
      logger.error({ to, subject, error, event: 'email.error' }, 'Email error')
    },
  },

  /**
   * Log business events
   */
  business: {
    newsletterSubscribe: (email: string) => {
      logger.info({ email, event: 'business.newsletter_subscribe' }, 'Newsletter subscription')
    },
    contactForm: (email: string, subject: string) => {
      logger.info({ email, subject, event: 'business.contact_form' }, 'Contact form submitted')
    },
    supportTicket: (email: string, priority: string, category: string) => {
      logger.info({ email, priority, category, event: 'business.support_ticket' }, 'Support ticket created')
    },
  },

  /**
   * Log security events
   */
  security: {
    csrfMismatch: (ip: string, path: string) => {
      logger.warn({ ip, path, event: 'security.csrf_mismatch' }, 'CSRF token mismatch')
    },
    invalidInput: (field: string, value: string, reason: string) => {
      logger.warn({ field, value, reason, event: 'security.invalid_input' }, 'Invalid input detected')
    },
    suspiciousActivity: (ip: string, description: string) => {
      logger.warn({ ip, description, event: 'security.suspicious' }, 'Suspicious activity detected')
    },
  },
}

/**
 * Performance timing helper
 * Usage:
 * const timer = startTimer()
 * // ... do work
 * logger.info({ duration: timer() }, 'Operation completed')
 */
export function startTimer(): () => number {
  const start = Date.now()
  return () => Date.now() - start
}

/**
 * Log middleware errors with context
 */
export function logMiddlewareError(error: Error, context: Record<string, any>) {
  logger.error({
    error,
    ...context,
    event: 'middleware.error',
  }, 'Middleware error')
}

/**
 * Log Server Action errors
 */
export function logServerActionError(
  action: string,
  error: Error,
  context?: Record<string, any>
) {
  logger.error({
    action,
    error,
    ...context,
    event: 'server_action.error',
  }, `Server Action error: ${action}`)
}
