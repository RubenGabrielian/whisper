import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail } from "@/lib/auth/otp";

export type FeedbackProjectRow = {
  id: string;
  name: string;
  owner_email: string;
};

/**
 * Resolve which project should own a landing-page feedback report.
 * 1) FEEDBACK_PROJECT_ID when set and valid+active
 * 2) Else newest active project whose owner_email matches FEEDBACK_TO_EMAIL (normalized)
 */
export async function resolveProjectForLandingFeedback(
  supabase: SupabaseClient,
  params: { feedbackToEmail: string; explicitProjectId?: string | null }
): Promise<{ project: FeedbackProjectRow } | { error: string }> {
  const inbox = normalizeEmail(params.feedbackToEmail);
  const explicit = params.explicitProjectId?.trim();

  if (explicit) {
    const { data, error } = await supabase
      .from("projects")
      .select("id, name, owner_email, status")
      .eq("id", explicit)
      .maybeSingle();

    if (error) {
      console.error("[reports] resolve explicit project", error);
      return { error: "Could not load project" };
    }
    if (!data || data.status !== "active") {
      return { error: "FEEDBACK_PROJECT_ID does not match any active project." };
    }
    return {
      project: {
        id: data.id as string,
        name: typeof data.name === "string" ? data.name : "",
        owner_email: typeof data.owner_email === "string" ? data.owner_email : "",
      },
    };
  }

  const { data, error } = await supabase
    .from("projects")
    .select("id, name, owner_email, status")
    .eq("owner_email", inbox)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[reports] resolve project by owner email", error);
    return { error: "Could not look up project" };
  }
  if (!data) {
    return {
      error:
        "No active project found for this inbox. Use the same email in FEEDBACK_TO_EMAIL as your dashboard login, or set FEEDBACK_PROJECT_ID to your project UUID.",
    };
  }

  return {
    project: {
      id: data.id as string,
      name: typeof data.name === "string" ? data.name : "",
      owner_email: typeof data.owner_email === "string" ? data.owner_email : "",
    },
  };
}
