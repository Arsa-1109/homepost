"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Type-safe, debounced form draft persistence hook.
 *
 * Automatically saves form state to localStorage and restores it upon return.
 *
 * @param draftKey - Unique localStorage key for this form draft
 * @param initialValues - Default values when no draft exists
 * @param debounceMs - Debounce delay in ms before writing to localStorage (default: 400ms)
 */
export function useFormDraft<T extends Record<string, any>>(
  draftKey: string,
  initialValues: T,
  debounceMs: number = 400
) {
  const [values, setValues] = useState<T>(initialValues);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const isHydratedRef = useRef(false);

  // Restore draft once on mount
  useEffect(() => {
    if (isHydratedRef.current || typeof window === "undefined") return;
    isHydratedRef.current = true;

    try {
      const raw = window.localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<T>;
        const hasContent = Object.values(parsed).some(
          (val) => val !== undefined && val !== null && val !== ""
        );
        if (hasContent) {
          setValues((prev) => ({ ...prev, ...parsed }));
          setIsDraftRestored(true);
        }
      }
    } catch {
      // Ignore corrupt or inaccessible storage
    }
  }, [draftKey]);

  // Debounced auto-save on value change
  useEffect(() => {
    if (!isHydratedRef.current || typeof window === "undefined") return;

    const timer = setTimeout(() => {
      try {
        const hasContent = Object.values(values).some(
          (val) => val !== undefined && val !== null && val !== ""
        );
        if (hasContent) {
          window.localStorage.setItem(draftKey, JSON.stringify(values));
        } else {
          window.localStorage.removeItem(draftKey);
        }
      } catch {
        // Ignore quota/access errors
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [values, draftKey, debounceMs]);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const discardDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(draftKey);
      } catch {}
    }
    setValues(initialValues);
    setIsDraftRestored(false);
  }, [draftKey, initialValues]);

  const clearDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(draftKey);
      } catch {}
    }
    setIsDraftRestored(false);
  }, [draftKey]);

  return {
    values,
    setValues,
    updateField,
    isDraftRestored,
    discardDraft,
    clearDraft,
  };
}
