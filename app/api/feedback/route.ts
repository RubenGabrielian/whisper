import { NextResponse } from "next/server";
import { Resend } from "resend";
import { parseFeedbackPayload } from "@/lib/api/feedback-payload";
import {
  buildFeedbackReportHtml,
  feedbackEmailSubject,
} from "@/lib/email/feedback-report-html";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { insertReportAndSendSummaryEmail } from "@/lib/reports/store-and-notify";
import { resolveProjectForLandingFeedback } from "@/lib/reports/resolve-project";
import { getAppOriginFromRequest } from "@/lib/app-url";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const explicitProjectId = process.env.FEEDBACK_PROJECT_ID?.trim() || null;
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

  /* ── Try Supabase: store report + summary email (same as widget flow) ── */
  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    supabase = null;
  }

  if (supabase) {
    const resolved = await resolveProjectForLandingFeedback(supabase, {
      feedbackToEmail: to,
      explicitProjectId,
    });

    if ("project" in resolved) {
      const storeResult = await insertReportAndSendSummaryEmail({
        supabase,
        parsed,
        project: resolved.project,
        notifyTo: to,
        appOrigin,
        resendApiKey: apiKey,
        resendFrom: from,
        ...(replyTo ? { replyTo } : {}),
      });

      if (!storeResult.ok) {
        return NextResponse.json(
          {
            error: storeResult.error || "Could not save report",
            ...(process.env.NODE_ENV === "development" && {
              hint: "Check Supabase for the reports table and service role key.",
            }),
          },
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

    /* Resolved error: no project — fall through to legacy email only if configured */
    const allowLegacy =
      process.env.FEEDBACK_EMAIL_WITHOUT_PROJECT === "1" ||
      process.env.FEEDBACK_EMAIL_WITHOUT_PROJECT === "true";

    if (!allowLegacy) {
      return NextResponse.json(
        {
          error: resolved.error,
          hint:
            "Create a Whybug project while signed in with the same address as FEEDBACK_TO_EMAIL, or set FEEDBACK_PROJECT_ID. To allow full HTML emails without saving reports, set FEEDBACK_EMAIL_WITHOUT_PROJECT=true.",
        },
        { status: 503 }
      );
    }
  }

  /* ── Legacy: full HTML email only (no DB) — missing Supabase or explicit opt-in with no project ── */
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
