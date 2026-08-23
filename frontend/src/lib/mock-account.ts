/**
 * Self-created ("own") account sessions for local hosted mock auth.
 *
 * Distinct from the three read-only demo personas: own accounts get a
 * unique `user_own_*` id and full write access, both client- and
 * server-side (the backend demo mutation guard only matches the
 * designated demo ids).
 */

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
  } catch {}
}
