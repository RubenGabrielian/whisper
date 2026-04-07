"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useClientEnvironment } from "@/hooks/useClientEnvironment";
import { snapshotToFeedbackContext } from "@/lib/client-environment";
import type { FeedbackContext } from "@/lib/email/feedback-report-html";
import { Inter } from "next/font/google";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
   MOCK RECEIPT DATA
═══════════════════════════════════════════════════════════════════ */
const MOCK_CONSOLE: { level: LogLevel; text: string }[] = [
  { level: "warn", text: "Stripe.js not initialized — checkout may fail" },
  { level: "error", text: "TypeError: Cannot read properties of undefined (reading 'id')" },
  { level: "log", text: "Auth token refreshed (exp +3600s)" },
];

/** Includes a prominent 500 for the “aha” demo */
const MOCK_NETWORK = [
  { method: "POST" as const, path: "/api/checkout/session", status: 422, ms: "1 240", highlight: false },
  { method: "GET" as const, path: "/api/user/me", status: 200, ms: "81", highlight: false },
  {
    method: "PUT" as const,
    path: "/api/cart",
    status: 500,
    ms: "2 910",
    highlight: true,
    errorLabel: "500 Internal Server Error",
  },
] as const;

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
    dot: "bg-cyan-400",
    label: "click",
    pill: "bg-cyan-500/15 text-cyan-300 border-cyan-500/25",
  },
  input: {
    icon: Keyboard,
    dot: "bg-violet-400",
    label: "input",
    pill: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
  navigation: {
    icon: MapIcon,
    dot: "bg-emerald-400",
    label: "nav",
    pill: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  },
};

const LOG_PILL: Record<LogLevel, string> = {
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  warn: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  log: "bg-zinc-700/40 text-zinc-500 border-zinc-600/30",
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
          className="block w-[3px] h-[3px] rounded-full bg-cyan-400"
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
      {Icon && <Icon size={11} className="text-slate-500" />}
      <span className="text-[0.6rem] font-medium text-slate-600 uppercase tracking-[0.14em]">{label}</span>
      {badge && (
        <span className="ml-auto text-[0.58rem] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-[1px] rounded-full">
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
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-cyan-600">
            <Zap size={12} />
          </span>
          <span className="text-[0.8rem] font-semibold text-slate-900 tracking-tight">Whisper</span>
          <span className="text-[0.58rem] text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-[2px] rounded-full">
            DEMO
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
        >
          <X size={12} />
        </button>
      </div>

      <div className="px-4 pt-4 pb-2">
        <p className="text-[0.83rem] font-semibold text-slate-900 mb-1">What went wrong?</p>
        <p className="text-[0.71rem] text-slate-600 mb-3 leading-relaxed">
          Your session is being tracked for the last 30 seconds. Describe the issue in your own words.
        </p>
        {error && (
          <div
            role="alert"
            className="mb-3 rounded-xl border border-red-500/35 bg-red-950/50 px-3 py-2.5 flex gap-2 items-start"
          >
            <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[0.72rem] font-medium text-red-200">Could not send email</p>
              <p className="text-[0.68rem] text-red-300/90 mt-0.5 leading-relaxed">{error}</p>
            </div>
            <button
              type="button"
              onClick={onDismissError}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 shrink-0"
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
          className="w-full resize-none rounded-xl bg-slate-50 border border-slate-200
            focus:border-cyan-500/50 focus:ring-0 focus:outline-none
            text-[0.8rem] text-slate-900 placeholder-slate-400
            px-3.5 py-3 transition-colors duration-200 leading-relaxed"
        />
      </div>

      <div className="px-4 pb-4 pt-1.5 space-y-2.5">
        <motion.button
          type="button"
          onClick={onSubmit}
          disabled={!canSend}
          whileHover={canSend ? { scale: 1.02 } : {}}
          whileTap={canSend ? { scale: 0.98 } : {}}
          className={`w-full py-2.5 rounded-xl text-[0.83rem] font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
            canSend
              ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-500"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          Send report
          {canSend && <ArrowRight size={13} />}
        </motion.button>

        <p className="flex items-center justify-center gap-1.5 text-[0.62rem] text-slate-500">
          <Zap size={8} className="text-cyan-600/60" />
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
        <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
          <Zap size={14} />
        </div>
        <div>
          <p className="text-[0.78rem] font-semibold text-slate-900">Preparing receipt…</p>
          <p className="text-[0.64rem] text-slate-600">Packaging timeline + environment snapshot</p>
        </div>
      </div>

      <div className="space-y-3">
        {SUBMIT_STEPS.map((text, i) => (
          <motion.div
            key={text}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.25, ease: "easeOut" }}
            className="flex items-center gap-3 text-[0.74rem]"
          >
            <span className="shrink-0 w-4 flex justify-center">
              {i < step ? (
                <Check size={12} className="text-emerald-400" />
              ) : i === step ? (
                <Dots />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
              )}
            </span>
            <span className={i < step ? "text-slate-500" : i === step ? "text-slate-900" : "text-slate-400"}>{text}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SESSION TIMELINE — staggered entrance
═══════════════════════════════════════════════════════════════════ */
function SessionTimeline({ events, refTs }: { events: SessionEvent[]; refTs: number }) {
  const displayed = [...events].sort((a, b) => b.timestamp - a.timestamp);
  const empty = displayed.length === 0;

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.085, delayChildren: 0.12 },
    },
  };
  const item = {
    hidden: { opacity: 0, x: -16, filter: "blur(4px)" },
    show: {
      opacity: 1,
      x: 0,
      filter: "blur(0px)",
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <div>
      <SectionLabel
        icon={Activity}
        label="Session timeline"
        badge={empty ? "empty" : `${events.length} in last 30s`}
      />

      {empty ? (
        <p className="text-[0.72rem] text-slate-600 italic px-1">
          No events yet — click or type on the page, then send a report.
        </p>
      ) : (
        <motion.div variants={container} initial="hidden" animate="show" className="relative pl-1">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gradient-to-b from-slate-300/80 via-slate-200/50 to-transparent" />

          {displayed.map((ev, idx) => {
            const cfg = EVENT_CFG[ev.type];
            const Icon = cfg.icon;
            const isLast = idx === displayed.length - 1;

            return (
              <motion.div
                key={ev.id}
                variants={item}
                className={`relative flex items-start gap-3 py-2.5 pl-1 ${!isLast ? "border-b border-slate-100" : ""}`}
              >
                <div
                  className={`absolute left-[7px] mt-[6px] w-2 h-2 rounded-full ring-2 ring-white shrink-0 ${cfg.dot}`}
                />

                <div className="shrink-0 w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 ml-4">
                  <Icon size={12} strokeWidth={2} />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-[0.74rem] text-slate-700 leading-snug">{ev.description}</p>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1 ml-1 pt-0.5">
                  <span className={`text-[0.58rem] font-mono px-1.5 py-[2px] rounded border ${cfg.pill}`}>
                    {cfg.label}
                  </span>
                  <span className="text-[0.62rem] font-mono text-slate-500 flex items-center gap-0.5">
                    <Clock size={9} />
                    {relTime(ev.timestamp, refTs)}
                  </span>
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
   DEVELOPER RECEIPT
═══════════════════════════════════════════════════════════════════ */
function ReceiptStage({
  message,
  ctx,
  events,
  receiptTs,
  onReset,
  onClose,
}: {
  message: string;
  ctx: FeedbackContext;
  events: SessionEvent[];
  receiptTs: number;
  onReset: () => void;
  onClose: () => void;
}) {
  const fadeRow = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };
  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.09, delayChildren: 0.06 } },
  };

  return (
    <motion.div
      key="receipt"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col max-h-[min(560px,78vh)]"
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden px-4 py-3.5 border-b border-slate-200 shrink-0 bg-slate-50/80"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_120%_at_50%_0%,rgba(8,145,178,0.08)_0%,transparent_60%)]" />
        <div className="relative flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.12, type: "spring", stiffness: 280, damping: 18 }}
              className="mt-0.5 w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 shrink-0"
            >
              <Check size={14} />
            </motion.div>
            <div>
              <p className="text-[0.83rem] font-bold text-slate-900 leading-tight">Developer receipt</p>
              <p className="text-[0.68rem] text-slate-600 mt-0.5">
                A copy was emailed to you; this is the same summary in the widget
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            <X size={12} />
          </button>
        </div>
      </motion.div>

      <div
        className="flex-1 overflow-y-auto px-4 py-3 space-y-4
        [&::-webkit-scrollbar]:w-1.5
        [&::-webkit-scrollbar-track]:bg-transparent
        [&::-webkit-scrollbar-thumb]:bg-slate-300/80
        [&::-webkit-scrollbar-thumb]:rounded-full"
      >
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
          <motion.div variants={fadeRow}>
            <SectionLabel icon={MessageSquare} label="User message" />
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-3.5 py-3">
              <p className="text-[0.8rem] text-slate-700 leading-relaxed">&ldquo;{message}&rdquo;</p>
            </div>
          </motion.div>

          <motion.div variants={fadeRow}>
            <SessionTimeline events={events} refTs={receiptTs} />
          </motion.div>

          <motion.div variants={fadeRow}>
            <SectionLabel icon={Monitor} label="Environment" />
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { k: "Browser", v: `${ctx.browser} ${ctx.browserVersion}`.trim() },
                { k: "OS", v: ctx.os },
                { k: "Screen", v: ctx.screenResolution },
                { k: "Viewport", v: ctx.windowSize },
                { k: "Language", v: ctx.language },
                { k: "Time zone", v: ctx.timezone },
              ].map(({ k, v }) => (
                <div key={k} className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2">
                  <div className="text-[0.57rem] font-mono text-slate-500 uppercase tracking-wider mb-0.5">{k}</div>
                  <div className="text-[0.72rem] text-slate-800 truncate font-medium">{v || "—"}</div>
                </div>
              ))}
            </div>
            <div className="mt-1.5 rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-2">
              <div className="text-[0.57rem] font-mono text-slate-500 uppercase tracking-wider mb-0.5">
                <Globe size={8} className="inline mr-1 opacity-70" />
                URL
              </div>
              <div className="text-[0.68rem] text-cyan-700 truncate font-mono">{ctx.url}</div>
            </div>
          </motion.div>

          <motion.div variants={fadeRow}>
            <SectionLabel icon={Activity} label="Console (sample)" badge={`${MOCK_CONSOLE.length} lines`} />
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900">
              {MOCK_CONSOLE.map((entry, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2.5 px-3 py-2.5 font-mono text-[0.68rem] ${
                    i !== 0 ? "border-t border-white/10" : ""
                  }`}
                >
                  <span
                    className={`shrink-0 mt-px px-1.5 py-[1px] rounded text-[0.57rem] font-bold uppercase tracking-wider border ${LOG_PILL[entry.level]}`}
                  >
                    {entry.level}
                  </span>
                  <span className="text-slate-300 leading-relaxed break-all">{entry.text}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeRow}>
            <SectionLabel icon={Wifi} label="Network (sample)" badge="intercepted" />
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900">
              {MOCK_NETWORK.map((req, i) => (
                <div
                  key={i}
                  className={`flex flex-col gap-1 px-3 py-2.5 font-mono text-[0.68rem] ${
                    i !== 0 ? "border-t border-white/10" : ""
                  } ${req.highlight ? "bg-red-500/[0.06]" : ""}`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`shrink-0 font-bold w-9 text-[0.62rem] ${
                        req.method === "GET" ? "text-sky-400" : req.method === "POST" ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {req.method}
                    </span>
                    <span className="text-slate-400 flex-1 min-w-0 truncate">{req.path}</span>
                    <span className={`shrink-0 font-bold ${netStatusColor(req.status)}`}>{req.status}</span>
                    <span className="shrink-0 text-slate-500">{req.ms}ms</span>
                  </div>
                  {"highlight" in req && req.highlight && "errorLabel" in req && (
                    <div className="flex items-center gap-1.5 text-[0.62rem] text-red-400/95 pl-[2.25rem]">
                      <AlertTriangle size={11} className="shrink-0" />
                      <span className="font-medium">{req.errorLabel}</span>
                      <span className="text-slate-400">— primary failure candidate</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            variants={fadeRow}
            className="rounded-2xl bg-cyan-500/[0.06] border border-cyan-500/20 p-4"
          >
            <p className="text-[0.75rem] font-semibold text-slate-900 mb-1">
              This is the <span className="text-cyan-600">full picture</span> per report.
            </p>
            <p className="text-[0.67rem] text-slate-600 mb-3 leading-relaxed">
              Timeline + device context + logs + network — without asking the user for screenshots.
            </p>
            <motion.a
              href="#pricing"
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-cyan-600 text-white text-[0.79rem] font-bold shadow-md shadow-cyan-600/20 hover:bg-cyan-500"
            >
              Get Whisper for your site
              <ArrowRight size={13} />
            </motion.a>
            <button type="button" onClick={onReset} className="w-full mt-2 py-1.5 text-[0.68rem] text-slate-500 hover:text-slate-800 transition-colors">
              Try another message
            </button>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════ */
export default function WhisperWidgetDemo() {
  const prefersReduced = useReducedMotion();
  const sessionEvents = useSessionTracker();

  const [stage, setStage] = useState<Stage>("closed");
  const [message, setMessage] = useState("");
  const [stepIdx, setStepIdx] = useState(0);
  const [receiptTs, setReceiptTs] = useState(0);
  const [snapEvents, setSnapEvents] = useState<SessionEvent[]>([]);
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
  }, [stage, ctx, message, snapEvents]);

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
    setSubmitError(null);
    setStage("submitting");
  }, [sessionEvents]);
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
                className="absolute inset-0 rounded-full bg-cyan-400"
                animate={{ scale: [1, scale], opacity: [0.2, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: i * 0.45 }}
              />
            ))}

          <motion.button
            type="button"
            onClick={isOpen ? close : open}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            aria-label={isOpen ? "Close feedback" : "Open feedback"}
            data-whisper-widget
            className="relative flex items-center justify-center rounded-full bg-white text-cyan-600 border border-slate-200
              shadow-lg shadow-slate-900/10
              hover:border-cyan-500/40 hover:bg-slate-50 transition-colors duration-200"
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
              whitespace-nowrap text-[0.72rem] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-lg"
            >
              Feedback
              <span className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[5px] w-2 h-2 bg-white border-r border-t border-slate-200 rotate-45" />
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
            className="fixed z-[110] flex flex-col overflow-hidden rounded-2xl
              bg-white border border-slate-200
              shadow-xl shadow-slate-900/10"
            data-whisper-widget
          >
            <div className="absolute top-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

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
                  receiptTs={receiptTs}
                  onReset={reset}
                  onClose={close}
                />
              )}
            </AnimatePresence>

            {stage !== "receipt" && (
              <div className="shrink-0 border-t border-slate-200 px-4 py-2 flex items-center justify-center gap-1.5 bg-slate-50">
                <Zap size={8} className="text-cyan-600/70" />
                <span className="text-[0.57rem] text-slate-500 tracking-wide">Whisper widget demo</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
