import { NextRequest, NextResponse } from "next/server";
import { ssoService } from "@/lib/auth/sso/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserRole } from "@/types/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get configuration
    const configuration = await ssoService.getConfiguration(params.id);
    
    if (!configuration) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }
    
    // Check user permissions
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", configuration.organization_id)
      .eq("user_id", user.id)
      .eq("invitation_status", "accepted")
      .single();
    
    if (!membership || !["subscription_owner", "organization_admin"].includes(membership.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ configuration });
  } catch (error: any) {
    console.error("Failed to get SSO configuration:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get existing configuration to check permissions
    const existing = await ssoService.getConfiguration(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }
    
    // Check user permissions (only subscription owners can update SSO configs)
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", existing.organization_id)
      .eq("user_id", user.id)
      .eq("invitation_status", "accepted")
      .single();
    
    if (!membership || membership.role !== UserRole.SUBSCRIPTION_OWNER) {
      return NextResponse.json(
        { error: "Only subscription owners can update SSO configurations" },
        { status: 403 }
      );
    }
    
    // Get update data
    const updates = await _request.json();
    
    // Update configuration
    const configuration = await ssoService.updateConfiguration(params.id, updates);
    
    return NextResponse.json({ configuration });
  } catch (error: any) {
    console.error("Failed to update SSO configuration:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update configuration" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Get existing configuration to check permissions
    const existing = await ssoService.getConfiguration(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }
    
    // Check user permissions (only subscription owners can delete SSO configs)
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", existing.organization_id)
      .eq("user_id", user.id)
      .eq("invitation_status", "accepted")
      .single();
    
    if (!membership || membership.role !== UserRole.SUBSCRIPTION_OWNER) {
      return NextResponse.json(
        { error: "Only subscription owners can delete SSO configurations" },
        { status: 403 }
      );
    }
    
    // Delete configuration
    await ssoService.deleteConfiguration(params.id);
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to delete SSO configuration:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete configuration" },
      { status: 500 }
    );
  }
}