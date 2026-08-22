/**
 * C5 — apiFetch demo-token gating specs.
 *
 * Without a real Clerk session:
 *  - flag OFF (default): fetch must go out WITHOUT an Authorization header
 *    (the backend then rejects cleanly with 401).
 *  - flag ON: only a valid allowlisted demo session may attach a token.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "@/lib/api";
import { clearDemoSession } from "@/lib/demo-auth";

const fetchMock = vi.fn(async () =>
  new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
);

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  clearDemoSession();
  localStorage.clear();
  delete (window as any).Clerk;
  vi.unstubAllGlobals();
  fetchMock.mockClear();
});

describe("apiFetch without a real Clerk session", () => {
  it("sends NO Authorization header when NEXT_PUBLIC_DEMO_MODE is off", async () => {
    plantMockSession();

    await apiFetch("/api/v1/onboarding/me");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});

function plantMockSession() {
  document.cookie = "mock_user_id=user_demo_landlord_001; path=/; max-age=600";
  document.cookie = "mock_user_email=landlord%40homepost.demo; path=/; max-age=600";
  localStorage.setItem("mock_user_id", "user_demo_landlord_001");
  localStorage.setItem("mock_user_email", "landlord@homepost.demo");
}
