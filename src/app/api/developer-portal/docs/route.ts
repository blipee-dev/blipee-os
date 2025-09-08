/**
 * Developer Portal Documentation API
 * GET /api/developer-portal/docs - Get API documentation
 */

import { NextRequest, NextResponse } from 'next/server';
import { developerPortalManager } from '@/lib/developer-portal/portal-manager';
import { withAPIVersioning } from '@/middleware/api-versioning';

export const GET = withAPIVersioning(async (req: NextRequest, context) => {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const version = searchParams.get('version') || context.version;

    // Get all endpoints
    const endpoints = developerPortalManager.getEndpoints(category, version);
    
    // Get unique categories for filtering
    const categories = [...new Set(endpoints.map(e => e.category))];
    
    // Get available versions
    const versions = ['2024-06-01', '2024-07-15', '2024-09-01'];

    return NextResponse.json({
      endpoints,
      categories,
      versions,
      currentVersion: context.version,
      meta: {
        total: endpoints.length,
        filtered: !!category
      }
    });
  } catch (error) {
    console.error('Developer Portal Docs Error:', error);
    return NextResponse.json(
      {
        error: 'DOCS_ERROR',
        message: 'Failed to fetch API documentation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});