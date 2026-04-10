import { NextResponse } from "next/server";
import { Resend } from "resend";
import { parseFeedbackPayload } from "@/lib/api/feedback-payload";
import {
  buildFeedbackReportHtml,
  feedbackEmailSubject,
} from "@/lib/email/feedback-report-html";

export const runtime = "nodejs";

export async function POST(req: Request) {
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

  const html = buildFeedbackReportHtml({
    ...parsed,
    iconBaseUrl,
  });
  const subject = feedbackEmailSubject(parsed.message);

  try {
    const resend = new Resend(apiKey);
    const replyTo = process.env.FEEDBACK_REPLY_TO?.trim();

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
