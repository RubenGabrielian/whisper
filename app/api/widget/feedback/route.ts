import { NextResponse } from "next/server";
import { parseFeedbackPayload } from "@/lib/api/feedback-payload";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { insertReportAndSendSummaryEmail } from "@/lib/reports/store-and-notify";
import { getAppOriginFromRequest } from "@/lib/app-url";

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

function looksLikeSlackWebhook(url: string): boolean {
  const u = url.trim();
  // Slack incoming webhooks use the `hooks.slack.com/services/...` pattern.
  // Be permissive (Slack may change token formats).
  return /^https:\/\/hooks\.slack\.com\/services\/\S+$/i.test(u);
}

async function sendSlackWebhook(params: {
  webhookUrl: string;
  projectName: string;
  message: string;
  pageUrl: string;
  consoleCount: number;
  networkCount: number;
}) {
  const { webhookUrl, projectName, message, pageUrl, consoleCount, networkCount } = params;
  const title = projectName ? `Whisper · ${projectName}` : "Whisper";

  // Use plain {text} for maximum compatibility with all webhook setups/workspaces.
  const lines = [
    `*${title}*`,
    `*New feedback:* ${message}`,
    pageUrl ? `*Page:* ${pageUrl}` : null,
    `*Console:* ${consoleCount}  ·  *Network:* ${networkCount}`,
  ].filter(Boolean);
  const payload = { text: lines.join("\n") };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Slack webhook failed (${res.status}): ${txt.slice(0, 200)}`);
  }
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
    .select("id, status, name, owner_email, alert_email, slack_webhook_url")
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
    process.env.RESEND_FROM?.trim() || "Whybug <onboarding@resend.dev>";
  const replyTo = process.env.FEEDBACK_REPLY_TO?.trim();
  const appOrigin = getAppOriginFromRequest(req);

  const projectName = typeof project.name === "string" ? project.name : "";
  const projectRow = {
    id: project.id as string,
    name: projectName,
    owner_email: owner,
  };

  try {
    const storeResult = await insertReportAndSendSummaryEmail({
      supabase,
      parsed,
      project: projectRow,
      notifyTo: to,
      appOrigin,
      resendApiKey: resendKey,
      resendFrom: from,
      ...(replyTo ? { replyTo } : {}),
    });

    if (!storeResult.ok) {
      return corsJson({ error: storeResult.error || "Could not save report" }, 500);
    }

    // Slack is best-effort: don't fail the request if webhook fails.
    let slackSent = false;
    const slackUrl =
      typeof (project as { slack_webhook_url?: unknown }).slack_webhook_url === "string"
        ? (project as { slack_webhook_url: string }).slack_webhook_url.trim()
        : "";
    if (slackUrl && looksLikeSlackWebhook(slackUrl)) {
      try {
        await sendSlackWebhook({
          webhookUrl: slackUrl,
          projectName,
          message: parsed.message,
          pageUrl: parsed.context.url,
          consoleCount: parsed.console.length,
          networkCount: parsed.network.length,
        });
        slackSent = true;
      } catch (e) {
        console.error("[widget/feedback] Slack webhook error:", e);
      }
    }

    return corsJson({
      ok: true,
      reportId: storeResult.reportId,
      emailSent: storeResult.emailSent,
      ...(storeResult.emailSent
        ? { resendEmailId: storeResult.resendEmailId }
        : { emailError: storeResult.emailError }),
      slackSent,
    });
  } catch (e) {
    console.error("[widget/feedback]", e);
    return corsJson(
      { error: e instanceof Error ? e.message : "Server error" },
      500
    );
  }
}
