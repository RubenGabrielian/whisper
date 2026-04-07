import { cookies } from "next/headers";
import {
  EMAIL_SESSION_COOKIE,
  verifyEmailSessionToken,
} from "./jwt-email-session";

/** Server Components / Route Handlers — email from OTP cookie or null. */
export async function getEmailSessionEmail(): Promise<string | null> {
  const jar = cookies();
  const token = jar.get(EMAIL_SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyEmailSessionToken(token);
  return payload?.email ?? null;
}
