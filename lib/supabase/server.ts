import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireSupabaseBrowserConfig } from "./env";

export function createClient() {
  const cookieStore = cookies();
  const { url, anonKey } = requireSupabaseBrowserConfig();

  return createServerClient(
    url,
    anonKey,
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
          } catch {
            // Called from a Server Component; middleware keeps sessions fresh.
          }
        },
      },
    }
  );
}
