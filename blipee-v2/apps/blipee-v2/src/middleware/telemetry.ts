/**
 * Minimal telemetry middleware used by the V2 edge middleware.
 * Records request metadata and delegates to the provided handler.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

type TelemetryHandler = (request: NextRequest) => Promise<NextResponse> | NextResponse

export async function telemetryMiddleware(
  request: NextRequest,
  handler: TelemetryHandler
): Promise<NextResponse> {
  const startedAt = Date.now()

  const response = await handler(request)

  const durationMs = Date.now() - startedAt
  const telemetryHeader = `${request.method} ${request.nextUrl.pathname} ${durationMs}ms`

  response.headers.set('x-blipee-telemetry', telemetryHeader)

  return response
}
