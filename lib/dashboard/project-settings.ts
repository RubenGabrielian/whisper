import type { ProjectDashboardSettings } from "@/lib/projects/dashboard-settings";
import type { SessionTimelineSeconds } from "@/lib/projects/types";

export type {
  ProjectDashboardSettings,
  WidgetPosition,
  WidgetThemeMode,
} from "@/lib/projects/dashboard-settings";
export {
  ACCENT_PRESETS,
  defaultProjectDashboardSettings,
} from "@/lib/projects/dashboard-settings";

/** Path only — combine with your app origin for the full script URL. */
export const INSTALL_SCRIPT_PATH = "/api/embed/sdk";

export function getInstallScriptSrc(appOrigin: string): string {
  const base = appOrigin.replace(/\/$/, "");
  return `${base}${INSTALL_SCRIPT_PATH}`;
}

/**
 * Installation snippet — use your deployed Whisper app URL as `appOrigin`
 * (e.g. from the dashboard server via `getAppOriginFromHeaders()`).
 */
export function buildInstallScriptSnippet(
  apiKey: string,
  s: ProjectDashboardSettings,
  appOrigin: string,
  sessionTimelineSeconds?: SessionTimelineSeconds
): string {
  const src = getInstallScriptSrc(appOrigin);
  const attrs: string[] = [`src="${src}"`, `data-id="${apiKey}"`];

  if (s.theme !== "system") {
    attrs.push(`data-theme="${s.theme}"`);
  }
  if (s.accentColor?.trim()) {
    attrs.push(`data-accent="${s.accentColor.trim()}"`);
  }
  attrs.push(`data-position="${s.position}"`);
  const label = s.widgetLabel.trim();
  if (label) {
    attrs.push(`data-label="${label.replace(/"/g, "&quot;")}"`);
  }
  if (!s.captureConsole) attrs.push(`data-capture-console="false"`);
  if (s.captureNetworkFailuresOnly) attrs.push(`data-network-failures-only="true"`);
  if (!s.sessionTimelineEnabled) attrs.push(`data-session-timeline="false"`);
  if (s.sessionTimelineEnabled && sessionTimelineSeconds) {
    attrs.push(`data-session-seconds="${sessionTimelineSeconds}"`);
  }
  if (!s.captureDeviceMetadata) attrs.push(`data-device-metadata="false"`);

  attrs.push("async");
  return `<script ${attrs.join(" ")}></script>`;
}

/** Minimal one-liner variant for marketing-style previews. */
export function buildMinimalInstallScript(apiKey: string, appOrigin: string): string {
  const src = getInstallScriptSrc(appOrigin);
  return `<script src="${src}" data-id="${apiKey}" async></script>`;
}
