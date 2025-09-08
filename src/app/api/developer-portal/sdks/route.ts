/**
 * Developer Portal SDKs API
 * GET /api/developer-portal/sdks - Get available SDKs
 */

import { NextRequest, NextResponse } from 'next/server';
import { developerPortalManager } from '@/lib/developer-portal/portal-manager';
import { withAPIVersioning } from '@/middleware/api-versioning';

export const GET = withAPIVersioning(async (req: NextRequest, context) => {
  try {
    const { searchParams } = new URL(req.url);
    const language = searchParams.get('language') || undefined;

    if (language) {
      const sdk = developerPortalManager.getSDK(language);
      if (!sdk) {
        return NextResponse.json(
          {
            error: 'SDK_NOT_FOUND',
            message: `SDK for ${language} not found`
          },
          { status: 404 }
        );
      }
      return NextResponse.json({ sdk });
    }

    const sdks = developerPortalManager.getSDKs();
    
    return NextResponse.json({
      sdks,
      languages: [...new Set(sdks.map(s => s.language))],
      featured: sdks.filter(s => ['javascript', 'python'].includes(s.language))
    });
  } catch (error) {
    console.error('Developer Portal SDKs Error:', error);
    return NextResponse.json(
      {
        error: 'SDKS_ERROR',
        message: 'Failed to fetch SDKs',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});