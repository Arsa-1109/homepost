import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useViewPreference } from "./useViewPreference";

const TEST_KEY = "test_view_preference";

describe("useViewPreference", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("defaults to 'grid' when localStorage is empty", () => {
    const { result } = renderHook(() => useViewPreference(TEST_KEY));
    const [view] = result.current;
    expect(view).toBe("grid");
  });

  it("hydrates with 'table' when stored in localStorage", () => {
    localStorage.setItem(TEST_KEY, "table");

    const { result } = renderHook(() => useViewPreference(TEST_KEY));
    const [view] = result.current;
    expect(view).toBe("table");
  });

  it("hydrates with 'grid' when stored in localStorage", () => {
    localStorage.setItem(TEST_KEY, "grid");

    const { result } = renderHook(() => useViewPreference(TEST_KEY));
    const [view] = result.current;
    expect(view).toBe("grid");
  });

  it("ignores unknown stored values and preserves default 'grid'", () => {
    localStorage.setItem(TEST_KEY, "invalid_view_mode");

    const { result } = renderHook(() => useViewPreference(TEST_KEY));
    const [view] = result.current;
    expect(view).toBe("grid");
  });

  it("updates view mode and persists change to localStorage", () => {
    const { result } = renderHook(() => useViewPreference(TEST_KEY));

    act(() => {
      const [, setView] = result.current;
      setView("table");
    });

    expect(result.current[0]).toBe("table");
    expect(localStorage.getItem(TEST_KEY)).toBe("table");

    act(() => {
      const [, setView] = result.current;
      setView("grid");
    });

    expect(result.current[0]).toBe("grid");
    expect(localStorage.getItem(TEST_KEY)).toBe("grid");
  });

  it("gracefully falls back to default if localStorage.getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError: localStorage is disabled");
    });

    const { result } = renderHook(() => useViewPreference(TEST_KEY));
    const [view] = result.current;
    expect(view).toBe("grid");
  });

  it("updates in-memory state gracefully if localStorage.setItem throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const { result } = renderHook(() => useViewPreference(TEST_KEY));

    act(() => {
      const [, setView] = result.current;
      setView("table");
    });

    expect(result.current[0]).toBe("table");
  });
});
