import { NextRequest, NextResponse } from "next/server";
import { ssoService } from "@/lib/auth/sso/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    const { email, redirectTo } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    // Extract domain from email
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }
    
    // Check if SSO is configured for this domain
    const ssoConfig = await ssoService.getConfigurationByDomain(domain);
    
    if (!ssoConfig) {
      return NextResponse.json(
        { error: "SSO not configured for this domain" },
        { status: 404 }
      );
    }
    
    // Generate redirect URL
    const appUrl = process.env['NEXT_PUBLIC_APP_URL'] || `https://${request.headers.get("host")}`;
    const callbackUrl = ssoConfig.provider === "saml"
      ? `${appUrl}/api/auth/sso/saml/callback`
      : `${appUrl}/api/auth/sso/oidc/callback`;
    
    // Initiate SSO authentication
    const { url, requestId } = await ssoService.initiateAuthentication(
      ssoConfig.id,
      redirectTo || callbackUrl
    );
    
    return NextResponse.json({
      url,
      requestId,
      provider: ssoConfig.provider,
    });
  } catch (error: any) {
    console.error("Failed to initiate SSO:", error);
    return NextResponse.json(
      { error: errorerror.message || "Failed to initiate SSO" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // This endpoint can be used to check if SSO is available for a domain
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    // Extract domain from email
    const domain = email.split("@")[1]?.toLowerCase();
    if (!domain) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }
    
    // Check if SSO is configured for this domain
    const ssoConfig = await ssoService.getConfigurationByDomain(domain);
    
    return NextResponse.json({
      available: !!ssoConfig,
      provider: ssoConfig?.provider,
    });
  } catch (error: any) {
    console.error("Failed to check SSO availability:", error);
    return NextResponse.json(
      { error: errorerror.message || "Failed to check SSO availability" },
      { status: 500 }
    );
  }
}