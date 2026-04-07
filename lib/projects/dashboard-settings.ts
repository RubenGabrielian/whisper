/** Widget appearance theme (embed). */
export type WidgetThemeMode = "light" | "dark" | "system";

/** Floating button corner. */
export type WidgetPosition = "bottom-right" | "bottom-left";

/**
 * Full dashboard configuration for a project (persisted in Supabase).
 */
export type ProjectDashboardSettings = {
  projectName: string;
  websiteUrl: string;
  theme: WidgetThemeMode;
  accentColor: string;
  position: WidgetPosition;
  widgetLabel: string;
  captureConsole: boolean;
  captureNetworkFailuresOnly: boolean;
  sessionTimelineEnabled: boolean;
  captureDeviceMetadata: boolean;
  alertEmail: string;
  slackWebhookUrl: string;
  discordWebhookUrl: string;
};

export const ACCENT_PRESETS = [
  { hex: "#06b6d4", label: "Cyan" },
  { hex: "#8b5cf6", label: "Violet" },
  { hex: "#10b981", label: "Emerald" },
  { hex: "#f59e0b", label: "Amber" },
  { hex: "#f43f5e", label: "Rose" },
] as const;

export function defaultProjectDashboardSettings(): ProjectDashboardSettings {
  return {
    projectName: "",
    websiteUrl: "",
    theme: "system",
    accentColor: "#06b6d4",
    position: "bottom-right",
    widgetLabel: "Send Feedback",
    captureConsole: true,
    captureNetworkFailuresOnly: true,
    sessionTimelineEnabled: true,
    captureDeviceMetadata: true,
    alertEmail: "",
    slackWebhookUrl: "",
    discordWebhookUrl: "",
  };
}
