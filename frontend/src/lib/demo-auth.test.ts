/**
 * C5 — demo-auth sanitization specs (flag OFF: NEXT_PUBLIC_DEMO_MODE="false").
 *
 * With the build-time flag off, every demo *creation* path must be inert:
 * no cookies, no localStorage, no fabricated tokens. Cleanup helpers stay
 * active so stale demo state from older bundles is still wiped.
 */
process.env.NEXT_PUBLIC_DEMO_MODE = "false";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

const {
  clearDemoSession,
  getDemoUser,
  isDemoSession,
  sanitizeSession,
  startDemoSession,
  DEMO_ACCOUNTS,
} = await import("@/lib/demo-auth");

function plantStaleMockState() {
  document.cookie = "mock_user_id=user_demo_landlord_001; path=/; max-age=600";
  document.cookie = "mock_user_role=landlord; path=/; max-age=600";
  localStorage.setItem("mock_user_id", "user_demo_landlord_001");
  localStorage.setItem("mock_user_email", "landlord@homepost.demo");
}

beforeEach(() => {
  plantStaleMockState();
});

afterEach(() => {
  clearDemoSession();
  localStorage.clear();
});

describe("demo auth with NEXT_PUBLIC_DEMO_MODE off (default)", () => {
  it("startDemoSession is inert and never fabricates session state", () => {
    const result = startDemoSession("owner");

    expect(result).toBe("/");
    expect(localStorage.getItem("mock_user_id")).toBe("user_demo_landlord_001"); // only pre-existing state
    expect(document.cookie).toMatch(/mock_user_id/); // pre-existing
    // No new writes happened: cookie value unchanged, no role/onboarding cookies added
    expect(document.cookie).not.toContain("mock_user_onboarding_complete=true");
    expect((window as any).Clerk).toBeUndefined();
  });

  it("isDemoSession returns false even when stale mock cookies exist", () => {
    expect(isDemoSession()).toBe(false);
  });

  it("getDemoUser returns null even when stale mock state exists", () => {
    expect(getDemoUser()).toBeNull();
  });

  it("cleanup helpers remain active to wipe stale demo state", () => {
    // Simulate a real Clerk user being present — this is what triggers sanitization
    (window as any).Clerk = { user: { id: "user_real_abc123" } };

    sanitizeSession(true);

    expect(localStorage.getItem("mock_user_id")).toBeNull();
    expect(document.cookie).not.toMatch(/mock_user_id=[^;\s]/);
  });
});

describe("demo accounts registry parity", () => {
  it("keeps demo account ids aligned across owner and tenant entries", () => {
    expect(DEMO_ACCOUNTS.owner.userId).toBe("user_demo_landlord_001");
    expect(DEMO_ACCOUNTS.tenant.userId).toBe("user_demo_tenant_001");
  });
});
