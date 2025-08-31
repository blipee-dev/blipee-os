import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/lib/auth/service";
import type { Session } from "@/types/auth";

export interface AuthenticatedRequest extends NextRequest {
  session?: Session;
}

/**
 * Middleware to check authentication
 */
export async function requireAuth(
  request: AuthenticatedRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const session = await authService.getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Attach session to request
    request.session = session;

    return handler(request);
  } catch (error: any) {
    console.error("Auth middleware error:", error);
    return NextResponse.json(
      { success: false, error: "Authentication failed" },
      { status: 401 },
    );
  }
}

/**
 * Middleware to check specific permissions
 */
export function requirePermission(
  resource: string,
  action: string,
  scope?: Record<string, string>,
) {
  return async function (
    request: AuthenticatedRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  ): Promise<NextResponse> {
    try {
      const session = await authService.getSession();

      if (!session) {
        return NextResponse.json(
          { success: false, error: "Not authenticated" },
          { status: 401 },
        );
      }

      // Check permission
      if (!authService.hasPermission(session, resource, action, scope)) {
        return NextResponse.json(
          {
            success: false,
            error: "Insufficient permissions",
            required: { resource, action, scope },
          },
          { status: 403 },
        );
      }

      // Attach session to request
      request.session = session;

      return handler(request);
    } catch (error: any) {
      console.error("Permission middleware error:", error);
      return NextResponse.json(
        { success: false, error: "Authorization failed" },
        { status: 403 },
      );
    }
  };
}

/**
 * Middleware to check organization membership
 */
export function requireOrgMembership(organizationId?: string) {
  return async function (
    request: AuthenticatedRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  ): Promise<NextResponse> {
    try {
      const session = await authService.getSession();

      if (!session) {
        return NextResponse.json(
          { success: false, error: "Not authenticated" },
          { status: 401 },
        );
      }

      // Get organization ID from params or body if not provided
      const orgId =
        organizationId ||
        request.nextUrl.searchParams.get("organizationId") ||
        (await request.json()).organizationId;

      if (!orgId) {
        return NextResponse.json(
          { success: false, error: "Organization ID required" },
          { status: 400 },
        );
      }

      // Check if user is member of organization
      const isMember = session.organizations.some((org) => org.id === orgId);

      if (!isMember) {
        return NextResponse.json(
          { success: false, error: "Not a member of this organization" },
          { status: 403 },
        );
      }

      // Attach session to request
      request.session = session;

      return handler(request);
    } catch (error: any) {
      console.error("Org membership middleware error:", error);
      return NextResponse.json(
        { success: false, error: "Authorization failed" },
        { status: 403 },
      );
    }
  };
}

/**
 * Middleware to check building access
 */
export function requireBuildingAccess(buildingId?: string) {
  return async function (
    request: AuthenticatedRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  ): Promise<NextResponse> {
    try {
      const session = await authService.getSession();

      if (!session) {
        return NextResponse.json(
          { success: false, error: "Not authenticated" },
          { status: 401 },
        );
      }

      // Get building ID from params or body if not provided
      const bldgId =
        buildingId ||
        request.nextUrl.searchParams.get("buildingId") ||
        (await request.json()).buildingId;

      if (!bldgId) {
        return NextResponse.json(
          { success: false, error: "Building ID required" },
          { status: 400 },
        );
      }

      // Check building access based on role
      const hasAccess = await checkBuildingAccess(session, bldgId);

      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: "No access to this building" },
          { status: 403 },
        );
      }

      // Attach session to request
      request.session = session;

      return handler(request);
    } catch (error: any) {
      console.error("Building access middleware error:", error);
      return NextResponse.json(
        { success: false, error: "Authorization failed" },
        { status: 403 },
      );
    }
  };
}

/**
 * Helper to check building access
 */
async function checkBuildingAccess(
  session: Session,
  _buildingId: string,
): Promise<boolean> {
  // Organization admins and subscription owners have access to all buildings
  if (session.permissions.some((p) => p.resource === "*" && p.action === "*")) {
    return true;
  }

  // Check if user has specific building assignment
  // This would query the building_assignments table
  // For now, return true if user has building view permission
  return authService.hasPermission(session, "buildings", "view");
}
