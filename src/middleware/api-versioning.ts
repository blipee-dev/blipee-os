/**
 * API Versioning Middleware
 * Handles version negotiation and routing for all API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { versionManager } from '@/lib/api/versioning/version-manager';

export interface VersionContext {
  version: string;
  warnings: string[];
  deprecationNotice?: {
    version: string;
    sunsetDate: Date;
    migrationGuide: string;
  };
}

/**
 * API Versioning Middleware
 * Negotiates version and adds headers to response
 */
export function withAPIVersioning(handler: (req: NextRequest, context: VersionContext) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Extract version information from request
      const clientRequest = {
        version: req.headers.get('api-version') || undefined,
        headers: Object.fromEntries(req.headers.entries()),
        userAgent: req.headers.get('user-agent') || undefined
      };

      // Negotiate version
      const negotiation = versionManager.negotiateVersion(clientRequest);
      
      // Create version context
      const context: VersionContext = {
        version: negotiation.negotiatedVersion,
        warnings: negotiation.warnings,
        deprecationNotice: negotiation.deprecationNotice
      };

      // Track version usage for analytics
      const pathname = new URL(req.url).pathname;
      versionManager.trackVersionUsage(
        negotiation.negotiatedVersion,
        pathname,
        clientRequest.userAgent
      );

      // Call the actual handler
      const response = await handler(req, context);

      // Add version headers to response
      response.headers.set('API-Version', negotiation.negotiatedVersion);
      response.headers.set('API-Version-Current', versionManager.getCurrentVersion());
      response.headers.set('API-Version-Minimum', versionManager.getMinimumSupportedVersion());

      // Add warnings if any
      if (negotiation.warnings.length > 0) {
        response.headers.set('API-Warnings', negotiation.warnings.join('; '));
      }

      // Add deprecation notice
      if (negotiation.deprecationNotice) {
        const notice = negotiation.deprecationNotice;
        response.headers.set('Deprecation', notice.sunsetDate.toISOString());
        response.headers.set('Link', `<${notice.migrationGuide}>; rel="successor-version"`);
        response.headers.set('Sunset', notice.sunsetDate.toISOString());
      }

      // Add CORS headers for version negotiation
      response.headers.set('Access-Control-Expose-Headers', 
        'API-Version,API-Version-Current,API-Version-Minimum,API-Warnings,Deprecation,Sunset'
      );

      return response;
    } catch (error) {
      console.error('API Versioning Error:', error);
      
      // Return error response with version info
      return NextResponse.json(
        {
          error: 'API_VERSIONING_ERROR',
          message: 'Failed to negotiate API version',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { 
          status: 400,
          headers: {
            'API-Version': versionManager.getCurrentVersion(),
            'Content-Type': 'application/json'
          }
        }
      );
    }
  };
}

/**
 * Version validation middleware
 * Ensures the requested version is supported
 */
export function validateAPIVersion(req: NextRequest): { valid: boolean; error?: NextResponse } {
  const requestedVersion = req.headers.get('api-version');
  
  if (requestedVersion && !versionManager.isVersionSupported(requestedVersion)) {
    const error = NextResponse.json(
      {
        error: 'UNSUPPORTED_API_VERSION',
        message: `API version ${requestedVersion} is not supported`,
        supportedVersions: versionManager.getSupportedVersions().map(v => ({
          version: v.version,
          status: v.status,
          releaseDate: v.releaseDate,
          deprecationDate: v.deprecationDate
        }))
      },
      { status: 400 }
    );
    
    return { valid: false, error };
  }

  return { valid: true };
}

/**
 * Get versioned endpoint handler
 * Routes to the appropriate handler based on negotiated version
 */
export function getVersionedHandler(
  path: string, 
  method: string, 
  version: string,
  handlers: Record<string, Function>
): Function | null {
  const endpointInfo = versionManager.getEndpointHandler(path, method, version);
  
  if (!endpointInfo) {
    return null;
  }

  return handlers[endpointInfo.handler] || null;
}

/**
 * Create version-aware response
 * Adds version metadata to JSON responses
 */
export function createVersionedResponse(
  data: any, 
  context: VersionContext, 
  status: number = 200
): NextResponse {
  const responseData = {
    ...data,
    _meta: {
      apiVersion: context.version,
      warnings: context.warnings,
      deprecationNotice: context.deprecationNotice
    }
  };

  const response = NextResponse.json(responseData, { status });
  
  // Add version headers
  response.headers.set('API-Version', context.version);
  
  if (context.warnings.length > 0) {
    response.headers.set('API-Warnings', context.warnings.join('; '));
  }

  return response;
}

/**
 * Handle version migration request
 * Provides migration guidance for version upgrades
 */
export async function handleVersionMigration(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const fromVersion = url.searchParams.get('from');
  const toVersion = url.searchParams.get('to');

  if (!fromVersion) {
    return NextResponse.json(
      {
        error: 'MISSING_FROM_VERSION',
        message: 'from version parameter is required'
      },
      { status: 400 }
    );
  }

  const migrationGuide = versionManager.generateMigrationGuide(fromVersion, toVersion);
  
  if (!migrationGuide) {
    return NextResponse.json(
      {
        error: 'INVALID_VERSION',
        message: 'One or both versions are invalid'
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    migration: migrationGuide,
    supportedVersions: versionManager.getSupportedVersions().map(v => ({
      version: v.version,
      status: v.status,
      changelog: v.changelog
    }))
  });
}

/**
 * Handle version discovery request
 * Returns information about all available versions
 */
export async function handleVersionDiscovery(): Promise<NextResponse> {
  const versions = versionManager.getSupportedVersions();
  const currentVersion = versionManager.getCurrentVersion();

  return NextResponse.json({
    current: currentVersion,
    minimum: versionManager.getMinimumSupportedVersion(),
    versions: versions.map(v => ({
      version: v.version,
      status: v.status,
      releaseDate: v.releaseDate,
      deprecationDate: v.deprecationDate,
      sunsetDate: v.sunsetDate,
      breaking: v.breaking,
      changelog: v.changelog
    })),
    links: {
      documentation: 'https://docs.blipee.com/api',
      migration: 'https://docs.blipee.com/api/migration',
      changelog: 'https://docs.blipee.com/api/changelog'
    }
  });
}