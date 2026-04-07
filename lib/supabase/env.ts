/**
 * Resolve Supabase URL + browser key from env.
 * Supports `NEXT_PUBLIC_SUPABASE_ANON_KEY` (JWT `eyJ...`) or, in newer dashboards,
 * `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (`sb_publishable_...`) as fallback.
 */
export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || undefined;
}

export function getSupabaseAnonKey(): string | undefined {
  const a = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (a) return a;
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?.trim() || undefined;
}

export function requireSupabaseBrowserConfig(): { url: string; anonKey: string } {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "(or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) in .env.local — see https://supabase.com/dashboard/project/_/settings/api"
    );
  }
  return { url, anonKey };
}
