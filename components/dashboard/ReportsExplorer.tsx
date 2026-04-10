"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Globe,
  Mouse,
  Keyboard,
  Map as MapIcon,
  Monitor,
  Terminal,
  Wifi,
  Zap,
} from "lucide-react";
import type { FeedbackEvent } from "@/lib/email/feedback-report-html";
import type { ReportLogs, ReportStatus, ReportUserData } from "@/lib/reports/types";

type ListRow = {
  id: string;
  project_id: string;
  user_message: string;
  status: ReportStatus;
  created_at: string;
  user_data: Record<string, unknown>;
};

type FullReport = ListRow & {
  session_timeline: FeedbackEvent[];
  logs: ReportLogs;
  owner_email: string;
};

const EVENT_ICON: Record<FeedbackEvent["type"], typeof Mouse> = {
  click: Mouse,
  input: Keyboard,
  navigation: MapIcon,
};

function statusLabel(s: ReportStatus): string {
  if (s === "resolved") return "Fixed";
  if (s === "archived") return "Archived";
  return "New";
}

function statusStyles(s: ReportStatus): string {
  if (s === "resolved")
    return "bg-emerald-500/15 text-emerald-400 border-emerald-700/60";
  if (s === "archived") return "bg-zinc-800 text-zinc-500 border-zinc-700";
  return "bg-amber-500/15 text-amber-400 border-amber-700/60";
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function relTime(ts: number, ref: number): string {
  const s = Math.floor((ref - ts) / 1000);
  if (s <= 0) return "now";
  return `−${s}s`;
}

function ConsoleLine({ level, text }: { level: string; text: string }) {
  const col =
    level === "error"
      ? "text-red-400"
      : level === "warn"
        ? "text-amber-400"
        : "text-zinc-400";
  const pre = level === "error" ? "›" : level === "warn" ? "!" : "$";
  return (
    <div className={`font-mono text-[0.68rem] leading-relaxed ${col}`}>
      <span className="text-zinc-600 mr-1.5 select-none">{pre}</span>
      {text}
    </div>
  );
}

type TabKey = "console" | "network";

export function ReportsExplorer({ initialReportId }: { initialReportId?: string }) {
  const router = useRouter();
  const [list, setList] = useState<ListRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(initialReportId ?? null);
  const [detail, setDetail] = useState<FullReport | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [tab, setTab] = useState<TabKey>("console");
  const [actionBusy, setActionBusy] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const refTs = useMemo(
    () =>
      (detail?.user_data as ReportUserData | undefined)?.receiptAt ??
      (detail ? new Date(detail.created_at).getTime() : Date.now()),
    [detail]
  );

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch("/api/reports");
      const data = (await res.json().catch(() => ({}))) as {
        reports?: ListRow[];
        error?: string;
      };
      if (!res.ok) {
        setListError(data.error || "Could not load reports");
        setList([]);
        return;
      }
      setList(data.reports ?? []);
    } catch {
      setListError("Network error");
      setList([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setDetailError(null);
    try {
      const res = await fetch(`/api/reports/${id}`);
      const data = (await res.json().catch(() => ({}))) as {
        report?: FullReport;
        error?: string;
      };
      if (!res.ok) {
        setDetail(null);
        setDetailError(data.error || "Not found");
        return;
      }
      setDetail(data.report ?? null);
    } catch {
      setDetail(null);
      setDetailError("Network error");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (initialReportId) setSelectedId(initialReportId);
  }, [initialReportId]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  const selectReport = (id: string) => {
    setSelectedId(id);
    router.push(`/dashboard/reports/${id}`);
  };

  const patchStatus = async (status: ReportStatus) => {
    if (!selectedId) return;
    setActionBusy(true);
    try {
      const res = await fetch(`/api/reports/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json().catch(() => ({}))) as { report?: FullReport; error?: string };
      if (!res.ok) {
        setDetailError(data.error || "Update failed");
        return;
      }
      const next = data.report;
      if (next) {
        setDetail(next);
        setList((prev) =>
          prev.map((r) => (r.id === selectedId ? { ...r, status: next.status } : r))
        );
      }
    } finally {
      setActionBusy(false);
    }
  };

  const shareLink = async () => {
    if (!selectedId || typeof window === "undefined") return;
    const url = `${window.location.origin}/dashboard/reports/${selectedId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setDetailError("Could not copy link");
    }
  };

  const ud = detail?.user_data as ReportUserData | undefined;
  const logs = detail?.logs;
  const timeline = Array.isArray(detail?.session_timeline) ? detail.session_timeline : [];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
      {/* Sidebar */}
      <aside className="w-full shrink-0 lg:w-[300px]">
        <div className="border-2 border-zinc-800 bg-zinc-900/80 shadow-[4px_4px_0_0_#000]">
          <div className="flex items-center justify-between border-b-2 border-zinc-800 px-3 py-2.5">
            <span className="text-[0.65rem] font-mono font-bold uppercase tracking-[0.14em] text-zinc-500">
              Inbox
            </span>
            <button
              type="button"
              onClick={() => loadList()}
              className="text-[0.65rem] font-mono font-bold text-amber-400 hover:text-amber-300"
            >
              Refresh
            </button>
          </div>
          <div className="max-h-[min(70vh,560px)] overflow-y-auto">
            {listLoading && (
              <div className="px-3 py-8 text-center text-[0.75rem] font-mono text-zinc-600">
                Loading…
              </div>
            )}
            {listError && (
              <div className="m-2 border-2 border-red-900/60 bg-red-950/40 px-2 py-2 text-[0.72rem] text-red-300">
                {listError}
              </div>
            )}
            {!listLoading && !list.length && !listError && (
              <div className="px-3 py-10 text-center">
                <Zap className="mx-auto mb-2 text-amber-400/50" size={22} />
                <p className="text-[0.78rem] font-mono text-zinc-500">
                  No reports yet. Submit feedback from a site with your widget installed.
                </p>
                <Link
                  href="/dashboard"
                  className="mt-3 inline-block text-[0.72rem] font-bold text-amber-400 hover:underline"
                >
                  Go to projects
                </Link>
              </div>
            )}
            {list.map((r) => {
              const active = r.id === selectedId;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => selectReport(r.id)}
                  className={`flex w-full flex-col gap-1 border-b border-zinc-800 px-3 py-3 text-left transition-colors ${
                    active ? "bg-amber-400/10" : "hover:bg-zinc-800/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex border-2 px-1.5 py-0.5 text-[0.58rem] font-mono font-bold uppercase ${statusStyles(r.status)}`}
                    >
                      {statusLabel(r.status)}
                    </span>
                    <span className="flex items-center gap-1 text-[0.62rem] font-mono text-zinc-600">
                      <Clock size={10} />
                      {formatTime(r.created_at)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-[0.78rem] font-medium leading-snug text-zinc-200">
                    {r.user_message}
                  </p>
                  <span className="flex items-center gap-0.5 text-[0.65rem] font-mono text-zinc-500">
                    Open
                    <ChevronRight size={12} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Detail */}
      <section className="min-w-0 flex-1">
        {!selectedId && (
          <div className="flex min-h-[420px] flex-col items-center justify-center border-2 border-dashed border-zinc-800 bg-zinc-900/40 px-6 text-center">
            <Activity className="mb-3 text-zinc-600" size={28} />
            <p className="max-w-sm text-[0.85rem] font-mono text-zinc-500">
              Select a report to view the full session timeline, console output, and network trace.
            </p>
          </div>
        )}

        {selectedId && detailLoading && (
          <div className="flex min-h-[320px] items-center justify-center border-2 border-zinc-800 bg-zinc-900/60 font-mono text-sm text-zinc-500">
            Loading report…
          </div>
        )}

        {selectedId && detailError && !detailLoading && (
          <div className="border-2 border-red-900/50 bg-red-950/30 px-4 py-4 font-mono text-sm text-red-300">
            {detailError}
          </div>
        )}

        <AnimatePresence mode="wait">
          {selectedId && detail && !detailLoading && (
            <motion.div
              key={detail.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {/* Hero header */}
              <div className="border-2 border-zinc-800 bg-zinc-900 shadow-[6px_6px_0_0_#000]">
                <div className="border-b-2 border-zinc-800 px-4 py-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`inline-flex border-2 px-2 py-0.5 text-[0.62rem] font-mono font-bold uppercase ${statusStyles(detail.status)}`}
                      >
                        {statusLabel(detail.status)}
                      </span>
                      <span className="text-[0.65rem] font-mono text-zinc-500">
                        {formatTime(detail.created_at)}
                      </span>
                    </div>
                    <h1 className="text-lg font-black leading-snug text-zinc-50 sm:text-xl max-w-3xl">
                      {detail.user_message}
                    </h1>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {detail.status !== "resolved" && (
                      <motion.button
                        type="button"
                        disabled={actionBusy}
                        whileTap={{ x: 2, y: 2 }}
                        onClick={() => patchStatus("resolved")}
                        className="flex items-center gap-2 border-2 border-zinc-950 bg-emerald-400 px-3 py-2 text-[0.72rem] font-black text-zinc-950 shadow-[4px_4px_0_0_#000] hover:shadow-[3px_3px_0_0_#000] disabled:opacity-50"
                      >
                        <Check size={14} strokeWidth={2.5} />
                        Mark resolved
                      </motion.button>
                    )}
                    {detail.status === "resolved" && (
                      <motion.button
                        type="button"
                        disabled={actionBusy}
                        whileTap={{ x: 2, y: 2 }}
                        onClick={() => patchStatus("new")}
                        className="border-2 border-zinc-700 bg-zinc-800 px-3 py-2 text-[0.72rem] font-bold text-zinc-200 shadow-[4px_4px_0_0_#000]"
                      >
                        Reopen
                      </motion.button>
                    )}
                    <motion.button
                      type="button"
                      whileTap={{ x: 2, y: 2 }}
                      onClick={shareLink}
                      className="flex items-center gap-2 border-2 border-zinc-950 bg-amber-400 px-3 py-2 text-[0.72rem] font-black text-zinc-950 shadow-[4px_4px_0_0_#000]"
                    >
                      <Copy size={14} />
                      {copyDone ? "Copied!" : "Share with team"}
                    </motion.button>
                  </div>
                </div>
                <div className="grid gap-px bg-zinc-800 sm:grid-cols-3">
                  {[
                    {
                      icon: Monitor,
                      label: "Browser",
                      value:
                        ud?.browser && ud?.browserVersion
                          ? `${ud.browser} ${ud.browserVersion}`
                          : ud?.browser || "—",
                    },
                    { icon: Globe, label: "OS", value: ud?.os || "—" },
                    {
                      icon: Activity,
                      label: "Screen",
                      value: ud?.screenResolution || "—",
                    },
                  ].map(({ icon: Icon, label, value }) => (
                    <div
                      key={label}
                      className="flex items-start gap-2 bg-zinc-950 px-3 py-3"
                    >
                      <Icon size={14} className="mt-0.5 shrink-0 text-zinc-600" />
                      <div>
                        <div className="text-[0.58rem] font-mono font-bold uppercase tracking-wider text-zinc-600">
                          {label}
                        </div>
                        <div className="text-[0.78rem] font-mono text-zinc-200">{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
                {ud?.url && (
                  <div className="border-t-2 border-zinc-800 px-3 py-2.5">
                    <div className="text-[0.58rem] font-mono font-bold uppercase text-zinc-600">
                      Page URL
                    </div>
                    <a
                      href={ud.url}
                      target="_blank"
                      rel="noreferrer"
                      className="break-all text-[0.75rem] font-mono text-amber-400 hover:underline"
                    >
                      {ud.url}
                    </a>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="border-2 border-zinc-800 bg-zinc-900 shadow-[4px_4px_0_0_#000]">
                <div className="flex items-center gap-2 border-b-2 border-zinc-800 px-3 py-2">
                  <Zap size={14} className="text-amber-400" />
                  <span className="text-[0.65rem] font-mono font-bold uppercase tracking-[0.12em] text-zinc-500">
                    Session timeline
                  </span>
                </div>
                <div className="max-h-[280px] overflow-y-auto px-3 py-4">
                  {timeline.length === 0 ? (
                    <p className="text-center text-[0.75rem] font-mono text-zinc-600">
                      No session events captured.
                    </p>
                  ) : (
                    <ul className="relative space-y-0 pl-1">
                      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-zinc-800" />
                      {timeline.map((ev) => {
                        const Icon = EVENT_ICON[ev.type] ?? Mouse;
                        return (
                          <li key={ev.id} className="relative flex gap-3 pb-4 pl-1 last:pb-0">
                            <div className="relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center border-2 border-zinc-800 bg-zinc-950">
                              <Icon size={12} className="text-amber-400" />
                            </div>
                            <div className="min-w-0 flex-1 pt-0.5">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <span className="text-[0.58rem] font-mono font-bold uppercase text-zinc-500">
                                  {ev.type}
                                </span>
                                <span className="text-[0.62rem] font-mono text-zinc-600">
                                  {relTime(ev.timestamp, refTs)}
                                </span>
                              </div>
                              <p className="text-[0.78rem] font-mono leading-relaxed text-zinc-200">
                                {ev.description}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>

              {/* Terminal tabs */}
              <div className="border-2 border-zinc-800 bg-zinc-900 shadow-[4px_4px_0_0_#000] overflow-hidden">
                <div className="flex border-b-2 border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setTab("console")}
                    className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-[0.72rem] font-mono font-bold transition-colors ${
                      tab === "console"
                        ? "bg-zinc-950 text-amber-400"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Terminal size={14} />
                    Console
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab("network")}
                    className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-[0.72rem] font-mono font-bold transition-colors ${
                      tab === "network"
                        ? "bg-zinc-950 text-amber-400"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Wifi size={14} />
                    Network
                  </button>
                </div>
                <div className="bg-zinc-950 p-3 max-h-[320px] overflow-y-auto">
                  {tab === "console" && (
                    <>
                      {!logs?.console?.length ? (
                        <p className="text-center text-[0.75rem] font-mono text-zinc-600 py-6">
                          No console output.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {logs.console.map((c, i) => (
                            <ConsoleLine key={`${c.timestamp}-${i}`} level={c.level} text={c.text} />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  {tab === "network" && (
                    <>
                      {!logs?.network?.length ? (
                        <p className="text-center text-[0.75rem] font-mono text-zinc-600 py-6">
                          No network requests recorded.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {logs.network.map((n, i) => {
                            const failed = (n.status ?? 0) >= 400 || !n.ok;
                            return (
                              <div
                                key={`${n.url}-${n.timestamp}-${i}`}
                                className={`border-2 px-2 py-2 font-mono text-[0.68rem] ${
                                  failed
                                    ? "border-red-900/50 bg-red-950/25"
                                    : "border-zinc-800 bg-zinc-900/50"
                                }`}
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`font-bold ${
                                      n.method === "GET"
                                        ? "text-sky-400"
                                        : n.method === "POST"
                                          ? "text-emerald-400"
                                          : "text-amber-400"
                                    }`}
                                  >
                                    {n.method}
                                  </span>
                                  <span
                                    className={
                                      failed ? "text-red-400 font-bold" : "text-emerald-400"
                                    }
                                  >
                                    {n.status ?? "—"}
                                  </span>
                                  <span className="text-zinc-600">{n.durationMs ?? "—"}ms</span>
                                </div>
                                <div className="mt-1 break-all text-zinc-400">{n.url}</div>
                                {n.error && (
                                  <div className="mt-1 flex items-center gap-1 text-red-400/90">
                                    <AlertTriangle size={12} />
                                    {n.error}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
