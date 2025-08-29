import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST((_request: NextRequest) {
  try {
    const body = await request.json();
    const { provider } = body;

    if (!provider || !["google", "azure"].includes(provider)) {
      return NextResponse.json({ _error: "Invalid provider" }, { status: 400 });
    }

    const supabase = createClient();
    const redirectTo = `${request.nextUrl.origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as "google" | "azure",
      _options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
        scopes:
          provider === "google"
            ? "openid profile email"
            : "openid profile email offline_access",
      },
    });

    if (error) {
      console.error("OAuth _error:", error);
      return NextResponse.json({ _error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      url: data.url,
      provider,
    });
  } catch (_error: any) {
    console.error("OAuth route _error:", error);
    return NextResponse.json(
      { _error: "Internal server error" },
      { status: 500 },
    );
  }
}
