/**
 * Demo token builder — the single alg:"none" minter (C5).
 *
 * Only reachable in builds where NEXT_PUBLIC_DEMO_MODE === "true".
 * The backend independently rejects such tokens unless ENABLE_DEMO_AUTH
 * is explicitly set on a non-production deployment (C2 pairing).
 */

function encodeBase64Url(value: string): string {
  return btoa(unescape(encodeURIComponent(value)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function generateDemoJWT(email: string, name: string, sub: string, role?: string): string {
  const header = { alg: "none", typ: "JWT" };
  const payload: Record<string, any> = {
    sub,
    email,
    name,
    iss: "https://test.clerk.dev",
    exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7, // 7 days
  };
  if (role) {
    payload.role = role;
  }

  return `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}.`;
}
