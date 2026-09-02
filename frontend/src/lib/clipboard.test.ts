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

  it("falls back to document.execCommand when navigator.clipboard is undefined", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const execCommandMock = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandMock;

    const result = await copyToClipboard("https://homepost.app/join/tok123");
    expect(result).toBe(true);
    expect(execCommandMock).toHaveBeenCalledWith("copy");
  });

  it("returns false when document.execCommand returns false", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const execCommandMock = vi.fn().mockReturnValue(false);
    document.execCommand = execCommandMock;

    const result = await copyToClipboard("https://homepost.app/join/tok123");
    expect(result).toBe(false);
    expect(execCommandMock).toHaveBeenCalledWith("copy");
  });

  it("returns false when document.execCommand throws an error", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    document.execCommand = vi.fn().mockImplementation(() => {
      throw new Error("execCommand disabled");
    });

    const result = await copyToClipboard("https://homepost.app/join/tok123");
    expect(result).toBe(false);
  });

  it("cleans up temporary textarea from DOM after fallback copy", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const removeChildSpy = vi.spyOn(document.body, "removeChild");
    document.execCommand = vi.fn().mockReturnValue(true);

    const result = await copyToClipboard("test-copy-text");
    expect(result).toBe(true);

    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();

    const createdTextarea = appendChildSpy.mock.calls[0][0] as HTMLTextAreaElement;
    expect(createdTextarea.tagName).toBe("TEXTAREA");
    expect(createdTextarea.value).toBe("test-copy-text");
    expect(createdTextarea.style.position).toBe("fixed");
    expect(createdTextarea.style.opacity).toBe("0");
    expect(document.body.contains(createdTextarea)).toBe(false);
  });

  it("handles non-browser/SSR environment where document is not present", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const originalDocument = globalThis.document;
    try {
      // @ts-expect-error simulating SSR
      delete globalThis.document;
      const result = await copyToClipboard("ssr-copy");
      expect(result).toBe(false);
    } finally {
      globalThis.document = originalDocument;
    }
  });
});
