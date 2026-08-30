import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "./clipboard";

describe("copyToClipboard", () => {
  const originalClipboard = navigator.clipboard;

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it("returns false for empty input", async () => {
    const result = await copyToClipboard("");
    expect(result).toBe(false);
  });

  it("uses navigator.clipboard.writeText when available and successful", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    const result = await copyToClipboard("https://homepost.app/join/tok123");
    expect(result).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith("https://homepost.app/join/tok123");
  });

  it("falls back to document.execCommand when navigator.clipboard throws", async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error("Permission denied"));
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    const execCommandMock = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandMock;

    const result = await copyToClipboard("https://homepost.app/join/tok123");
    expect(result).toBe(true);
    expect(execCommandMock).toHaveBeenCalledWith("copy");
  });
});
