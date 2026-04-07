"use client";

/**
 * Dashboard projects: list, create wizard, and tabbed configuration (saved to Supabase).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ExternalLink,
  FolderOpen,
  Plus,
  Settings2,
} from "lucide-react";

import { CreateProjectWizard } from "@/components/dashboard/CreateProjectWizard";
import { ProjectSettingsPanel } from "@/components/dashboard/ProjectSettingsPanel";
import { Button } from "@/components/ui/button";
import {
  defaultProjectDashboardSettings,
  type ProjectDashboardSettings,
} from "@/lib/dashboard/project-settings";
import type { Project } from "@/lib/projects/types";
import { isValidHttpUrl, normalizeWebsiteUrl } from "@/lib/projects/url";
import { cn } from "@/lib/utils";

export type {
  Project,
  ProjectConfig,
  ProjectStatus,
  SessionTimelineSeconds,
} from "@/lib/projects/types";
export { SESSION_TIMELINE_OPTIONS } from "@/lib/projects/types";
/** @deprecated Use `Project` from `@/lib/projects/types` */
export type MockProject = Project;

type Mode = "list" | "wizard" | "settings";

export type ProjectCreationProps = {
  /** Base URL of this Whisper deployment (used in the install snippet). */
  appOrigin: string;
};

export function ProjectCreation({ appOrigin }: ProjectCreationProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("list");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<ProjectDashboardSettings>(() =>
    defaultProjectDashboardSettings()
  );

  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setListLoading(true);
      setListError(null);
      try {
        const res = await fetch("/api/projects");
        if (!res.ok) {
          setListError(
            res.status === 401 ? "Please sign in to view projects." : "Could not load projects."
          );
          return;
        }
        const data = (await res.json()) as { projects?: Project[] };
        if (!cancelled && Array.isArray(data.projects)) {
          setProjects(data.projects);
        }
      } catch {
        if (!cancelled) setListError("Could not load projects.");
      } finally {
        if (!cancelled) setListLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const openSettings = useCallback((project: Project) => {
    setSelectedProject(project);
    setSettingsDraft({ ...project.settings });
    setSaveState("idle");
    setMode("settings");
  }, []);

  const goToList = useCallback(() => {
    setMode("list");
    setSelectedProject(null);
    setName("");
    setWebsiteUrl("");
    setCreateError(null);
  }, []);

  const canCreate = name.trim().length >= 2 && isValidHttpUrl(websiteUrl);

  const handleCreateProject = async () => {
    setCreateError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          website_url: normalizeWebsiteUrl(websiteUrl),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: string;
        project?: Project;
      };
      if (!res.ok) {
        const base =
          typeof data.error === "string" ? data.error : "Could not create project.";
        const detail =
          typeof data.details === "string" && data.details.length > 0
            ? ` ${data.details}`
            : "";
        setCreateError(`${base}${detail}`.trim());
        return;
      }
      if (!data.project) {
        setCreateError("Could not create project.");
        return;
      }
      setProjects((prev) => [data.project!, ...prev]);
      setSelectedProject(data.project);
      setSettingsDraft({ ...data.project.settings });
      setSaveState("idle");
      setMode("settings");
      setName("");
      setWebsiteUrl("");
    } catch {
      setCreateError("Could not create project.");
    } finally {
      setCreating(false);
    }
  };

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (mode !== "settings" || !selectedProject) return;
    if (JSON.stringify(settingsDraft) === JSON.stringify(selectedProject.settings)) {
      return;
    }

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const projectId = selectedProject.id;
      setSaveState("saving");
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settingsDraft),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          project?: Project;
        };
        if (!res.ok) {
          throw new Error(typeof data.error === "string" ? data.error : "Save failed");
        }
        if (!data.project) throw new Error("Invalid response");
        setSelectedProject(data.project);
        setProjects((prev) => prev.map((p) => (p.id === data.project!.id ? data.project! : p)));
        setSaveState("saved");
        window.setTimeout(() => setSaveState("idle"), 2000);
      } catch {
        setSaveState("error");
      }
    }, 900);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [settingsDraft, mode, selectedProject]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-900/5">
      <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
        {mode === "list" && listError && (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {listError}
          </p>
        )}

        {mode === "list" && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.14em] text-cyan-600">
                Projects
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
                Your sites
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Configure Whisper per project — ingestion, appearance, and alerts.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setCreateError(null);
                setName("");
                setWebsiteUrl("");
                setMode("wizard");
              }}
              className="bg-cyan-600 text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-500"
            >
              <Plus className="size-4" />
              Add project
            </Button>
          </div>
        )}

        {mode === "wizard" && (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.14em] text-cyan-600">
                New project
              </p>
              <h2 className="mt-1 font-display text-xl font-bold text-slate-900">Create</h2>
            </div>
          </div>
        )}

        {mode === "settings" && selectedProject && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={goToList}
                className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
              >
                <ArrowLeft className="size-4" />
                Projects
              </button>
              <div className="min-w-0 pl-1">
                <p className="text-xs font-mono font-semibold uppercase tracking-[0.14em] text-cyan-600">
                  Configuration
                </p>
                <h2 className="truncate font-display text-xl font-bold text-slate-900 sm:text-2xl">
                  {selectedProject.name}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Local preview — wire to{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">
                    router.put
                  </code>{" "}
                  or your API when ready.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <FolderOpen className="size-4 shrink-0 text-slate-500" aria-hidden />
              <span className="truncate font-mono text-slate-700">{selectedProject.websiteUrl}</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-8 pt-2 sm:px-8 sm:pb-10 sm:pt-4">
        <AnimatePresence mode="wait">
          {mode === "list" && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
            >
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
                <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Settings2 className="size-4 text-slate-500" aria-hidden />
                    All projects
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3 font-medium sm:px-5">Name</th>
                        <th className="px-4 py-3 font-medium sm:px-5">URL</th>
                        <th className="px-4 py-3 font-medium sm:px-5">Status</th>
                        <th className="px-4 py-3 text-right font-medium sm:px-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listLoading ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-12 text-center text-slate-600">
                            Loading projects…
                          </td>
                        </tr>
                      ) : projects.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-12 text-center text-slate-600">
                            No projects yet. Add one to open the configuration workspace.
                          </td>
                        </tr>
                      ) : (
                        projects.map((p) => (
                          <tr
                            key={p.id}
                            className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                          >
                            <td className="px-4 py-3.5 font-medium text-slate-900 sm:px-5">
                              {p.name}
                            </td>
                            <td className="px-4 py-3.5 sm:px-5">
                              <a
                                href={p.websiteUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex max-w-[220px] items-center gap-1.5 truncate text-cyan-600 hover:text-cyan-700"
                              >
                                <span className="truncate">{p.websiteUrl}</span>
                                <ExternalLink className="size-3.5 shrink-0 opacity-70" />
                              </a>
                            </td>
                            <td className="px-4 py-3.5 sm:px-5">
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                  p.status === "active"
                                    ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                                    : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                                )}
                              >
                                {p.status === "active" ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right sm:px-5">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="border-slate-200 text-slate-800 hover:bg-slate-50"
                                onClick={() => openSettings(p)}
                              >
                                Configure
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {mode === "wizard" && (
            <motion.div key="wizard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CreateProjectWizard
                name={name}
                websiteUrl={websiteUrl}
                onNameChange={setName}
                onWebsiteUrlChange={setWebsiteUrl}
                onSubmit={handleCreateProject}
                onBack={goToList}
                creating={creating}
                error={createError}
                canSubmit={canCreate}
              />
            </motion.div>
          )}

          {mode === "settings" && selectedProject && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <ProjectSettingsPanel
                apiKey={selectedProject.apiKey}
                settings={settingsDraft}
                onSettingsChange={setSettingsDraft}
                appOrigin={appOrigin}
                sessionTimelineSeconds={selectedProject.config.sessionTimelineSeconds}
              />
              <p className="mt-8 text-center text-xs text-slate-500">
                {saveState === "saving" && "Saving…"}
                {saveState === "saved" && "All changes saved to Supabase."}
                {saveState === "error" && "Could not save. Check your connection and try again."}
                {saveState === "idle" && "Edits save automatically to your project in Supabase."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
