import type { ParsedUserAgent } from "./types";

/**
 * Best-effort User-Agent parsing (no dependencies). Order matters: Edge/Opera before Chrome; Safari excludes Chrome.
 */
export function parseUserAgent(ua: string): ParsedUserAgent {
  let browser = "Unknown";
  let browserVersion = "";
  let os = "Unknown";

  if (/Edg\//.test(ua)) {
    browser = "Edge";
    browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] ?? "";
  } else if (/OPR\//.test(ua)) {
    browser = "Opera";
    browserVersion = ua.match(/OPR\/([\d.]+)/)?.[1] ?? "";
  } else if (/Chrome\//.test(ua)) {
    browser = "Chrome";
    browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] ?? "";
  } else if (/Firefox\//.test(ua)) {
    browser = "Firefox";
    browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] ?? "";
  } else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) {
    browser = "Safari";
    browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] ?? "";
  }

  if (/Windows NT 10/.test(ua)) os = "Windows 10/11";
  else if (/Windows NT 6\.3/.test(ua)) os = "Windows 8.1";
  else if (/Windows NT 6\.1/.test(ua)) os = "Windows 7";
  else if (/Mac OS X ([\d_]+)/.test(ua)) {
    const v = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, ".") ?? "";
    os = v ? `macOS ${v}` : "macOS";
  } else if (/iPhone OS ([\d_]+)/.test(ua)) {
    const v = ua.match(/iPhone OS ([\d_]+)/)?.[1]?.replace(/_/g, ".") ?? "";
    os = v ? `iOS ${v}` : "iOS";
  } else if (/Android ([\d.]+)/.test(ua)) {
    os = `Android ${ua.match(/Android ([\d.]+)/)?.[1] ?? ""}`.trim();
  } else if (/Linux/.test(ua)) {
    os = "Linux";
  }

  const browserDisplayName = browserDisplayNameFromKey(browser);

  return {
    browser,
    browserVersion,
    os,
    browserDisplayName,
  };
}

function browserDisplayNameFromKey(short: string): string {
  switch (short) {
    case "Edge":
      return "Microsoft Edge";
    case "Opera":
      return "Opera";
    case "Chrome":
      return "Google Chrome";
    case "Firefox":
      return "Mozilla Firefox";
    case "Safari":
      return "Safari";
    default:
      return "Unknown Browser";
  }
}
