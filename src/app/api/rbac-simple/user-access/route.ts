import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { SimpleRBACService } from '@/lib/rbac-simple/service';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's access records with resource names
    const { data: accessRecords, error } = await supabase
      .from('user_access')
      .select(`
        *,
        organizations:resource_id!left(name),
        sites:resource_id!left(name)
      `)
      .eq('user_id', user.id)
      .order('granted_at', { ascending: false });

    if (error) {
      console.error('Error fetching user access:', error);
      return NextResponse.json({ error: 'Failed to fetch access' }, { status: 500 });
    }

    // Format the response
    const access = accessRecords?.map(record => ({
      resource_type: record.resource_type,
      resource_id: record.resource_id,
      role: record.role,
      resource_name: record.resource_type === 'org'
        ? record.organizations?.name
        : record.sites?.name,
      granted_at: record.granted_at,
      expires_at: record.expires_at
    })) || [];

    return NextResponse.json({ access });
  } catch (error) {
    console.error('Error in user access endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}