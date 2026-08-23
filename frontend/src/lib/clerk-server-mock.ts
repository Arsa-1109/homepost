/**
 * Offline Clerk server mock (MOCK_AUTH builds only).
 *
 * Aliased for @clerk/nextjs/server by next.config.mjs. Provides just enough
 * surface for src/proxy.ts (clerkMiddleware/createRouteMatcher) and
 * app/actions/onboarding.ts (auth/clerkClient) to run without Clerk.
 */

import { NextResponse } from "next/server";

type RequestLike = { url: string; cookies?: { get: (n: string) => { value: string } | undefined }; headers?: Headers };

function readCookie(req: RequestLike, name: string): string | null {
  try {
    const fromApi = req.cookies?.get(name)?.value;
    if (fromApi) return decodeURIComponent(fromApi);
  } catch {
    // fall through to header parsing for plain Requests
  }
  const header = req.headers?.get("cookie") ?? "";
  const match = header.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function mockSessionClaims(req: RequestLike) {
  const userId = readCookie(req, "mock_user_id");
  const role = readCookie(req, "mock_user_role");
  if (!userId || !role) return null;
  return {
    sub: userId,
    metadata: { onboardingComplete: true, role },
  };
}

export function createRouteMatcher(patterns: Array<string | RegExp>) {
  return (req: RequestLike) => {
    const pathname = new URL(req.url).pathname;
    return patterns.some((pattern) => {
      if (pattern instanceof RegExp) return pattern.test(pathname);
      if (pattern.endsWith("(.*)")) return pathname.startsWith(pattern.slice(0, -4));
      return pathname === pattern;
    });
  };
}

type MockAuthHandler = (
  auth: (() => Promise<{ sessionClaims: unknown; userId: string | null }>) & {
    protect: () => Promise<{ sessionClaims: unknown }>;
  },
  req: RequestLike
) => Promise<unknown> | unknown;

export function clerkMiddleware(handler: MockAuthHandler) {
  return async (req: RequestLike) => {
    const claims = mockSessionClaims(req);
    const auth = Object.assign(
      () =>
        Promise.resolve({
          sessionClaims: claims,
          userId: claims ? claims.sub : null,
        }),
      {
        protect: () => {
          if (!claims) {
            const signIn = new URL("/sign-in", req.url);
            return NextResponse.redirect(signIn);
          }
          return Promise.resolve({ sessionClaims: claims });
        },
      }
    );
    const result = await handler(auth as Parameters<MockAuthHandler>[0], req);
    if (result instanceof NextResponse || result instanceof Response) return result;
    return NextResponse.next();
  };
}

// Server-action context has no request in the offline mock; callers treat a
// null userId as a no-op (completeOnboarding wraps everything in try/catch).
export async function auth() {
  return { userId: null, getToken: async () => null, sessionClaims: null };
}

export async function clerkClient() {
  return {
    users: {
      updateUserMetadata: async () => ({}),
    },
  };
}
