"use client";

import { useEffect, useState } from "react";
import type { ClientEnvironmentSnapshot } from "@/lib/client-environment";
import {
  getClientEnvironmentSnapshot,
  isBrowser,
} from "@/lib/client-environment";

type Options = {
  /** Update snapshot on window resize (viewport + DPR changes on zoom). Default false. */
  trackResize?: boolean;
};

/**
 * Client-only environment snapshot (UA, screen, locale, URL, connectivity).
 * `null` during SSR and the first client render — match layout after mount.
 */
export function useClientEnvironment(options: Options = {}): ClientEnvironmentSnapshot | null {
  const { trackResize = false } = options;
  const [snapshot, setSnapshot] = useState<ClientEnvironmentSnapshot | null>(null);

  useEffect(() => {
    if (!isBrowser()) return;

    const refresh = () => {
      try {
        setSnapshot(getClientEnvironmentSnapshot());
      } catch {
        setSnapshot(null);
      }
    };

    refresh();

    if (!trackResize) return;

    window.addEventListener("resize", refresh);
    return () => window.removeEventListener("resize", refresh);
  }, [trackResize]);

  return snapshot;
}
