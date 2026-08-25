/**
 * Regression specs — exiting demo mode must NOT flash an
 * "access denied / you don't have access" error state.
 *
 * Root cause being guarded against:
 *   clearDemoSession() stripped localStorage + cookies while the protected
 *   layout was still mounted, so the next render observed "signed out",
 *   pages re-fetched without a token, got 401/403 from the backend, and the
 *   error banner flashed before window.location.href = "/" completed.
 *
 * exitDemoSession() fixes this by initiating the redirect FIRST and deferring
 * the credential wipe until after the browser has committed to navigating.
 */
process.env.NEXT_PUBLIC_DEMO_MODE = "true";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { startDemoSession, exitDemoSession } = await import("@/lib/demo-auth");

const assignSpy = vi.fn();

beforeEach(() => {
  // Stub location.assign so we never actually navigate in jsdom.
  vi.stubGlobal("location", {
    ...window.location,
    assign: assignSpy,
    href: "",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  document.cookie = "mock_user_id=; path=/; max-age=0";
  assignSpy.mockClear();
});

describe("exitDemoSession", () => {
  it("navigates BEFORE wiping demo credentials (no unauthorized render window)", async () => {
    startDemoSession("owner");
    expect(localStorage.getItem("mock_user_id")).toBe("user_demo_landlord_001");

    await exitDemoSession();

    // Redirect was initiated first...
    expect(assignSpy).toHaveBeenCalledWith("/");
    // ...and only afterwards are credentials wiped.
    expect(localStorage.getItem("mock_user_id")).toBeNull();
    expect(document.cookie).not.toContain("mock_user_id=");
  });

  it("still wipes all mock keys after redirect initiation", async () => postWipeAssertions());

  it("is idempotent when called with no active demo session", async () => {
    await expect(exitDemoSession()).resolves.toBeUndefined();
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it("does not throw if storage access fails mid-exit", async () => {
    startDemoSession("owner");
    const removeSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new DOMException("storage blocked", "SecurityError");
    });

    await expect(exitDemoSession()).resolves.toBeUndefined();
    expect(assignSpy).toHaveBeenCalledWith("/");
    removeSpy.mockRestore();
  });
});

async function postWipeAssertions(): Promise<void> {
  startDemoSession("tenant");
  await exitDemoSession();

  const keys = [
    "mock_user_email",
    "mock_user_name",
    "mock_user_id",
    "mock_user_role",
    "mock_user_onboarding_complete",
  ];
  for (const key of keys) {
    expect(localStorage.getItem(key), key).toBeNull();
  }
}
