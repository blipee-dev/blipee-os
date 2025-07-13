import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider } = body;

    if (!provider || !["google", "azure"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const supabase = createClient();
    const redirectTo = `${request.nextUrl.origin}/auth/callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as "google" | "azure",
      options: {
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
      console.error("OAuth error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      url: data.url,
      provider,
    });
  } catch (error: any) {
    console.error("OAuth route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
