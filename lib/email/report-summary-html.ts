/**
 * Short notification email: message + quick glance + CTA to full report in dashboard.
 */

import type { FeedbackContext } from "./feedback-report-html";

const AMBER = "#fbbf24";
const DARK_BG = "#18181b";
const CARD_BORDER = "#27272a";
const MUTED = "#71717a";
const TEXT_PRIMARY = "#fafafa";
const TEXT_SECONDARY = "#a1a1aa";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildReportSummaryEmailHtml(params: {
  message: string;
  context: FeedbackContext;
  dashboardReportUrl: string;
  projectName?: string;
}): string {
  const { message, context, dashboardReportUrl, projectName } = params;
  const glance = [
    context.browser && context.browserVersion
      ? `${context.browser} ${context.browserVersion}`.trim()
      : context.browser || "Unknown browser",
    context.os || "Unknown OS",
    context.screenResolution || "—",
  ]
    .filter(Boolean)
    .join(" · ");

  const title = projectName?.trim()
    ? `New report · ${escapeHtml(projectName.trim())}`
    : "New Whybug report";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:24px;background:#09090b;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;">
  <table width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="padding:0 0 16px 0;">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.14em;color:${AMBER};text-transform:uppercase;">Whybug</div>
        <div style="font-size:20px;font-weight:800;color:${TEXT_PRIMARY};margin-top:6px;line-height:1.25;">${title}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 16px 0;">
        <table width="100%" style="background:${DARK_BG};border:2px solid ${CARD_BORDER};border-radius:0;">
          <tr><td style="padding:16px 18px;">
            <div style="font-size:10px;font-weight:600;letter-spacing:0.12em;color:${MUTED};text-transform:uppercase;margin-bottom:8px;">User message</div>
            <div style="font-size:15px;line-height:1.55;color:${TEXT_PRIMARY};white-space:pre-wrap;">${escapeHtml(message)}</div>
          </td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 20px 0;">
        <table width="100%" style="background:${DARK_BG};border:2px solid ${CARD_BORDER};">
          <tr><td style="padding:14px 18px;">
            <div style="font-size:10px;font-weight:600;letter-spacing:0.12em;color:${MUTED};text-transform:uppercase;margin-bottom:6px;">Quick glance</div>
            <div style="font-size:13px;line-height:1.5;color:${TEXT_SECONDARY};font-family:ui-monospace,Menlo,monospace;">${escapeHtml(glance)}</div>
            ${
              context.url
                ? `<div style="margin-top:10px;font-size:11px;color:${MUTED};word-break:break-all;"><strong style="color:${TEXT_SECONDARY};">Page</strong><br/><a href="${escapeHtml(context.url)}" style="color:${AMBER};text-decoration:none;">${escapeHtml(context.url)}</a></div>`
                : ""
            }
          </td></tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:0 0 8px 0;text-align:center;">
        <a href="${escapeHtml(dashboardReportUrl)}" style="display:inline-block;padding:16px 28px;background:${AMBER};color:#09090b;font-weight:900;font-size:15px;text-decoration:none;border:2px solid #000;box-shadow:6px 6px 0 0 #000;font-family:ui-monospace,Menlo,monospace;letter-spacing:-0.02em;">
          View full technical report
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding:12px 0 0 0;text-align:center;">
        <div style="font-size:11px;color:${MUTED};line-height:1.5;">Console output, network trace, and session timeline are in the dashboard.<br/>Full details are not included in this email.</div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function reportSummaryEmailSubject(projectName: string | undefined, message: string): string {
  const clean = message.replace(/\s+/g, " ").trim();
  const preview = clean.length > 42 ? `${clean.slice(0, 42)}…` : clean;
  const pn = projectName?.replace(/\s+/g, " ").trim().slice(0, 48);
  if (pn) return `[Whybug · ${pn}] New report — ${preview || "Open dashboard"}`;
  return `[Whybug] New report — ${preview || "Open dashboard"}`;
}
