import type {
  FeedbackContext,
  FeedbackEvent,
} from "@/lib/email/feedback-report-html";

export const FEEDBACK_MAX_MESSAGE = 8000;
export const FEEDBACK_MAX_EVENTS = 80;
export const FEEDBACK_MAX_CONSOLE = 80;
export const FEEDBACK_MAX_NETWORK = 60;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export type ParsedFeedbackPayload = {
  message: string;
  context: FeedbackContext;
  events: FeedbackEvent[];
  console: { level: "error" | "warn" | "log"; text: string; timestamp: number }[];
  network: {
    method: string;
    url: string;
    status: number | null;
    durationMs: number | null;
    ok: boolean;
    error?: string;
    timestamp: number;
  }[];
  receiptAt: number;
};

export function parseFeedbackPayload(body: unknown): ParsedFeedbackPayload | null {
  if (!isRecord(body)) return null;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (message.length < 3 || message.length > FEEDBACK_MAX_MESSAGE) return null;

  const receiptAt =
    typeof body.receiptAt === "number" && Number.isFinite(body.receiptAt)
      ? body.receiptAt
      : Date.now();

  const ctx = body.context;
  if (!isRecord(ctx)) return null;
  const context: FeedbackContext = {
    browser: String(ctx.browser ?? ""),
    browserVersion: String(ctx.browserVersion ?? ""),
    os: String(ctx.os ?? ""),
    screenResolution: String(ctx.screenResolution ?? ""),
    windowSize: String(ctx.windowSize ?? ""),
    language: String(ctx.language ?? ""),
    timezone: String(ctx.timezone ?? ""),
    url: String(ctx.url ?? ""),
  };

  if (!Array.isArray(body.events)) return null;
  const events: FeedbackEvent[] = [];
  for (const ev of body.events.slice(0, FEEDBACK_MAX_EVENTS)) {
    if (!isRecord(ev)) continue;
    const type = ev.type;
    if (type !== "click" && type !== "input" && type !== "navigation") continue;
    const id = String(ev.id ?? "");
    const description = String(ev.description ?? "");
    const timestamp = Number(ev.timestamp);
    if (!id || !description || !Number.isFinite(timestamp)) continue;
    events.push({ id, type, description, timestamp });
  }

  const consoleRaw = (body as Record<string, unknown>).console;
  const consoleEntries: ParsedFeedbackPayload["console"] = [];
  if (Array.isArray(consoleRaw)) {
    for (const c of consoleRaw.slice(0, FEEDBACK_MAX_CONSOLE)) {
      if (!isRecord(c)) continue;
      const level = c.level;
      if (level !== "log" && level !== "warn" && level !== "error") continue;
      const text = typeof c.text === "string" ? c.text.trim() : "";
      const timestamp = Number(c.timestamp);
      if (!text || !Number.isFinite(timestamp)) continue;
      consoleEntries.push({ level, text, timestamp });
    }
  }

  const networkRaw = (body as Record<string, unknown>).network;
  const networkEntries: ParsedFeedbackPayload["network"] = [];
  if (Array.isArray(networkRaw)) {
    for (const n of networkRaw.slice(0, FEEDBACK_MAX_NETWORK)) {
      if (!isRecord(n)) continue;
      const method = typeof n.method === "string" ? n.method.toUpperCase() : "";
      const url = typeof n.url === "string" ? n.url : "";
      const ok = typeof n.ok === "boolean" ? n.ok : false;
      const status =
        typeof n.status === "number" && Number.isFinite(n.status) ? n.status : null;
      const durationMs =
        typeof n.durationMs === "number" && Number.isFinite(n.durationMs) ? n.durationMs : null;
      const timestamp = Number(n.timestamp);
      const error = typeof n.error === "string" ? n.error.trim().slice(0, 220) : undefined;
      if (!method || !url || !Number.isFinite(timestamp)) continue;
      networkEntries.push({ method, url, ok, status, durationMs, timestamp, ...(error ? { error } : {}) });
    }
  }

  return { message, context, events, console: consoleEntries, network: networkEntries, receiptAt };
}
