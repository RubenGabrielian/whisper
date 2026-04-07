import { NextResponse } from "next/server";

import { getDashboardUser } from "@/lib/auth/dashboard-user";
import { normalizeEmail } from "@/lib/auth/otp";
import { defaultProjectDashboardSettings } from "@/lib/projects/dashboard-settings";
import { dashboardSettingsToInsertRow, rowToClient } from "@/lib/projects/map";
import type { ProjectDashboardSettings } from "@/lib/projects/dashboard-settings";
import type { ProjectRow } from "@/lib/projects/types";
import { isValidHttpUrl, normalizeWebsiteUrl } from "@/lib/projects/url";
import { generateProjectApiKey } from "@/lib/projects/api-key";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const user = await getDashboardUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const owner = normalizeEmail(user.email);
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_email", owner)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[projects GET]", error);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }

  const rows = (data ?? []) as ProjectRow[];
  return NextResponse.json({ projects: rows.map(rowToClient) });
}

export async function POST(request: Request) {
  const user = await getDashboardUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const websiteRaw =
    typeof b.website_url === "string"
      ? b.website_url
      : typeof b.websiteUrl === "string"
        ? b.websiteUrl
        : "";

  if (name.length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
  }
  if (!isValidHttpUrl(websiteRaw)) {
    return NextResponse.json({ error: "Invalid website URL" }, { status: 400 });
  }

  const websiteUrl = normalizeWebsiteUrl(websiteRaw);
  const defaults = defaultProjectDashboardSettings();
  const settings: ProjectDashboardSettings = {
    ...defaults,
    projectName: name,
    websiteUrl,
  };

  const rowPayload = dashboardSettingsToInsertRow(settings);
  const owner_email = normalizeEmail(user.email);
  const supabase = createServiceRoleClient();

  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const api_key = generateProjectApiKey();

    const { data, error } = await supabase
      .from("projects")
      .insert({
        owner_email,
        status: "active",
        api_key,
        ...rowPayload,
      })
      .select("*")
      .single();

    if (!error && data) {
      return NextResponse.json({ project: rowToClient(data as ProjectRow) });
    }

    if (error?.code === "23505") {
      continue;
    }

    console.error("[projects POST]", error);
    return NextResponse.json(
      {
        error: "Failed to create project",
        details: error?.message ?? String(error),
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ error: "Could not allocate API key" }, { status: 503 });
}
