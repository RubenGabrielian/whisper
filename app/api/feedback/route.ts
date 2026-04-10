import { NextResponse } from "next/server";
import { Resend } from "resend";
import { parseFeedbackPayload } from "@/lib/api/feedback-payload";
import {
  buildFeedbackReportHtml,
  feedbackEmailSubject,
} from "@/lib/email/feedback-report-html";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { insertReportAndSendSummaryEmail } from "@/lib/reports/store-and-notify";
import { getAppOriginFromRequest } from "@/lib/app-url";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const projectId = process.env.FEEDBACK_PROJECT_ID?.trim();
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_TO_EMAIL;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing RESEND_API_KEY. Add it to your environment." },
      { status: 503 }
    );
  }
  if (!to) {
    return NextResponse.json(
      { error: "Missing FEEDBACK_TO_EMAIL. Set your inbox address in .env.local." },
      { status: 503 }
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseFeedbackPayload(json);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const from =
    process.env.RESEND_FROM?.trim() ||
    "Whybug <onboarding@resend.dev>";
  const iconBaseUrl = process.env.EMAIL_ICON_BASE_URL?.trim() || null;
  const replyTo = process.env.FEEDBACK_REPLY_TO?.trim();
  const appOrigin = getAppOriginFromRequest(req);

  /* ── With FEEDBACK_PROJECT_ID: store report + summary email (dashboard link) ── */
  if (projectId) {
    let supabase;
    try {
      supabase = createServiceRoleClient();
    } catch {
      return NextResponse.json(
        { error: "Server misconfigured (Supabase service role)." },
        { status: 503 }
      );
    }

    const { data: project, error: qErr } = await supabase
      .from("projects")
      .select("id, name, owner_email")
      .eq("id", projectId)
      .maybeSingle();

    if (qErr) {
      console.error("[feedback] project", qErr);
      return NextResponse.json({ error: "Could not load project" }, { status: 500 });
    }
    if (!project) {
      return NextResponse.json(
        { error: "FEEDBACK_PROJECT_ID does not match any project." },
        { status: 400 }
      );
    }

    const storeResult = await insertReportAndSendSummaryEmail({
      supabase,
      parsed,
      project: {
        id: project.id as string,
        name: typeof project.name === "string" ? project.name : "",
        owner_email: typeof project.owner_email === "string" ? project.owner_email : "",
      },
      notifyTo: to,
      appOrigin,
      resendApiKey: apiKey,
      resendFrom: from,
      ...(replyTo ? { replyTo } : {}),
    });

    if (!storeResult.ok) {
      return NextResponse.json(
        { error: storeResult.error || "Could not save report" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      reportId: storeResult.reportId,
      emailSent: storeResult.emailSent,
      ...(storeResult.emailSent
        ? { resendEmailId: storeResult.resendEmailId }
        : { emailError: storeResult.emailError }),
    });
  }

  /* ── Legacy: full HTML email only (no project / no DB row) ── */
  const html = buildFeedbackReportHtml({
    ...parsed,
    iconBaseUrl,
  });
  const subject = feedbackEmailSubject(parsed.message);

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      console.error("[feedback] Resend error:", error);
      return NextResponse.json(
        { error: error.message || "Email send failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (e) {
    console.error("[feedback]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
