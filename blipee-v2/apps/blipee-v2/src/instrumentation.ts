/**
 * Instrumentation
 *
 * This file is automatically loaded by Next.js when the server starts.
 * It's the perfect place to initialize monitoring tools like Sentry.
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run instrumentation on the server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}
