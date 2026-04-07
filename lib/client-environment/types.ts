/**
 * Parsed navigator.userAgent — safe to run on the server (pass UA string from headers if needed).
 */
export type ParsedUserAgent = {
  /** Short label: Chrome, Edge, Safari, … */
  browser: string;
  browserVersion: string;
  os: string;
  /** Longer label for demos / marketing copy */
  browserDisplayName: string;
};

/**
 * Snapshot of browser APIs — only available after calling {@link getClientEnvironmentSnapshot} in the browser.
 */
export type ClientEnvironmentSnapshot = {
  userAgent: string;
  parsed: ParsedUserAgent;
  /** e.g. "1728×1117" */
  screenResolutionPlain: string;
  /** e.g. "1728×1117 (@2x)" */
  screenResolutionWithDpr: string;
  windowSize: string;
  devicePixelRatio: number;
  devicePixelRatioLabel: string;
  language: string;
  languages: readonly string[];
  timezone: string;
  url: string;
  referrer: string;
  cookiesEnabled: boolean;
  onLine: boolean;
};
