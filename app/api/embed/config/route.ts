import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/**
 * Public embed config for the widget loader. `id` is the project's `api_key`
 * (`data-id` on the script tag). Used cross-origin from customer sites.
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim() ?? "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400, headers: CORS });
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    console.error("[embed/config]", e);
    return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 503, headers: CORS });
  }

  const { data: row, error: qErr } = await supabase
    .from("projects")
    .select(
      "status, widget_theme, accent_color, widget_position, widget_label, session_timeline_enabled, session_timeline_seconds, capture_device_metadata"
    )
    .eq("api_key", id)
    .maybeSingle();

  if (qErr) {
    console.error("[embed/config] lookup", qErr);
    return NextResponse.json({ ok: false, error: "Could not load config" }, { status: 500, headers: CORS });
  }

  if (!row || row.status !== "active") {
    return NextResponse.json({ ok: false, error: "Invalid or inactive project key" }, { status: 403, headers: CORS });
  }

  const wt = row.widget_theme;
  const theme = wt === "light" || wt === "dark" || wt === "system" ? wt : "system";
  const position = row.widget_position === "bottom-left" ? "bottom-left" : "bottom-right";
  const sec = row.session_timeline_seconds;
  const sessionTimelineSeconds = sec === 10 || sec === 30 || sec === 60 ? sec : 30;

  const accent =
    typeof row.accent_color === "string" && row.accent_color.trim()
      ? row.accent_color.trim()
      : "#06b6d4";
  const widgetLabel =
    typeof row.widget_label === "string" && row.widget_label.trim()
      ? row.widget_label.trim()
      : "Send Feedback";

  return NextResponse.json(
    {
      ok: true,
      theme,
      accentColor: accent,
      position,
      widgetLabel,
      sessionTimelineEnabled: row.session_timeline_enabled ?? true,
      sessionTimelineSeconds,
      captureDeviceMetadata: row.capture_device_metadata ?? true,
    },
    { headers: CORS }
  );
}
