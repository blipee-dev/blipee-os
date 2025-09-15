import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Use admin client to bypass RLS
    const { data: memberships, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", user.id)
      .eq("invitation_status", "accepted");
      
    if (memberError) {
      console.error('Error fetching memberships:', memberError);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }
    
    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ organizations: [] });
    }
    
    // Get organization IDs
    const orgIds = memberships.map(m => m.organization_id);
    
    // Fetch organizations
    const { data: organizations, error: orgsError } = await supabaseAdmin
      .from("organizations")
      .select("*")
      .in("id", orgIds);
      
    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      return NextResponse.json({ error: orgsError.message }, { status: 500 });
    }
    
    // Map organizations with roles
    const orgsWithRoles = organizations?.map(org => {
      const membership = memberships.find(m => m.organization_id === org.id);
      return {
        ...org,
        role: membership?.role || 'viewer'
      };
    }) || [];
    
    return NextResponse.json({ 
      organizations: orgsWithRoles,
      memberships 
    });
  } catch (error) {
    console.error('Error in user-orgs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}