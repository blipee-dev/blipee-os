/**
 * Sentry Client Configuration
 *
 * This file configures Sentry for the browser/client-side.
 * It captures JavaScript errors, unhandled promise rejections, and custom events.
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  // Your Sentry DSN from https://sentry.io/
  // Set this in your environment variables
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Replay sessions for debugging
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1, // 10% of sessions will be recorded

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and input fields for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking (optional, useful for source maps)
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'development',

  // Ignore certain errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'http://tt.epicplay.com',
    "Can't find variable: ZiteReader",
    'jigsaw is not defined',
    'ComboSearch is not defined',
    'atomicFindClose',
    // React hydration warnings (these are expected in development)
    'Hydration failed',
    'There was an error while hydrating',
    // Network errors (these are often not actionable)
    'Network request failed',
    'Failed to fetch',
    'Load failed',
  ],

  // Filter sensitive data
  beforeSend(event, hint) {
    // Remove sensitive data from event
    if (event.request) {
      delete event.request.cookies
    }

    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_ENABLED) {
      return null
    }

    return event
  },
})
