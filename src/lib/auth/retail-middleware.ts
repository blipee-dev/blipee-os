import { NextRequest, NextResponse } from 'next/server';
import { createRetailContext, checkRetailAccess, RETAIL_PERMISSIONS } from './retail-permissions';

// Mock user session - in production this would come from your auth system
function getMockUserSession() {
  return {
    user: {
      id: 'user-123',
      email: 'demo@blipee.ai',
      name: 'Demo User',
      roles: ['retail_manager', 'sustainability_lead']
    },
    organization: {
      id: 'org-456',
      name: 'Demo Organization',
      type: 'retail'
    }
  };
}

export async function withRetailAuth(
  req: NextRequest,
  requiredPermission: string = RETAIL_PERMISSIONS.READ
) {
  try {
    // In production, extract real user session from auth cookies/headers
    const session = getMockUserSession();
    
    if (!session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Create retail module context
    const context = createRetailContext(
      session.user,
      session.organization,
      session.user.roles
    );

    // Check if user has required permission
    if (!checkRetailAccess(requiredPermission, context)) {
      return NextResponse.json(
        { 
          error: 'Insufficient permissions',
          required: requiredPermission,
          available: context.permissions
        },
        { status: 403 }
      );
    }

    // Add context to request for use in API handlers
    (req as any).retailContext = context;
    return null; // Continue to next handler
  } catch (error) {
    console.error('Retail auth middleware error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

// Helper to extract retail context from request
export function getRetailContext(req: NextRequest) {
  return (req as any).retailContext;
}

// Wrapper for API route handlers
export function withRetailPermission(
  permission: string,
  handler: (req: NextRequest, context: any) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const authResult = await withRetailAuth(req, permission);
    if (authResult) return authResult; // Auth failed

    const context = getRetailContext(req);
    return handler(req, context);
  };
}