import type { FeedbackContext } from "@/lib/email/feedback-report-html";
import type { ClientEnvironmentSnapshot } from "./types";

/**
 * Shape expected by `/api/feedback` and email HTML — short browser name, DPR in screen string.
 */
export function snapshotToFeedbackContext(
  snap: ClientEnvironmentSnapshot
): FeedbackContext {
  return {
    browser: snap.parsed.browser,
    browserVersion: snap.parsed.browserVersion,
    os: snap.parsed.os,
    screenResolution: snap.screenResolutionWithDpr,
    windowSize: snap.windowSize,
    language: snap.language,
    timezone: snap.timezone,
    url: snap.url,
  };
}
