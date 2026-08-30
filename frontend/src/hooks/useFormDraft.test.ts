import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFormDraft } from "./useFormDraft";

const DRAFT_KEY = "test_form_draft";

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("useFormDraft", () => {
  it("initializes with default values when no draft exists", () => {
    const { result } = renderHook(() =>
      useFormDraft(DRAFT_KEY, { title: "", body: "" })
    );

    expect(result.current.values).toEqual({ title: "", body: "" });
    expect(result.current.isDraftRestored).toBe(false);
  });

  it("restores existing draft from localStorage on mount", () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ title: "Restored Title", body: "Draft Body" })
    );

    const { result } = renderHook(() =>
      useFormDraft(DRAFT_KEY, { title: "", body: "" })
    );

    expect(result.current.values).toEqual({
      title: "Restored Title",
      body: "Draft Body",
    });
    expect(result.current.isDraftRestored).toBe(true);
  });

  it("auto-saves changes to localStorage after debounce delay", () => {
    const { result } = renderHook(() =>
      useFormDraft(DRAFT_KEY, { title: "", body: "" }, 200)
    );

    act(() => {
      result.current.updateField("title", "New Title");
    });

    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}")).toEqual({
      title: "New Title",
      body: "",
    });
  });

  it("discards draft and resets state to initial values", () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ title: "Draft to discard", body: "" })
    );

    const { result } = renderHook(() =>
      useFormDraft(DRAFT_KEY, { title: "", body: "" })
    );

    expect(result.current.isDraftRestored).toBe(true);

    act(() => {
      result.current.discardDraft();
    });

    expect(result.current.values).toEqual({ title: "", body: "" });
    expect(result.current.isDraftRestored).toBe(false);
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
  });

  it("clears draft from localStorage on clearDraft()", () => {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ title: "Submitted draft", body: "" })
    );

    const { result } = renderHook(() =>
      useFormDraft(DRAFT_KEY, { title: "", body: "" })
    );

    act(() => {
      result.current.clearDraft();
    });

    expect(localStorage.getItem(DRAFT_KEY)).toBeNull();
    expect(result.current.isDraftRestored).toBe(false);
  });
});
