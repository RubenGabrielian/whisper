export type { ParsedUserAgent, ClientEnvironmentSnapshot } from "./types";
export { parseUserAgent } from "./parse-user-agent";
export {
  isBrowser,
  getClientEnvironmentSnapshot,
} from "./snapshot";
export { snapshotToFeedbackContext } from "./to-feedback-context";
