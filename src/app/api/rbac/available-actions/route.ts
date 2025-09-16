import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { RBACService } from '@/lib/rbac/service';
import { ResourceType, Action } from '@/lib/rbac/types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { resource, organization_id, site_id } = await request.json();

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource is required' },
        { status: 400 }
      );
    }

    // All possible actions for a resource
    const allActions: Action[] = ['create', 'read', 'update', 'delete', 'approve', 'export', 'analyze'];
    const availableActions: Action[] = [];

    // Check each action
    for (const action of allActions) {
      const result = await RBACService.checkPermission({
        user_id: user.id,
        resource: resource as ResourceType,
        action,
        organization_id,
        site_id
      });

      if (result.allowed) {
        availableActions.push(action);
      }
    }

    return NextResponse.json({ actions: availableActions });
  } catch (error) {
    console.error('Error checking available actions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}