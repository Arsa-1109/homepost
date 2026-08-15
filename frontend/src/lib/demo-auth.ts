/**
 * Instant Demo Authentication Utility
 *
 * Provides zero-friction test-drive access for landing page visitors:
 * - Owner Demo: landlord@homepost.demo (Marcus Vance) -> /landlord/dashboard
 * - Resident Demo: sarah.jenkins@demo.homepost.io (Sarah Jenkins) -> /tenant/dashboard
 */

function encodeBase64Url(str: string): string {
  if (typeof window === "undefined") return "";
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateDemoJWT(email: string, name: string, sub: string): string {
  const header = { alg: "none", typ: "JWT" };
  const payload = {
    sub: sub,
    email: email,
    name: name,
    iss: "https://test.clerk.dev",
    exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7, // 7 days
  };

  return `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}.`;
}

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

    // 4. Trigger global mock state if available
    if (typeof (window as any).mockLogin === "function") {
      try {
        (window as any).mockLogin(config.email, config.name, config.userId);
      } catch (err) {
        console.warn("mockLogin hook execution warning:", err);
      }
    }
  }

  return config.dashboardUrl;
}
