import { NextRequest, NextResponse } from "next/server";
import { ssoService } from "@/lib/auth/sso/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserRole } from "@/types/auth";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get organization ID from query params
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");
    
    if (!organizationId) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }
    
    // Check user permissions
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .eq("invitation_status", "accepted")
      .single();
    
    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
    
    // List configurations
    const configurations = await ssoService.listConfigurations(organizationId);
    
    return NextResponse.json({ configurations });
  } catch (error: any) {
    console.error("Failed to list SSO configurations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list configurations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get request data
    const data = await request.json();
    
    if (!data.organization_id) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }
    
    // Check user permissions (only subscription owners can create SSO configs)
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", data.organization_id)
      .eq("user_id", user.id)
      .eq("invitation_status", "accepted")
      .single();
    
    if (!membership || membership.role !== UserRole.SUBSCRIPTION_OWNER) {
      return NextResponse.json(
        { error: "Only subscription owners can create SSO configurations" },
        { status: 403 }
      );
    }
    
    // Create configuration
    const configuration = await ssoService.createConfiguration({
      ...data,
      created_by: user.id,
    });
    
    return NextResponse.json({ configuration }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create SSO configuration:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create configuration" },
      { status: 500 }
    );
  }
}