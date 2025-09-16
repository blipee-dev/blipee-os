import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SimpleRBACService } from '@/lib/rbac-simple/service';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const { resource_type, resource_id, action } = await request.json();

    if (!resource_type || !resource_id || !action) {
      return NextResponse.json(
        { error: 'resource_type, resource_id, and action are required' },
        { status: 400 }
      );
    }

    // Check permission using simple RBAC service
    const result = await SimpleRBACService.checkPermission(
      user.id,
      resource_type,
      resource_id,
      action
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}