/**
 * Self-created ("own") account sessions for local hosted mock auth.
 *
 * Distinct from the three read-only demo personas: own accounts get a
 * unique `user_own_*` id and full write access, both client- and
 * server-side (the backend demo mutation guard only matches the
 * designated demo ids).
 */

import { generateDemoJWT } from "./demo-token";

export const OWN_ACCOUNT_ID_PREFIX = "user_own_";

export type MockRole = "landlord" | "tenant";

export interface MockPersona {
  id: string;
  email: string;
  name: string;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=604800; SameSite=Lax`;
}

export function createOwnAccountId(): string {
  return `${OWN_ACCOUNT_ID_PREFIX}${crypto.randomUUID()}`;
}

export function isOwnAccountUserId(id: string | null | undefined): boolean {
  return Boolean(id?.startsWith(OWN_ACCOUNT_ID_PREFIX));
}

const MOCK_COOKIE_NAMES = [
  "mock_user_id",
  "mock_user_email",
  "mock_user_name",
  "mock_user_role",
  "mock_user_onboarding_complete",
] as const;

export function persistMockSession(persona: MockPersona, role: MockRole): void {
  const values = {
    mock_user_id: persona.id,
    mock_user_email: persona.email,
    mock_user_name: persona.name,
    mock_user_role: role,
    mock_user_onboarding_complete: "true",
  } as const;

  for (const name of MOCK_COOKIE_NAMES) {
    setCookie(name, values[name]);
  }

  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("mock_user_id", persona.id);
    localStorage.setItem("mock_user_email", persona.email);
    localStorage.setItem("mock_user_name", persona.name);
    localStorage.setItem("mock_user_role", role);
    localStorage.setItem("mock_user_onboarding_complete", "true");

    const mockToken = generateDemoJWT(persona.email, persona.name, persona.id, role);
    (window as any).Clerk = {
      loaded: true,
      session: {
        getToken: async () => mockToken,
      },
      user: {
        id: persona.id,
        fullName: persona.name,
        primaryEmailAddress: { emailAddress: persona.email },
      },
    };
  } catch {}
}

export async function provisionCustomAccount(
  persona: MockPersona,
  role: MockRole
): Promise<string> {
  // 1. Write the mock session locally
  persistMockSession(persona, role);

  // 2. Generate token for backend onboarding API call
  const token = generateDemoJWT(persona.email, persona.name, persona.id, role);

  // 3. Register role in backend Postgres DB
  let baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    if (typeof window !== "undefined" && window.location?.hostname && window.location?.protocol) {
      baseUrl = `${window.location.protocol}//${window.location.hostname}:8000`;
    } else {
      baseUrl = "http://127.0.0.1:8000";
    }
  }
  if (!baseUrl.startsWith("http")) baseUrl = `https://${baseUrl}`;
  baseUrl = baseUrl.replace(/\/$/, "");

  const endpoint =
    role === "landlord"
      ? "/api/v1/onboarding/register-landlord"
      : "/api/v1/onboarding/register-tenant";

  try {
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 2500) : null;
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: controller?.signal,
    });
    if (timeoutId) clearTimeout(timeoutId);
    if (!res.ok) {
      const errorText = await res.text();
      console.warn(`Role provisioning notice for ${role}:`, errorText);
    }
  } catch (err) {
    console.warn(`Role provisioning network notice for ${role}:`, err);
  }

  const targetDashboard =
    role === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard";
  return targetDashboard;
}
