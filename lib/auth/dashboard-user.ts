import { createClient } from "@/lib/supabase/server";
import { getEmailSessionEmail } from "./email-session-server";

export type DashboardUser =
  | {
      source: "google";
      email: string;
      name: string | null;
      avatar: string | null;
    }
  | { source: "email_otp"; email: string };

export async function getDashboardUser(): Promise<DashboardUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    const meta = user.user_metadata as Record<string, unknown> | undefined;
    const name =
      (typeof meta?.full_name === "string" && meta.full_name) ||
      (typeof meta?.name === "string" && meta.name) ||
      null;
    const avatar =
      (typeof meta?.avatar_url === "string" && meta.avatar_url) ||
      (typeof meta?.picture === "string" && meta.picture) ||
      null;

    return {
      source: "google",
      email: user.email,
      name,
      avatar,
    };
  }

  const email = await getEmailSessionEmail();
  if (email) return { source: "email_otp", email };

  return null;
}
