"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Copy,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  /** Session window for the embed (10 / 30 / 60 seconds). */
  sessionTimelineSeconds: 10 | 30 | 60;
};

const tabTransition = { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] as const };

export function ProjectSettingsPanel({
  apiKey,
  settings,
  onSettingsChange,
  appOrigin,
  sessionTimelineSeconds,
}: ProjectSettingsPanelProps) {
  const [tab, setTab] = useState("general");
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
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1.5 sm:grid-cols-4">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="size-4 shrink-0 text-slate-500" aria-hidden />
            General
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Paintbrush className="size-4 shrink-0 text-slate-500" aria-hidden />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="collection" className="gap-2">
            <Shield className="size-4 shrink-0 text-slate-500" aria-hidden />
            Collection
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="size-4 shrink-0 text-slate-500" aria-hidden />
            Notifications
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={tabTransition}
          className="min-h-[320px]"
        >
          {tab === "general" && (
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-slate-900">Project details</h3>
                <p className="mt-1 text-xs text-slate-600">
                  Identity and URL for this Whisper site.
                </p>
                <div className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ps-name" className="text-slate-700">
                      Project name
                    </Label>
                    <Input
                      id="ps-name"
                      value={settings.projectName}
                      onChange={(e) => patch({ projectName: e.target.value })}
                      className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                      placeholder="My production app"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ps-url" className="text-slate-700">
                      Website URL
                    </Label>
                    <Input
                      id="ps-url"
                      type="url"
                      value={settings.websiteUrl}
                      onChange={(e) => patch({ websiteUrl: e.target.value })}
                      className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                      placeholder="https://app.example.com"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-slate-900">Public API key</h3>
                <p className="mt-1 text-xs text-slate-600">
                  Embed key — safe to expose in your frontend bundle.
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <code className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-cyan-700">
                    {apiKey}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-slate-200 text-slate-800 hover:bg-slate-50"
                    onClick={() => void copy("api", apiKey)}
                  >
                    <Copy className="size-4" />
                    {copied === "api" ? "Copied" : "Copy"}
                  </Button>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-cyan-200/80 bg-gradient-to-b from-cyan-50/90 to-white p-5 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Installation code</h3>
                    <p className="mt-1 max-w-xl text-xs text-slate-600">
                      Paste before the closing <code className="text-slate-800">&lt;/body&gt;</code>.
                      Updates live as you adjust Appearance &amp; Collection.
                    </p>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={minimalScript}
                      onChange={(e) => setMinimalScript(e.target.checked)}
                      className="rounded border-slate-300 bg-white"
                    />
                    Minimal snippet only
                  </label>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-slate-200 text-slate-800 hover:bg-slate-50"
                    onClick={() => void copy("script", scriptText)}
                  >
                    <Copy className="size-4" />
                    {copied === "script" ? "Copied" : "Copy script"}
                  </Button>
                </div>
                <pre className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-slate-900 p-4 text-[0.7rem] leading-relaxed text-emerald-400/95 sm:text-xs">
                  <code>{scriptText}</code>
                </pre>
              </section>
            </div>
          )}

          {tab === "appearance" && (
            <div className="space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-slate-900">Theme</h3>
                <p className="mt-1 text-xs text-slate-600">Widget chrome and panel appearance.</p>
                <RadioGroup
                  value={settings.theme}
                  onValueChange={(v) => patch({ theme: v as WidgetThemeMode })}
                  className="mt-4 grid gap-3 sm:grid-cols-3"
                >
                  {(
                    [
                      { id: "light", label: "Light" },
                      { id: "dark", label: "Dark" },
                      { id: "system", label: "System" },
                    ] as const
                  ).map((opt) => (
                    <label
                      key={opt.id}
                      htmlFor={`theme-${opt.id}`}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                        settings.theme === opt.id
                          ? "border-cyan-500/40 bg-cyan-50"
                          : "border-slate-200 bg-slate-50/80 hover:border-slate-300"
                      )}
                    >
                      <RadioGroupItem value={opt.id} id={`theme-${opt.id}`} />
                      <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h3 className="text-sm font-semibold text-slate-900">Accent color</h3>
                <p className="mt-1 text-xs text-slate-600">Primary color for the launcher and highlights.</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {ACCENT_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      title={p.label}
                      onClick={() => patch({ accentColor: p.hex })}
                      className={cn(
                        "size-10 rounded-full ring-2 ring-offset-2 ring-offset-white transition-transform hover:scale-105",
                        settings.accentColor.toLowerCase() === p.hex.toLowerCase()
                          ? "ring-cyan-400"
                          : "ring-transparent"
                      )}
                      style={{ backgroundColor: p.hex }}
                    />
                  ))}
                </div>
                <div className="mt-4 flex max-w-xs items-center gap-2">
                  <span className="text-xs font-mono text-slate-500">#</span>
                  <Input
                    value={settings.accentColor.replace(/^#/, "")}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
                      patch({ accentColor: raw ? `#${raw}` : "#" });
                    }}
                    className="h-10 border-slate-200 bg-slate-50 font-mono text-sm text-slate-900"
                    placeholder="06b6d4"
                  />
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ps-position" className="text-slate-700">
                      Position
                    </Label>
                    <select
                      id="ps-position"
                      value={settings.position}
                      onChange={(e) =>
                        patch({ position: e.target.value as WidgetPosition })
                      }
                      className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                    >
                      <option value="bottom-right">Bottom right</option>
                      <option value="bottom-left">Bottom left</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ps-label" className="text-slate-700">
                      Widget label
                    </Label>
                    <Input
                      id="ps-label"
                      value={settings.widgetLabel}
                      onChange={(e) => patch({ widgetLabel: e.target.value })}
                      className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                      placeholder="Send Feedback"
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {tab === "collection" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                  <Shield className="size-5 text-cyan-600" aria-hidden />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Ingestion engine</h3>
                  <p className="mt-1 text-xs text-slate-600">
                    Control what technical context Whisper attaches to each report.
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-5 border-t border-slate-200 pt-6">
                <ConfigRow
                  id="cap-console"
                  label="Console logs"
                  description="Capture browser console output with each report."
                  checked={settings.captureConsole}
                  onCheckedChange={(v) => patch({ captureConsole: v })}
                />
                <ConfigRow
                  id="cap-net-fail"
                  label="Network requests"
                  description="Capture failed API calls (HTTP 4xx / 5xx)."
                  checked={settings.captureNetworkFailuresOnly}
                  onCheckedChange={(v) => patch({ captureNetworkFailuresOnly: v })}
                />
                <ConfigRow
                  id="cap-session"
                  label="Session timeline"
                  description="Record the last ~30s of clicks and scrolls for replay."
                  checked={settings.sessionTimelineEnabled}
                  onCheckedChange={(v) => patch({ sessionTimelineEnabled: v })}
                />
                <ConfigRow
                  id="cap-device"
                  label="Device metadata"
                  description="Browser, OS, viewport, and screen size."
                  checked={settings.captureDeviceMetadata}
                  onCheckedChange={(v) => patch({ captureDeviceMetadata: v })}
                />
              </div>
            </section>
          )}

          {tab === "notifications" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-slate-900">Alert destinations</h3>
              <p className="mt-1 text-xs text-slate-600">
                Where Whisper should send new issue notifications (mock — connect API later).
              </p>
              <div className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="ps-email" className="flex items-center gap-2 text-slate-700">
                    <Mail className="size-3.5 text-slate-500" aria-hidden />
                    Email alerts
                  </Label>
                  <Input
                    id="ps-email"
                    type="email"
                    value={settings.alertEmail}
                    onChange={(e) => patch({ alertEmail: e.target.value })}
                    className="h-11 border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                    placeholder="team@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ps-slack" className="flex items-center gap-2 text-slate-700">
                    <Webhook className="size-3.5 text-slate-500" aria-hidden />
                    Slack webhook URL
                  </Label>
                  <Input
                    id="ps-slack"
                    value={settings.slackWebhookUrl}
                    onChange={(e) => patch({ slackWebhookUrl: e.target.value })}
                    className="h-11 border-slate-200 bg-slate-50 font-mono text-xs text-slate-900 placeholder:text-slate-400"
                    placeholder="https://hooks.slack.com/services/…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ps-discord" className="flex items-center gap-2 text-slate-700">
                    <MessageCircle className="size-3.5 text-indigo-500" aria-hidden />
                    Discord webhook URL
                  </Label>
                  <Input
                    id="ps-discord"
                    value={settings.discordWebhookUrl}
                    onChange={(e) => patch({ discordWebhookUrl: e.target.value })}
                    className="h-11 border-slate-200 bg-slate-50 font-mono text-xs text-slate-900 placeholder:text-slate-400"
                    placeholder="https://discord.com/api/webhooks/…"
                  />
                </div>
              </div>
            </section>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ConfigRow({
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
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 space-y-0.5">
        <Label htmlFor={id} className="cursor-pointer text-slate-900">
          {label}
        </Label>
        <p className="text-xs text-slate-600">{description}</p>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="focus-visible:ring-offset-white"
      />
    </div>
  );
}
