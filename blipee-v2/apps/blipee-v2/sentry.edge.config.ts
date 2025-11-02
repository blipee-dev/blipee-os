/**
 * Sentry Edge Configuration
 *
 * This file configures Sentry for the Edge runtime (middleware, edge functions).
 * Edge runtime has limited capabilities compared to Node.js.
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  // Your Sentry DSN from https://sentry.io/
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking (optional, useful for source maps)
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',

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

    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLED) {
      return null
    }

    return event
  },
})
