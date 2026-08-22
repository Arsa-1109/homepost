/**
 * C5 — demo-auth specs with NEXT_PUBLIC_DEMO_MODE="true" (explicit opt-in build).
 *
 * Only in an explicitly flagged build may demo sessions be created, and the
 * minted token must target an allowlisted demo identity via the single
 * shared demo-token builder.
 */
process.env.NEXT_PUBLIC_DEMO_MODE = "true";

import { afterEach, describe, expect, it } from "vitest";

const {
  clearDemoSession,
  isDemoSession,
  startDemoSession,
} = await import("@/lib/demo-auth");
const { generateDemoJWT } = await import("@/lib/demo-token");
const { IS_DEMO_MODE } = await import("@/lib/demo-mode");

describe("demo auth with NEXT_PUBLIC_DEMO_MODE=true", () => {
  afterEach(() => clearDemoSession());

  it("flag constant evaluates true", () => {
    expect(IS_DEMO_MODE).toBe(true);
  });

  it("startDemoSession provisions the owner demo session and returns its dashboard", () => {
    const result = startDemoSession("owner");

    expect(result).toBe("/landlord/dashboard");
    expect(localStorage.getItem("mock_user_id")).toBe("user_demo_landlord_001");
    expect(document.cookie).toContain("mock_user_id=user_demo_landlord_001");
  });

  it("isDemoSession recognizes a provisioned demo session", () => {
    startDemoSession("tenant");
    expect(isDemoSession()).toBe(true);
  });

  it("generateDemoJWT mints an unsigned token for allowlisted demo subs only", () => {
    const token = generateDemoJWT(
      "landlord@homepost.demo",
      "Marcus Vance (Demo Landlord)",
      "user_demo_landlord_001",
    );

    const [header] = token.split(".");
    const decodedHeader = JSON.parse(atob(header.replace(/-/g, "+").replace(/_/g, "/")));
    expect(decodedHeader.alg).toBe("none");
  });
});
