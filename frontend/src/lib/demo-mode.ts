/**
 * Demo mode — single source of truth (C5).
 *
 * IS_DEMO_MODE is evaluated at BUILD time from NEXT_PUBLIC_DEMO_MODE.
 * In production builds the flag is absent, so every consumer of this
 * constant is statically unreachable / tree-shakeable.
 */

export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

export const ALLOWED_DEMO_IDS: ReadonlySet<string> = new Set([
  "user_demo_landlord_001",
  "user_demo_tenant_001",
  "user_demo_tenant_002",
]);
