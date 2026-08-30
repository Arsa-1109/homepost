/**
 * C5 — apiFetch demo-token gating specs.
 *
 * Without a real Clerk session:
 *  - flag OFF (default): fetch must go out WITHOUT an Authorization header
 *    (the backend then rejects cleanly with 401).
 *  - flag ON: only a valid allowlisted demo session may attach a token.
 */
process.env.NEXT_PUBLIC_DEMO_MODE = "false";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { apiFetch } = await import("@/lib/api");
const { clearDemoSession } = await import("@/lib/demo-auth");

const fetchMock = vi.fn(
  async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> =>
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
    const [, init] = fetchMock.mock.calls[0] as [RequestInfo | URL, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });
});

describe("apiFetch with a real Clerk session", () => {
  it("prefers the live Clerk token over any planted demo identity", async () => {
    plantMockSession();
    (window as any).Clerk = {
      user: { id: "user_real" },
      session: { getToken: async () => "clerk_jwt_123" },
    };

    await apiFetch("/api/v1/properties");

    const [, init] = fetchMock.mock.calls[0] as [RequestInfo | URL, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer clerk_jwt_123"
    );
  });

  it("clears lingering mock storage once a real user is detected", async () => {
    plantMockSession();
    (window as any).Clerk = {
      user: { id: "user_real" },
      session: { getToken: async () => "clerk_jwt_123" },
    };

    await apiFetch("/api/v1/properties");

    expect(localStorage.getItem("mock_user_id")).toBeNull();
  });
});

describe("apiFetch error-message extraction", () => {
  it("surfaces a string detail from the backend payload", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "Unit not found." }), {
        status: 404,
        headers: { "content-type": "application/json" },
      })
    );

    await expect(apiFetch("/api/v1/nope")).rejects.toThrow("Unit not found.");
  });

  it("falls back to an auth message on 401 without a detail", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 401,
        headers: { "content-type": "application/json" },
      })
    );

    await expect(apiFetch("/api/v1/secure")).rejects.toThrow(
      /Authentication required/
    );
  });

  it("reports an unexpected response for non-JSON bodies", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("<html>oops</html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      })
    );

    await expect(apiFetch("/api/v1/broken")).rejects.toThrow(
      /unexpected response/
    );
  });

  it("maps network failures to a connection message", async () => {
    fetchMock.mockRejectedValueOnce(new TypeError("fetch failed"));

    await expect(apiFetch("/api/v1/properties")).rejects.toThrow(
      /Unable to connect to the server/
    );
  });

  it("rethrows AbortError untouched so cancellation stays silent", async () => {
    const abortError = new DOMException("aborted", "AbortError");
    fetchMock.mockRejectedValueOnce(abortError);

    await expect(apiFetch("/api/v1/slow")).rejects.toBe(abortError);
  });
});

function plantMockSession() {
  document.cookie = "mock_user_id=user_demo_landlord_001; path=/; max-age=600";
  document.cookie = "mock_user_email=landlord%40homepost.demo; path=/; max-age=600";
  localStorage.setItem("mock_user_id", "user_demo_landlord_001");
  localStorage.setItem("mock_user_email", "landlord@homepost.demo");
}
