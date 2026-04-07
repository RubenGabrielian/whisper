import type {
  FeedbackContext,
  FeedbackEvent,
} from "@/lib/email/feedback-report-html";

export const FEEDBACK_MAX_MESSAGE = 8000;
export const FEEDBACK_MAX_EVENTS = 80;

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export type ParsedFeedbackPayload = {
  message: string;
  context: FeedbackContext;
  events: FeedbackEvent[];
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

  return { message, context, events, receiptAt };
}
