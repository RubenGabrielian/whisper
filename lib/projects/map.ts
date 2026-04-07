import type {
  ProjectDashboardSettings,
  WidgetPosition,
  WidgetThemeMode,
} from "@/lib/projects/dashboard-settings";
import type { Project, ProjectRow, SessionTimelineSeconds } from "./types";
import { normalizeWebsiteUrl } from "./url";

export function rowToDashboardSettings(row: ProjectRow): ProjectDashboardSettings {
  const theme = (row.widget_theme || "system") as WidgetThemeMode;
  return {
    projectName: row.name,
    websiteUrl: row.website_url,
    theme: theme === "light" || theme === "dark" || theme === "system" ? theme : "system",
    accentColor: row.accent_color || "#06b6d4",
    position: (row.widget_position === "bottom-left" ? "bottom-left" : "bottom-right") as WidgetPosition,
    widgetLabel: row.widget_label || "Send Feedback",
    captureConsole: row.capture_console,
    captureNetworkFailuresOnly: row.capture_network_failures_only ?? row.capture_network,
    sessionTimelineEnabled: row.session_timeline_enabled ?? true,
    captureDeviceMetadata: row.capture_device_metadata ?? true,
    alertEmail: row.alert_email ?? "",
    slackWebhookUrl: row.slack_webhook_url ?? "",
    discordWebhookUrl: row.discord_webhook_url ?? "",
  };
}

export function rowToClient(row: ProjectRow): Project {
  const sec = row.session_timeline_seconds;
  const sessionTimelineSeconds: SessionTimelineSeconds =
    sec === 10 || sec === 30 || sec === 60 ? sec : 30;

  const settings = rowToDashboardSettings(row);
  const theme = settings.theme;

  return {
    id: row.id,
    name: row.name,
    websiteUrl: row.website_url,
    status: row.status === "inactive" ? "inactive" : "active",
    apiKey: row.api_key,
    settings,
    config: {
      captureConsole: row.capture_console,
      captureNetwork: settings.captureNetworkFailuresOnly,
      sessionTimelineSeconds,
      widgetDarkMode: theme === "dark" || row.widget_dark_mode,
    },
    createdAt: row.created_at,
  };
}

/**
 * Fields that exist on the original `projects` table (before extended-settings migration).
 * Use for INSERT so project creation works even if optional columns are not migrated yet.
 */
export function dashboardSettingsToInsertRow(
  s: ProjectDashboardSettings
): Record<string, string | boolean | number> {
  return {
    name: s.projectName.trim(),
    website_url: normalizeWebsiteUrl(s.websiteUrl.trim()),
    capture_console: s.captureConsole,
    capture_network: s.captureNetworkFailuresOnly,
    session_timeline_seconds: s.sessionTimelineEnabled ? 30 : 10,
    widget_dark_mode: s.theme === "dark",
  };
}

/** Map dashboard settings + identity fields to a Supabase update payload (snake_case). */
export function dashboardSettingsToRowUpdate(
  s: ProjectDashboardSettings
): Record<string, string | boolean | number> {
  const session_timeline_seconds = s.sessionTimelineEnabled ? 30 : 10;
  const widget_dark_mode = s.theme === "dark";

  return {
    name: s.projectName.trim(),
    website_url: normalizeWebsiteUrl(s.websiteUrl.trim()),
    capture_console: s.captureConsole,
    capture_network: s.captureNetworkFailuresOnly,
    capture_network_failures_only: s.captureNetworkFailuresOnly,
    session_timeline_seconds,
    session_timeline_enabled: s.sessionTimelineEnabled,
    widget_dark_mode,
    widget_theme: s.theme,
    accent_color: s.accentColor.trim() || "#06b6d4",
    widget_position: s.position,
    widget_label: s.widgetLabel.trim() || "Send Feedback",
    capture_device_metadata: s.captureDeviceMetadata,
    alert_email: s.alertEmail.trim(),
    slack_webhook_url: s.slackWebhookUrl.trim(),
    discord_webhook_url: s.discordWebhookUrl.trim(),
  };
}
