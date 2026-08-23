"use client";

import { useState, useEffect, useCallback, useRef, DependencyList } from "react";
import { fetchAPI } from "@/lib/api";

export type ApiFetcher<T> = (signal: AbortSignal) => Promise<T>;

export interface UseApiQueryOptions<T = unknown> {
  enabled?: boolean;
  token?: string | null;
  initialData?: T;
}

export interface UseApiQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  /** True only when waiting for the query itself to become available (e.g. auth not yet loaded). */
  isPending: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

/**
 * Shared data-fetching hook with cancellation, stale-response guards,
 * and robust error propagation (H9/H10).
 */
export function useApiQuery<T>(
  query: string | ApiFetcher<T> | null,
  deps: DependencyList = [],
  options: UseApiQueryOptions<T> = {}
): UseApiQueryResult<T> {
  const { enabled = true, token, initialData = null } = options;

  const [data, setData] = useState<T | null>(initialData);
  // A null query while enabled means the query is still pending (e.g. Clerk
  // not yet loaded), so the hook must report loading to keep skeletons up.
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);

  // Keep track of the active request to discard stale responses
  const activeRequestId = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeFetch = useCallback(
    async (isManualRefetch = false) => {
      if (!enabled) {
        setIsLoading(false);
        return;
      }

      if (query === null) {
        setIsLoading(true);
        return;
      }

      // Abort previous in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const currentId = ++activeRequestId.current;

      setIsLoading(true);
      setError(null);

      try {
        let result: T;
        if (typeof query === "function") {
          result = await query(controller.signal);
        } else {
          result = await fetchAPI<T>(
            query,
            { signal: controller.signal },
            token
          );
        }

        // Only update state if this is still the most recent request and wasn't aborted
        if (currentId === activeRequestId.current && !controller.signal.aborted) {
          setData(result);
          setError(null);
          setIsLoading(false);
        }
      } catch (err: unknown) {
        // Abort errors are expected when cancelling/superseding requests
        const errObj = err as { name?: string; message?: string } | null;
        if (
          errObj?.name === "AbortError" ||
          controller.signal.aborted ||
          currentId !== activeRequestId.current
        ) {
          return;
        }

        const message = errObj?.message || "Failed to load data. Please try again.";
        setError(message);
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/use-memo
    [enabled, query, token, ...deps]
  );

  useEffect(() => {
    executeFetch();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [executeFetch]);

  const refetch = useCallback(async () => {
    await executeFetch(true);
  }, [executeFetch]);

  return {
    data,
    isLoading,
    isPending: isLoading && enabled && query === null,
    error,
    refetch,
    setData,
  };
}
