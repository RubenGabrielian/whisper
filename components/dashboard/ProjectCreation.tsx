"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Plus,
  Search,
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
  const [search, setSearch] = useState("");

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
    return () => { cancelled = true; };
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
        const base = typeof data.error === "string" ? data.error : "Could not create project.";
        const detail = typeof data.details === "string" && data.details.length > 0 ? ` ${data.details}` : "";
        setCreateError(`${base}${detail}`.trim());
        return;
      }
      if (!data.project) { setCreateError("Could not create project."); return; }
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
    if (JSON.stringify(settingsDraft) === JSON.stringify(selectedProject.settings)) return;

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
        const data = (await res.json().catch(() => ({}))) as { error?: string; project?: Project };
        if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Save failed");
        if (!data.project) throw new Error("Invalid response");
        setSelectedProject(data.project);
        setProjects((prev) => prev.map((p) => (p.id === data.project!.id ? data.project! : p)));
        setSaveState("saved");
        window.setTimeout(() => setSaveState("idle"), 2000);
      } catch {
        setSaveState("error");
      }
    }, 900);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [settingsDraft, mode, selectedProject]);

  const filtered = projects.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.websiteUrl.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence mode="wait">
      {mode === "list" && (
        <motion.div
          key="list"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Page header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[1.4rem] font-semibold tracking-tight text-zinc-900">
                Projects
              </h1>
              <p className="mt-0.5 text-[0.82rem] text-zinc-500">
                Manage your Whisper widgets and configuration.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => { setCreateError(null); setName(""); setWebsiteUrl(""); setMode("wizard"); }}
              className="bg-zinc-900 text-white shadow-sm hover:bg-zinc-800"
            >
              <Plus className="size-3.5" />
              New project
            </Button>
          </div>

          {listError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-[0.82rem] text-red-800">
              {listError}
            </div>
          )}

          {/* Search */}
          {projects.length > 0 && (
            <div className="relative mt-6">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search projects…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full max-w-xs rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-[0.82rem] text-zinc-900 placeholder:text-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-shadow"
              />
            </div>
          )}

          {/* Project grid */}
          <div className="mt-5">
            {listLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900" />
              </div>
            ) : filtered.length === 0 && projects.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center">
                <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-lg bg-zinc-100">
                  <Globe className="size-5 text-zinc-400" />
                </div>
                <p className="text-sm font-medium text-zinc-900">No projects yet</p>
                <p className="mt-1 text-[0.82rem] text-zinc-500">
                  Create your first project to start collecting feedback.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-500">No projects match your search.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => openSettings(p)}
                    className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition-all hover:border-zinc-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                        <Globe className="size-4" />
                      </div>
                      <span
                        className={cn(
                          "mt-0.5 inline-flex rounded-full px-2 py-0.5 text-[0.68rem] font-medium",
                          p.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-zinc-100 text-zinc-500"
                        )}
                      >
                        {p.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-zinc-900 group-hover:text-zinc-950">
                      {p.name}
                    </h3>
                    <div className="mt-1 flex items-center gap-1 text-[0.75rem] text-zinc-400">
                      <span className="truncate">{p.websiteUrl.replace(/^https?:\/\//, "")}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </div>
                    <div className="mt-auto flex items-center justify-end pt-3">
                      <span className="flex items-center gap-1 text-[0.75rem] font-medium text-zinc-400 group-hover:text-zinc-600 transition-colors">
                        Configure
                        <ChevronRight className="size-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {mode === "wizard" && (
        <motion.div
          key="wizard"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
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
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Breadcrumb */}
          <div className="mb-6 flex items-center gap-2 text-[0.8rem]">
            <button
              type="button"
              onClick={goToList}
              className="font-medium text-zinc-500 transition-colors hover:text-zinc-900"
            >
              Projects
            </button>
            <ChevronRight className="size-3 text-zinc-300" />
            <span className="font-medium text-zinc-900 truncate max-w-[200px]">{selectedProject.name}</span>
          </div>

          {/* Settings header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-900 text-white">
                <Globe className="size-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-zinc-900">{selectedProject.name}</h1>
                <p className="text-[0.78rem] text-zinc-500">
                  {selectedProject.websiteUrl.replace(/^https?:\/\//, "")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {saveState === "saving" && (
                <span className="flex items-center gap-1.5 text-[0.75rem] text-zinc-400">
                  <div className="size-3 animate-spin rounded-full border border-zinc-300 border-t-zinc-600" />
                  Saving…
                </span>
              )}
              {saveState === "saved" && (
                <span className="text-[0.75rem] text-emerald-600 font-medium">Saved</span>
              )}
              {saveState === "error" && (
                <span className="text-[0.75rem] text-red-600 font-medium">Save failed</span>
              )}
              <button
                type="button"
                onClick={goToList}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-[0.78rem] font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50"
              >
                <ArrowLeft className="size-3" />
                Back
              </button>
            </div>
          </div>

          <div className="mt-6">
            <ProjectSettingsPanel
              apiKey={selectedProject.apiKey}
              settings={settingsDraft}
              onSettingsChange={setSettingsDraft}
              appOrigin={appOrigin}
              sessionTimelineSeconds={selectedProject.config.sessionTimelineSeconds}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
