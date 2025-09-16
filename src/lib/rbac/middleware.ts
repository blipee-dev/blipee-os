import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RBACService } from './service';
import { ResourceType, Action } from './types';

interface PermissionCheckOptions {
  resource: ResourceType;
  action: Action;
  getOrgId?: (req: NextRequest) => string | Promise<string>;
  getSiteId?: (req: NextRequest) => string | undefined | Promise<string | undefined>;
}

/**
 * Middleware factory for checking permissions in API routes
 */
export function requirePermission(options: PermissionCheckOptions) {
  return async function permissionMiddleware(
    request: NextRequest,
    handler: (req: NextRequest, context: any) => Promise<NextResponse>
  ) {
    try {
      const supabase = await createServerSupabaseClient();

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get organization and site IDs
      const organizationId = options.getOrgId ? await options.getOrgId(request) : undefined;
      const siteId = options.getSiteId ? await options.getSiteId(request) : undefined;

      // Check permission
      const result = await RBACService.checkPermission({
        user_id: user.id,
        resource: options.resource,
        action: options.action,
        organization_id: organizationId,
        site_id: siteId
      });

      if (!result.allowed) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }

      // Call the actual handler
      return handler(request, { user, permission: result });
    } catch (error) {
      console.error('Permission middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Helper to extract organization ID from request body
 */
export async function getOrgIdFromBody(req: NextRequest): Promise<string> {
  const body = await req.json();
  return body.organization_id;
}

/**
 * Helper to extract site ID from request body
 */
export async function getSiteIdFromBody(req: NextRequest): Promise<string | undefined> {
  const body = await req.json();
  return body.site_id;
}

/**
 * Helper to extract organization ID from query params
 */
export function getOrgIdFromParams(req: NextRequest): string {
  const { searchParams } = new URL(req.url);
  return searchParams.get('organization_id') || '';
}

/**
 * Helper to extract site ID from query params
 */
export function getSiteIdFromParams(req: NextRequest): string | undefined {
  const { searchParams } = new URL(req.url);
  return searchParams.get('site_id') || undefined;
}