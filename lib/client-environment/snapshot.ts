import type { ClientEnvironmentSnapshot } from "./types";
import { parseUserAgent } from "./parse-user-agent";

export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof navigator !== "undefined";
}

/**
 * Reads live `window` / `navigator` / `document` state. Call only in the browser (e.g. inside `useEffect`).
 */
export function getClientEnvironmentSnapshot(): ClientEnvironmentSnapshot {
  if (!isBrowser()) {
    throw new Error("getClientEnvironmentSnapshot() must run in the browser");
  }

  const userAgent = navigator.userAgent;
  const parsed = parseUserAgent(userAgent);
  const w = window.screen.width;
  const h = window.screen.height;
  const dpr = window.devicePixelRatio || 1;
  const dprLabel = Number.isInteger(dpr) ? `${dpr}x` : `${dpr.toFixed(2)}x`;

  return {
    userAgent,
    parsed,
    screenResolutionPlain: `${w}×${h}`,
    screenResolutionWithDpr: `${w}×${h} (@${dprLabel})`,
    windowSize: `${window.innerWidth}×${window.innerHeight}`,
    devicePixelRatio: dpr,
    devicePixelRatioLabel: dprLabel,
    language: navigator.language,
    languages: Object.freeze([...navigator.languages]),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    url: window.location.href,
    referrer: document.referrer ?? "",
    cookiesEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
  };
}
