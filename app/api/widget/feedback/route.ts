import { NextResponse } from "next/server";
import { Resend } from "resend";
import { parseFeedbackPayload } from "@/lib/api/feedback-payload";
import {
  buildFeedbackReportHtml,
  widgetFeedbackEmailSubject,
} from "@/lib/email/feedback-report-html";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Whisper-Key",
  "Access-Control-Max-Age": "86400",
};

function corsJson(
  body: Record<string, unknown>,
  status = 200,
  extraHeaders?: Record<string, string>
) {
  return NextResponse.json(body, {
    status,
    headers: { ...CORS, ...extraHeaders },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export async function POST(req: Request) {
  const apiKey =
    req.headers.get("x-whisper-key")?.trim() ||
    req.headers.get("X-Whisper-Key")?.trim() ||
    "";

  let jsonBody: unknown;
  try {
    jsonBody = await req.json();
  } catch {
    return corsJson({ error: "Invalid JSON body" }, 400);
  }

  const keyFromBody =
    typeof jsonBody === "object" &&
      jsonBody !== null &&
      "apiKey" in jsonBody &&
      typeof (jsonBody as { apiKey?: unknown }).apiKey === "string"
      ? (jsonBody as { apiKey: string }).apiKey.trim()
      : "";

  const resolvedKey = apiKey || keyFromBody;
  if (!resolvedKey) {
    return corsJson({ error: "Missing API key (X-Whisper-Key header or apiKey in body)" }, 401);
  }

  const parsed = parseFeedbackPayload(jsonBody);
  if (!parsed) {
    return corsJson({ error: "Invalid payload" }, 400);
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch (e) {
    console.error("[widget/feedback]", e);
    return corsJson(
      { error: "Server is not configured for widget feedback (Supabase service role)." },
      503
    );
  }

  const { data: project, error: qErr } = await supabase
    .from("projects")
    .select("id, status, name, owner_email, alert_email")
    .eq("api_key", resolvedKey)
    .maybeSingle();

  if (qErr) {
    console.error("[widget/feedback] lookup", qErr);
    return corsJson({ error: "Could not validate project" }, 500);
  }
  if (!project || project.status !== "active") {
    return corsJson({ error: "Invalid or inactive project key" }, 403);
  }

  const alert = typeof project.alert_email === "string" ? project.alert_email.trim() : "";
  const owner = typeof project.owner_email === "string" ? project.owner_email.trim() : "";
  const to = looksLikeEmail(alert) ? alert : owner;
  if (!to || !looksLikeEmail(to)) {
    return corsJson({ error: "Project has no valid notification email" }, 503);
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return corsJson(
      { error: "Missing RESEND_API_KEY. Add it to your environment." },
      503
    );
  }

  const from =
    process.env.RESEND_FROM?.trim() || "Whisper <onboarding@resend.dev>";
  const iconBaseUrl = process.env.EMAIL_ICON_BASE_URL?.trim() || null;
  const replyTo = process.env.FEEDBACK_REPLY_TO?.trim();

  const projectName = typeof project.name === "string" ? project.name : "";
  const html = buildFeedbackReportHtml({
    ...parsed,
    iconBaseUrl,
  });
  const subject = widgetFeedbackEmailSubject(projectName, parsed.message);

  try {
    const resend = new Resend(resendKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      console.error("[widget/feedback] Resend error:", error);
      return corsJson({ error: error.message || "Email send failed" }, 502);
    }

    return corsJson({ ok: true, id: data?.id ?? null });
  } catch (e) {
    console.error("[widget/feedback]", e);
    return corsJson(
      { error: e instanceof Error ? e.message : "Server error" },
      500
    );
  }
}
