"use client";

import { useCallback, useEffect, useState } from "react";

export type ViewMode = "grid" | "table";

/**
 * Persisted Grid/Table view preference (localStorage).
 * Hydrates after mount to avoid SSR mismatches; defaults to "grid".
 */
export function useViewPreference(key: string): [ViewMode, (mode: ViewMode) => void] {
  const [view, setView] = useState<ViewMode>("grid");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored === "table" || stored === "grid") setView(stored);
    } catch {
      // Storage unavailable — keep default
    }
    setHydrated(true);
  }, [key]);

  const update = useCallback(
    (mode: ViewMode) => {
      setView(mode);
      try {
        window.localStorage.setItem(key, mode);
      } catch {
        // Storage full/unavailable — preference stays session-only
      }
    },
    [key]
  );

  // Avoid flashing the toggle before hydration
  return hydrated ? [view, update] : ["grid", update];
}
