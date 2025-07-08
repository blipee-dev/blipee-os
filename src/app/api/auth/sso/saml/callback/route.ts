import { NextRequest, NextResponse } from "next/server";
import { ssoService } from "@/lib/auth/sso/service";
import { authService } from "@/lib/auth/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SSOProvider } from "@/types/sso";

export async function POST(request: NextRequest) {
  try {
    // Get SAML response from form data
    const formData = await request.formData();
    const samlResponse = formData.get("SAMLResponse") as string;
    const relayState = formData.get("RelayState") as string;
    
    if (!samlResponse) {
      return NextResponse.json(
        { error: "Missing SAML response" },
        { status: 400 }
      );
    }
    
    // Process SAML response
    const result = await ssoService.handleAuthenticationResponse(
      SSOProvider.SAML,
      {
        SAMLResponse: samlResponse,
        RelayState: relayState,
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
      provisionUrl.searchParams.set("provider", "saml");
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
    console.error("SAML callback error:", error);
    
    // Redirect to error page
    const errorUrl = new URL("/auth/sso/error", request.url);
    errorUrl.searchParams.set("error", error.message || "Authentication failed");
    return NextResponse.redirect(errorUrl);
  }
}

export async function GET(request: NextRequest) {
  // Some IdPs may use GET for the callback
  return NextResponse.json(
    { error: "Method not allowed. Please use POST." },
    { status: 405 }
  );
}