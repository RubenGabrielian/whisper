import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { buildOtpSignInEmailHtml } from "@/lib/email/otp-sign-in-html";
import {
  generateOtpCode,
  hashOtp,
  isValidEmail,
  normalizeEmail,
  OTP_TTL_MS,
} from "@/lib/auth/otp";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email =
    typeof body === "object" &&
      body !== null &&
      "email" in body &&
      typeof (body as { email: unknown }).email === "string"
      ? normalizeEmail((body as { email: string }).email)
      : "";

  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json(
      { error: "Email is not configured (RESEND_API_KEY)." },
      { status: 503 }
    );
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return NextResponse.json(
      { error: "Server misconfigured (SUPABASE_SERVICE_ROLE_KEY)." },
      { status: 503 }
    );
  }

  const code = generateOtpCode();
  const codeHash = hashOtp(email, code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { error: dbError } = await supabase.from("email_otp_challenges").upsert(
    {
      email,
      code_hash: codeHash,
      expires_at: expiresAt,
    },
    { onConflict: "email" }
  );

  if (dbError) {
    console.error("[send-otp]", dbError);
    const missingTable =
      dbError.code === "42P01" ||
      /relation|does not exist|schema cache/i.test(String(dbError.message ?? ""));
    const msg = missingTable
      ? "Database table missing: open Supabase → SQL Editor, run the SQL in supabase/migrations/20260406120000_email_otp_challenges.sql, then retry."
      : "Could not save sign-in code. Check SUPABASE_SERVICE_ROLE_KEY and Supabase logs.";
    return NextResponse.json(
      {
        error: msg,
        ...(process.env.NODE_ENV === "development" && {
          detail: dbError.message,
          code: dbError.code,
        }),
      },
      { status: 500 }
    );
  }

  const resend = new Resend(resendKey);
  const from =
    process.env.RESEND_FROM_OTP ??
    process.env.RESEND_FROM ??
    "Whisper <onboarding@resend.dev>";

  const { error: sendError } = await resend.emails.send({
    from,
    to: email,
    subject: "Your Whisper sign-in code",
    html: buildOtpSignInEmailHtml({ code }),
  });

  if (sendError) {
    console.error("[send-otp] Resend", sendError);
    await supabase.from("email_otp_challenges").delete().eq("email", email);
    return NextResponse.json(
      { error: "Could not send email. Check RESEND_API_KEY and domain." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
