/** Accepts `myapp.com` or full URL — normalizes for storage. */
export function normalizeWebsiteUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function isValidHttpUrl(raw: string): boolean {
  try {
    const u = new URL(normalizeWebsiteUrl(raw));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
