import { createClient } from "@/lib/supabase/client";

/**
 * Start Supabase Google OAuth (browser only).
 *
 * **Google Cloud — Authorized redirect URIs (fixes `redirect_uri_mismatch`):**
 * Add exactly one URI for Supabase (not your app’s localhost URL):
 *   `https://<project-ref>.supabase.co/auth/v1/callback`
 * The project ref is in the Supabase dashboard URL. Google validates this URI because
 * the OAuth flow returns to Supabase first; Supabase then redirects to your `redirectTo`
 * (`/auth/callback` on your site).
 *
 * **Supabase Dashboard** → Authentication → URL Configuration: add your site
 * `http://localhost:3000/**` and production URL under Redirect URLs (for after Supabase
 * finishes). Providers → Google: paste Google Client ID + Secret.
 */
export async function startGoogleSignIn(nextPath: string): Promise<{ error?: string }> {
  if (typeof window === "undefined") {
    return { error: "Google sign-in is only available in the browser." };
  }

  const supabase = createClient();
  const origin = window.location.origin;
  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
  const next = encodeURIComponent(safeNext);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${next}`,
      scopes: "email profile openid",
      queryParams: {
        access_type: "online",
        prompt: "select_account",
      },
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data?.url) {
    window.location.assign(data.url);
    return {};
  }

  return { error: "Could not start Google sign-in. Check Supabase Google provider settings." };
}
