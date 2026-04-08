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
 * Widget appearance and behavior come from project settings via `GET /api/embed/config`
 * (only `data-id` / API key is required on the script tag).
 */
export function buildInstallScriptSnippet(
  apiKey: string,
  _s: ProjectDashboardSettings,
  appOrigin: string,
  _sessionTimelineSeconds?: SessionTimelineSeconds
): string {
  return buildMinimalInstallScript(apiKey, appOrigin);
}

/** Same as {@link buildInstallScriptSnippet} — single script tag with `data-id` only. */
export function buildMinimalInstallScript(apiKey: string, appOrigin: string): string {
  const src = getInstallScriptSrc(appOrigin);
  return `<script src="${src}" data-id="${apiKey}" async></script>`;
}
