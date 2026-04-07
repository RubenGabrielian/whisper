/**
 * Light-themed inline HTML for Whisper feedback reports.
 * Optional browser icons: set EMAIL_ICON_BASE_URL to a folder of PNGs (see public/email-icons/README.txt).
 */

export type FeedbackEvent = {
  id: string;
  type: "click" | "input" | "navigation";
  description: string;
  timestamp: number;
};

export type FeedbackContext = {
  browser: string;
  browserVersion: string;
  os: string;
  screenResolution: string;
  windowSize: string;
  language: string;
  timezone: string;
  url: string;
};

type LogLevel = "error" | "warn" | "log";

/** Sample console lines (matches in-widget demo; replace with live data when you wire capture). */
const SAMPLE_CONSOLE: { level: LogLevel; text: string }[] = [
  { level: "warn", text: "Stripe.js not initialized — checkout may fail" },
  { level: "error", text: "TypeError: Cannot read properties of undefined (reading 'id')" },
  { level: "log", text: "Auth token refreshed (exp +3600s)" },
];

/** Sample network rows (matches in-widget demo). */
const SAMPLE_NETWORK: {
  method: string;
  path: string;
  status: number;
  ms: string;
  highlight?: boolean;
  errorLabel?: string;
}[] = [
    { method: "POST", path: "/api/checkout/session", status: 422, ms: "1 240" },
    { method: "GET", path: "/api/user/me", status: 200, ms: "81" },
    {
      method: "PUT",
      path: "/api/cart",
      status: 500,
      ms: "2 910",
      highlight: true,
      errorLabel: "500 Internal Server Error",
    },
  ];

const LOG_COLORS: Record<LogLevel, { bg: string; text: string; border: string }> = {
  error: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" },
  warn: { bg: "#fffbeb", text: "#b45309", border: "#fde68a" },
  log: { bg: "#f8fafc", text: "#64748b", border: "#e2e8f0" },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatWhen(ts: number, receiptAt: number): string {
  const s = Math.floor((receiptAt - ts) / 1000);
  if (s <= 0) return "just now";
  if (s === 1) return "1s before send";
  if (s < 60) return `${s}s before send`;
  const m = Math.floor(s / 60);
  return m === 1 ? "1m before send" : `${m}m before send`;
}

const typeLabel: Record<FeedbackEvent["type"], string> = {
  click: "CLICK",
  input: "INPUT",
  navigation: "NAV",
};

const typeColor: Record<FeedbackEvent["type"], string> = {
  click: "#0891b2",
  input: "#7c3aed",
  navigation: "#059669",
};

/** Map detected browser name → PNG filename in EMAIL_ICON_BASE_URL */
export function browserIconFilename(browser: string): string {
  const b = browser.toLowerCase();
  if (b.includes("chrome")) return "chrome.png";
  if (b.includes("edge")) return "edge.png";
  if (b.includes("firefox")) return "firefox.png";
  if (b.includes("safari")) return "safari.png";
  if (b.includes("opera")) return "opera.png";
  return "unknown.png";
}

function netStatusColor(s: number): string {
  if (s >= 500) return "#b91c1c";
  if (s >= 400) return "#b45309";
  return "#047857";
}

function browserIconImg(iconBaseUrl: string, browser: string): string {
  const base = iconBaseUrl.replace(/\/$/, "");
  const file = browserIconFilename(browser);
  const src = `${base}/${file}`;
  return `<img src="${escapeHtml(src)}" width="22" height="22" alt="" style="display:inline-block;vertical-align:middle;margin-right:10px;border-radius:4px;" />`;
}

export function buildFeedbackReportHtml(params: {
  message: string;
  context: FeedbackContext;
  events: FeedbackEvent[];
  receiptAt: number;
  /** Absolute base URL to a folder of PNGs, no trailing slash. Example: https://yoursite.com/email-icons */
  iconBaseUrl?: string | null;
}): string {
  const { message, context, events, receiptAt, iconBaseUrl } = params;
  const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp);
  const iconsOn = Boolean(iconBaseUrl?.trim());

  const rows =
    sorted.length === 0
      ? `<tr><td colspan="3" style="padding:18px;color:#64748b;font-size:14px;font-style:italic;">No session events in the last 30s window.</td></tr>`
      : sorted
        .map((ev) => {
          const border = typeColor[ev.type];
          return `<tr>
  <td style="padding:11px 0;border-bottom:1px solid #e2e8f0;vertical-align:top;width:40px;">
    <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${border};margin-top:7px;"></span>
  </td>
  <td style="padding:11px 8px 11px 0;border-bottom:1px solid #e2e8f0;vertical-align:top;">
    <span style="font-size:10px;font-weight:700;letter-spacing:0.1em;color:${border};">${typeLabel[ev.type]}</span>
    <div style="margin-top:5px;font-size:14px;color:#0f172a;line-height:1.45;">${escapeHtml(ev.description)}</div>
  </td>
  <td style="padding:11px 0;border-bottom:1px solid #e2e8f0;vertical-align:top;text-align:right;white-space:nowrap;">
    <span style="font-size:12px;font-family:ui-monospace,Menlo,monospace;color:#64748b;">${escapeHtml(formatWhen(ev.timestamp, receiptAt))}</span>
  </td>
</tr>`;
        })
        .join("");

  const browserLabel = `${context.browser} ${context.browserVersion}`.trim();
  const browserValueTd = iconsOn
    ? `<td style="padding:10px 12px;font-size:13px;color:#0f172a;border-bottom:1px solid #e2e8f0;vertical-align:middle;">
         ${browserIconImg(iconBaseUrl!.trim(), context.browser)}
         <span style="vertical-align:middle;">${escapeHtml(browserLabel || "—")}</span>
       </td>`
    : `<td style="padding:10px 12px;font-size:13px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${escapeHtml(browserLabel || "—")}</td>`;

  const browserRow = `<tr>
  <td style="padding:10px 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;width:38%;border-bottom:1px solid #e2e8f0;vertical-align:middle;">Browser</td>
  ${browserValueTd}
</tr>`;

  const otherRows = [
    ["OS", context.os],
    ["Screen", context.screenResolution],
    ["Viewport", context.windowSize],
    ["Language", context.language],
    ["Time zone", context.timezone],
  ]
    .map(
      ([k, v]) => `<tr>
  <td style="padding:10px 12px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;width:38%;border-bottom:1px solid #e2e8f0;">${escapeHtml(k)}</td>
  <td style="padding:10px 12px;font-size:13px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${escapeHtml(v || "—")}</td>
</tr>`
    )
    .join("");

  const consoleRows = SAMPLE_CONSOLE.map((entry, i) => {
    const c = LOG_COLORS[entry.level];
    const borderTop = i > 0 ? "border-top:1px solid #e2e8f0;" : "";
    return `<tr>
  <td style="padding:10px 14px;${borderTop}">
    <span style="display:inline-block;font-size:10px;font-weight:700;letter-spacing:0.06em;padding:3px 8px;border-radius:6px;border:1px solid ${c.border};background:${c.bg};color:${c.text};">${entry.level}</span>
    <span style="font-size:13px;color:#334155;margin-left:10px;line-height:1.5;">${escapeHtml(entry.text)}</span>
  </td>
</tr>`;
  }).join("");

  const networkRows = SAMPLE_NETWORK.map((req, i) => {
    const borderTop = i > 0 ? "border-top:1px solid #e2e8f0;" : "";
    const hl = req.highlight ? "background:#fef2f2;" : "";
    const methodColor =
      req.method === "GET" ? "#0369a1" : req.method === "POST" ? "#047857" : "#b45309";
    const errBlock =
      req.highlight && req.errorLabel
        ? `<div style="padding:6px 0 2px 52px;font-size:12px;color:#b91c1c;">
             ${escapeHtml(req.errorLabel)} <span style="color:#64748b;">— likely failure</span>
           </div>`
        : "";
    return `<tr><td style="padding:12px 14px;${borderTop}${hl}">
  <table width="100%" cellspacing="0" cellpadding="0"><tr>
    <td style="font-size:12px;font-weight:700;font-family:ui-monospace,Menlo,monospace;color:${methodColor};width:52px;">${escapeHtml(req.method)}</td>
    <td style="font-size:13px;color:#475569;padding:0 8px;">${escapeHtml(req.path)}</td>
    <td style="font-size:13px;font-weight:700;color:${netStatusColor(req.status)};text-align:right;width:44px;">${req.status}</td>
    <td style="font-size:12px;color:#94a3b8;text-align:right;width:56px;white-space:nowrap;">${escapeHtml(req.ms)}ms</td>
  </tr></table>
  ${errBlock}
</td></tr>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Whisper feedback</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:28px 14px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;border-collapse:collapse;">

          <tr>
            <td style="padding:0 0 20px 0;">
              <table width="100%" style="background:#ffffff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;">
                <tr>
                  <td style="padding:24px 26px 20px 26px;border-bottom:3px solid #06b6d4;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#0891b2;text-transform:uppercase;margin-bottom:8px;">Whisper · Feedback</div>
                    <h1 style="margin:0;font-size:21px;font-weight:700;color:#0f172a;line-height:1.25;letter-spacing:-0.02em;">New report from your site</h1>
                    <p style="margin:10px 0 0 0;font-size:13px;color:#64748b;line-height:1.55;">What they wrote, recent session activity, environment, console sample, and network sample — so you can see the problem at a glance.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 0 14px 0;">
              <table width="100%" style="background:#ffffff;border-radius:14px;border:1px solid #e2e8f0;border-left:4px solid #06b6d4;">
                <tr>
                  <td style="padding:20px 22px;">
                    <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;margin-bottom:10px;">What they reported</div>
                    <p style="margin:0;font-size:16px;color:#0f172a;line-height:1.55;font-style:italic;">&ldquo;${escapeHtml(message)}&rdquo;</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 0 14px 0;">
              <table width="100%" style="background:#ffffff;border-radius:14px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:18px 20px 6px 20px;">
                    <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;">Session timeline</div>
                    <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Last ~30 seconds (clicks, inputs after typing pauses, navigation)</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 18px 18px 18px;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      ${rows}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 0 14px 0;">
              <table width="100%" style="background:#ffffff;border-radius:14px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:18px 20px 10px 20px;">
                    <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;">Environment</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 18px 6px 18px;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      ${browserRow}
                      ${otherRows}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 18px 18px 18px;">
                    <div style="font-size:11px;font-weight:600;letter-spacing:0.06em;color:#64748b;text-transform:uppercase;margin-bottom:6px;">Page URL</div>
                    <a href="${escapeHtml(context.url)}" style="font-size:13px;color:#0891b2;word-break:break-all;text-decoration:underline;">${escapeHtml(context.url)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 0 14px 0;">
              <table width="100%" style="background:#ffffff;border-radius:14px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:18px 20px 6px 20px;">
                    <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;">Console (sample)</div>
                    <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Representative lines captured with the report</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 4px 14px 4px;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      ${consoleRows}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:0 0 14px 0;">
              <table width="100%" style="background:#ffffff;border-radius:14px;border:1px solid #e2e8f0;">
                <tr>
                  <td style="padding:18px 20px 6px 20px;">
                    <div style="font-size:11px;font-weight:600;letter-spacing:0.1em;color:#64748b;text-transform:uppercase;">Network (sample)</div>
                    <div style="font-size:12px;color:#94a3b8;margin-top:4px;">Requests correlated with this session (demo data)</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 4px 14px 4px;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      ${networkRows}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 0 0 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">Whisper · ${escapeHtml(new Date(receiptAt).toISOString())}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function feedbackEmailSubject(message: string): string {
  const clean = message.replace(/\s+/g, " ").trim();
  const preview = clean.length > 55 ? `${clean.slice(0, 55)}…` : clean;
  return `[Whisper] ${preview || "New feedback"}`;
}

/** Subject line when feedback comes from an embedded widget (includes project name). */
export function widgetFeedbackEmailSubject(projectName: string, message: string): string {
  const clean = message.replace(/\s+/g, " ").trim();
  const preview = clean.length > 55 ? `${clean.slice(0, 55)}…` : clean;
  const pn = projectName.replace(/\s+/g, " ").trim().slice(0, 80);
  if (pn) return `[Whisper · ${pn}] ${preview || "New feedback"}`;
  return feedbackEmailSubject(message);
}
