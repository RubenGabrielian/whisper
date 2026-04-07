import { createHash, randomInt, timingSafeEqual } from "crypto";

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_LENGTH = 6;

/** Same normalization for send-otp (DB key) and hashOtp. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase().normalize("NFKC");
}

export function generateOtpCode(): string {
  const n = randomInt(0, 1_000_000);
  return String(n).padStart(OTP_LENGTH, "0");
}

export function hashOtp(email: string, code: string): string {
  const pepper = process.env.OTP_PEPPER ?? process.env.AUTH_SESSION_SECRET ?? "";
  const e = normalizeEmail(email);
  const digits = code.replace(/\D/g, "").slice(0, OTP_LENGTH).padStart(OTP_LENGTH, "0");
  return createHash("sha256")
    .update(`${e}:${digits}:${pepper}`)
    .digest("hex");
}

/** Constant-time compare for hex hashes. */
export function hashesEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}

export function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
