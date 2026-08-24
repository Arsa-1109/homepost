"use client";

import { useEffect, useState } from "react";

/**
 * Debounce a fast-changing value (default 150ms per the FilterBar standard).
 * Returns the delayed value; consumers filter on it instead of the raw input.
 */
export function useDebouncedValue<T>(value: T, delay = 150): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
