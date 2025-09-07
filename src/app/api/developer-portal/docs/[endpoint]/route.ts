/**
 * Individual Endpoint Documentation API
 * GET /api/developer-portal/docs/[endpoint] - Get specific endpoint documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { developerPortalManager } from '@/lib/developer-portal/portal-manager';
import { withAPIVersioning } from '@/middleware/api-versioning';

export const GET = withAPIVersioning(async (req: NextRequest, context) => {
  try {
    const pathname = new URL(req.url).pathname;
    const endpointId = pathname.split('/').pop();

    if (!endpointId) {
      return NextResponse.json(
        {
          error: 'MISSING_ENDPOINT_ID',
          message: 'Endpoint ID is required'
        },
        { status: 400 }
      );
    }

    const endpoint = developerPortalManager.getEndpoint(endpointId);
    
    if (!endpoint) {
      return NextResponse.json(
        {
          error: 'ENDPOINT_NOT_FOUND',
          message: `Endpoint ${endpointId} not found`
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      endpoint,
      related: developerPortalManager.getEndpoints(endpoint.category)
        .filter(e => e.id !== endpointId)
        .slice(0, 3)
    });
  } catch (error) {
    console.error('Endpoint Documentation Error:', error);
    return NextResponse.json(
      {
        error: 'ENDPOINT_DOCS_ERROR',
        message: 'Failed to fetch endpoint documentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});