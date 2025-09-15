import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Current user:', user?.email);
    
    // Query ALL organizations (using service role if available)
    const { data: allOrgs, error: allOrgsError, count: allCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact' });
    
    // Query organization_members for current user
    let userOrgs = null;
    let userOrgsError = null;
    if (user) {
      const result = await supabase
        .from('organization_members')
        .select(`
          user_id,
          organization_id,
          role,
          invitation_status,
          organization:organizations (
            id,
            name,
            slug,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .eq('invitation_status', 'accepted');
      
      userOrgs = result.data;
      userOrgsError = result.error;
    }
    
    // Get counts
    const { count: orgCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });
    
    const { count: userOrgCount } = await supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true });
    
    return NextResponse.json({
      debug: true,
      timestamp: new Date().toISOString(),
      currentUser: user ? {
        id: user.id,
        email: user.email
      } : null,
      organizationsTable: {
        totalCount: orgCount,
        error: allOrgsError?.message,
        data: allOrgs
      },
      organizationMembersTable: {
        totalCount: userOrgCount,
        currentUserMemberships: userOrgs,
        error: userOrgsError?.message
      },
      summary: {
        totalOrganizations: orgCount || 0,
        totalUserMemberships: userOrgCount || 0,
        currentUserOrganizations: userOrgs?.length || 0
      }
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
  } catch (error: any) {
    console.error('Error in check-organizations API:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        debug: true
      },
      { status: 500 }
    );
  }
}