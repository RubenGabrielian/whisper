"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Code2,
  Copy,
  Check,
  Mail,
  MessageCircle,
  Paintbrush,
  Settings,
  Shield,
  Webhook,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  ACCENT_PRESETS,
  buildInstallScriptSnippet,
  buildMinimalInstallScript,
  type ProjectDashboardSettings,
  type WidgetPosition,
  type WidgetThemeMode,
} from "@/lib/dashboard/project-settings";
import { cn } from "@/lib/utils";

export type ProjectSettingsPanelProps = {
  apiKey: string;
  settings: ProjectDashboardSettings;
  onSettingsChange: (next: ProjectDashboardSettings) => void;
  appOrigin: string;
  sessionTimelineSeconds: 10 | 30 | 60;
};

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "install", label: "Install", icon: Code2 },
  { id: "appearance", label: "Appearance", icon: Paintbrush },
  { id: "collection", label: "Collection", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ProjectSettingsPanel({
  apiKey,
  settings,
  onSettingsChange,
  appOrigin,
  sessionTimelineSeconds,
}: ProjectSettingsPanelProps) {
  const [tab, setTab] = useState<TabId>("general");
  const [copied, setCopied] = useState<"api" | "script" | null>(null);
  const [minimalScript, setMinimalScript] = useState(false);

  const patch = (p: Partial<ProjectDashboardSettings>) =>
    onSettingsChange({ ...settings, ...p });

  const scriptText = minimalScript
    ? buildMinimalInstallScript(apiKey, appOrigin)
    : buildInstallScriptSnippet(apiKey, settings, appOrigin, sessionTimelineSeconds);

  const copy = async (kind: "api" | "script", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch { setCopied(null); }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Sidebar nav */}
      <nav className="flex shrink-0 gap-1 overflow-x-auto lg:w-48 lg:flex-col lg:overflow-visible">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[0.8rem] font-medium transition-colors",
                active
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {tab === "general" && (
              <SettingsCard title="Project details" description="Identity and URL for this site.">
                <div className="space-y-4">
                  <Field label="Project name" htmlFor="ps-name">
                    <Input
                      id="ps-name"
                      value={settings.projectName}
                      onChange={(e) => patch({ projectName: e.target.value })}
                      placeholder="My production app"
                    />
                  </Field>
                  <Field label="Website URL" htmlFor="ps-url">
                    <Input
                      id="ps-url"
                      type="url"
                      value={settings.websiteUrl}
                      onChange={(e) => patch({ websiteUrl: e.target.value })}
                      placeholder="https://app.example.com"
                    />
                  </Field>
                  <Field label="Public API key" htmlFor="ps-api">
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700">
                        {apiKey}
                      </code>
                      <CopyBtn copied={copied === "api"} onClick={() => void copy("api", apiKey)} />
                    </div>
                  </Field>
                </div>
              </SettingsCard>
            )}

            {tab === "install" && (
              <SettingsCard title="Installation snippet" description="Paste before the closing </body> tag.">
                <div className="flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-[0.78rem] text-zinc-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={minimalScript}
                      onChange={(e) => setMinimalScript(e.target.checked)}
                      className="rounded border-zinc-300"
                    />
                    Minimal snippet
                  </label>
                  <CopyBtn
                    copied={copied === "script"}
                    onClick={() => void copy("script", scriptText)}
                    label="Copy"
                  />
                </div>
                <pre className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-950 p-4 text-[0.72rem] leading-relaxed text-emerald-400/90">
                  <code>{scriptText}</code>
                </pre>
              </SettingsCard>
            )}

            {tab === "appearance" && (
              <div className="space-y-5">
                <SettingsCard title="Theme" description="Widget chrome and panel appearance.">
                  <RadioGroup
                    value={settings.theme}
                    onValueChange={(v) => patch({ theme: v as WidgetThemeMode })}
                    className="grid gap-2 sm:grid-cols-3"
                  >
                    {(["light", "dark", "system"] as const).map((id) => (
                      <label
                        key={id}
                        htmlFor={`theme-${id}`}
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-[0.82rem] font-medium transition-colors",
                          settings.theme === id
                            ? "border-zinc-900 bg-zinc-50 text-zinc-900"
                            : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
                        )}
                      >
                        <RadioGroupItem value={id} id={`theme-${id}`} />
                        {id.charAt(0).toUpperCase() + id.slice(1)}
                      </label>
                    ))}
                  </RadioGroup>
                </SettingsCard>

                <SettingsCard title="Accent color" description="Primary color for the launcher.">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {ACCENT_PRESETS.map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        title={p.label}
                        onClick={() => patch({ accentColor: p.hex })}
                        className={cn(
                          "size-8 rounded-full ring-2 ring-offset-2 ring-offset-white transition-transform hover:scale-110",
                          settings.accentColor.toLowerCase() === p.hex.toLowerCase()
                            ? "ring-zinc-900"
                            : "ring-transparent"
                        )}
                        style={{ backgroundColor: p.hex }}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex max-w-[200px] items-center gap-1.5">
                    <span className="text-xs font-mono text-zinc-400">#</span>
                    <Input
                      value={settings.accentColor.replace(/^#/, "")}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
                        patch({ accentColor: raw ? `#${raw}` : "#" });
                      }}
                      className="h-8 font-mono text-xs"
                      placeholder="06b6d4"
                    />
                  </div>
                </SettingsCard>

                <SettingsCard title="Layout" description="Widget position and label.">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Position" htmlFor="ps-position">
                      <select
                        id="ps-position"
                        value={settings.position}
                        onChange={(e) => patch({ position: e.target.value as WidgetPosition })}
                        className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-[0.82rem] text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                      >
                        <option value="bottom-right">Bottom right</option>
                        <option value="bottom-left">Bottom left</option>
                      </select>
                    </Field>
                    <Field label="Widget label" htmlFor="ps-label">
                      <Input
                        id="ps-label"
                        value={settings.widgetLabel}
                        onChange={(e) => patch({ widgetLabel: e.target.value })}
                        placeholder="Send Feedback"
                        className="h-9"
                      />
                    </Field>
                  </div>
                </SettingsCard>
              </div>
            )}

            {tab === "collection" && (
              <SettingsCard title="Data collection" description="Control what context Whisper attaches to each report.">
                <div className="space-y-1 divide-y divide-zinc-100">
                  <ToggleRow
                    id="cap-console"
                    label="Console logs"
                    description="Capture browser console output."
                    checked={settings.captureConsole}
                    onCheckedChange={(v) => patch({ captureConsole: v })}
                  />
                  <ToggleRow
                    id="cap-net-fail"
                    label="Network failures"
                    description="Capture failed API calls (4xx / 5xx)."
                    checked={settings.captureNetworkFailuresOnly}
                    onCheckedChange={(v) => patch({ captureNetworkFailuresOnly: v })}
                  />
                  <ToggleRow
                    id="cap-session"
                    label="Session timeline"
                    description="Record the last ~30s of clicks and scrolls."
                    checked={settings.sessionTimelineEnabled}
                    onCheckedChange={(v) => patch({ sessionTimelineEnabled: v })}
                  />
                  <ToggleRow
                    id="cap-device"
                    label="Device metadata"
                    description="Browser, OS, viewport, and screen size."
                    checked={settings.captureDeviceMetadata}
                    onCheckedChange={(v) => patch({ captureDeviceMetadata: v })}
                  />
                </div>
              </SettingsCard>
            )}

            {tab === "notifications" && (
              <SettingsCard title="Alert destinations" description="Where to send new issue notifications.">
                <div className="space-y-4">
                  <Field
                    label={<span className="flex items-center gap-1.5"><Mail className="size-3 text-zinc-400" />Email alerts</span>}
                    htmlFor="ps-email"
                  >
                    <Input
                      id="ps-email"
                      type="email"
                      value={settings.alertEmail}
                      onChange={(e) => patch({ alertEmail: e.target.value })}
                      placeholder="team@company.com"
                    />
                  </Field>
                  <Field
                    label={<span className="flex items-center gap-1.5"><Webhook className="size-3 text-zinc-400" />Slack webhook</span>}
                    htmlFor="ps-slack"
                  >
                    <Input
                      id="ps-slack"
                      value={settings.slackWebhookUrl}
                      onChange={(e) => patch({ slackWebhookUrl: e.target.value })}
                      className="font-mono text-xs"
                      placeholder="https://hooks.slack.com/services/…"
                    />
                  </Field>
                  <Field
                    label={<span className="flex items-center gap-1.5"><MessageCircle className="size-3 text-indigo-400" />Discord webhook</span>}
                    htmlFor="ps-discord"
                  >
                    <Input
                      id="ps-discord"
                      value={settings.discordWebhookUrl}
                      onChange={(e) => patch({ discordWebhookUrl: e.target.value })}
                      className="font-mono text-xs"
                      placeholder="https://discord.com/api/webhooks/…"
                    />
                  </Field>
                </div>
              </SettingsCard>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ───── Small reusable primitives ───── */

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 px-5 py-4">
        <h3 className="text-[0.88rem] font-semibold text-zinc-900">{title}</h3>
        <p className="mt-0.5 text-[0.78rem] text-zinc-500">{description}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: React.ReactNode;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-[0.78rem] text-zinc-600">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <Label htmlFor={id} className="cursor-pointer text-[0.82rem] text-zinc-900">{label}</Label>
        <p className="text-[0.75rem] text-zinc-500">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function CopyBtn({
  copied,
  onClick,
  label,
}: {
  copied: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 shrink-0 gap-1.5 border-zinc-200 text-zinc-600 hover:bg-zinc-50"
      onClick={onClick}
    >
      {copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
      {label ?? (copied ? "Copied" : "Copy")}
    </Button>
  );
}
