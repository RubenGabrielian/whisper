import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedFeedbackPayload } from "@/lib/api/feedback-payload";
import {
  buildReportSummaryEmailHtml,
  reportSummaryEmailSubject,
} from "@/lib/email/report-summary-html";
import { normalizeEmail } from "@/lib/auth/otp";
import { payloadToReportInsert } from "./db-map";

export type StoreReportResult =
  | { ok: true; reportId: string; emailSent: true; resendEmailId: string | null }
  | { ok: true; reportId: string; emailSent: false; emailError: string }
  | { ok: false; error: string };

export async function insertReportAndSendSummaryEmail(params: {
  supabase: SupabaseClient;
  parsed: ParsedFeedbackPayload;
  project: { id: string; name: string; owner_email: string };
  notifyTo: string;
  appOrigin: string;
  resendApiKey: string;
  resendFrom: string;
  replyTo?: string;
}): Promise<StoreReportResult> {
  const {
    supabase,
    parsed,
    project,
    notifyTo,
    appOrigin,
    resendApiKey,
    resendFrom,
    replyTo,
  } = params;

  const owner_email = normalizeEmail(project.owner_email);
  const row = payloadToReportInsert({
    projectId: project.id,
    ownerEmail: owner_email,
    parsed,
  });

  const { data: inserted, error: insErr } = await supabase
    .from("reports")
    .insert(row)
    .select("id")
    .single();

  if (insErr || !inserted?.id) {
    console.error("[reports] insert", {
      message: insErr?.message,
      code: insErr?.code,
      details: insErr?.details,
      hint: insErr?.hint,
    });
    const hint =
      insErr?.code === "42P01" || /relation|does not exist/i.test(String(insErr?.message ?? ""))
        ? " Run supabase/migrations/20260410120000_reports.sql in your Supabase project."
        : "";
    return {
      ok: false,
      error: (insErr?.message ?? "Could not save report") + hint,
    };
  }

  const reportId = inserted.id as string;
  const dashboardReportUrl = `${appOrigin.replace(/\/$/, "")}/dashboard/reports/${reportId}`;

  const html = buildReportSummaryEmailHtml({
    message: parsed.message,
    context: parsed.context,
    dashboardReportUrl,
    projectName: project.name,
  });
  const subject = reportSummaryEmailSubject(project.name, parsed.message);

  try {
    const resend = new Resend(resendApiKey);
    const { data, error } = await resend.emails.send({
      from: resendFrom,
      to: [notifyTo],
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });

    if (error) {
      console.error("[reports] Resend error:", error);
      return {
        ok: true,
        reportId,
        emailSent: false,
        emailError: error.message ?? "Email send failed",
      };
    }

    return {
      ok: true,
      reportId,
      emailSent: true,
      resendEmailId: data?.id ?? null,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Email send failed";
    console.error("[reports] email", e);
    return {
      ok: true,
      reportId,
      emailSent: false,
      emailError: msg,
    };
  }
}
