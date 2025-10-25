import { NextRequest, NextResponse } from "next/server";

/**
 * Mobile Detection and Redirect Middleware
 * Automatically redirects mobile users to the PWA chat interface
 */
export function mobileRedirect(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const url = request.nextUrl.clone();

  // Check if it's a mobile device
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);

  // Check if user is on the main app but should be on mobile
  const isOnMainApp = url.pathname.startsWith("/dashboard") ||
                      url.pathname === "/" ||
                      url.pathname.startsWith("/buildings");

  // Check if user is on mobile but trying to access desktop features
  const isOnMobile = url.pathname.startsWith("/mobile");

  // Redirect mobile users to mobile chat
  if (isMobile && isOnMainApp && !isOnMobile) {
    url.pathname = "/mobile";
    return NextResponse.redirect(url);
  }

  // Redirect desktop users away from mobile pages (optional)
  if (!isMobile && isOnMobile) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}