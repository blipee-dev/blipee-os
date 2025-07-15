import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import { telemetry } from '../monitoring/telemetry';

export interface AuthConfig {
  publicPaths: string[];
  apiKeyHeader?: string;
  jwtSecret?: string;
  supabaseAuth?: boolean;
}

export class AuthMiddleware {
  private supabase: any;
  private config: AuthConfig;
  private apiKeys: Map<string, string> = new Map();

  constructor(config: AuthConfig) {
    this.config = config;
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Load API keys from environment
    if (process.env.API_KEYS) {
      const keys = JSON.parse(process.env.API_KEYS);
      Object.entries(keys).forEach(([key, org]) => {
        this.apiKeys.set(key as string, org as string);
      });
    }
  }

  /**
   * Main authentication middleware
   */
  async authenticate(request: NextRequest): Promise<NextResponse | null> {
    const pathname = request.nextUrl.pathname;
    const startTime = Date.now();

    // Check if path is public
    if (this.isPublicPath(pathname)) {
      return null; // Allow request to proceed
    }

    try {
      // Try different auth methods in order
      const authResult = await this.tryAuthenticate(request);

      if (!authResult.authenticated) {
        telemetry.recordAPIRequest(
          pathname,
          request.method,
          Date.now() - startTime,
          401
        );

        return NextResponse.json(
          { error: 'Authentication required', message: authResult.message },
          { status: 401 }
        );
      }

      // Add auth context to request
      const response = NextResponse.next();
      response.headers.set('X-User-Id', authResult.userId || '');
      response.headers.set('X-Organization-Id', authResult.organizationId || '');
      response.headers.set('X-Auth-Method', authResult.method || '');

      return null; // Allow request to proceed

    } catch (error) {
      console.error('Auth middleware error:', error);
      
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      );
    }
  }

  /**
   * Try different authentication methods
   */
  private async tryAuthenticate(request: NextRequest): Promise<{
    authenticated: boolean;
    userId?: string;
    organizationId?: string;
    method?: string;
    message?: string;
  }> {
    // 1. Check API Key authentication
    const apiKey = request.headers.get(this.config.apiKeyHeader || 'X-API-Key');
    if (apiKey) {
      const orgId = this.apiKeys.get(apiKey);
      if (orgId) {
        return {
          authenticated: true,
          organizationId: orgId,
          method: 'api-key'
        };
      }
    }

    // 2. Check Bearer token (JWT or Supabase)
    const authHeader = request.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      
      // Try Supabase auth first
      if (this.config.supabaseAuth) {
        const supabaseAuth = await this.verifySupabaseToken(token);
        if (supabaseAuth.authenticated) {
          return supabaseAuth;
        }
      }

      // Try custom JWT
      if (this.config.jwtSecret) {
        const jwtAuth = await this.verifyJWT(token);
        if (jwtAuth.authenticated) {
          return jwtAuth;
        }
      }
    }

    // 3. Check session cookie (for web app)
    const sessionCookie = request.cookies.get('sb-access-token');
    if (sessionCookie && this.config.supabaseAuth) {
      const sessionAuth = await this.verifySupabaseToken(sessionCookie.value);
      if (sessionAuth.authenticated) {
        return sessionAuth;
      }
    }

    return {
      authenticated: false,
      message: 'No valid authentication provided'
    };
  }

  /**
   * Verify Supabase token
   */
  private async verifySupabaseToken(token: string): Promise<any> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser(token);
      
      if (error || !user) {
        return { authenticated: false };
      }

      // Get user's organization
      const { data: profile } = await this.supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      return {
        authenticated: true,
        userId: user.id,
        organizationId: profile?.organization_id,
        method: 'supabase'
      };

    } catch (error) {
      console.error('Supabase auth error:', error);
      return { authenticated: false };
    }
  }

  /**
   * Verify custom JWT
   */
  private async verifyJWT(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret!) as any;
      
      return {
        authenticated: true,
        userId: decoded.userId,
        organizationId: decoded.organizationId,
        method: 'jwt'
      };

    } catch (error) {
      return { authenticated: false };
    }
  }

  /**
   * Check if path is public
   */
  private isPublicPath(pathname: string): boolean {
    return this.config.publicPaths.some(path => {
      if (path.endsWith('*')) {
        return pathname.startsWith(path.slice(0, -1));
      }
      return pathname === path;
    });
  }
}

/**
 * Create auth middleware instance
 */
export function createAuthMiddleware(): AuthMiddleware {
  return new AuthMiddleware({
    publicPaths: [
      '/api/health',
      '/api/health/*',
      '/api/metrics',
      '/api/auth/*',
      '/_next/*',
      '/favicon.ico'
    ],
    apiKeyHeader: 'X-API-Key',
    jwtSecret: process.env.JWT_SECRET,
    supabaseAuth: true
  });
}