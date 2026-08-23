import { renderHook, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useApiQuery } from "./useApiQuery";

describe("useApiQuery hook", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("handles standard tri-state lifecycle (loading -> data)", async () => {
    const mockData = { id: "1", title: "Test Announcement" };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => mockData,
    } as unknown as Response);

    const { result } = renderHook(() => useApiQuery<typeof mockData>("/api/v1/test", []));

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    // Resolves to data
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });

  it("surfaces error message when request fails", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ detail: "Database connection failed" }),
    } as unknown as Response);

    const { result } = renderHook(() => useApiQuery("/api/v1/fail", []));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Database connection failed");
  });

  it("discards stale responses when dependencies change rapidly", async () => {
    let resolveFirst: (value: any) => void = () => {};
    let resolveSecond: (value: any) => void = () => {};

    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise((resolve) => {
      resolveSecond = resolve;
    });

    global.fetch = vi
      .fn()
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    let propId = "prop-1";
    const { result, rerender } = renderHook(() =>
      useApiQuery(`/api/v1/properties/${propId}`, [propId])
    );

    // First request in flight
    expect(result.current.isLoading).toBe(true);

    // Rapidly switch propId
    propId = "prop-2";
    rerender();

    // Now resolve second request FIRST
    await act(async () => {
      resolveSecond({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: "prop-2", name: "Second Property" }),
      });
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: "prop-2", name: "Second Property" });
    });

    // Now resolve first request LATER (should be ignored as stale)
    await act(async () => {
      resolveFirst({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ id: "prop-1", name: "First Property" }),
      });
    });

    // Data should still be the second property
    expect(result.current.data).toEqual({ id: "prop-2", name: "Second Property" });
  });

  it("aborts the active request signal on unmount", async () => {
    let capturedSignal: AbortSignal | undefined;

    global.fetch = vi.fn().mockImplementation((_url, options) => {
      capturedSignal = options?.signal;
      return new Promise(() => {}); // never resolves
    });

    const { unmount } = renderHook(() => useApiQuery("/api/v1/long-request", []));

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });

  it("re-runs the request when refetch is called", async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ count: callCount }),
      } as unknown as Response);
    });

    const { result } = renderHook(() => useApiQuery<{ count: number }>("/api/v1/counter", []));

    await waitFor(() => {
      expect(result.current.data).toEqual({ count: 1 });
    });

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toEqual({ count: 2 });
  });

  it("supports custom async fetcher functions with AbortSignal", async () => {
    const customFetcher = vi.fn().mockImplementation(async (signal: AbortSignal) => {
      if (signal.aborted) throw new DOMException("Aborted", "AbortError");
      return { custom: true };
    });

    const { result } = renderHook(() => useApiQuery(customFetcher, []));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({ custom: true });
    expect(customFetcher).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it("does not fetch when enabled option is false", async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const { result } = renderHook(() =>
      useApiQuery("/api/v1/disabled", [], { enabled: false })
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
