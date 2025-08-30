import { NextRequest, NextResponse } from "next/server";
import { ssoService } from "@/lib/auth/sso/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
// import { UserRole } from "@/types/auth"; // Unused after fixing role checks

export async function POST(
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
    
    // Get configuration to check permissions
    const configuration = await ssoService.getConfiguration(params.id);
    
    if (!configuration) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }
    
    // Check user permissions (only subscription owners can test SSO configs)
    const { data: membership } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", configuration.organization_id)
      .eq("user_id", user.id)
      .eq("invitation_status", "accepted")
      .single();
    
    if (!membership || membership.role !== 'account_owner') {
      return NextResponse.json(
        { error: "Only subscription owners can test SSO configurations" },
        { status: 403 }
      );
    }
    
    // Test configuration
    const result = await ssoService.testConfiguration(params.id);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to test SSO configuration:", error);
    return NextResponse.json(
      { error: errorerror.message || "Failed to test configuration" },
      { status: 500 }
    );
  }
}