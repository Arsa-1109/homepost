/**
 * Issue #9 — self-created ("own") accounts in local hosted mock mode.
 *
 * The mock SignUp page must let users create their OWN account (unique
 * `user_own_*` id) instead of only offering the three read-only demo
 * personas. These specs pin the pure session helpers behind that form.
 */
import { beforeEach, describe, expect, it } from "vitest";

import {
  createOwnAccountId,
  isOwnAccountUserId,
  persistMockSession,
} from "@/lib/mock-account";
import { ALLOWED_DEMO_IDS } from "@/lib/demo-mode";

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

beforeEach(() => {
  localStorage.clear();
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (name) document.cookie = `${name}=; path=/; max-age=0`;
  }
});

describe("createOwnAccountId", () => {
  it("generates ids prefixed with user_own_", () => {
    expect(createOwnAccountId()).toMatch(/^user_own_/);
  });

  it("never reuses an id", () => {
    const seen = new Set(Array.from({ length: 50 }, () => createOwnAccountId()));
    expect(seen.size).toBe(50);
  });
});

describe("persistMockSession", () => {
  it("writes the own-account identity into cookies and localStorage", () => {
    const id = createOwnAccountId();

    persistMockSession(
      { id, email: "owner@example.test", name: "Own Account Landlord" },
      "landlord",
    );

    expect(readCookie("mock_user_id")).toBe(id);
    expect(readCookie("mock_user_email")).toBe("owner@example.test");
    expect(readCookie("mock_user_name")).toBe("Own Account Landlord");
    expect(readCookie("mock_user_role")).toBe("landlord");
    expect(localStorage.getItem("mock_user_id")).toBe(id);
  });

  it("keeps demo and own ids distinct", () => {
    const ownId = createOwnAccountId();
    expect(ALLOWED_DEMO_IDS.has(ownId)).toBe(false);
    expect(isOwnAccountUserId(ownId)).toBe(true);
    expect(isOwnAccountUserId("user_demo_landlord_001")).toBe(false);
  });
});
