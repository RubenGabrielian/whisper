"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useClientEnvironment } from "@/hooks/useClientEnvironment";
import { snapshotToFeedbackContext } from "@/lib/client-environment";
import type { FeedbackContext } from "@/lib/email/feedback-report-html";
import { Inter } from "next/font/google";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import {
  Mouse,
  Keyboard,
  Map as MapIcon,
  Zap,
  X,
  Check,
  ArrowRight,
  Activity,
  Clock,
  AlertTriangle,
  Wifi,
  Monitor,
  Globe,
  MessageSquare,
} from "lucide-react";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

/* ═══════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════ */
type Stage = "closed" | "input" | "submitting" | "receipt";
type EventType = "click" | "input" | "navigation";

interface SessionEvent {
  id: string;
  type: EventType;
  description: string;
  timestamp: number;
}

type LogLevel = "error" | "warn" | "log";

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════ */

/** Relative time from event timestamp to reference (receipt time) */
function relTime(eventTs: number, refTs: number): string {
  const s = Math.floor((refTs - eventTs) / 1000);
  if (s <= 0) return "just now";
  if (s === 1) return "1s ago";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return m === 1 ? "1m ago" : `${m}m ago`;
}

/** Max visible label length for click reports (keeps emails/timeline readable). */
const CLICK_LABEL_MAX = 96;

/**
 * Best-effort visible label: what the user likely read (visible text, then aria/title).
 * Does not traverse up the DOM — uses the actual click target only.
 */
function clickVisibleLabel(el: HTMLElement): string {
  let raw = "";
  if (typeof el.innerText === "string" && el.innerText.trim()) {
    raw = el.innerText.trim().replace(/\s+/g, " ");
  } else {
    raw = (el.textContent ?? "").trim().replace(/\s+/g, " ");
  }
  if (raw) return raw.slice(0, CLICK_LABEL_MAX);

  const aria = el.getAttribute("aria-label")?.trim();
  if (aria) return aria.slice(0, CLICK_LABEL_MAX);

  const title = el.getAttribute("title")?.trim();
  if (title) return title.slice(0, CLICK_LABEL_MAX);

  const testId = el.getAttribute("data-testid") ?? el.getAttribute("data-label");
  if (testId?.trim()) return testId.trim().slice(0, CLICK_LABEL_MAX);

  return "";
}

function quoteLabel(s: string): string {
  const t = s.replace(/"/g, "'");
  return t.length > CLICK_LABEL_MAX ? `${t.slice(0, CLICK_LABEL_MAX - 1)}…` : t;
}

/**
 * Human-readable click: element type + id when present + visible text so reports
 * show e.g. `Clicked div — "Buy"` or `Clicked div #cta — "Add to cart"`.
 */
function describeClick(target: HTMLElement): string {
  const tag = target.tagName.toLowerCase();
  const role = target.getAttribute("role") ?? "";
  const id = target.id?.trim() ? `#${target.id.trim()}` : "";

  const label = clickVisibleLabel(target);
  const quoted = label ? ` — "${quoteLabel(label)}"` : "";

  const roleTag =
    role === "button" || tag === "button"
      ? "button"
      : role === "link" || tag === "a"
        ? "link"
        : tag;

  if (tag === "input") {
    const inp = target as HTMLInputElement;
    if (inp.type === "submit" || inp.type === "button") {
      const v = inp.value?.trim();
      return v
        ? `Clicked input[type=${inp.type}] — "${quoteLabel(v)}"`
        : `Clicked input[type=${inp.type}]${quoted || ""}`;
    }
    if (inp.type === "image") return `Clicked image button${quoted || ""}`;
  }

  if (roleTag === "button") {
    if (id) return `Clicked button ${id}${quoted}`;
    return quoted ? `Clicked button${quoted}` : "Clicked button";
  }

  if (roleTag === "link" || tag === "a") {
    if (id) return `Clicked link ${id}${quoted}`;
    return quoted ? `Clicked link${quoted}` : "Clicked link";
  }

  if (id) return `Clicked ${tag} ${id}${quoted}`;
  return quoted ? `Clicked ${tag}${quoted}` : `Clicked <${tag}>`;
}

/**
 * Privacy: NEVER record input value or placeholder — only id or name attribute.
 */
function describeInput(target: HTMLInputElement | HTMLTextAreaElement): string {
  const id = target.id?.trim();
  const name = target.name?.trim();
  if (id) return `User typed in #${id}`;
  if (name) return `User typed in field [name="${name}"]`;
  const tag = target.tagName.toLowerCase();
  const type = (target as HTMLInputElement).type || "text";
  if (tag === "textarea") return "User typed in a textarea (no id/name)";
  return `User typed in ${type} input (no id/name)`;
}

const uid = () => Math.random().toString(36).slice(2, 11);

/* ═══════════════════════════════════════════════════════════════════
   LIVE CAPTURE TYPES
═══════════════════════════════════════════════════════════════════ */
interface CapturedConsoleEntry {
  level: LogLevel;
  text: string;
  timestamp: number;
}

interface CapturedNetworkEntry {
  method: string;
  url: string;
  path: string;
  status: number;
  durationMs: number;
  ok: boolean;
  error?: string;
  timestamp: number;
}

const MAX_CONSOLE_ENTRIES = 50;
const MAX_NETWORK_ENTRIES = 20;

/* ═══════════════════════════════════════════════════════════════════
   REAL CONSOLE INTERCEPTOR
   Overrides console.log/warn/error, preserves original behavior,
   stores last 50 entries in a rolling buffer.
═══════════════════════════════════════════════════════════════════ */
function useConsoleTracker() {
  const entriesRef = useRef<CapturedConsoleEntry[]>([]);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const origLog = console.log.bind(console);
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);

    function capture(level: LogLevel, args: unknown[]) {
      const text = args
        .map((a) => {
          if (typeof a === "string") return a;
          try { return JSON.stringify(a); } catch { return String(a); }
        })
        .join(" ")
        .slice(0, 500);

      if (!text.trim()) return;

      // Skip our own widget internals
      if (text.includes("[whisper-widget]") || text.includes("[whybug-widget]")) return;

      entriesRef.current.push({ level, text, timestamp: Date.now() });
      if (entriesRef.current.length > MAX_CONSOLE_ENTRIES) {
        entriesRef.current = entriesRef.current.slice(-MAX_CONSOLE_ENTRIES);
      }
    }

    console.log = (...args: unknown[]) => { capture("log", args); origLog(...args); };
    console.warn = (...args: unknown[]) => { capture("warn", args); origWarn(...args); };
    console.error = (...args: unknown[]) => { capture("error", args); origError(...args); };

    // Capture unhandled errors
    const onError = (ev: ErrorEvent) => {
      capture("error", [`${ev.message} (${ev.filename}:${ev.lineno})`]);
    };
    const onRejection = (ev: PromiseRejectionEvent) => {
      const reason = ev.reason instanceof Error ? ev.reason.message : String(ev.reason ?? "Unhandled promise rejection");
      capture("error", [reason]);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      console.log = origLog;
      console.warn = origWarn;
      console.error = origError;
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  /** Snapshot current buffer (returns a copy) */
  const snapshot = useCallback(() => [...entriesRef.current], []);

  return { snapshot, entriesRef };
}

/* ═══════════════════════════════════════════════════════════════════
   REAL NETWORK INTERCEPTOR
   Monkey-patches fetch + XMLHttpRequest, captures requests with
   status >= 400 or errors. Stores last 20 entries.
═══════════════════════════════════════════════════════════════════ */
function useNetworkTracker() {
  const entriesRef = useRef<CapturedNetworkEntry[]>([]);

  useEffect(() => {
    function pushEntry(entry: CapturedNetworkEntry) {
      entriesRef.current.push(entry);
      if (entriesRef.current.length > MAX_NETWORK_ENTRIES) {
        entriesRef.current = entriesRef.current.slice(-MAX_NETWORK_ENTRIES);
      }
    }

    function extractPath(urlStr: string): string {
      try {
        const u = new URL(urlStr, window.location.origin);
        return `${u.pathname}${u.search}`;
      } catch { return urlStr; }
    }

    // ── Patch fetch ──
    const origFetch = window.fetch;
    window.fetch = async function patchedFetch(input: RequestInfo | URL, init?: RequestInit) {
      const method = (init?.method ?? "GET").toUpperCase();
      const urlStr = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const startMs = Date.now();

      try {
        const response = await origFetch.apply(this, [input, init] as Parameters<typeof origFetch>);
        const durationMs = Date.now() - startMs;
        const status = response.status;

        // Always capture — we show all requests in the receipt
        pushEntry({
          method,
          url: urlStr,
          path: extractPath(urlStr),
          status,
          durationMs,
          ok: response.ok,
          ...(status >= 400 ? { error: `${status} ${response.statusText || "Error"}` } : {}),
          timestamp: Date.now(),
        });

        return response;
      } catch (err) {
        pushEntry({
          method,
          url: urlStr,
          path: extractPath(urlStr),
          status: 0,
          durationMs: Date.now() - startMs,
          ok: false,
          error: err instanceof Error ? err.message : "Network error",
          timestamp: Date.now(),
        });
        throw err;
      }
    };

    // ── Patch XMLHttpRequest ──
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (this: XMLHttpRequest & { __wb_method?: string; __wb_url?: string }, method: string, url: string | URL, ...rest: unknown[]) {
      this.__wb_method = method.toUpperCase();
      this.__wb_url = typeof url === "string" ? url : url.href;
      return (origOpen as Function).call(this, method, url, ...rest);
    };

    XMLHttpRequest.prototype.send = function (this: XMLHttpRequest & { __wb_method?: string; __wb_url?: string; __wb_start?: number }, body?: Document | XMLHttpRequestBodyInit | null) {
      this.__wb_start = Date.now();
      const method = this.__wb_method || "GET";
      const url = this.__wb_url || "";

      const onDone = () => {
        const durationMs = Date.now() - (this.__wb_start || Date.now());
        const status = this.status || 0;
        pushEntry({
          method,
          url,
          path: extractPath(url),
          status,
          durationMs,
          ok: status >= 200 && status < 400,
          ...(status >= 400 || status === 0 ? { error: `${status} ${this.statusText || "Error"}` } : {}),
          timestamp: Date.now(),
        });
      };

      this.addEventListener("load", onDone);
      this.addEventListener("error", () => {
        pushEntry({
          method,
          url,
          path: extractPath(url),
          status: 0,
          durationMs: Date.now() - (this.__wb_start || Date.now()),
          ok: false,
          error: "Network error (XHR)",
          timestamp: Date.now(),
        });
      });
      this.addEventListener("timeout", () => {
        pushEntry({
          method,
          url,
          path: extractPath(url),
          status: 0,
          durationMs: Date.now() - (this.__wb_start || Date.now()),
          ok: false,
          error: "Request timeout (XHR)",
          timestamp: Date.now(),
        });
      });

      return origSend.call(this, body);
    };

    return () => {
      window.fetch = origFetch;
      XMLHttpRequest.prototype.open = origOpen;
      XMLHttpRequest.prototype.send = origSend;
    };
  }, []);

  /** Snapshot current buffer (returns a copy) */
  const snapshot = useCallback(() => [...entriesRef.current], []);

  return { snapshot, entriesRef };
}

const EVENT_CFG: Record<
  EventType,
  {
    icon: React.ElementType;
    dot: string;
    label: string;
    pill: string;
  }
> = {
  click: {
    icon: Mouse,
    dot: "bg-amber-400",
    label: "click",
    pill: "bg-amber-500/15 text-amber-400 border-2 border-amber-900/50",
  },
  input: {
    icon: Keyboard,
    dot: "bg-violet-400",
    label: "input",
    pill: "bg-violet-500/15 text-violet-400 border-2 border-violet-900/40",
  },
  navigation: {
    icon: MapIcon,
    dot: "bg-emerald-400",
    label: "nav",
    pill: "bg-emerald-500/15 text-emerald-400 border-2 border-emerald-900/40",
  },
};

const LOG_PILL: Record<LogLevel, string> = {
  error: "bg-red-500/15 text-red-400 border-2 border-red-900/60",
  warn: "bg-amber-500/15 text-amber-400 border-2 border-amber-900/50",
  log: "bg-zinc-800 text-zinc-400 border-2 border-zinc-700",
};

function netStatusColor(s: number) {
  if (s >= 500) return "text-red-400";
  if (s >= 400) return "text-amber-400";
  return "text-emerald-400";
}

/* ═══════════════════════════════════════════════════════════════════
   SESSION TRACKER — click, input (500ms debounce), navigation
   Rolling buffer: last 30 seconds only (time-based, no arbitrary cap)
═══════════════════════════════════════════════════════════════════ */
const WINDOW_MS = 30_000;
const INPUT_DEBOUNCE_MS = 500;

function pruneToWindow(events: SessionEvent[], now: number): SessionEvent[] {
  const cutoff = now - WINDOW_MS;
  return events.filter((x) => x.timestamp >= cutoff);
}

function useSessionTracker() {
  const [events, setEvents] = useState<SessionEvent[]>([]);
  const debounceMap = useRef(new Map<EventTarget, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const push = (e: Omit<SessionEvent, "id" | "timestamp">) => {
      const now = Date.now();
      setEvents((prev) => {
        const pruned = pruneToWindow(prev, now);
        return [...pruned, { ...e, id: uid(), timestamp: now }];
      });
    };

    push({
      type: "navigation",
      description: `Page: ${window.location.pathname || "/"}`,
    });

    const onClick = (ev: MouseEvent) => {
      const t = ev.target as HTMLElement | null;
      if (!t) return;
      if (t.closest("[data-whisper-widget]")) return;
      push({ type: "click", description: describeClick(t) });
    };

    const onInput = (e: Event) => {
      const t = e.target as HTMLInputElement | HTMLTextAreaElement | null;
      if (!t || !("value" in t)) return;
      if (t.closest("[data-whisper-widget]")) return;

      const prevTimer = debounceMap.current.get(t);
      if (prevTimer) clearTimeout(prevTimer);

      const timer = setTimeout(() => {
        push({ type: "input", description: describeInput(t) });
        debounceMap.current.delete(t);
      }, INPUT_DEBOUNCE_MS);

      debounceMap.current.set(t, timer);
    };

    let lastHref = window.location.href;
    const recordNav = (reason: string) => {
      const href = window.location.href;
      if (href === lastHref) return;
      lastHref = href;
      try {
        const u = new URL(href);
        push({
          type: "navigation",
          description: `${reason} ${u.pathname}${u.search || ""}${u.hash || ""}`,
        });
      } catch {
        push({ type: "navigation", description: `${reason} ${href}` });
      }
    };

    const onPopState = () => recordNav("Navigated to");
    const onHashChange = () => recordNav("Hash changed →");

    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    history.pushState = (...args: Parameters<History["pushState"]>) => {
      origPush(...args);
      queueMicrotask(() => recordNav("Navigated to"));
    };
    history.replaceState = (...args: Parameters<History["replaceState"]>) => {
      origReplace(...args);
      queueMicrotask(() => recordNav("URL updated →"));
    };

    const pruner = setInterval(() => {
      const now = Date.now();
      setEvents((prev) => pruneToWindow(prev, now));
    }, 2000);

    document.addEventListener("click", onClick, true);
    document.addEventListener("input", onInput, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("hashchange", onHashChange);

    return () => {
      clearInterval(pruner);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("input", onInput, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("hashchange", onHashChange);
      history.pushState = origPush;
      history.replaceState = origReplace;
      debounceMap.current.forEach((timer: ReturnType<typeof setTimeout>) => clearTimeout(timer));
      debounceMap.current.clear();
    };
  }, []);

  return events;
}

/* ═══════════════════════════════════════════════════════════════════
   UI ATOMS
═══════════════════════════════════════════════════════════════════ */

function Dots() {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="block w-[3px] h-[3px] bg-amber-400"
          animate={{ scale: [1, 1.8, 1], opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}

function SectionLabel({ icon: Icon, label, badge }: { icon?: React.ElementType; label: string; badge?: string }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      {Icon && <Icon size={11} className="text-zinc-600" />}
      <span className="text-[0.6rem] font-mono font-bold text-zinc-600 uppercase tracking-[0.15em]">// {label}</span>
      {badge && (
        <span className="ml-auto text-[0.58rem] font-mono text-zinc-600 bg-zinc-800 border border-zinc-700 px-1.5 py-[1px]">
          {badge}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   INPUT STAGE
═══════════════════════════════════════════════════════════════════ */
function InputStage({
  value,
  onChange,
  onSubmit,
  onClose,
  error,
  onDismissError,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  error?: string | null;
  onDismissError?: () => void;
}) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    taRef.current?.focus();
  }, []);
  const canSend = value.trim().length >= 3;

  return (
    <motion.div
      key="input"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
    >
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b-2 border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 flex items-center justify-center bg-amber-400 border border-zinc-950 shadow-[1px_1px_0px_0px_#000]">
            <Zap size={10} className="text-zinc-950" fill="currentColor" />
          </span>
          <span className="text-[0.8rem] font-display font-bold text-zinc-100 tracking-tight">Whybug</span>
          <span className="text-[0.55rem] font-mono font-bold text-zinc-500 bg-zinc-800 border border-zinc-700 px-1.5 py-[2px]">
            DEMO
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all"
        >
          <X size={12} />
        </button>
      </div>

      <div className="px-4 pt-4 pb-2">
        <p className="text-[0.83rem] font-display font-bold text-zinc-100 mb-1">What went wrong?</p>
        <p className="text-[0.71rem] font-mono text-zinc-500 mb-3 leading-relaxed">
          Your session is being tracked for the last 30 seconds. Describe the issue in your own words.
        </p>
        {error && (
          <div
            role="alert"
            className="mb-3 border-2 border-red-900/60 bg-red-950/40 px-3 py-2.5 flex gap-2 items-start"
          >
            <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[0.72rem] font-bold text-red-300">Could not send email</p>
              <p className="text-[0.68rem] font-mono text-red-400/80 mt-0.5 leading-relaxed">{error}</p>
            </div>
            <button
              type="button"
              onClick={onDismissError}
              className="text-zinc-600 hover:text-zinc-300 p-0.5 shrink-0"
              aria-label="Dismiss"
            >
              <X size={12} />
            </button>
          </div>
        )}
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. The checkout button does nothing after I tap Pay…"
          rows={4}
          className="w-full resize-none bg-zinc-950 border-2 border-zinc-700
            focus:border-amber-500/60 focus:ring-0 focus:outline-none
            text-[0.8rem] font-mono text-zinc-200 placeholder-zinc-600
            px-3.5 py-3 transition-colors duration-150 leading-relaxed"
        />
      </div>

      <div className="px-4 pb-4 pt-1.5 space-y-2.5">
        <motion.button
          type="button"
          onClick={onSubmit}
          disabled={!canSend}
          whileTap={canSend ? { x: 2, y: 2 } : {}}
          className={`w-full py-2.5 text-[0.83rem] font-bold transition-[transform,box-shadow,background-color] duration-75 flex items-center justify-center gap-2 border-2 ${
            canSend
              ? "bg-amber-400 text-zinc-950 border-zinc-950 shadow-[3px_3px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
              : "bg-zinc-800 text-zinc-600 border-zinc-700 cursor-not-allowed shadow-none"
          }`}
        >
          Send report
          {canSend && <ArrowRight size={13} />}
        </motion.button>

        <p className="flex items-center justify-center gap-1.5 text-[0.62rem] font-mono text-zinc-600">
          <Zap size={8} className="text-amber-400/60" />
          Opens developer receipt with session timeline &amp; tech context
        </p>
      </div>
    </motion.div>
  );
}

const SUBMIT_STEPS = [
  "Serializing session timeline…",
  "Attaching browser and screen context…",
  "Merging network fingerprint…",
  "Building developer receipt…",
] as const;

function SubmittingStage({ step }: { step: number }) {
  return (
    <motion.div
      key="submitting"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="px-5 py-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 border-2 border-amber-400 bg-amber-400 flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
          <Zap size={14} className="text-zinc-950" />
        </div>
        <div>
          <p className="text-[0.78rem] font-display font-bold text-zinc-100">Preparing receipt…</p>
          <p className="text-[0.64rem] font-mono text-zinc-500">Packaging timeline + environment snapshot</p>
        </div>
      </div>

      <div className="space-y-3">
        {SUBMIT_STEPS.map((text, i) => (
          <motion.div
            key={text}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.25, ease: "easeOut" }}
            className="flex items-center gap-3 text-[0.74rem] font-mono"
          >
            <span className="shrink-0 w-4 flex justify-center">
              {i < step ? (
                <Check size={12} className="text-emerald-400" />
              ) : i === step ? (
                <Dots />
              ) : (
                <span className="w-1.5 h-1.5 bg-zinc-700 inline-block" />
              )}
            </span>
            <span className={i < step ? "text-zinc-600" : i === step ? "text-zinc-100" : "text-zinc-600"}>{text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PATH TO BUG — Premium vertical timeline
═══════════════════════════════════════════════════════════════════ */
function PathToBug({ events, refTs }: { events: SessionEvent[]; refTs: number }) {
  const displayed = [...events].sort((a, b) => b.timestamp - a.timestamp);
  const empty = displayed.length === 0;

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
  };
  const item: Variants = {
    hidden: { opacity: 0, x: -14, filter: "blur(3px)" },
    show: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
    },
  };

  // Final "Report submitted" virtual event
  const submitEvent = {
    id: "__submit__",
    type: "click" as EventType,
    description: "Report submitted",
    timestamp: refTs,
  };

  const allEvents = empty ? [] : [submitEvent, ...displayed];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Activity size={10} className="text-amber-400" />
        <span className="text-[0.6rem] font-mono font-black text-amber-400 uppercase tracking-[0.18em]">
          Path to Bug
        </span>
        <span className="flex-1 h-px bg-zinc-800" />
        <span className="text-[0.55rem] font-mono text-zinc-600 bg-zinc-800/80 border border-zinc-700 px-1.5 py-[2px]">
          {empty ? "no events" : `${events.length} events · 30s`}
        </span>
      </div>

      {empty ? (
        <div className="border-2 border-zinc-800 bg-zinc-950 px-4 py-5 text-center">
          <div className="w-8 h-8 mx-auto mb-2 border-2 border-emerald-800 bg-emerald-500/10 flex items-center justify-center">
            <Check size={12} className="text-emerald-400" />
          </div>
          <p className="text-[0.72rem] font-mono text-emerald-400 font-bold">Clean Slate</p>
          <p className="text-[0.62rem] font-mono text-zinc-600 mt-0.5">No user interactions captured in the last 30s</p>
        </div>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="relative ml-2">
          {/* Vertical connector line */}
          <div className="absolute left-[5px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-amber-500/60 via-zinc-700/40 to-zinc-800/20" />

          {allEvents.map((ev, idx) => {
            const isSubmit = ev.id === "__submit__";
            const cfg = EVENT_CFG[ev.type];
            const Icon = isSubmit ? Check : cfg.icon;
            const secs = Math.floor((refTs - ev.timestamp) / 1000);
            const timeLabel = isSubmit ? "now" : secs === 0 ? "0s" : `-${secs}s`;

            return (
              <motion.div
                key={ev.id}
                variants={item}
                className="relative flex items-start gap-3 py-[7px] group"
              >
                {/* Dot connector */}
                <div className={`relative z-10 w-3 h-3 shrink-0 mt-[5px] border-2 ${
                  isSubmit
                    ? "bg-amber-400 border-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                    : `${cfg.dot} border-zinc-700`
                }`} />

                {/* Timestamp column */}
                <span className={`shrink-0 w-8 text-right text-[0.62rem] font-mono font-bold mt-[3px] ${
                  isSubmit ? "text-amber-400" : "text-zinc-600"
                }`}>
                  {timeLabel}
                </span>

                {/* Event card */}
                <div className={`flex-1 min-w-0 flex items-center gap-2 px-2.5 py-[6px] border ${
                  isSubmit
                    ? "border-amber-500/40 bg-amber-500/[0.06]"
                    : "border-zinc-800 bg-zinc-900/60 group-hover:border-zinc-700 group-hover:bg-zinc-900 transition-colors"
                }`}>
                  <div className={`shrink-0 w-5 h-5 flex items-center justify-center ${
                    isSubmit ? "text-amber-400" : "text-zinc-500"
                  }`}>
                    <Icon size={11} strokeWidth={2.5} />
                  </div>
                  <p className={`text-[0.7rem] font-mono leading-snug truncate ${
                    isSubmit ? "text-amber-300 font-bold" : "text-zinc-300"
                  }`}>
                    {ev.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TERMINAL BLOCK — reusable dark code block with tab header
═══════════════════════════════════════════════════════════════════ */
function TerminalBlock({
  title,
  icon: Icon,
  badge,
  badgeColor = "text-zinc-500",
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="border-2 border-zinc-700 overflow-hidden"
    >
      {/* Tab bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center gap-1.5">
          <Icon size={10} className="text-zinc-500" />
          <span className="text-[0.58rem] font-mono font-bold text-zinc-400 uppercase tracking-[0.12em]">{title}</span>
        </div>
        {badge && (
          <span className={`text-[0.52rem] font-mono font-bold ${badgeColor}`}>{badge}</span>
        )}
      </div>
      {/* Body */}
      <div className="bg-zinc-950">{children}</div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DEVELOPER RECEIPT — "Bug DNA" premium dashboard
═══════════════════════════════════════════════════════════════════ */
function ReceiptStage({
  message,
  ctx,
  events,
  consoleLogs,
  networkLogs,
  receiptTs,
  onReset,
  onClose,
}: {
  message: string;
  ctx: FeedbackContext;
  events: SessionEvent[];
  consoleLogs: CapturedConsoleEntry[];
  networkLogs: CapturedNetworkEntry[];
  receiptTs: number;
  onReset: () => void;
  onClose: () => void;
}) {
  const fadeRow: Variants = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
  };
  const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
  };

  const envString = `${ctx.browser || "Browser"} on ${ctx.os || "Unknown"} \u00B7 ${ctx.screenResolution || "?"}`;
  const sortedConsole = [...consoleLogs].sort((a, b) => b.timestamp - a.timestamp);
  const sortedNetwork = [...networkLogs].sort((a, b) => b.timestamp - a.timestamp);
  const hasConsole = sortedConsole.length > 0;
  const hasNetwork = sortedNetwork.length > 0;
  const errorCount = sortedConsole.filter(e => e.level === "error").length;
  const failedReqs = sortedNetwork.filter(r => r.status >= 400 || !r.ok).length;

  return (
    <motion.div
      key="receipt"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col max-h-[min(600px,82vh)]"
    >
      {/* ── HEADER: Bug DNA ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden shrink-0 border-b-2 border-zinc-800"
      >
        {/* Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_100%_at_50%_-20%,rgba(251,191,36,0.08)_0%,transparent_65%)]" />
        <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

        <div className="relative px-4 pt-3.5 pb-3">
          {/* Top row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
                className="w-7 h-7 border-2 border-emerald-500 bg-emerald-400 flex items-center justify-center text-zinc-950 shrink-0 shadow-[2px_2px_0px_0px_#000]"
              >
                <Check size={12} strokeWidth={3} />
              </motion.div>
              <div>
                <p className="text-[0.78rem] font-display font-black text-zinc-100 tracking-tight leading-none">Bug DNA</p>
                <p className="text-[0.55rem] font-mono text-zinc-600 mt-0.5">Report decoded</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 w-6 h-6 flex items-center justify-center text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent hover:border-zinc-700 transition-all"
            >
              <X size={11} />
            </button>
          </div>

          {/* User message bubble */}
          <div className="relative border-2 border-amber-500/30 bg-amber-500/[0.05] px-3 py-2.5">
            <div className="absolute -top-px left-4 w-6 h-px bg-amber-400/50" />
            <MessageSquare size={10} className="text-amber-400/70 mb-1.5" />
            <p className="text-[0.78rem] font-mono text-zinc-200 leading-relaxed">
              &ldquo;{message}&rdquo;
            </p>
          </div>

          {/* Environment badge */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.35 }}
            className="flex items-center gap-2 mt-2.5"
          >
            <div className="flex items-center gap-1.5 bg-zinc-800/80 border border-zinc-700 px-2 py-[3px]">
              <Monitor size={9} className="text-zinc-500" />
              <span className="text-[0.58rem] font-mono text-zinc-400">{envString}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-800/80 border border-zinc-700 px-2 py-[3px]">
              <Globe size={9} className="text-zinc-500" />
              <span className="text-[0.58rem] font-mono text-amber-400/80 max-w-[140px] truncate">{ctx.url}</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── SCROLLABLE BODY ── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3.5 space-y-4
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-zinc-700
        [&::-webkit-scrollbar-thumb]:border-l [&::-webkit-scrollbar-thumb]:border-zinc-800"
      >
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

          {/* ── 30s ACTION TIMELINE ── */}
          <motion.div variants={fadeRow}>
            <PathToBug events={events} refTs={receiptTs} />
          </motion.div>

          {/* ── CONSOLE LOGS (Terminal) ── */}
          <motion.div variants={fadeRow}>
            <TerminalBlock
              title="Console"
              icon={Activity}
              badge={hasConsole ? `${errorCount} error${errorCount !== 1 ? "s" : ""} \u00B7 ${sortedConsole.length} total` : undefined}
              badgeColor={errorCount > 0 ? "text-red-400" : "text-zinc-500"}
              delay={0.2}
            >
              {hasConsole ? (
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.25 } } }}
                >
                  {sortedConsole.map((entry, i) => (
                    <motion.div
                      key={`${entry.timestamp}-${i}`}
                      variants={{ hidden: { opacity: 0, x: -6 }, show: { opacity: 1, x: 0, transition: { duration: 0.3 } } }}
                      className={`flex items-start gap-2 px-3 py-2 font-mono text-[0.66rem] ${
                        i !== 0 ? "border-t border-zinc-800/60" : ""
                      } ${entry.level === "error" ? "bg-red-500/[0.03]" : ""}`}
                    >
                      <span className="shrink-0 text-zinc-700 select-none mt-px">{entry.level === "error" ? ">" : entry.level === "warn" ? "!" : "$"}</span>
                      <span className={`shrink-0 mt-px px-1 py-[1px] text-[0.52rem] font-bold uppercase tracking-wider border ${LOG_PILL[entry.level]}`}>
                        {entry.level}
                      </span>
                      <span className={`leading-relaxed break-all ${
                        entry.level === "error" ? "text-red-400" : entry.level === "warn" ? "text-amber-400/90" : "text-zinc-400"
                      }`}>
                        {entry.text}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="px-3 py-4 text-center">
                  <Check size={14} className="mx-auto text-emerald-400 mb-1" />
                  <p className="text-[0.65rem] font-mono text-emerald-400">Clean Slate: No errors detected</p>
                </div>
              )}
            </TerminalBlock>
          </motion.div>

          {/* ── NETWORK LOGS (DevTools-style) ── */}
          <motion.div variants={fadeRow}>
            <TerminalBlock
              title="Network"
              icon={Wifi}
              badge={hasNetwork ? `${failedReqs} failed \u00B7 ${sortedNetwork.length} req` : undefined}
              badgeColor={failedReqs > 0 ? "text-red-400" : "text-emerald-400"}
              delay={0.35}
            >
              {hasNetwork ? (
                <>
                  {/* Column headers */}
                  <div className="flex items-center gap-2 px-3 py-1 border-b border-zinc-800 text-[0.5rem] font-mono text-zinc-600 uppercase tracking-wider">
                    <span className="w-8">Method</span>
                    <span className="flex-1">Path</span>
                    <span className="w-8 text-center">Status</span>
                    <span className="w-12 text-right">Time</span>
                  </div>
                  <motion.div
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.4 } } }}
                  >
                    {sortedNetwork.map((req, i) => {
                      const isFailed = !req.ok || req.status >= 400;
                      return (
                        <motion.div
                          key={`${req.timestamp}-${i}`}
                          variants={{ hidden: { opacity: 0, x: -6 }, show: { opacity: 1, x: 0, transition: { duration: 0.3 } } }}
                          className={`${isFailed ? "bg-red-500/[0.05] border-l-2 border-l-red-500" : "border-l-2 border-l-transparent"} ${
                            i !== 0 ? "border-t border-zinc-800/50" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 px-3 py-2 font-mono text-[0.64rem]">
                            <span className={`shrink-0 font-bold w-8 text-[0.6rem] ${
                              req.method === "GET" ? "text-blue-400"
                                : req.method === "POST" ? "text-emerald-400"
                                : req.method === "DELETE" ? "text-red-400"
                                : "text-amber-400"
                            }`}>
                              {req.method}
                            </span>
                            <span className="text-zinc-400 flex-1 min-w-0 truncate">{req.path}</span>
                            <span className={`shrink-0 font-bold text-[0.62rem] w-8 text-center px-1 py-[1px] border ${
                              req.status >= 500
                                ? "text-red-400 border-red-900/60 bg-red-500/10"
                                : req.status >= 400
                                  ? "text-amber-400 border-amber-900/50 bg-amber-500/10"
                                  : "text-emerald-400 border-emerald-900/40 bg-emerald-500/10"
                            }`}>
                              {req.status || "ERR"}
                            </span>
                            <span className="shrink-0 text-zinc-600 w-12 text-right text-[0.58rem]">{req.durationMs}ms</span>
                          </div>
                          {isFailed && req.error && (
                            <div className="flex items-center gap-1.5 text-[0.58rem] text-red-400/90 px-3 pb-2 pl-[2.75rem]">
                              <AlertTriangle size={10} className="shrink-0" />
                              <span className="font-bold">{req.error}</span>
                              <span className="text-zinc-600">&mdash; likely root cause</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </>
              ) : (
                <div className="px-3 py-4 text-center">
                  <Check size={14} className="mx-auto text-emerald-400 mb-1" />
                  <p className="text-[0.65rem] font-mono text-emerald-400">All requests healthy</p>
                </div>
              )}
            </TerminalBlock>
          </motion.div>

          {/* ── ENVIRONMENT GRID ── */}
          <motion.div variants={fadeRow}>
            <div className="flex items-center gap-2 mb-2">
              <Monitor size={10} className="text-zinc-500" />
              <span className="text-[0.58rem] font-mono font-bold text-zinc-500 uppercase tracking-[0.15em]">Device Snapshot</span>
              <span className="flex-1 h-px bg-zinc-800" />
            </div>
            <div className="grid grid-cols-3 gap-[3px]">
              {[
                { k: "Browser", v: `${ctx.browser} ${ctx.browserVersion}`.trim() },
                { k: "OS", v: ctx.os },
                { k: "Screen", v: ctx.screenResolution },
                { k: "Viewport", v: ctx.windowSize },
                { k: "Language", v: ctx.language },
                { k: "Time zone", v: ctx.timezone },
              ].map(({ k, v }) => (
                <div key={k} className="border border-zinc-800 bg-zinc-900/70 px-2 py-1.5">
                  <div className="text-[0.48rem] font-mono text-zinc-600 uppercase tracking-wider">{k}</div>
                  <div className="text-[0.66rem] font-mono text-zinc-300 truncate mt-[1px]">{v || "\u2014"}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── MAGIC FOOTER ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="shrink-0 border-t-2 border-zinc-800 bg-zinc-950 px-4 py-3"
      >
        <div className="flex items-center gap-3 mb-2.5">
          <motion.a
            href="#pricing"
            onClick={onClose}
            whileTap={{ x: 2, y: 2 }}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-amber-400 text-zinc-950 text-[0.72rem] font-black border-2 border-zinc-950 shadow-[3px_3px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] transition-[transform,box-shadow] duration-75"
          >
            Open in Dashboard
            <ArrowRight size={11} />
          </motion.a>
          <motion.button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
            }}
            whileTap={{ scale: 0.95 }}
            className="shrink-0 px-3 py-2 text-[0.68rem] font-mono font-bold text-zinc-400 border-2 border-zinc-700 bg-zinc-900 hover:border-zinc-600 hover:text-zinc-200 transition-colors"
          >
            Copy Link
          </motion.button>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <Zap size={7} className="text-amber-400/60" fill="currentColor" />
          <span className="text-[0.5rem] font-mono text-zinc-600 tracking-wider">
            Context captured automatically by{" "}
            <span className="text-zinc-500 font-bold">Whybug.info</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="w-full mt-2 py-1 text-[0.6rem] font-mono text-zinc-700 hover:text-zinc-400 transition-colors"
        >
          Send another report
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════ */
export default function WhisperWidgetDemo() {
  const prefersReduced = useReducedMotion();
  const sessionEvents = useSessionTracker();
  const { snapshot: snapshotConsole } = useConsoleTracker();
  const { snapshot: snapshotNetwork } = useNetworkTracker();

  const [stage, setStage] = useState<Stage>("closed");
  const [message, setMessage] = useState("");
  const [stepIdx, setStepIdx] = useState(0);
  const [receiptTs, setReceiptTs] = useState(0);
  const [snapEvents, setSnapEvents] = useState<SessionEvent[]>([]);
  const [snapConsole, setSnapConsole] = useState<CapturedConsoleEntry[]>([]);
  const [snapNetwork, setSnapNetwork] = useState<CapturedNetworkEntry[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const clientEnv = useClientEnvironment();
  const ctx = useMemo(
    () => (clientEnv ? snapshotToFeedbackContext(clientEnv) : null),
    [clientEnv]
  );
  const mounted = clientEnv !== null;

  useEffect(() => {
    if (stage !== "submitting" || !ctx) return;

    const ac = new AbortController();
    const receiptAt = Date.now();
    setStepIdx(0);

    const stepTimer = setInterval(() => {
      setStepIdx((i) => (i < SUBMIT_STEPS.length - 1 ? i + 1 : i));
    }, 200);

    (async () => {
      try {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: message.trim(),
            context: ctx,
            events: snapEvents,
            receiptAt,
            console: snapConsole.map((e) => ({
              level: e.level,
              text: e.text,
              timestamp: e.timestamp,
            })),
            network: snapNetwork.map((n) => ({
              method: n.method,
              url: n.url,
              status: n.status,
              durationMs: n.durationMs,
              ok: n.ok,
              ...(n.error ? { error: n.error } : {}),
              timestamp: n.timestamp,
            })),
          }),
          signal: ac.signal,
        });

        const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };

        if (ac.signal.aborted) return;

        clearInterval(stepTimer);

        if (!res.ok) {
          setSubmitError(data.error || `Could not send (${res.status})`);
          setStepIdx(0);
          setStage("input");
          return;
        }

        setStepIdx(SUBMIT_STEPS.length);
        setReceiptTs(receiptAt);
        setTimeout(() => setStage("receipt"), 320);
      } catch (e) {
        if (ac.signal.aborted) return;
        clearInterval(stepTimer);
        if (e instanceof DOMException && e.name === "AbortError") return;
        const msg =
          e instanceof Error ? (e.name === "AbortError" ? "" : e.message) : "Network error";
        if (!msg) return;
        setSubmitError(msg);
        setStepIdx(0);
        setStage("input");
      }
    })();

    return () => {
      ac.abort();
      clearInterval(stepTimer);
    };
  }, [stage, ctx, message, snapEvents, snapConsole, snapNetwork]);

  const open = useCallback(() => {
    setSubmitError(null);
    setStage("input");
  }, []);
  const close = useCallback(() => {
    setStage("closed");
    setTimeout(() => {
      setMessage("");
      setStepIdx(0);
      setSubmitError(null);
    }, 380);
  }, []);
  const submit = useCallback(() => {
    setSnapEvents([...sessionEvents]);
    setSnapConsole(snapshotConsole());
    setSnapNetwork(snapshotNetwork());
    setSubmitError(null);
    setStage("submitting");
  }, [sessionEvents, snapshotConsole, snapshotNetwork]);
  const reset = useCallback(() => {
    setMessage("");
    setStepIdx(0);
    setStage("input");
  }, []);

  if (!mounted || !ctx) return null;

  const isOpen = stage !== "closed";
  const panelSpring = prefersReduced ? { duration: 0.15 } : { type: "spring" as const, stiffness: 400, damping: 32 };

  const EDGE = 20;
  const BTN_SIZE = 52;
  const GAP = 12;

  return (
    <div className={inter.className}>
      <AnimatePresence>
        {stage === "receipt" && (
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            onClick={close}
            className="fixed inset-0 z-[100] bg-black/35 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ scale: 0, opacity: 0, y: 24 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 24, delay: 1.2 }}
        className="fixed z-[110]"
        style={{ bottom: EDGE, right: EDGE }}
        data-whisper-widget
      >
        <div className="group relative">
          {!isOpen &&
            [1.45, 1.2].map((scale, i) => (
              <motion.span
                key={i}
                className="absolute inset-0 bg-amber-400"
                animate={{ scale: [1, scale], opacity: [0.2, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: i * 0.45 }}
              />
            ))}

          <motion.button
            type="button"
            onClick={isOpen ? close : open}
            whileTap={{ x: 3, y: 3 }}
            aria-label={isOpen ? "Close feedback" : "Open feedback"}
            data-whisper-widget
            className="relative flex items-center justify-center bg-amber-400 text-zinc-950 border-2 border-zinc-950
              shadow-[5px_5px_0px_0px_#000]
              hover:shadow-[4px_4px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]
              transition-[transform,box-shadow] duration-75"
            style={{ width: BTN_SIZE, height: BTN_SIZE }}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.span
                  key="x"
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                >
                  <X size={18} strokeWidth={2} />
                </motion.span>
              ) : (
                <motion.span
                  key="msg"
                  initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.15 }}
                >
                  <MessageSquare size={18} strokeWidth={2} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {!isOpen && (
            <div
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 pointer-events-none select-none
              opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100 transition-all duration-150
              whitespace-nowrap text-[0.72rem] font-mono font-bold text-zinc-950 bg-amber-400 border-2 border-zinc-950 px-3 py-2 shadow-[3px_3px_0px_0px_#000]"
            >
              Feedback
              <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[5px] w-2 h-2 bg-amber-400 border-r-2 border-t-2 border-zinc-950 rotate-45" />
            </div>
          )}
        </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: panelSpring }}
            exit={{ opacity: 0, scale: 0.94, y: 12, transition: { duration: 0.18, ease: "easeIn" } }}
            style={{
              transformOrigin: "bottom right",
              bottom: EDGE + BTN_SIZE + GAP,
              right: EDGE,
              width: 400,
              maxWidth: `calc(100vw - ${EDGE * 2}px)`,
            }}
            className="fixed z-[110] flex flex-col overflow-hidden
              bg-zinc-900 border-2 border-zinc-700
              shadow-[8px_8px_0px_0px_#000]"
            data-whisper-widget
          >
            <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

            <AnimatePresence mode="wait">
              {stage === "input" && (
                <InputStage
                  key="input"
                  value={message}
                  onChange={(v) => {
                    setMessage(v);
                    setSubmitError(null);
                  }}
                  onSubmit={submit}
                  onClose={close}
                  error={submitError}
                  onDismissError={() => setSubmitError(null)}
                />
              )}
              {stage === "submitting" && <SubmittingStage key="submitting" step={stepIdx} />}
              {stage === "receipt" && (
                <ReceiptStage
                  key="receipt"
                  message={message}
                  ctx={ctx}
                  events={snapEvents}
                  consoleLogs={snapConsole}
                  networkLogs={snapNetwork}
                  receiptTs={receiptTs}
                  onReset={reset}
                  onClose={close}
                />
              )}
            </AnimatePresence>

            {stage !== "receipt" && (
              <div className="shrink-0 border-t-2 border-zinc-800 px-4 py-2 flex items-center justify-center gap-1.5 bg-zinc-950">
                <Zap size={8} className="text-amber-400/70" fill="currentColor" />
                <span className="text-[0.57rem] font-mono text-zinc-600 tracking-wider uppercase">Whybug widget demo</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
