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

    // First, get the user's profile to check direct organization assignment
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from("app_users")
      .select("id, organization_id, role")
      .eq("auth_user_id", user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const orgIds: string[] = [];
    const orgRoles: Record<string, string> = {};

    // Add direct organization if exists
    if (userProfile?.organization_id) {
      orgIds.push(userProfile.organization_id);
      orgRoles[userProfile.organization_id] = userProfile.role || 'viewer';
    }

    // Also check organization_members table (for invited users)
    const { data: memberships, error: memberError } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", userProfile?.id || user.id)  // Use app_users.id if available
      .eq("invitation_status", "accepted");

    if (memberError) {
      console.error('Error fetching memberships:', memberError);
    }

    // Add membership organizations
    if (memberships && memberships.length > 0) {
      memberships.forEach(m => {
        if (!orgIds.includes(m.organization_id)) {
          orgIds.push(m.organization_id);
          orgRoles[m.organization_id] = m.role || 'viewer';
        }
      });
    }

    if (orgIds.length === 0) {
      return NextResponse.json({ organizations: [] });
    }
    
    // Fetch organizations
    const { data: organizations, error: orgsError } = await supabaseAdmin
      .from("organizations")
      .select("*")
      .in("id", orgIds);
      
    if (orgsError) {
      console.error('Error fetching organizations:', orgsError);
      return NextResponse.json({ error: orgsError.message }, { status: 500 });
    }
    
    // Fetch sites count for each organization
    const { data: siteCounts, error: siteCountError } = await supabaseAdmin
      .from("sites")
      .select("organization_id")
      .in("organization_id", orgIds);

    if (siteCountError) {
      console.error('Error fetching site counts:', siteCountError);
    }

    console.log('Sites found:', siteCounts?.length || 0);
    console.log('Site data:', siteCounts);

    // Count sites per organization
    const siteCountMap: Record<string, number> = {};
    siteCounts?.forEach(site => {
      siteCountMap[site.organization_id] = (siteCountMap[site.organization_id] || 0) + 1;
    });

    console.log('Site count map:', siteCountMap);

    // Fetch user count for each organization
    const { data: userCounts, error: userCountError } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .in("organization_id", orgIds)
      .eq("invitation_status", "accepted");

    if (userCountError) {
      console.error('Error fetching user counts:', userCountError);
    }

    // Count users per organization
    const userCountMap: Record<string, number> = {};
    userCounts?.forEach(member => {
      userCountMap[member.organization_id] = (userCountMap[member.organization_id] || 0) + 1;
    });

    // Map organizations with roles, sites, and users count
    const orgsWithRoles = organizations?.map(org => {
      const orgWithCounts = {
        ...org,
        role: orgRoles[org.id] || 'viewer',
        sites: siteCountMap[org.id] || 0,
        users: userCountMap[org.id] || 0
      };
      console.log(`Organization ${org.name}: sites=${orgWithCounts.sites}, users=${orgWithCounts.users}`);
      return orgWithCounts;
    }) || [];

    console.log('Final organizations with counts:', orgsWithRoles.map(o => ({ name: o.name, sites: o.sites, users: o.users })));

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