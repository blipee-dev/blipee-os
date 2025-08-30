import { NextRequest, NextResponse } from 'next/server';
import { apiKeyService } from './api-key-service';
import { rateLimitService } from './rate-limit-service';
import { APIVersion, APIResponse, APIError, RateLimitInfo } from '@/types/api-gateway';
import { headers } from 'next/headers';

// API Version regex patterns
const API_VERSION_PATTERN = /^\/api\/(v\d+)\//;
const DEFAULT_VERSION = APIVersion.V1;

// Helper to create API error response
function createErrorResponse(
  error: APIError,
  status: number,
  version: string = DEFAULT_VERSION
): NextResponse {
  const response: APIResponse = {
    success: false,
    error,
    meta: {
      version,
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID(),
    },
  };

  return NextResponse.json(response, { status });
}

// Helper to add rate limit headers
function addRateLimitHeaders(
  response: NextResponse,
  rateLimitInfo: RateLimitInfo
): NextResponse {
  response.headers.set('X-RateLimit-Limit', rateLimitInfo.limit.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitInfo.remaining.toString());
  response.headers.set('X-RateLimit-Reset', rateLimitInfo.reset.toISOString());
  
  if (rateLimitInfo.retryAfter) {
    response.headers.set('Retry-After', rateLimitInfo.retryAfter.toString());
  }
  
  return response;
}

// Extract API version from URL
function extractVersion(pathname: string): string {
  const match = pathname.match(API_VERSION_PATTERN);
  return match ? match[1] : DEFAULT_VERSION;
}

// Extract API key from request
function extractAPIKey(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = _request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check X-API-Key header
  const apiKeyHeader = _request.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }
  
  // Check query parameter (not recommended for production)
  const url = new URL(_request.url);
  const queryKey = url.searchParams.get('api_key');
  if (queryKey) {
    return queryKey;
  }
  
  return null;
}

// Get client IP address
function getClientIP(request: NextRequest): string {
  return _request.headers.get('x-forwarded-for')?.split(',')[0] || 
         _request.headers.get('x-real-ip') || 
         _request.ip || 
         'unknown';
}

// API Gateway Middleware
export async function apiGatewayMiddleware(
  request: NextRequest,
  handler: (req: NextRequest, context: APIGatewayContext) => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const version = extractVersion(_request.nextUrl.pathname);
  const endpoint = _request.nextUrl.pathname.replace(API_VERSION_PATTERN, '');
  
  try {
    // Extract API key
    const apiKey = extractAPIKey(_request);
    if (!apiKey) {
      return createErrorResponse(
        {
          code: 'MISSING_API_KEY',
          message: 'API key is required',
          documentation_url: 'https://docs.blipee.com/api/authentication',
        },
        401,
        version
      );
    }

    // Validate API key
    const keyData = await apiKeyService.validateAPIKey(apiKey);
    if (!keyData) {
      return createErrorResponse(
        {
          code: 'INVALID_API_KEY',
          message: 'Invalid or expired API key',
          documentation_url: 'https://docs.blipee.com/api/authentication',
        },
        401,
        version
      );
    }

    // Check API version compatibility
    if (keyData.version !== version && keyData.version !== 'v2') {
      // v2 keys can access v1 endpoints, but not vice versa
      return createErrorResponse(
        {
          code: 'VERSION_MISMATCH',
          message: `API key is for version ${keyData.version}, but you are accessing ${version}`,
          documentation_url: 'https://docs.blipee.com/api/versioning',
        },
        400,
        version
      );
    }

    // Check allowed origins (CORS)
    const origin = _request.headers.get('origin');
    if (origin && keyData.allowed_origins && keyData.allowed_origins.length > 0) {
      if (!keyData.allowed_origins.includes(origin) && !keyData.allowed_origins.includes('*')) {
        return createErrorResponse(
          {
            code: 'ORIGIN_NOT_ALLOWED',
            message: 'Origin not allowed for this API key',
          },
          403,
          version
        );
      }
    }

    // Check allowed IPs
    const clientIP = getClientIP(_request);
    if (keyData.allowed_ips && keyData.allowed_ips.length > 0) {
      if (!keyData.allowed_ips.includes(clientIP)) {
        return createErrorResponse(
          {
            code: 'IP_NOT_ALLOWED',
            message: 'IP address not allowed for this API key',
          },
          403,
          version
        );
      }
    }

    // Check API scopes
    const requiredScope = getRequiredScope(_request.method, endpoint);
    if (requiredScope && keyData.scopes) {
      const hasAdminScope = keyData.scopes.includes('admin:all');
      const hasRequiredScope = keyData.scopes.includes(requiredScope);
      
      if (!hasAdminScope && !hasRequiredScope) {
        return createErrorResponse(
          {
            code: 'INSUFFICIENT_SCOPE',
            message: `Missing required scope: ${requiredScope}`,
            documentation_url: 'https://docs.blipee.com/api/scopes',
          },
          403,
          version
        );
      }
    }

    // Check rate limits
    const rateLimitInfo = await rateLimitService.checkRateLimit(
      keyData.id,
      keyData.rate_limit_override
    );
    
    if (!rateLimitInfo.allowed) {
      const errorResponse = createErrorResponse(
        {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          details: {
            limit: rateLimitInfo.limit,
            reset: rateLimitInfo.reset,
          },
        },
        429,
        version
      );
      
      return addRateLimitHeaders(errorResponse, rateLimitInfo);
    }

    // Check quotas
    const quotaCheck = await apiKeyService.checkQuota(keyData.id, 'requests');
    if (!quotaCheck.allowed) {
      return createErrorResponse(
        {
          code: 'QUOTA_EXCEEDED',
          message: 'API quota exceeded',
          details: {
            limit: quotaCheck.limit,
            current: quotaCheck.current,
            reset: quotaCheck.resetAt,
          },
        },
        429,
        version
      );
    }

    // Create context for handler
    const context: APIGatewayContext = {
      apiKey: {
        id: keyData.id,
        organization_id: keyData.organization_id,
        scopes: keyData.scopes || [],
      },
      version,
      endpoint,
      clientIP,
      startTime,
    };

    // Call the actual handler
    const response = await handler(_request, context);
    
    // Add standard headers
    response.headers.set('X-API-Version', version);
    response.headers.set('X-Request-ID', crypto.randomUUID());
    
    // Add rate limit headers
    addRateLimitHeaders(response, rateLimitInfo);
    
    // Track usage asynchronously
    const responseTime = Date.now() - startTime;
    apiKeyService.trackUsage(keyData.id, {
      endpoint,
      method: _request.method,
      version,
      statusCode: response.status,
      responseTimeMs: responseTime,
      requestSize: parseInt(_request.headers.get('content-length') || '0'),
      responseSize: parseInt(response.headers.get('content-length') || '0'),
      ipAddress: clientIP,
      userAgent: _request.headers.get('user-agent') || undefined,
      origin: origin || undefined,
    }).catch(console.error);

    return response;
  } catch (error) {
    console.error('API Gateway error:', error);
    return createErrorResponse(
      {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
      500,
      version
    );
  }
}

// Context passed to API handlers
export interface APIGatewayContext {
  apiKey: {
    id: string;
    organization_id: string;
    scopes: string[];
  };
  version: string;
  endpoint: string;
  clientIP: string;
  startTime: number;
}

// Helper to determine required scope based on method and endpoint
function getRequiredScope(method: string, endpoint: string): string | null {
  // Define scope requirements for different endpoints
  const scopeMap: Record<string, Record<string, string>> = {
    GET: {
      '/organizations': 'read:organizations',
      '/buildings': 'read:buildings',
      '/emissions': 'read:emissions',
      '/sustainability': 'read:sustainability',
      '/users': 'read:users',
      '/analytics': 'read:analytics',
    },
    POST: {
      '/organizations': 'write:organizations',
      '/buildings': 'write:buildings',
      '/emissions': 'write:emissions',
      '/sustainability': 'write:sustainability',
      '/users': 'write:users',
    },
    PUT: {
      '/organizations': 'write:organizations',
      '/buildings': 'write:buildings',
      '/emissions': 'write:emissions',
      '/sustainability': 'write:sustainability',
      '/users': 'write:users',
    },
    DELETE: {
      '/organizations': 'write:organizations',
      '/buildings': 'write:buildings',
      '/emissions': 'write:emissions',
      '/sustainability': 'write:sustainability',
      '/users': 'write:users',
    },
  };

  // Check exact match first
  const methodScopes = scopeMap[method];
  if (methodScopes) {
    // Check exact endpoint match
    if (methodScopes[endpoint]) {
      return methodScopes[endpoint];
    }
    
    // Check prefix match
    for (const [path, scope] of Object.entries(methodScopes)) {
      if (endpoint.startsWith(path)) {
        return scope;
      }
    }
  }

  return null;
}

// Middleware for specific API versions
export function withAPIGateway(
  handler: (req: NextRequest, context: APIGatewayContext) => Promise<NextResponse>
) {
  return (request: NextRequest) => apiGatewayMiddleware(_request, handler);
}

// Helper to create success response
export function createSuccessResponse<T>(
  data: T,
  version: string,
  meta?: Record<string, any>
): NextResponse {
  const response: APIResponse<T> = {
    success: true,
    data,
    meta: {
      version,
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID(),
      ...meta,
    },
  };

  return NextResponse.json(response);
}

// Helper to create paginated response
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  },
  version: string
): NextResponse {
  const totalPages = Math.ceil(pagination.total / pagination.limit);
  
  const response = {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      total_pages: totalPages,
      has_next: pagination.page < totalPages,
      has_previous: pagination.page > 1,
    },
    meta: {
      version,
      timestamp: new Date().toISOString(),
      request_id: crypto.randomUUID(),
    },
  };

  return NextResponse.json(response);
}