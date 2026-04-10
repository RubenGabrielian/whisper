import type { ParsedFeedbackPayload } from "@/lib/api/feedback-payload";
import type { ReportLogs, ReportUserData } from "./types";

export function payloadToReportInsert(params: {
  projectId: string;
  ownerEmail: string;
  parsed: ParsedFeedbackPayload;
}): {
  project_id: string;
  owner_email: string;
  user_message: string;
  user_data: ReportUserData;
  session_timeline: ParsedFeedbackPayload["events"];
  logs: ReportLogs;
  status: "new";
} {
  const { projectId, ownerEmail, parsed } = params;
  const { context, events, console: consoleLogs, network, receiptAt } = parsed;

  const user_data: ReportUserData = {
    ...context,
    receiptAt,
  };

  const logs: ReportLogs = {
    console: consoleLogs,
    network: network.map((n) => ({
      method: n.method,
      url: n.url,
      status: n.status,
      durationMs: n.durationMs,
      ok: n.ok,
      ...(n.error ? { error: n.error } : {}),
      timestamp: n.timestamp,
    })),
  };

  return {
    project_id: projectId,
    owner_email: ownerEmail,
    user_message: parsed.message,
    user_data,
    session_timeline: events,
    logs,
    status: "new",
  };
}
