import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import {
  hashOtp,
  hashesEqual,
  isValidEmail,
  normalizeEmail,
  OTP_LENGTH,
} from "@/lib/auth/otp";
import {
  EMAIL_SESSION_COOKIE,
  signEmailSessionToken,
} from "@/lib/auth/jwt-email-session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { email: rawEmail, code: rawCode } = body as {
    email?: unknown;
    code?: unknown;
  };

  const email =
    typeof rawEmail === "string" ? normalizeEmail(rawEmail) : "";
  const codeDigits =
    typeof rawCode === "string"
      ? rawCode.replace(/\D/g, "").slice(0, OTP_LENGTH).padStart(OTP_LENGTH, "0")
      : "";

  if (!isValidEmail(email) || codeDigits.length !== OTP_LENGTH) {
    return NextResponse.json({ error: "Invalid email or code." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "Server misconfigured." }, { status: 503 });
  }

  const { data: row, error: fetchError } = await supabase
    .from("email_otp_challenges")
    .select("code_hash, expires_at")
    .eq("email", email)
    .maybeSingle();

  if (fetchError || !row) {
    return NextResponse.json(
      { error: "Code expired or not found. Request a new code." },
      { status: 400 }
    );
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await supabase.from("email_otp_challenges").delete().eq("email", email);
    return NextResponse.json(
      { error: "Code expired. Request a new code." },
      { status: 400 }
    );
  }

  const expectedHash = hashOtp(email, codeDigits);
  if (!hashesEqual(row.code_hash, expectedHash)) {
    return NextResponse.json({ error: "Incorrect code." }, { status: 400 });
  }

  let token: string;
  try {
    token = await signEmailSessionToken(email);
  } catch (e) {
    console.error("[verify-otp] JWT sign failed — set AUTH_SESSION_SECRET (32+ chars)", e);
    return NextResponse.json(
      {
        error:
          "Server misconfigured: add AUTH_SESSION_SECRET (at least 32 characters) to .env.local and restart the dev server.",
      },
      { status: 503 }
    );
  }

  const { error: delError } = await supabase
    .from("email_otp_challenges")
    .delete()
    .eq("email", email);

  if (delError) {
    console.error("[verify-otp] delete challenge", delError);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(EMAIL_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
