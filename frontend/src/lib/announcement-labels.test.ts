import { describe, expect, it } from "vitest";
import { formatAnnouncementUnitLabel } from "./announcement-labels";

describe("formatAnnouncementUnitLabel", () => {
  it("returns the stored unit label verbatim", () => {
    expect(formatAnnouncementUnitLabel("Unit 101")).toBe("Unit 101");
  });

  it("returns the fallback for null", () => {
    expect(formatAnnouncementUnitLabel(null)).toBe("Unit Specific");
  });

  it("returns the fallback for undefined", () => {
    expect(formatAnnouncementUnitLabel(undefined)).toBe("Unit Specific");
  });

  it("returns the fallback for an empty string", () => {
    expect(formatAnnouncementUnitLabel("")).toBe("Unit Specific");
  });
});
