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
      const membership = memberships.find(m => m.organization_id === org.id);
      const orgWithCounts = {
        ...org,
        role: membership?.role || 'viewer',
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