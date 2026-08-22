/**
 * Instant Demo Authentication Utility
 *
 * Provides zero-friction test-drive access for landing page visitors —
 * ONLY in builds where NEXT_PUBLIC_DEMO_MODE === "true" (C5).
 *
 * - Owner Demo: landlord@homepost.demo (Marcus Vance) -> /landlord/dashboard
 * - Resident Demo: sarah.jenkins@demo.homepost.io (Sarah Jenkins) -> /tenant/dashboard
 *
 * Creation paths (startDemoSession / isDemoSession / getDemoUser) are inert
 * when the build flag is off. Cleanup helpers (clearDemoSession /
 * sanitizeSession) stay active unconditionally so stale demo state from
 * older cached bundles is still wiped when a real user signs in.
 */

import { ALLOWED_DEMO_IDS, IS_DEMO_MODE } from "@/lib/demo-mode";
import { generateDemoJWT } from "@/lib/demo-token";

export interface DemoSessionConfig {
  email: string;
  name: string;
  userId: string;
  role: "landlord" | "tenant";
  dashboardUrl: string;
}

export const DEMO_ACCOUNTS: Record<"owner" | "tenant", DemoSessionConfig> = {
  owner: {
    email: "landlord@homepost.demo",
    name: "Marcus Vance (Demo Landlord)",
    userId: "user_demo_landlord_001",
    role: "landlord",
    dashboardUrl: "/landlord/dashboard",
  },
  tenant: {
    email: "sarah.jenkins@demo.homepost.io",
    name: "Sarah Jenkins",
    userId: "user_demo_tenant_001",
    role: "tenant",
    dashboardUrl: "/tenant/dashboard",
  },
};

export function startDemoSession(role: "owner" | "tenant"): string {
  if (!IS_DEMO_MODE) return "/";
  const config = DEMO_ACCOUNTS[role];
  if (!config) return "/";

  if (typeof window !== "undefined") {
    // 1. Store in localStorage
    localStorage.setItem("mock_user_email", config.email);
    localStorage.setItem("mock_user_name", config.name);
    localStorage.setItem("mock_user_id", config.userId);

    // 2. Set Cookies for SSR and middleware
    document.cookie = `mock_user_email=${encodeURIComponent(config.email)}; path=/; max-age=604800`;
    document.cookie = `mock_user_name=${encodeURIComponent(config.name)}; path=/; max-age=604800`;
    document.cookie = `mock_user_id=${encodeURIComponent(config.userId)}; path=/; max-age=604800`;
    document.cookie = `mock_user_role=${config.role}; path=/; max-age=604800`;
    document.cookie = `mock_user_onboarding_complete=true; path=/; max-age=604800`;

    // 3. Attach session token generator to window.Clerk
    const mockToken = generateDemoJWT(config.email, config.name, config.userId);
    (window as any).Clerk = {
      loaded: true,
      session: {
        getToken: async () => mockToken,
      },
    };
  }

  return config.dashboardUrl;
}

export function isDemoSession(): boolean {
  if (!IS_DEMO_MODE || typeof window === "undefined") return false;
  const clerk = (window as any).Clerk;
  // If a live Clerk user is present (not mock or demo)
  if (clerk?.user?.id && !clerk.user.id.startsWith("mock_") && !ALLOWED_DEMO_IDS.has(clerk.user.id)) {
    return false;
  }

  const mockId = localStorage.getItem("mock_user_id");
  const hasMockCookie = document.cookie.match(/(^|;\s*)mock_user_id=([^;]*)/)?.[2];
  const effectiveId = mockId || hasMockCookie;
  return Boolean(effectiveId && ALLOWED_DEMO_IDS.has(effectiveId));
}

export function sanitizeSession(isSignedIn?: boolean): void {
  if (typeof window === "undefined") return;
  const clerk = (window as any).Clerk;
  // Only sanitize demo session if a live Clerk user is authenticated
  if (clerk?.user?.id && !clerk.user.id.startsWith("mock_") && !ALLOWED_DEMO_IDS.has(clerk.user.id)) {
    clearDemoSession();
  }
}

export function getDemoUser(): {
  email: string;
  name: string;
  userId: string;
  role: "landlord" | "tenant";
} | null {
  if (!IS_DEMO_MODE || typeof window === "undefined") return null;
  if (!isDemoSession()) return null;

  const email = localStorage.getItem("mock_user_email") || "";
  const name = localStorage.getItem("mock_user_name") || "Demo User";
  const userId = localStorage.getItem("mock_user_id") || "";
  const isTenant = email.includes("tenant") || email.includes("sarah");

  if (!userId && !email) return null;
  return {
    email: email || (isTenant ? DEMO_ACCOUNTS.tenant.email : DEMO_ACCOUNTS.owner.email),
    name: name || (isTenant ? DEMO_ACCOUNTS.tenant.name : DEMO_ACCOUNTS.owner.name),
    userId: userId || (isTenant ? DEMO_ACCOUNTS.tenant.userId : DEMO_ACCOUNTS.owner.userId),
    role: isTenant ? "tenant" : "landlord",
  };
}

export function clearDemoSession(): void {
  if (typeof window === "undefined") return;
  const mockId = localStorage.getItem("mock_user_id") || document.cookie.match(/(^|;\s*)mock_user_id=([^;]*)/)?.[2];

  // Only wipe if it is actually one of the designated demo accounts!
  const isDemo = Boolean(mockId && ALLOWED_DEMO_IDS.has(mockId));
  if (!isDemo && mockId) {
    // This is a legitimate custom mock user (e.g. mock_...), do NOT destroy their session!
    return;
  }

  try {
    localStorage.removeItem("mock_user_email");
    localStorage.removeItem("mock_user_name");
    localStorage.removeItem("mock_user_id");
    localStorage.removeItem("mock_user_role");
    localStorage.removeItem("mock_user_onboarding_complete");
  } catch (e) {
    // ignore storage access errors
  }

  const deleteCookie = (name: string) => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
  };

  deleteCookie("mock_user_email");
  deleteCookie("mock_user_name");
  deleteCookie("mock_user_id");
  deleteCookie("mock_user_role");
  deleteCookie("mock_user_onboarding_complete");
}
