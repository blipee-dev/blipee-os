/**
 * Security Middleware
 * Comprehensive security middleware for Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { securityManager } from '@/lib/security/security-manager';

export interface SecurityContext {
  user?: {
    id: string;
    organizationId: string;
    role: string;
    email: string;
  };
  threatAssessment: any;
  ipAddress: string;
  userAgent: string;
  requestId: string;
}

/**
 * Enhanced Authentication Middleware with Threat Detection
 */
export function withEnhancedAuth(
  handler: (req: NextRequest, context: SecurityContext) => Promise<NextResponse>,
  options: {
    requireRole?: string[];
    requireMFA?: boolean;
    enableThreatDetection?: boolean;
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();
    const ipAddress = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    try {
      // Extract authorization token
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        await securityManager.logSecurityEvent({
          type: 'authentication',
          severity: 'warning',
          ipAddress,
          userAgent,
          endpoint: req.nextUrl.pathname,
          action: 'missing_auth_token',
          result: 'failure',
          metadata: { requestId },
          timestamp: new Date()
        });

        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Missing or invalid authorization token' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7);

      // Verify JWT token
      let tokenPayload;
      try {
        tokenPayload = securityManager.verifyJWT(token);
      } catch (error) {
        await securityManager.logSecurityEvent({
          type: 'authentication',
          severity: 'warning',
          ipAddress,
          userAgent,
          endpoint: req.nextUrl.pathname,
          action: 'invalid_jwt_token',
          result: 'failure',
          metadata: { 
            requestId,
            error: error instanceof Error ? error.message : 'Token verification failed'
          },
          timestamp: new Date()
        });

        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'Invalid or expired token' },
          { status: 401 }
        );
      }

      // Get user information
      const supabase = createClient();
      // Get user profile and organization membership
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email, two_factor_enabled')
        .eq('id', tokenPayload.sub)
        .single();

      if (profileError || !userProfile) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'User not found' },
          { status: 401 }
        );
      }

      // Get organization membership
      const { data: membership, error: memberError } = await supabase
        .from('organization_members')
        .select(`
          organization_id,
          role,
          organizations (
            id,
            name,
            security_settings
          )
        `)
        .eq('user_id', tokenPayload.sub)
        .eq('invitation_status', 'accepted')
        .single();

      if (memberError || !membership) {
        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'No organization membership found' },
          { status: 401 }
        );
      }

      // Combine user and membership data
      const user = {
        id: userProfile.id,
        email: userProfile.email,
        mfa_enabled: userProfile.two_factor_enabled,
        organization_id: membership.organization_id,
        role: membership.role,
        organizations: membership.organizations
      };

      if (!user) {
        await securityManager.logSecurityEvent({
          type: 'authentication',
          severity: 'error',
          userId: tokenPayload.sub,
          ipAddress,
          userAgent,
          endpoint: req.nextUrl.pathname,
          action: 'user_not_found',
          result: 'failure',
          metadata: { requestId },
          timestamp: new Date()
        });

        return NextResponse.json(
          { error: 'UNAUTHORIZED', message: 'User not found or inactive' },
          { status: 401 }
        );
      }

      // Check role requirements
      if (options.requireRole && !options.requireRole.includes(user.role)) {
        await securityManager.logSecurityEvent({
          type: 'authorization',
          severity: 'warning',
          userId: user.id,
          organizationId: user.organization_id,
          ipAddress,
          userAgent,
          endpoint: req.nextUrl.pathname,
          action: 'insufficient_role',
          result: 'failure',
          metadata: { 
            requestId,
            userRole: user.role,
            requiredRoles: options.requireRole
          },
          timestamp: new Date()
        });

        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Check MFA requirement
      if (options.requireMFA && !user.mfa_enabled) {
        await securityManager.logSecurityEvent({
          type: 'authentication',
          severity: 'warning',
          userId: user.id,
          organizationId: user.organization_id,
          ipAddress,
          userAgent,
          endpoint: req.nextUrl.pathname,
          action: 'mfa_required',
          result: 'failure',
          metadata: { requestId },
          timestamp: new Date()
        });

        return NextResponse.json(
          { error: 'MFA_REQUIRED', message: 'Multi-factor authentication required' },
          { status: 403 }
        );
      }

      // Threat detection
      let threatAssessment = null;
      if (options.enableThreatDetection) {
        threatAssessment = await securityManager.assessThreatLevel(
          user.id,
          user.organization_id,
          {
            ipAddress,
            userAgent,
            action: req.method,
            endpoint: req.nextUrl.pathname
          }
        );

        // Block high-risk requests
        if (threatAssessment.riskLevel === 'critical') {
          await securityManager.logSecurityEvent({
            type: 'threat_detected',
            severity: 'critical',
            userId: user.id,
            organizationId: user.organization_id,
            ipAddress,
            userAgent,
            endpoint: req.nextUrl.pathname,
            action: 'critical_threat_blocked',
            result: 'blocked',
            metadata: { 
              requestId,
              threatScore: threatAssessment.score,
              threats: threatAssessment.threats
            },
            timestamp: new Date()
          });

          return NextResponse.json(
            { 
              error: 'SECURITY_THREAT_DETECTED', 
              message: 'Request blocked due to security concerns',
              threatLevel: threatAssessment.riskLevel,
              requestId
            },
            { status: 403 }
          );
        }

        // Log high-risk requests for monitoring
        if (threatAssessment.riskLevel === 'high') {
          await securityManager.logSecurityEvent({
            type: 'threat_detected',
            severity: 'warning',
            userId: user.id,
            organizationId: user.organization_id,
            ipAddress,
            userAgent,
            endpoint: req.nextUrl.pathname,
            action: 'high_risk_request',
            result: 'success',
            metadata: { 
              requestId,
              threatScore: threatAssessment.score,
              threats: threatAssessment.threats
            },
            timestamp: new Date()
          });
        }
      }

      // Create security context
      const securityContext: SecurityContext = {
        user: {
          id: user.id,
          organizationId: user.organization_id,
          role: user.role,
          email: user.email
        },
        threatAssessment,
        ipAddress,
        userAgent,
        requestId
      };

      // Execute the handler
      const response = await handler(req, securityContext);

      // Log successful request
      await securityManager.logSecurityEvent({
        type: 'api_usage',
        severity: 'info',
        userId: user.id,
        organizationId: user.organization_id,
        ipAddress,
        userAgent,
        endpoint: req.nextUrl.pathname,
        action: req.method,
        result: 'success',
        metadata: { 
          requestId,
          processingTime: Date.now() - startTime,
          responseStatus: response.status
        },
        timestamp: new Date()
      });

      // Add security headers
      response.headers.set('X-Request-ID', requestId);
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      if (threatAssessment && threatAssessment.riskLevel !== 'low') {
        response.headers.set('X-Threat-Level', threatAssessment.riskLevel);
      }

      return response;
    } catch (error) {
      console.error('Security middleware error:', error);

      await securityManager.logSecurityEvent({
        type: 'api_usage',
        severity: 'error',
        ipAddress,
        userAgent,
        endpoint: req.nextUrl.pathname,
        action: req.method,
        result: 'failure',
        metadata: { 
          requestId,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime: Date.now() - startTime
        },
        timestamp: new Date()
      });

      return NextResponse.json(
        { 
          error: 'INTERNAL_ERROR', 
          message: 'An internal security error occurred',
          requestId
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Data Access Control Middleware
 */
export function withDataAccessControl(
  handler: (req: NextRequest, context: SecurityContext) => Promise<NextResponse>,
  options: {
    resourceType: 'building' | 'conversation' | 'analytics' | 'organization' | 'user';
    action: 'read' | 'write' | 'delete' | 'admin';
    allowSelfAccess?: boolean;
  }
) {
  return withEnhancedAuth(
    async (req: NextRequest, context: SecurityContext) => {
      try {
        const { user } = context;
        if (!user) {
          return NextResponse.json(
            { error: 'UNAUTHORIZED', message: 'Authentication required' },
            { status: 401 }
          );
        }

        // Check resource-specific permissions
        const hasPermission = await checkDataAccessPermission(
          user,
          options.resourceType,
          options.action,
          req,
          options.allowSelfAccess
        );

        if (!hasPermission) {
          await securityManager.logSecurityEvent({
            type: 'authorization',
            severity: 'warning',
            userId: user.id,
            organizationId: user.organizationId,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
            endpoint: req.nextUrl.pathname,
            action: `${options.action}_${options.resourceType}`,
            result: 'failure',
            metadata: { 
              requestId: context.requestId,
              resourceType: options.resourceType,
              action: options.action
            },
            timestamp: new Date()
          });

          return NextResponse.json(
            { error: 'FORBIDDEN', message: 'Insufficient permissions for this resource' },
            { status: 403 }
          );
        }

        return handler(req, context);
      } catch (error) {
        console.error('Data access control error:', error);
        return NextResponse.json(
          { error: 'ACCESS_CONTROL_ERROR', message: 'Failed to verify access permissions' },
          { status: 500 }
        );
      }
    },
    { enableThreatDetection: true }
  );
}

async function checkDataAccessPermission(
  user: SecurityContext['user'],
  resourceType: string,
  action: string,
  req: NextRequest,
  allowSelfAccess?: boolean
): Promise<boolean> {
  if (!user) return false;

  // Role-based access control matrix
  const rolePermissions: Record<string, Record<string, string[]>> = {
    account_owner: {
      organization: ['read', 'write', 'delete', 'admin'],
      building: ['read', 'write', 'delete', 'admin'],
      conversation: ['read', 'write', 'delete', 'admin'],
      analytics: ['read', 'write', 'admin'],
      user: ['read', 'write', 'delete', 'admin']
    },
    sustainability_manager: {
      organization: ['read', 'write'],
      building: ['read', 'write', 'delete'],
      conversation: ['read', 'write', 'delete'],
      analytics: ['read', 'write'],
      user: ['read', 'write']
    },
    facility_manager: {
      organization: ['read'],
      building: ['read', 'write'],
      conversation: ['read', 'write'],
      analytics: ['read'],
      user: ['read']
    },
    analyst: {
      organization: ['read'],
      building: ['read'],
      conversation: ['read', 'write'],
      analytics: ['read'],
      user: ['read']
    },
    viewer: {
      organization: ['read'],
      building: ['read'],
      conversation: ['read'],
      analytics: ['read'],
      user: ['read']
    }
  };

  // Check basic role permissions
  const userPermissions = rolePermissions[user.role];
  if (!userPermissions) return false;

  const resourcePermissions = userPermissions[resourceType];
  if (!resourcePermissions || !resourcePermissions.includes(action)) {
    // Check self-access permissions
    if (allowSelfAccess && resourceType === 'user') {
      const { searchParams } = new URL(req.url);
      const targetUserId = searchParams.get('userId') || 
                          req.nextUrl.pathname.split('/').pop();
      
      return targetUserId === user.id && ['read', 'write'].includes(action);
    }
    
    return false;
  }

  // Additional resource-specific checks
  switch (resourceType) {
    case 'building':
      return await checkBuildingAccess(user, req);
    case 'analytics':
      return await checkAnalyticsAccess(user, req);
    default:
      return true;
  }
}

async function checkBuildingAccess(user: SecurityContext['user'], req: NextRequest): Promise<boolean> {
  const { searchParams } = new URL(req.url);
  const buildingId = searchParams.get('buildingId') || 
                    req.nextUrl.pathname.match(/\/buildings\/([^\/]+)/)?.[1];

  if (!buildingId) return true; // No specific building specified

  const supabase = createClient();
  const { data: building } = await supabase
    .from('buildings')
    .select('organization_id')
    .eq('id', buildingId)
    .single();

  return building?.organization_id === user.organizationId;
}

async function checkAnalyticsAccess(user: SecurityContext['user'], req: NextRequest): Promise<boolean> {
  // Analytics access is based on role and organization
  const allowedRoles = ['account_owner', 'sustainability_manager', 'facility_manager', 'analyst'];
  return allowedRoles.includes(user.role);
}

/**
 * HTTPS Enforcement Middleware
 */
export function enforceHTTPS(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (process.env.NODE_ENV === 'production' && 
        req.nextUrl.protocol === 'http:') {
      
      const httpsUrl = new URL(req.url);
      httpsUrl.protocol = 'https:';
      
      return NextResponse.redirect(httpsUrl.toString(), 301);
    }

    return handler(req);
  };
}

/**
 * Security Headers Middleware
 */
export function withSecurityHeaders(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const response = await handler(req);

    // Add comprehensive security headers
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:; object-src 'none'; media-src 'self'; frame-ancestors 'none';"
    );

    return response;
  };
}

/**
 * API Key Authentication Middleware
 */
export function withAPIKeyAuth(
  handler: (req: NextRequest, context: { apiKey: any }) => Promise<NextResponse>,
  options: {
    requiredScope?: string[];
  } = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const apiKey = req.headers.get('X-API-Key');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'MISSING_API_KEY', message: 'API key required' },
        { status: 401 }
      );
    }

    try {
      const supabase = createClient();
      const { data: keyData, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', (crypto as any).createHash('sha256').update(apiKey).digest('hex'))
        .eq('active', true)
        .single();

      if (error || !keyData) {
        return NextResponse.json(
          { error: 'INVALID_API_KEY', message: 'Invalid or inactive API key' },
          { status: 401 }
        );
      }

      // Check expiration
      if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'EXPIRED_API_KEY', message: 'API key has expired' },
          { status: 401 }
        );
      }

      // Check scopes
      if (options.requiredScope) {
        const keyScopes = keyData.scopes || [];
        const hasRequiredScope = options.requiredScope.some(scope => keyScopes.includes(scope));
        
        if (!hasRequiredScope) {
          return NextResponse.json(
            { error: 'INSUFFICIENT_SCOPE', message: 'API key lacks required permissions' },
            { status: 403 }
          );
        }
      }

      // Update last used timestamp
      await supabase
        .from('api_keys')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', keyData.id);

      return handler(req, { apiKey: keyData });
    } catch (error) {
      console.error('API key authentication error:', error);
      return NextResponse.json(
        { error: 'AUTH_ERROR', message: 'Authentication error' },
        { status: 500 }
      );
    }
  };
}