import { describe, expect, it } from "vitest";
import { shouldShowEmpty } from "./empty-state";

describe("shouldShowEmpty", () => {
  it("shows empty state when not loading, no items, no error", () => {
    expect(shouldShowEmpty(false, [], false)).toBe(true);
  });

  it("hides empty state while loading even if items array is empty", () => {
    expect(shouldShowEmpty(true, [], false)).toBe(false);
  });

  it("hides empty state when there is an error", () => {
    expect(shouldShowEmpty(false, [], true)).toBe(false);
  });

  it("hides empty state when items are present", () => {
    expect(shouldShowEmpty(false, [{ id: 1 }], false)).toBe(false);
  });

  it("treats null items as empty", () => {
    expect(shouldShowEmpty(false, null, false)).toBe(true);
  });
});
