import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createChunks } from "@supabase/ssr/dist/main/utils/chunker";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/supabase";

// Create a Supabase client for server-side usage (CORRECT PATTERN per Supabase docs)
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Next.js throws errors when setting cookies in Server Components
            // This is expected behavior - middleware will handle cookie refresh
          }
        },
      },
    },
  );
}

/**
 * Create a Supabase client for API routes (route handlers)
 * Based on the middleware pattern from Supabase docs
 *
 * IMPORTANT: For Route Handlers, you MUST return the response object
 * to ensure cookies are properly set in the browser.
 *
 * @param request - The NextRequest object
 * @returns Object with supabase client and cookieStore object
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const { supabase, cookieStore } = createAPISupabaseClient(request);
 *
 *   const { data, error } = await supabase.auth.signInWithPassword({...});
 *
 *   // cookieStore now contains the auth cookies that need to be set
 *   const response = NextResponse.json({ data });
 *   cookieStore.setAll(response);
 *   return response;
 * }
 * ```
 */
export function createAPISupabaseClient(request: NextRequest) {
  // Store cookies that need to be set
  const cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }> = [];

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Set cookie attributes
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        httpOnly: false, // Must be false for client-side access
        path: '/',
        maxAge: 60 * 60 * 24 * 400 // 400 days (max for Supabase)
      },
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll();
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [API Route] Reading cookies:', cookies.map(c => c.name).join(', ') || 'none');
          }
          return cookies;
        },
        setAll(cookiesToSet2) {
          // IMPORTANT: Manually chunk large cookies since we're bypassing Supabase SSR's storage layer
          const chunkedCookies: Array<{ name: string; value: string; options: CookieOptions }> = [];

          for (const cookie of cookiesToSet2) {
            const valueLength = cookie.value?.length || 0;

            // Chunk if cookie is larger than 2000 bytes (safe threshold)
            if (valueLength > 2000) {
              const chunks = createChunks(cookie.name, cookie.value, 2000);

              if (process.env.NODE_ENV === 'development') {
                console.log(`🧩 [API Route] Chunking large cookie ${cookie.name} (${valueLength} bytes) into ${chunks.length} chunks`);
              }

              chunks.forEach(chunk => {
                chunkedCookies.push({
                  name: chunk.name,
                  value: chunk.value,
                  options: {
                    ...cookie.options,
                    secure: process.env.NODE_ENV === 'production',
                  }
                });
              });
            } else {
              chunkedCookies.push({
                ...cookie,
                options: {
                  ...cookie.options,
                  secure: process.env.NODE_ENV === 'production',
                }
              });
            }
          }

          if (process.env.NODE_ENV === 'development') {
            console.log(`📝 [API Route] After chunking: ${chunkedCookies.length} cookies total`);
            chunkedCookies.forEach(c => {
              console.log(`   ${c.name}: httpOnly=${c.options?.httpOnly}, sameSite=${c.options?.sameSite}, valueLength=${c.value?.length || 0}`);
            });
          }

          // Store chunked cookies to be set later on the response
          cookiesToSet.push(...chunkedCookies);

          // Also set on request for immediate reading in this handler
          chunkedCookies.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
        },
      },
    }
  );

  // Helper to serialize cookie with options into Set-Cookie header string
  const serializeCookie = (name: string, value: string, options: CookieOptions): string => {
    const isDelete = !value || value.length === 0;
    let cookie = `${name}=${value}`;

    if (options.path) cookie += `; Path=${options.path}`;

    // CRITICAL: For cookie deletion (empty value), ALWAYS set Max-Age=0 to expire immediately
    // This overrides any maxAge value passed by Supabase
    if (isDelete) {
      cookie += '; Max-Age=0';
    } else if (options.maxAge) {
      cookie += `; Max-Age=${options.maxAge}`;
    }

    if (options.domain) cookie += `; Domain=${options.domain}`;

    // CRITICAL: For deletions, use Strict to ensure immediate deletion
    // For regular cookies, use the provided sameSite value
    if (isDelete) {
      cookie += '; SameSite=Strict';
    } else if (options.sameSite) {
      cookie += `; SameSite=${options.sameSite}`;
    }

    if (options.secure) cookie += '; Secure';
    if (options.httpOnly) cookie += '; HttpOnly';

    return cookie;
  };

  // Helper to apply collected cookies to a response
  const cookieStore = {
    setAll(response: NextResponse) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ [API Route] Applying cookies to response:', cookiesToSet.map(c => c.name).join(', '));
        // Debug: Show FINAL options being passed to headers
        cookiesToSet.forEach(c => {
          console.log(`   FINAL ${c.name}: httpOnly=${c.options.httpOnly}, secure=${c.options.secure}, sameSite=${c.options.sameSite}`);
        });
      }

      // IMPORTANT: Use headers.append() for ALL cookies
      // When Supabase deletes old chunks, it sends delete operations (empty value) first
      // Using set() for the first cookie could interfere with subsequent operations
      // See: https://github.com/vercel/next.js/discussions/48440

      // First, clear any existing set-cookie header to start fresh
      response.headers.delete('set-cookie');

      cookiesToSet.forEach(({ name, value, options }, index) => {
        const cookieString = serializeCookie(name, value, options);

        // Always use append() to ensure all cookies are sent
        response.headers.append('set-cookie', cookieString);

        if (process.env.NODE_ENV === 'development') {
          const isDelete = !value || value.length === 0;
          console.log(`   📤 [APPEND${isDelete ? ' DELETE' : ''}] ${name}: ${cookieString.substring(0, 60)}...`);
        }
      });
    },
  };

  return { supabase, cookieStore };
}

// Create admin client for server-side operations that bypass RLS
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createServerClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    serviceKey,
    {
      cookies: {
        get() {
          return null;
        },
        set() {},
        remove() {},
      },
    },
  );
}

// Deprecated: Use createServerSupabaseClient() instead
// This synchronous version is kept for backward compatibility but should not be used in API routes
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Handle cookie errors in server components
          }
        },
      },
    },
  );
}
