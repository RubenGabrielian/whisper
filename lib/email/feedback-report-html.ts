/**
 * Premium "Bug DNA" HTML email template for Whybug feedback reports.
 * Dark-themed with amber accents — designed to be screenshot-worthy.
 * Optional browser icons: set EMAIL_ICON_BASE_URL to a folder of PNGs.
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

export type LogLevel = "error" | "warn" | "log";

export type FeedbackConsoleEntry = { level: LogLevel; text: string; timestamp: number };

export type FeedbackNetworkEntry = {
  method: string;
  url: string;
  status: number | null;
  durationMs: number | null;
  ok: boolean;
  error?: string;
  timestamp: number;
};

/* ── Colors ── */
const AMBER = "#fbbf24";
const AMBER_DIM = "#b45309";
const DARK_BG = "#18181b";    // zinc-900
const DARKER_BG = "#09090b";  // zinc-950
const CARD_BG = "#1c1c20";
const CARD_BORDER = "#27272a"; // zinc-800
const MUTED = "#71717a";      // zinc-500
const DIM = "#52525b";        // zinc-600
const TEXT_PRIMARY = "#fafafa"; // zinc-50
const TEXT_SECONDARY = "#a1a1aa"; // zinc-400
const GREEN = "#34d399";
const RED = "#f87171";
const RED_BG = "#451a1a";

const TYPE_DOT: Record<FeedbackEvent["type"], string> = {
  click: AMBER,
  input: "#a78bfa",
  navigation: GREEN,
};

const TYPE_LABEL: Record<FeedbackEvent["type"], string> = {
  click: "CLICK",
  input: "INPUT",
  navigation: "NAV",
};

const LOG_STYLES: Record<LogLevel, { text: string; bg: string; border: string; prefix: string }> = {
  error: { text: "#f87171", bg: "#2a1515", border: "#7f1d1d", prefix: ">" },
  warn:  { text: "#fbbf24", bg: "#2a2210", border: "#78350f", prefix: "!" },
  log:   { text: "#a1a1aa", bg: DARKER_BG, border: "#3f3f46", prefix: "$" },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function relTime(ts: number, refTs: number): string {
  const s = Math.floor((refTs - ts) / 1000);
  if (s <= 0) return "now";
  return `-${s}s`;
}

function netStatusColor(s: number): string {
  if (s >= 500) return RED;
  if (s >= 400) return AMBER;
  return GREEN;
}

function netStatusBg(s: number): string {
  if (s >= 500) return RED_BG;
  if (s >= 400) return "#2a2210";
  return "#0d2818";
}

function methodColor(m: string): string {
  if (m === "GET") return "#60a5fa";
  if (m === "POST") return GREEN;
  if (m === "DELETE") return RED;
  return AMBER;
}

function netPath(u: string): string {
  try {
    const url = new URL(u);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return u;
  }
}

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

function browserIconImg(iconBaseUrl: string, browser: string): string {
  const base = iconBaseUrl.replace(/\/$/, "");
  const file = browserIconFilename(browser);
  return `<img src="${escapeHtml(base)}/${file}" width="16" height="16" alt="" style="display:inline-block;vertical-align:middle;margin-right:6px;" />`;
}

/* ═══════════════════════════════════════════════════════════
   BUILD EMAIL HTML
═══════════════════════════════════════════════════════════ */
export function buildFeedbackReportHtml(params: {
  message: string;
  context: FeedbackContext;
  events: FeedbackEvent[];
  console: FeedbackConsoleEntry[];
  network: FeedbackNetworkEntry[];
  receiptAt: number;
  iconBaseUrl?: string | null;
}): string {
  const { message, context, events, receiptAt, iconBaseUrl } = params;
  const sorted = [...events].sort((a, b) => b.timestamp - a.timestamp);
  const iconsOn = Boolean(iconBaseUrl?.trim());

  const browserLabel = `${context.browser} ${context.browserVersion}`.trim();
  const envLine = `${browserLabel || "Browser"} on ${context.os || "Unknown"} &middot; ${escapeHtml(context.screenResolution || "?")}`;

  const errorCount = (params.console ?? []).filter(e => e.level === "error").length;
  const failedReqs = (params.network ?? []).filter(r => !r.ok).length;
  const consoleSorted = [...(params.console ?? [])].sort((a, b) => b.timestamp - a.timestamp);
  const networkSorted = [...(params.network ?? [])].sort((a, b) => b.timestamp - a.timestamp);

  /* ── Timeline rows ── */
  const timelineRows = sorted.length === 0
    ? `<tr><td style="padding:20px 16px;text-align:center;">
        <div style="font-size:13px;font-weight:700;color:${GREEN};font-family:ui-monospace,Menlo,monospace;">&#10003; Clean Slate</div>
        <div style="font-size:11px;color:${MUTED};margin-top:4px;">No user interactions in the last 30s</div>
       </td></tr>`
    : sorted.map((ev, i) => {
      const dot = TYPE_DOT[ev.type];
      const label = TYPE_LABEL[ev.type];
      const time = relTime(ev.timestamp, receiptAt);
      const borderTop = i > 0 ? `border-top:1px solid ${CARD_BORDER};` : "";
      return `<tr>
  <td style="padding:10px 12px;${borderTop}vertical-align:top;width:36px;">
    <div style="width:10px;height:10px;border-radius:10px;background:${dot};margin-top:3px;"></div>
  </td>
  <td style="padding:10px 8px;${borderTop}vertical-align:top;">
    <span style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:0.12em;color:${dot};font-family:ui-monospace,Menlo,monospace;background:${dot}15;padding:2px 6px;border:1px solid ${dot}30;margin-bottom:4px;">${label}</span>
    <div style="font-size:13px;color:${TEXT_SECONDARY};font-family:ui-monospace,Menlo,monospace;line-height:1.45;">${escapeHtml(ev.description)}</div>
  </td>
  <td style="padding:10px 12px;${borderTop}vertical-align:top;text-align:right;white-space:nowrap;width:50px;">
    <span style="font-size:11px;font-weight:700;font-family:ui-monospace,Menlo,monospace;color:${DIM};">${time}</span>
  </td>
</tr>`;
    }).join("");

  /* ── Console rows ── */
  const consoleRows = consoleSorted.length === 0
    ? `<tr><td style="padding:16px;text-align:center;">
        <div style="font-size:12px;font-weight:700;color:${GREEN};font-family:ui-monospace,Menlo,monospace;">&#10003; No errors detected</div>
       </td></tr>`
    : consoleSorted.map((entry, i) => {
      const s = LOG_STYLES[entry.level];
      const borderTop = i > 0 ? `border-top:1px solid ${CARD_BORDER};` : "";
      return `<tr>
  <td style="padding:8px 12px;${borderTop}background:${s.bg};font-family:ui-monospace,Menlo,monospace;font-size:12px;">
    <span style="color:${DIM};margin-right:6px;">${s.prefix}</span>
    <span style="display:inline-block;font-size:9px;font-weight:700;letter-spacing:0.08em;padding:2px 6px;border:1px solid ${s.border};color:${s.text};margin-right:8px;vertical-align:middle;">${entry.level.toUpperCase()}</span>
    <span style="color:${s.text};line-height:1.5;">${escapeHtml(entry.text)}</span>
  </td>
</tr>`;
    }).join("");

  /* ── Network rows ── */
  const networkRows = networkSorted.length === 0
    ? `<tr><td style="padding:16px;text-align:center;">
        <div style="font-size:12px;font-weight:700;color:${GREEN};font-family:ui-monospace,Menlo,monospace;">&#10003; All requests healthy</div>
       </td></tr>`
    : networkSorted.map((req, i) => {
      const status = req.status ?? 0;
      const borderTop = i > 0 ? `border-top:1px solid ${CARD_BORDER};` : "";
      const rowBg = !req.ok ? RED_BG : "transparent";
      const leftBorder = !req.ok ? `border-left:3px solid ${RED};` : `border-left:3px solid transparent;`;
      const errBlock = !req.ok && req.error
        ? `<div style="padding:4px 0 0 54px;font-size:11px;color:${RED};">&#9888; ${escapeHtml(req.error)} <span style="color:${MUTED};">&mdash; likely root cause</span></div>`
        : "";
      return `<tr>
  <td style="padding:10px 12px;${borderTop}${leftBorder}background:${rowBg};font-family:ui-monospace,Menlo,monospace;font-size:12px;">
    <table width="100%" cellspacing="0" cellpadding="0"><tr>
      <td style="font-weight:700;color:${methodColor(req.method)};width:46px;font-size:11px;">${escapeHtml(req.method)}</td>
      <td style="color:${TEXT_SECONDARY};padding:0 6px;">${escapeHtml(netPath(req.url))}</td>
      <td style="text-align:right;width:40px;">
        <span style="font-weight:700;font-size:11px;color:${netStatusColor(status)};background:${netStatusBg(status)};padding:2px 6px;border:1px solid ${netStatusColor(status)}30;">${escapeHtml(String(req.status ?? '—'))}</span>
      </td>
      <td style="color:${DIM};text-align:right;width:60px;white-space:nowrap;font-size:11px;">${escapeHtml(req.durationMs == null ? '—' : String(Math.round(req.durationMs)))}ms</td>
    </tr></table>
    ${errBlock}
  </td>
</tr>`;
    }).join("");

  /* ── Environment grid ── */
  const envItems = [
    { k: "Browser", v: browserLabel, icon: iconsOn ? browserIconImg(iconBaseUrl!.trim(), context.browser) : "" },
    { k: "OS", v: context.os },
    { k: "Screen", v: context.screenResolution },
    { k: "Viewport", v: context.windowSize },
    { k: "Language", v: context.language },
    { k: "Timezone", v: context.timezone },
  ];

  const envRows = envItems.map((item, i) => {
    const isEven = i % 2 === 0;
    const next = i + 1 < envItems.length ? envItems[i + 1] : null;
    if (!isEven) return ""; // handled by previous iteration
    return `<tr>
  <td width="50%" style="padding:8px 10px;border:1px solid ${CARD_BORDER};background:${CARD_BG};">
    <div style="font-size:9px;font-weight:600;letter-spacing:0.12em;color:${DIM};text-transform:uppercase;">${escapeHtml(item.k)}</div>
    <div style="font-size:12px;color:${TEXT_SECONDARY};font-family:ui-monospace,Menlo,monospace;margin-top:2px;">${item.icon || ""}${escapeHtml(item.v || "—")}</div>
  </td>
  ${next ? `<td width="50%" style="padding:8px 10px;border:1px solid ${CARD_BORDER};background:${CARD_BG};">
    <div style="font-size:9px;font-weight:600;letter-spacing:0.12em;color:${DIM};text-transform:uppercase;">${escapeHtml(next.k)}</div>
    <div style="font-size:12px;color:${TEXT_SECONDARY};font-family:ui-monospace,Menlo,monospace;margin-top:2px;">${escapeHtml(next.v || "—")}</div>
  </td>` : `<td width="50%" style="padding:8px 10px;border:1px solid ${CARD_BORDER};background:${CARD_BG};">&nbsp;</td>`}
</tr>`;
  }).filter(Boolean).join("");

  /* ── Summary stats ── */
  const statItems = [
    { label: "Events", value: String(sorted.length), color: AMBER },
    { label: "Console", value: errorCount > 0 ? `${errorCount} error${errorCount !== 1 ? "s" : ""}` : "Clean", color: errorCount > 0 ? RED : GREEN },
    { label: "Network", value: failedReqs > 0 ? `${failedReqs} failed` : "Healthy", color: failedReqs > 0 ? RED : GREEN },
  ];

  const statCells = statItems.map(s =>
    `<td width="33%" style="padding:10px 8px;text-align:center;border:1px solid ${CARD_BORDER};background:${CARD_BG};">
      <div style="font-size:16px;font-weight:800;color:${s.color};font-family:ui-monospace,Menlo,monospace;">${s.value}</div>
      <div style="font-size:9px;font-weight:600;letter-spacing:0.14em;color:${DIM};text-transform:uppercase;margin-top:2px;">${s.label}</div>
    </td>`
  ).join("");

  const dateStr = new Date(receiptAt).toLocaleString("en-US", {
    weekday: "short", year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });

  /* ── Section header helper ── */
  const sectionHeader = (title: string, badge?: string, badgeColor?: string) => `
    <tr>
      <td style="padding:14px 16px 8px 16px;background:${CARD_BORDER};">
        <table width="100%" cellspacing="0" cellpadding="0"><tr>
          <td style="font-size:10px;font-weight:700;letter-spacing:0.14em;color:${MUTED};text-transform:uppercase;font-family:ui-monospace,Menlo,monospace;">&#9889; ${title}</td>
          ${badge ? `<td style="text-align:right;font-size:10px;font-weight:700;color:${badgeColor || MUTED};font-family:ui-monospace,Menlo,monospace;">${badge}</td>` : ""}
        </tr></table>
      </td>
    </tr>`;

  /* ═══════════════════════════════════════════════════════
     FINAL HTML
  ═══════════════════════════════════════════════════════ */
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <title>Whybug &middot; Bug DNA Report</title>
</head>
<body style="margin:0;padding:0;background:${DARKER_BG};font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${DARKER_BG};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;border-collapse:collapse;">

          <!-- ═══ BUG DNA HEADER ═══ -->
          <tr>
            <td style="padding:0 0 16px 0;">
              <table width="100%" style="background:${DARK_BG};border:2px solid ${CARD_BORDER};overflow:hidden;">
                <!-- Top glow line -->
                <tr><td style="height:3px;background:linear-gradient(90deg,transparent 10%,${AMBER} 50%,transparent 90%);font-size:0;">&nbsp;</td></tr>
                <tr>
                  <td style="padding:22px 20px 8px 20px;">
                    <table width="100%" cellspacing="0" cellpadding="0"><tr>
                      <td style="vertical-align:middle;">
                        <table cellspacing="0" cellpadding="0"><tr>
                          <td style="width:28px;height:28px;background:${GREEN};border:2px solid ${GREEN};text-align:center;vertical-align:middle;font-size:14px;font-weight:900;color:${DARKER_BG};">&#10003;</td>
                          <td style="padding-left:10px;">
                            <div style="font-size:18px;font-weight:900;color:${TEXT_PRIMARY};letter-spacing:-0.02em;">Bug DNA</div>
                            <div style="font-size:11px;color:${MUTED};font-family:ui-monospace,Menlo,monospace;">Report decoded &middot; ${escapeHtml(dateStr)}</div>
                          </td>
                        </tr></table>
                      </td>
                      <td style="text-align:right;vertical-align:top;">
                        <table cellspacing="0" cellpadding="0"><tr>
                          <td style="width:24px;height:24px;background:${AMBER};text-align:center;vertical-align:middle;font-size:12px;font-weight:900;color:${DARKER_BG};">&#9889;</td>
                          <td style="padding-left:6px;font-size:12px;font-weight:800;color:${TEXT_PRIMARY};">Whybug</td>
                        </tr></table>
                      </td>
                    </tr></table>
                  </td>
                </tr>

                <!-- User message bubble -->
                <tr>
                  <td style="padding:12px 20px 16px 20px;">
                    <table width="100%" style="border:2px solid ${AMBER}40;background:${AMBER}08;">
                      <tr><td style="padding:14px 16px;">
                        <div style="font-size:10px;color:${AMBER_DIM};font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">&#128172; USER REPORT</div>
                        <p style="margin:0;font-size:15px;color:${TEXT_PRIMARY};line-height:1.55;font-family:ui-monospace,Menlo,monospace;">&ldquo;${escapeHtml(message)}&rdquo;</p>
                      </td></tr>
                    </table>
                  </td>
                </tr>

                <!-- Environment badge -->
                <tr>
                  <td style="padding:0 20px 16px 20px;">
                    <table cellspacing="0" cellpadding="0"><tr>
                      <td style="padding:4px 10px;background:${CARD_BG};border:1px solid ${CARD_BORDER};font-size:11px;color:${TEXT_SECONDARY};font-family:ui-monospace,Menlo,monospace;">
                        &#128421; ${envLine}
                      </td>
                      <td style="padding:4px 10px;background:${CARD_BG};border:1px solid ${CARD_BORDER};font-size:11px;color:${AMBER};font-family:ui-monospace,Menlo,monospace;margin-left:4px;">
                        &#127760; ${escapeHtml(context.url)}
                      </td>
                    </tr></table>
                  </td>
                </tr>

                <!-- Quick stats -->
                <tr>
                  <td style="padding:0 20px 18px 20px;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      <tr>${statCells}</tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ PATH TO BUG ═══ -->
          <tr>
            <td style="padding:0 0 12px 0;">
              <table width="100%" style="background:${DARK_BG};border:2px solid ${CARD_BORDER};overflow:hidden;">
                ${sectionHeader("Path to Bug", sorted.length > 0 ? `${sorted.length} events &middot; 30s` : "no events", AMBER)}
                <tr>
                  <td style="padding:0;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      ${timelineRows}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ CONSOLE ═══ -->
          <tr>
            <td style="padding:0 0 12px 0;">
              <table width="100%" style="background:${DARKER_BG};border:2px solid ${CARD_BORDER};overflow:hidden;">
                ${sectionHeader("Console", errorCount > 0 ? `${errorCount} error${errorCount !== 1 ? "s" : ""} &middot; ${consoleSorted.length} total` : `${consoleSorted.length} lines`, errorCount > 0 ? RED : MUTED)}
                <tr>
                  <td style="padding:0;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      ${consoleRows}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ NETWORK ═══ -->
          <tr>
            <td style="padding:0 0 12px 0;">
              <table width="100%" style="background:${DARKER_BG};border:2px solid ${CARD_BORDER};overflow:hidden;">
                ${sectionHeader("Network", failedReqs > 0 ? `${failedReqs} failed &middot; ${networkSorted.length} req` : `${networkSorted.length} requests`, failedReqs > 0 ? RED : MUTED)}
                <!-- Column headers -->
                <tr>
                  <td style="padding:6px 12px;border-bottom:1px solid ${CARD_BORDER};background:${CARD_BG};">
                    <table width="100%" cellspacing="0" cellpadding="0"><tr>
                      <td style="font-size:9px;font-weight:600;letter-spacing:0.12em;color:${DIM};text-transform:uppercase;font-family:ui-monospace,Menlo,monospace;width:46px;">Method</td>
                      <td style="font-size:9px;font-weight:600;letter-spacing:0.12em;color:${DIM};text-transform:uppercase;font-family:ui-monospace,Menlo,monospace;">Path</td>
                      <td style="font-size:9px;font-weight:600;letter-spacing:0.12em;color:${DIM};text-transform:uppercase;font-family:ui-monospace,Menlo,monospace;text-align:right;width:40px;">Status</td>
                      <td style="font-size:9px;font-weight:600;letter-spacing:0.12em;color:${DIM};text-transform:uppercase;font-family:ui-monospace,Menlo,monospace;text-align:right;width:60px;">Time</td>
                    </tr></table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      ${networkRows}
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ DEVICE SNAPSHOT ═══ -->
          <tr>
            <td style="padding:0 0 12px 0;">
              <table width="100%" style="background:${DARK_BG};border:2px solid ${CARD_BORDER};overflow:hidden;">
                ${sectionHeader("Device Snapshot")}
                <tr>
                  <td style="padding:4px 12px 12px 12px;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      ${envRows}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 12px 14px 12px;">
                    <table width="100%" style="border:1px solid ${CARD_BORDER};background:${CARD_BG};">
                      <tr><td style="padding:8px 10px;">
                        <div style="font-size:9px;font-weight:600;letter-spacing:0.12em;color:${DIM};text-transform:uppercase;">Page URL</div>
                        <a href="${escapeHtml(context.url)}" style="font-size:12px;color:${AMBER};font-family:ui-monospace,Menlo,monospace;word-break:break-all;text-decoration:none;">${escapeHtml(context.url)}</a>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td style="padding:8px 0 0 0;text-align:center;">
              <table width="100%" style="background:${DARK_BG};border:2px solid ${CARD_BORDER};">
                <tr><td style="padding:16px 20px;text-align:center;">
                  <div style="font-size:10px;color:${MUTED};font-family:ui-monospace,Menlo,monospace;">
                    &#9889; Context captured automatically by <strong style="color:${TEXT_SECONDARY};">Whybug.info</strong>
                  </div>
                  <div style="font-size:10px;color:${DIM};font-family:ui-monospace,Menlo,monospace;margin-top:6px;">
                    ${escapeHtml(new Date(receiptAt).toISOString())}
                  </div>
                </td></tr>
              </table>
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
  return `[Whybug] ${preview || "New feedback"}`;
}

/** Subject line when feedback comes from an embedded widget (includes project name). */
export function widgetFeedbackEmailSubject(projectName: string, message: string): string {
  const clean = message.replace(/\s+/g, " ").trim();
  const preview = clean.length > 55 ? `${clean.slice(0, 55)}…` : clean;
  const pn = projectName.replace(/\s+/g, " ").trim().slice(0, 80);
  if (pn) return `[Whybug · ${pn}] ${preview || "New feedback"}`;
  return feedbackEmailSubject(message);
}
