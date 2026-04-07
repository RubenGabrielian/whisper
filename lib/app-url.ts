import { headers } from "next/headers";

/**
 * Public origin for this deployment (used in install snippets, emails, etc.).
 * Prefer `NEXT_PUBLIC_APP_URL`; otherwise derive from the incoming request.
 */
export function getAppOriginFromHeaders(): string {
  const env = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (env) return env.replace(/\/$/, "");

  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const rawProto = h.get("x-forwarded-proto");
  const proto =
    rawProto?.split(",")[0]?.trim() ||
    (host?.includes("localhost") ? "http" : "https");
  if (host) {
    const cleanHost = host.split(",")[0]?.trim();
    if (cleanHost) return `${proto}://${cleanHost}`;
  }

  return "http://localhost:3000";
}
