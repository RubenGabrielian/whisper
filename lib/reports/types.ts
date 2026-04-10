import type { FeedbackContext } from "@/lib/email/feedback-report-html";
import type { FeedbackEvent } from "@/lib/email/feedback-report-html";

export type ReportStatus = "new" | "resolved" | "archived";

export type ReportUserData = FeedbackContext & {
  receiptAt?: number;
};

export type ReportLogs = {
  console: {
    level: "error" | "warn" | "log";
    text: string;
    timestamp: number;
  }[];
  network: {
    method: string;
    url: string;
    status: number | null;
    durationMs: number | null;
    ok: boolean;
    error?: string;
    timestamp: number;
  }[];
};

export type ReportRow = {
  id: string;
  project_id: string;
  owner_email: string;
  user_message: string;
  user_data: ReportUserData;
  session_timeline: FeedbackEvent[];
  logs: ReportLogs;
  created_at: string;
  status: ReportStatus;
};

export function isReportStatus(s: string): s is ReportStatus {
  return s === "new" || s === "resolved" || s === "archived";
}
