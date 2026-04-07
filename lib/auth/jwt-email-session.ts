import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const EMAIL_SESSION_COOKIE = "whisper_email_session";

const ISS = "whisper";
const AUD = "email-otp-session";

function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SESSION_SECRET;
  if (!raw || raw.length < 32) {
    throw new Error("AUTH_SESSION_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(raw);
}

export type EmailSessionPayload = JWTPayload & {
  email: string;
  typ: "email_otp";
};

export async function signEmailSessionToken(email: string): Promise<string> {
  return new SignJWT({
    email,
    typ: "email_otp",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISS)
    .setAudience(AUD)
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyEmailSessionToken(
  token: string
): Promise<EmailSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISS,
      audience: AUD,
    });
    const email = payload.email;
    if (typeof email !== "string" || !email.includes("@")) return null;
    if (payload.typ !== "email_otp") return null;
    return payload as EmailSessionPayload;
  } catch {
    return null;
  }
}
