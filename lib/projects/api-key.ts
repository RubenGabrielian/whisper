import { randomUUID } from "node:crypto";

/** Server-only: unique Whisper public key for embed script. */
export function generateProjectApiKey(): string {
  const part = randomUUID().replace(/-/g, "").slice(0, 24);
  return `wsp_live_${part}`;
}
