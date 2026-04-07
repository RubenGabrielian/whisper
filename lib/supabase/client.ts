import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseBrowserConfig } from "./env";

export function createClient() {
  const { url, anonKey } = requireSupabaseBrowserConfig();
  return createBrowserClient(url, anonKey);
}
