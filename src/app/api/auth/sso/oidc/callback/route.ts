import { NextRequest, NextResponse } from "next/server";
import { ssoService } from "@/lib/auth/sso/service";
import { authService } from "@/lib/auth/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SSOProvider } from "@/types/sso";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Get OIDC response parameters
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");
    
    // Handle error response
    if (error) {
      const errorUrl = new URL("/auth/sso/error", request.url);
      errorUrl.searchParams.set("error", `${error}: ${errorDescription || ""}`);
      return NextResponse.redirect(errorUrl);
    }
    
    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }
    
    // Process OIDC response
    const result = await ssoService.handleAuthenticationResponse(
      SSOProvider.OIDC,
      {
        code,
        state,
      }
    );
    
    if (!result.success) {
      // Redirect to error page
      const errorUrl = new URL("/auth/sso/error", request.url);
      errorUrl.searchParams.set("error", result.error || "Authentication failed");
      return NextResponse.redirect(errorUrl);
    }
    
    // Handle user provisioning if needed
    if (result.requiresProvisioning) {
      // Redirect to provisioning page
      const provisionUrl = new URL("/auth/sso/provision", request.url);
      provisionUrl.searchParams.set("email", result.email!);
      provisionUrl.searchParams.set("provider", "oidc");
      // Store attributes temporarily
      const tempId = crypto.randomUUID();
      // In production, you'd store this in a secure temporary storage
      provisionUrl.searchParams.set("temp_id", tempId);
      return NextResponse.redirect(provisionUrl);
    }
    
    // Create Supabase session
    const supabase = await createServerSupabaseClient();
    
    // Get user data
    const { data: userData } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", result.userId!)
      .single();
    
    if (!userData) {
      const errorUrl = new URL("/auth/sso/error", request.url);
      errorUrl.searchParams.set("error", "User not found");
      return NextResponse.redirect(errorUrl);
    }
    
    // Set auth cookie (this is a simplified version - you may need to implement proper session management)
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    
    // Store SSO session ID in cookie
    response.cookies.set("sso_session", result.sessionId!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60, // 8 hours
    });
    
    return response;
  } catch (error: any) {
    console.error("OIDC callback error:", error);
    
    // Redirect to error page
    const errorUrl = new URL("/auth/sso/error", request.url);
    errorUrl.searchParams.set("error", error.message || "Authentication failed");
    return NextResponse.redirect(errorUrl);
  }
}

export async function POST(request: NextRequest) {
  // Some OIDC providers may use POST
  const formData = await request.formData();
  const code = formData.get("code") as string;
  const state = formData.get("state") as string;
  const error = formData.get("error") as string;
  const errorDescription = formData.get("error_description") as string;
  
  // Convert to GET parameters and redirect
  const url = new URL(request.url);
  if (code) url.searchParams.set("code", code);
  if (state) url.searchParams.set("state", state);
  if (error) url.searchParams.set("error", error);
  if (errorDescription) url.searchParams.set("error_description", errorDescription);
  
  return NextResponse.redirect(url);
}