/**
 * Sentry Server Configuration
 *
 * This file configures Sentry for the server-side (Node.js runtime).
 * It captures server errors, API route errors, and Server Action errors.
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  // Your Sentry DSN from https://sentry.io/
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking (optional, useful for source maps)
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',

  // Ignore certain errors
  ignoreErrors: [
    // Expected auth errors
    'Invalid login credentials',
    'Email not confirmed',
    'User already registered',
    // Rate limit errors (these are expected)
    'Too many requests',
    // NEXT_REDIRECT is not an error, it's how Next.js implements redirects
    'NEXT_REDIRECT',
  ],

  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove sensitive data from event
    if (event.request) {
      delete event.request.cookies
      if (event.request.headers) {
        delete event.request.headers.authorization
        delete event.request.headers.cookie
      }
    }

    // Remove password fields from extra data
    if (event.extra) {
      Object.keys(event.extra).forEach((key) => {
        if (key.toLowerCase().includes('password')) {
          delete event.extra![key]
        }
      })
    }

    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLED) {
      return null
    }

    return event
  },

  // Integration with structured logging
  integrations: [
    // Automatically capture console.error() calls
    Sentry.captureConsoleIntegration({
      levels: ['error'],
    }),
  ],
})
