import type { ProjectDashboardSettings } from "@/lib/projects/dashboard-settings";

/** How many seconds of interaction history to attach to each report. */
export type SessionTimelineSeconds = 10 | 30 | 60;

export type ProjectConfig = {
  captureConsole: boolean;
  captureNetwork: boolean;
  sessionTimelineSeconds: SessionTimelineSeconds;
  widgetDarkMode: boolean;
};

export type ProjectStatus = "active" | "inactive";

export const SESSION_TIMELINE_OPTIONS: {
  value: SessionTimelineSeconds;
  label: string;
}[] = [
  { value: 10, label: "10 seconds" },
  { value: 30, label: "30 seconds" },
  { value: 60, label: "60 seconds" },
];

/** Client / API shape for a project */
export type Project = {
  id: string;
  name: string;
  websiteUrl: string;
  status: ProjectStatus;
  apiKey: string;
  /** Full dashboard configuration (persisted in Supabase). */
  settings: ProjectDashboardSettings;
  /** Derived for legacy embed / SDK helpers. */
  config: ProjectConfig;
  createdAt: string;
};

/** DB row shape for public.projects */
export type ProjectRow = {
  id: string;
  owner_email: string;
  name: string;
  website_url: string;
  status: string;
  api_key: string;
  capture_console: boolean;
  /** Legacy: kept in sync with capture_network_failures_only for older readers */
  capture_network: boolean;
  capture_network_failures_only: boolean;
  session_timeline_seconds: number;
  session_timeline_enabled: boolean;
  widget_dark_mode: boolean;
  widget_theme: string;
  accent_color: string;
  widget_position: string;
  widget_label: string;
  capture_device_metadata: boolean;
  alert_email: string;
  slack_webhook_url: string;
  discord_webhook_url: string;
  created_at: string;
};
