import { NextResponse } from "next/server";

import { getDashboardUser } from "@/lib/auth/dashboard-user";
import { normalizeEmail } from "@/lib/auth/otp";
import {
  dashboardSettingsToInsertRow,
  dashboardSettingsToRowUpdate,
  rowToClient,
} from "@/lib/projects/map";
import type { ProjectDashboardSettings } from "@/lib/projects/dashboard-settings";
import type { ProjectRow } from "@/lib/projects/types";
import { isValidHttpUrl, normalizeWebsiteUrl } from "@/lib/projects/url";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const THEMES = new Set(["light", "dark", "system"]);
const POSITIONS = new Set(["bottom-right", "bottom-left"]);

function isSettingsBody(body: unknown): body is ProjectDashboardSettings {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.projectName === "string" &&
    typeof b.websiteUrl === "string" &&
    typeof b.theme === "string" &&
    typeof b.accentColor === "string" &&
    typeof b.position === "string" &&
    typeof b.widgetLabel === "string" &&
    typeof b.captureConsole === "boolean" &&
    typeof b.captureNetworkFailuresOnly === "boolean" &&
    typeof b.sessionTimelineEnabled === "boolean" &&
    typeof b.captureDeviceMetadata === "boolean" &&
    typeof b.alertEmail === "string" &&
    typeof b.slackWebhookUrl === "string" &&
    typeof b.discordWebhookUrl === "string"
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const user = await getDashboardUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const id = params.id;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isSettingsBody(body)) {
    return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
  }

  const s = body;
  if (s.projectName.trim().length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  }
  if (!isValidHttpUrl(s.websiteUrl)) {
    return NextResponse.json({ error: "Invalid website URL" }, { status: 400 });
  }
  if (!THEMES.has(s.theme) || !POSITIONS.has(s.position)) {
    return NextResponse.json({ error: "Invalid theme or position" }, { status: 400 });
  }

  const normalized: ProjectDashboardSettings = {
    ...s,
    websiteUrl: normalizeWebsiteUrl(s.websiteUrl.trim()),
  };

  const owner = normalizeEmail(user.email);
  const supabase = createServiceRoleClient();

  const { data: row, error: fetchError } = await supabase
    .from("projects")
    .select("owner_email")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !row) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const rowData = row as { owner_email: string };
  if (normalizeEmail(rowData.owner_email) !== owner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fullUpdate = dashboardSettingsToRowUpdate(normalized);

  let updated: unknown = null;
  let updateError: { message?: string; code?: string } | null = null;

  const first = await supabase
    .from("projects")
    .update(fullUpdate)
    .eq("id", id)
    .select("*")
    .single();

  updated = first.data;
  updateError = first.error;

  if (updateError) {
    const minimal = dashboardSettingsToInsertRow(normalized);
    const second = await supabase
      .from("projects")
      .update(minimal)
      .eq("id", id)
      .select("*")
      .single();
    updated = second.data;
    updateError = second.error;
    if (updateError) {
      console.error("[projects PATCH]", first.error, second.error);
      return NextResponse.json(
        {
          error: "Failed to save project",
          details: second.error?.message ?? first.error?.message,
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ project: rowToClient(updated as ProjectRow) });
}
