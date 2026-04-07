import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

function safeInternalPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}

/**
 * OAuth redirect target. Session cookies must be set on this response so the
 * browser stores the Supabase session after Google (or other provider) login.
 */
export async function GET(request: Request) {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  const { searchParams, origin } = new URL(request.url);

  if (!url || !anonKey) {
    return NextResponse.redirect(new URL("/auth/auth-code-error", origin));
  }

  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"));

  const fail = NextResponse.redirect(new URL("/auth/auth-code-error", origin));

  if (!code) {
    return fail;
  }

  const success = NextResponse.redirect(new URL(`${next}`, origin));

  const cookieStore = cookies();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          success.cookies.set(name, value, options)
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback] exchangeCodeForSession", error);
    return fail;
  }

  return success;
}
