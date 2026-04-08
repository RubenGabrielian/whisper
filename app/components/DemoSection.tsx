"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { getClientEnvironmentSnapshot } from "@/lib/client-environment";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
type LogLevel = "error" | "warn" | "log" | "info";
type Status = "idle" | "capturing" | "done";

interface ConsoleEntry {
  level: LogLevel;
  message: string;
  ts: string;
}

interface NetworkEntry {
  method: string;
  path: string;
  status: number;
  duration: string;
}

interface ReportData {
  id: string;
  timestamp: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  environment: {
    browser: string;
    browserVersion: string;
    os: string;
    screenResolution: string;
    windowSize: string;
    devicePixelRatio: string;
    language: string;
    timezone: string;
    url: string;
    referrer: string;
    cookiesEnabled: boolean;
    onLine: boolean;
  };
  consoleLogs: ConsoleEntry[];
  networkRequests: NetworkEntry[];
  jsErrors: string[];
}

/* ─────────────────────────────────────────────
   Random ID generator
───────────────────────────────────────────── */
function makeId() {
  return "wsp_" + Math.random().toString(36).slice(2, 10);
}

/* ─────────────────────────────────────────────
   Determine severity from real data
───────────────────────────────────────────── */
function pickSeverity(logs: ConsoleEntry[], errors: string[]): ReportData["severity"] {
  if (errors.length > 0 || logs.some((l) => l.level === "error")) return "CRITICAL";
  if (logs.some((l) => l.level === "warn")) return "HIGH";
  return "MEDIUM";
}

/* ─────────────────────────────────────────────
   Mock network entries (always shown)
───────────────────────────────────────────── */
const MOCK_NETWORK: NetworkEntry[] = [
  { method: "POST", path: "/api/checkout/session", status: 422, duration: "1.24s" },
  { method: "GET",  path: "/api/user/profile",     status: 200, duration: "83ms"  },
  { method: "PUT",  path: "/api/cart/items/42",    status: 500, duration: "2.91s" },
  { method: "GET",  path: "/api/feature-flags",    status: 200, duration: "47ms"  },
];

/* ─────────────────────────────────────────────
   Terminal line building — returns structured lines
───────────────────────────────────────────── */
type TerminalLine =
  | { kind: "comment"; text: string }
  | { kind: "blank" }
  | { kind: "kv"; key: string; value: string; valueStyle: string }
  | { kind: "log"; level: LogLevel; message: string; ts: string }
  | { kind: "network"; method: string; path: string; status: number; duration: string }
  | { kind: "error-entry"; message: string };

function buildLines(data: ReportData): TerminalLine[] {
  const lines: TerminalLine[] = [];

  // ── Metadata ─────────────────────────
  lines.push({ kind: "comment", text: "// REPORT METADATA" });
  lines.push({ kind: "kv", key: "id",        value: `"${data.id}"`,        valueStyle: "cyan"   });
  lines.push({ kind: "kv", key: "timestamp", value: `"${data.timestamp}"`, valueStyle: "zinc"   });
  lines.push({ kind: "kv", key: "severity",  value: data.severity,         valueStyle: data.severity === "CRITICAL" ? "red" : data.severity === "HIGH" ? "orange" : "mint" });
  lines.push({ kind: "blank" });

  // ── Environment ───────────────────────
  lines.push({ kind: "comment", text: "// ENVIRONMENT" });
  lines.push({ kind: "kv", key: "browser",          value: `"${data.environment.browser}"`,                             valueStyle: "cyan"  });
  lines.push({ kind: "kv", key: "version",          value: `"${data.environment.browserVersion}"`,                      valueStyle: "zinc"  });
  lines.push({ kind: "kv", key: "os",               value: `"${data.environment.os}"`,                                  valueStyle: "cyan"  });
  lines.push({ kind: "kv", key: "screenResolution", value: `"${data.environment.screenResolution}"`,                    valueStyle: "zinc"  });
  lines.push({ kind: "kv", key: "windowSize",       value: `"${data.environment.windowSize}"`,                          valueStyle: "zinc"  });
  lines.push({ kind: "kv", key: "devicePixelRatio", value: `"${data.environment.devicePixelRatio}"`,                    valueStyle: "zinc"  });
  lines.push({ kind: "kv", key: "language",         value: `"${data.environment.language}"`,                            valueStyle: "cyan"  });
  lines.push({ kind: "kv", key: "timezone",         value: `"${data.environment.timezone}"`,                            valueStyle: "zinc"  });
  lines.push({ kind: "kv", key: "url",              value: `"${data.environment.url}"`,                                 valueStyle: "cyan"  });
  if (data.environment.referrer)
    lines.push({ kind: "kv", key: "referrer",       value: `"${data.environment.referrer}"`,                            valueStyle: "zinc"  });
  lines.push({ kind: "kv", key: "cookiesEnabled",   value: String(data.environment.cookiesEnabled),                     valueStyle: "bool"  });
  lines.push({ kind: "kv", key: "onLine",           value: String(data.environment.onLine),                             valueStyle: "bool"  });
  lines.push({ kind: "blank" });

  // ── Console Logs ──────────────────────
  lines.push({ kind: "comment", text: `// CONSOLE LOGS  (${data.consoleLogs.length} captured)` });
  if (data.consoleLogs.length === 0) {
    lines.push({ kind: "kv", key: "entries", value: "[]", valueStyle: "zinc" });
  } else {
    data.consoleLogs.forEach((l) => lines.push({ kind: "log", ...l }));
  }
  lines.push({ kind: "blank" });

  // ── JS Errors ─────────────────────────
  lines.push({ kind: "comment", text: `// JAVASCRIPT ERRORS  (${data.jsErrors.length} captured)` });
  if (data.jsErrors.length === 0) {
    lines.push({ kind: "kv", key: "entries", value: "[]", valueStyle: "zinc" });
  } else {
    data.jsErrors.forEach((e) => lines.push({ kind: "error-entry", message: e }));
  }
  lines.push({ kind: "blank" });

  // ── Network Requests ─────────────────
  lines.push({ kind: "comment", text: `// NETWORK REQUESTS  (${data.networkRequests.length} intercepted)` });
  data.networkRequests.forEach((r) => lines.push({ kind: "network", ...r }));

  return lines;
}

/* ─────────────────────────────────────────────
   Terminal Line Renderer
───────────────────────────────────────────── */
const VALUE_STYLES: Record<string, string> = {
  cyan:   "text-amber-400",
  mint:   "text-emerald-400",
  zinc:   "text-zinc-400",
  red:    "text-red-400",
  orange: "text-orange-400",
  bool:   "text-violet-400",
};

const STATUS_COLORS: Record<number, string> = {};
function statusColor(s: number) {
  if (s >= 500) return "text-red-400";
  if (s >= 400) return "text-orange-400";
  return "text-emerald-400";
}

const LOG_COLORS: Record<LogLevel, string> = {
  error: "bg-red-500/15 text-red-400 border-2 border-red-900/60",
  warn:  "bg-amber-500/15 text-amber-400 border-2 border-amber-900/50",
  log:   "bg-zinc-800 text-zinc-400 border-2 border-zinc-700",
  info:  "bg-blue-500/10 text-blue-400 border-2 border-blue-900/40",
};

function TermLine({ line, index }: { line: TerminalLine; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex items-start gap-3 min-h-[1.45rem]"
    >
      {/* Gutter line number */}
      <span className="select-none text-zinc-700 text-right w-5 shrink-0 tabular-nums leading-[1.45rem] border-r border-zinc-800 pr-1 mr-1">
        {index + 1}
      </span>

      {/* Content */}
      <div className="flex-1 leading-[1.45rem]">
        {line.kind === "blank" && <span className="opacity-0">·</span>}

        {line.kind === "comment" && (
          <span className="text-zinc-600 italic font-mono">{line.text}</span>
        )}

        {line.kind === "kv" && (
          <span className="flex gap-2 flex-wrap">
            <span className="text-emerald-400 shrink-0">{line.key}</span>
            <span className="text-zinc-600">→</span>
            <span className={VALUE_STYLES[line.valueStyle] ?? "text-zinc-400"}>
              {line.value}
            </span>
          </span>
        )}

        {line.kind === "log" && (
          <span className="flex items-center gap-2 flex-wrap">
            <span
              className={`shrink-0 text-[0.62rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${LOG_COLORS[line.level]}`}
            >
              {line.level}
            </span>
            <span className="text-zinc-600 text-[0.7rem]">{line.ts}</span>
            <span className="text-zinc-300">{line.message}</span>
          </span>
        )}

        {line.kind === "network" && (
          <span className="flex items-center gap-2.5 flex-wrap font-mono">
            <span className={`shrink-0 text-[0.65rem] font-bold w-8 ${line.method === "GET" ? "text-blue-400" : line.method === "POST" ? "text-emerald-400" : "text-orange-400"}`}>
              {line.method}
            </span>
            <span className="text-zinc-400 flex-1 truncate">{line.path}</span>
            <span className={`shrink-0 font-bold text-[0.8rem] ${statusColor(line.status)}`}>
              {line.status}
            </span>
            <span className="shrink-0 text-zinc-500">{line.duration}</span>
          </span>
        )}

        {line.kind === "error-entry" && (
          <span className="flex items-start gap-2">
            <span className="shrink-0 text-red-500 mt-[1px]">✕</span>
            <span className="text-red-400">{line.message}</span>
          </span>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Blinking Cursor
───────────────────────────────────────────── */
function Cursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
      className="inline-block w-1.5 h-4 bg-amber-400 ml-1 align-middle"
    />
  );
}

/* ─────────────────────────────────────────────
   Capture spinner dots
───────────────────────────────────────────── */
function SpinnerDots() {
  return (
    <span className="inline-flex gap-1 items-center">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1 h-1 bg-amber-400"
          animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function DemoSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const capturedLogsRef = useRef<ConsoleEntry[]>([]);
  const capturedErrorsRef = useRef<string[]>([]);

  const inView = useInView(sectionRef, { once: true, margin: "-60px" });

  const [status, setStatus] = useState<Status>("idle");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [allLines, setAllLines] = useState<TerminalLine[]>([]);
  const [runCount, setRunCount] = useState(0);

  /* ── Console interceptor (mount once) ─── */
  useEffect(() => {
    const orig = {
      log:   console.log.bind(console),
      warn:  console.warn.bind(console),
      error: console.error.bind(console),
      info:  console.info.bind(console),
    };

    const intercept = (level: LogLevel) =>
      (...args: unknown[]) => {
        // Call the real console method
        orig[level](...args);
        const message = args
          .map((a) =>
            a instanceof Error
              ? a.message
              : typeof a === "object"
              ? JSON.stringify(a)
              : String(a)
          )
          .join(" ")
          .slice(0, 100);
        const ts = new Date().toTimeString().slice(0, 8);
        capturedLogsRef.current = [
          ...capturedLogsRef.current.slice(-9),
          { level, message, ts },
        ];
      };

    console.log   = intercept("log");
    console.warn  = intercept("warn");
    console.error = intercept("error");
    console.info  = intercept("info");

    /* ── Global error handler ─── */
    const onError = (e: ErrorEvent) => {
      capturedErrorsRef.current = [
        ...capturedErrorsRef.current.slice(-4),
        `${e.message} (${e.filename?.split("/").pop() ?? "unknown"}:${e.lineno})`,
      ];
    };
    window.addEventListener("error", onError);

    return () => {
      console.log   = orig.log;
      console.warn  = orig.warn;
      console.error = orig.error;
      console.info  = orig.info;
      window.removeEventListener("error", onError);
    };
  }, []);

  /* ── Stream lines once data is ready ─── */
  useEffect(() => {
    if (status !== "done" || allLines.length === 0) return;
    setVisibleCount(0);
    let i = 0;
    // Reveal a new line every 45ms — fast enough to feel live, slow enough to read
    const interval = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= allLines.length) clearInterval(interval);
    }, 45);
    return () => clearInterval(interval);
  }, [status, allLines]);

  /* ── Auto-scroll terminal ─── */
  useEffect(() => {
    if (visibleCount > 0)
      consoleEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [visibleCount]);

  /* ── Capture handler ─── */
  const handleCapture = useCallback(async () => {
    if (status === "capturing") return;

    setStatus("capturing");
    setReportData(null);
    setAllLines([]);
    setVisibleCount(0);

    // Emit a few demo logs so the interceptor has something real to show
    console.log("DemoSection: initiating capture…");
    console.warn("Stripe.js not loaded — falling back to embedded form");
    console.error("Failed to prefetch /api/recommendations: NetworkError");

    await new Promise((r) => setTimeout(r, 1200));

    /* ── Build real data ─── */
    const snap = getClientEnvironmentSnapshot();

    // Merge real logs + always show at least a few mock ones if the page is quiet
    const realLogs = [...capturedLogsRef.current];
    const logsToShow: ConsoleEntry[] =
      realLogs.length >= 2
        ? realLogs.slice(-6)
        : [
            { level: "log",   message: "App mounted successfully",                        ts: new Date().toTimeString().slice(0, 8) },
            { level: "warn",  message: "Stripe.js not loaded — falling back to embedded", ts: new Date().toTimeString().slice(0, 8) },
            { level: "error", message: "NetworkError: Failed to fetch /api/recommendations", ts: new Date().toTimeString().slice(0, 8) },
            { level: "log",   message: "Auth token refreshed ✓",                          ts: new Date().toTimeString().slice(0, 8) },
          ];

    const jsErrors = capturedErrorsRef.current.length
      ? [...capturedErrorsRef.current]
      : ["TypeError: Cannot read properties of undefined (reading 'stripe')"];

    const data: ReportData = {
      id:        makeId(),
      timestamp: new Date().toISOString(),
      severity:  pickSeverity(logsToShow, jsErrors),
      environment: {
        browser: snap.parsed.browserDisplayName,
        browserVersion: snap.parsed.browserVersion,
        os: snap.parsed.os,
        screenResolution: snap.screenResolutionPlain,
        windowSize: snap.windowSize,
        devicePixelRatio: snap.devicePixelRatioLabel,
        language: snap.language,
        timezone: snap.timezone,
        url: snap.url,
        referrer: snap.referrer,
        cookiesEnabled: snap.cookiesEnabled,
        onLine: snap.onLine,
      },
      consoleLogs:     logsToShow,
      networkRequests: MOCK_NETWORK,
      jsErrors,
    };

    setReportData(data);
    setAllLines(buildLines(data));
    setRunCount((n) => n + 1);
    setStatus("done");
  }, [status]);

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  const severityBadge =
    reportData?.severity === "CRITICAL"
      ? "bg-red-100 text-red-700 border-2 border-red-700"
      : reportData?.severity === "HIGH"
      ? "bg-amber-100 text-amber-700 border-2 border-amber-700"
      : "bg-emerald-100 text-emerald-700 border-2 border-emerald-700";

  return (
    <section ref={sectionRef} id="demo" className="relative py-28 px-6 overflow-hidden grid-paper-bg">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(251,191,36,0.03)_0%,transparent_70%)]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

      <div className="relative max-w-5xl mx-auto">
        {/* ── Section header ─────────────────── */}
        <motion.div
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.09 } },
          }}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-12"
        >
          <motion.div
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16,1,0.3,1] } } }}
            className="inline-flex items-center gap-2 text-[0.68rem] font-mono font-bold text-amber-700 tracking-[0.18em] uppercase mb-4"
          >
            <span className="w-5 h-[2px] bg-amber-600" />
            Live Demo
            <span className="w-5 h-[2px] bg-amber-600" />
          </motion.div>

          <motion.h2
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16,1,0.3,1] } } }}
            className="font-display font-black text-[clamp(2rem,4.5vw,3.4rem)] text-zinc-950 tracking-tight leading-tight"
          >
            See it work.
            <span className="text-zinc-500"> Right now.</span>
          </motion.h2>

          <motion.p
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16,1,0.3,1] } } }}
            className="font-mono text-zinc-600 text-[0.92rem] mt-3 max-w-md mx-auto leading-relaxed"
          >
            Click the button. Whybug captures{" "}
            <span className="text-zinc-950 font-semibold">your real browser context</span> instantly — no
            setup, no backend.
          </motion.p>
        </motion.div>

        {/* ── Main layout: button col + terminal col ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start"
        >
          {/* ── Left panel: trigger + stats ─── */}
          <div className="flex flex-col gap-4">
            {/* CTA card */}
            <div className="border-2 border-zinc-950 bg-white p-6 shadow-[6px_6px_0px_0px_#000]">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 border-2 border-zinc-950 bg-amber-400 flex items-center justify-center text-zinc-950 shadow-[2px_2px_0px_0px_#000]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <div>
                  <div className="text-[0.82rem] font-display font-bold text-zinc-950">Simulate Bug Report</div>
                  <div className="text-[0.68rem] font-mono text-zinc-500">Captures real context from your browser</div>
                </div>
              </div>

              <motion.button
                onClick={handleCapture}
                disabled={status === "capturing"}
                whileTap={status !== "capturing" ? { x: 2, y: 2 } : {}}
                className={`w-full py-3.5 font-bold text-[0.88rem] transition-[transform,box-shadow,background-color] duration-75 flex items-center justify-center gap-2.5 border-2 ${
                  status === "capturing"
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border-zinc-700 shadow-none"
                    : "bg-amber-400 text-zinc-950 border-zinc-950 shadow-[4px_4px_0px_0px_#000] hover:shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px]"
                }`}
              >
                {status === "capturing" ? (
                  <>
                    <SpinnerDots />
                    <span>Capturing context…</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    {status === "done" ? "Run Again" : "Capture Bug Report"}
                  </>
                )}
              </motion.button>

              {runCount > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-[0.68rem] font-mono text-zinc-600 mt-3"
                >
                  Report generated {runCount} time{runCount !== 1 ? "s" : ""}
                </motion.p>
              )}
            </div>

            {/* What will be captured */}
            <div className="border-2 border-zinc-950 bg-white p-5 shadow-[6px_6px_0px_0px_#000]">
              <div className="text-[0.65rem] font-mono font-bold text-zinc-500 uppercase tracking-[0.18em] mb-3">
                // What gets captured
              </div>
              <ul className="space-y-2.5">
                {[
                  { label: "Browser & OS",        sub: "navigator.userAgent",       color: "text-amber-600" },
                  { label: "Screen / Window Size", sub: "window.screen + innerWidth", color: "text-amber-600" },
                  { label: "Console Logs",         sub: "intercepted in real-time",  color: "text-emerald-600" },
                  { label: "JS Errors",            sub: "window onerror handler",    color: "text-red-600" },
                  { label: "Network Requests",     sub: "fetch / XHR interceptor",   color: "text-orange-600" },
                  { label: "URL & Referrer",       sub: "location + document",        color: "text-violet-600" },
                  { label: "Timezone",             sub: "Intl.DateTimeFormat",        color: "text-zinc-500" },
                ].map(({ label, sub, color }) => (
                  <li key={label} className="flex items-start gap-2.5">
                    <span className={`shrink-0 text-[0.7rem] leading-none mt-0.5 font-bold ${color}`}>▸</span>
                    <div>
                      <div className="text-[0.78rem] font-display font-bold text-zinc-950 leading-tight">{label}</div>
                      <div className="text-[0.65rem] text-zinc-500 font-mono">{sub}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Severity badge (shows after capture) */}
            <AnimatePresence>
              {reportData && (
                <motion.div
                  key={reportData.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.4 }}
                  className="border-2 border-zinc-950 bg-white p-5 shadow-[6px_6px_0px_0px_#000]"
                >
                  <div className="text-[0.65rem] font-mono font-bold text-zinc-500 uppercase tracking-[0.18em] mb-3">
                    // Auto-determined severity
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 text-[0.72rem] font-mono font-bold tracking-[0.12em] uppercase ${severityBadge}`}>
                      !! {reportData.severity}
                    </span>
                    <span className="text-[0.75rem] font-mono text-zinc-600">
                      {reportData.severity === "CRITICAL"
                        ? "JS errors detected"
                        : reportData.severity === "HIGH"
                        ? "Warnings detected"
                        : "No critical signals"}
                    </span>
                  </div>
                  <div className="mt-3 font-mono text-[0.65rem] text-zinc-500 truncate">
                    id: {reportData.id}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Right panel: debug console terminal ── */}
          <div className="border-2 border-zinc-700 bg-zinc-950 overflow-hidden shadow-[6px_6px_0px_0px_#000] min-h-[520px] flex flex-col terminal-scanlines">
            {/* Window chrome — vintage OS style */}
            <div className="flex items-center gap-0 px-4 py-2.5 border-b-2 border-zinc-800 bg-zinc-900 shrink-0">
              <div className="flex gap-1.5 mr-4">
                <span className="w-3 h-3 border border-red-700 bg-[#FF5F57]" />
                <span className="w-3 h-3 border border-yellow-700 bg-[#FFBD2E]" />
                <span className="w-3 h-3 border border-green-700 bg-[#28C840]" />
              </div>
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[0.65rem] font-mono text-zinc-600 tracking-wider uppercase">
                  WHYBUG · DEBUG-CONSOLE
                </span>
                {reportData && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`text-[0.6rem] font-mono font-bold px-2 py-0.5 ${severityBadge}`}
                  >
                    !! {reportData.severity}
                  </motion.span>
                )}
              </div>
              {/* Status indicator */}
              <div className="flex items-center gap-1.5 text-[0.65rem] font-mono text-zinc-500">
                {status === "idle" && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-zinc-600" />
                    IDLE
                  </span>
                )}
                {status === "capturing" && (
                  <span className="flex items-center gap-1.5 text-amber-400">
                    <motion.span
                      animate={{ opacity: [1, 0.3] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                      className="w-1.5 h-1.5 bg-amber-400"
                    />
                    CAPTURING…
                  </span>
                )}
                {status === "done" && (
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-1.5 h-1.5 bg-emerald-500" />
                    {visibleCount >= allLines.length ? "DONE" : "STREAMING…"}
                  </span>
                )}
              </div>
            </div>

            {/* Terminal body */}
            <div className="flex-1 overflow-y-auto p-5 font-mono text-[0.73rem] leading-relaxed max-h-[600px] scroll-smooth bg-zinc-950 text-zinc-200">
              <AnimatePresence mode="wait">
                {status === "idle" && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center gap-3 text-center py-16"
                  >
                    <div className="w-12 h-12 border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center text-zinc-500 mb-2 shadow-[2px_2px_0px_0px_#000]">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <polyline points="4 17 10 11 4 5" />
                        <line x1="12" y1="19" x2="20" y2="19" />
                      </svg>
                    </div>
                    <p className="text-zinc-500 text-[0.78rem] font-mono">Waiting for report…</p>
                    <p className="text-zinc-600 text-[0.68rem] font-mono">Click the button to capture context</p>
                    <Cursor />
                  </motion.div>
                )}

                {status === "capturing" && (
                  <motion.div
                    key="capturing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col justify-center gap-2 py-16"
                  >
                    {[
                      { done: true,  text: "Hooking console.log / warn / error…" },
                      { done: true,  text: "Intercepting fetch / XHR…" },
                      { done: true,  text: "Reading navigator.userAgent…" },
                      { done: true,  text: "Sampling window.screen + viewport…" },
                      { done: false, text: "Serialising report payload…", active: true },
                    ].map((step, i) => (
                      <motion.div
                        key={step.text}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.18, duration: 0.3 }}
                        className="flex items-center gap-3"
                      >
                        {step.done ? (
                          <span className="text-emerald-400 shrink-0">✓</span>
                        ) : (
                          <SpinnerDots />
                        )}
                        <span className={step.done ? "text-zinc-600" : "text-zinc-300"}>
                          {step.text}
                        </span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                {status === "done" && allLines.length > 0 && (
                  <motion.div key={`done-${runCount}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="space-y-0.5">
                      {allLines.slice(0, visibleCount).map((line, i) => (
                        <TermLine key={`${runCount}-${i}`} line={line} index={i} />
                      ))}
                    </div>
                    {/* Live cursor while streaming */}
                    {visibleCount < allLines.length && (
                      <div className="mt-1 ml-8">
                        <Cursor />
                      </div>
                    )}
                    <div ref={consoleEndRef} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer bar */}
            <div className="shrink-0 border-t-2 border-zinc-800 px-5 py-2 flex items-center justify-between bg-zinc-900">
              <div className="flex items-center gap-4 text-[0.63rem] font-mono text-zinc-600">
                <span>UTF-8</span>
                <span>LF</span>
                <span>JSON</span>
              </div>
              {reportData && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 text-[0.63rem] font-mono text-zinc-600"
                >
                  <span>{allLines.length} lines</span>
                  <span className="text-amber-400/80">
                    {visibleCount >= allLines.length ? "● DONE" : `● ${visibleCount}/${allLines.length}`}
                  </span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Bottom note ─── */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center text-[0.72rem] text-zinc-500 mt-8 font-mono"
        >
          ↑ This is real data from{" "}
          <span className="text-zinc-700">your browser</span>. No server involved.
          Network entries are simulated for demo purposes.
        </motion.p>
      </div>
    </section>
  );
}
