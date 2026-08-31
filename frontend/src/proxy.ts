import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { ALLOWED_DEMO_IDS, IS_DEMO_MODE } from "@/lib/demo-mode";
import { isOwnAccountUserId } from "@/lib/mock-account";

// Public routes — no auth required at the edge
const isPublicRoute = createRouteMatcher([
  "/",
  "/dashboard(.*)",
  "/sync-role(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/join/(.*)",
  "/api/(.*)",
]);

const MOCK_COOKIE_NAMES = [
  "mock_user_email",
  "mock_user_name",
  "mock_user_id",
  "mock_user_role",
  "mock_user_onboarding_complete",
] as const;

function expireMockCookies(response: NextResponse): NextResponse {
  if (process.env.MOCK_AUTH === "true" || IS_DEMO_MODE) return response;
  for (const name of MOCK_COOKIE_NAMES) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
  return response;
}

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // ---------------------------------------------------------------------------
  // Demo mode — reachable only in builds with NEXT_PUBLIC_DEMO_MODE === "true".
  // In production builds this branch is statically dead.
  // ---------------------------------------------------------------------------
  if (!IS_DEMO_MODE && url.searchParams.has("demo")) {
    // Strip any stray ?demo= parameter so demo URLs never resolve.
    const clean = new URL(url.toString());
    clean.searchParams.delete("demo");
    return NextResponse.redirect(clean);
  }

  if (IS_DEMO_MODE) {
    const demoParam = url.searchParams.get("demo");
    const mockUserIdCookie = req.cookies.get("mock_user_id")?.value;
    const mockUserRoleCookie = req.cookies.get("mock_user_role")?.value;
    const isOwnAccount = isOwnAccountUserId(mockUserIdCookie);
    const isKnownDemoId = Boolean(mockUserIdCookie && ALLOWED_DEMO_IDS.has(mockUserIdCookie));

    const isDemo = Boolean(
      demoParam === "owner" ||
        demoParam === "landlord" ||
        demoParam === "tenant" ||
        isKnownDemoId ||
        isOwnAccount
    );

    if (isDemo) {
      let activeRole =
        mockUserRoleCookie || (pathname.startsWith("/tenant") ? "tenant" : "landlord");
      if (demoParam === "tenant") {
        activeRole = "tenant";
      } else if (demoParam === "owner" || demoParam === "landlord") {
        activeRole = "landlord";
      }

      let userId: string;
      let userEmail: string;
      let userName: string;

      if (isOwnAccount) {
        userId = mockUserIdCookie!;
        userEmail =
          req.cookies.get("mock_user_email")?.value ||
          (activeRole === "landlord" ? "landlord@custom.test" : "tenant@custom.test");
        userName =
          req.cookies.get("mock_user_name")?.value ||
          (activeRole === "landlord" ? "Custom Landlord" : "Custom Tenant");
      } else if (mockUserIdCookie === "user_demo_tenant_002") {
        userId = "user_demo_tenant_002";
        userEmail = "alex.rivera@demo.homepost.io";
        userName = "Alex Rivera";
      } else {
        const isLandlord = activeRole === "landlord";
        userId = isLandlord ? "user_demo_landlord_001" : "user_demo_tenant_001";
        userEmail = isLandlord ? "landlord@homepost.demo" : "sarah.jenkins@demo.homepost.io";
        userName = isLandlord ? "Marcus Vance (Demo Landlord)" : "Sarah Jenkins";
      }

      // Role-based route guard for mock/demo sessions
      if (pathname.startsWith("/landlord") && activeRole === "tenant") {
        return NextResponse.redirect(new URL("/tenant/dashboard", req.url));
      }
      if (pathname.startsWith("/tenant") && activeRole === "landlord") {
        return NextResponse.redirect(new URL("/landlord/dashboard", req.url));
      }

      // If navigating to generic /dashboard in demo mode, redirect to appropriate role dashboard
      if (pathname === "/dashboard") {
        const targetDashboard = activeRole === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard";
        const redirectRes = NextResponse.redirect(new URL(targetDashboard, req.url));
        redirectRes.cookies.set("mock_user_id", userId, { path: "/", maxAge: 604800, sameSite: "lax" });
        redirectRes.cookies.set("mock_user_email", userEmail, { path: "/", maxAge: 604800, sameSite: "lax" });
        redirectRes.cookies.set("mock_user_name", userName, { path: "/", maxAge: 604800, sameSite: "lax" });
        redirectRes.cookies.set("mock_user_role", activeRole, { path: "/", maxAge: 604800, sameSite: "lax" });
        redirectRes.cookies.set("mock_user_onboarding_complete", "true", { path: "/", maxAge: 604800, sameSite: "lax" });
        return redirectRes;
      }

      const response = NextResponse.next();
      // Ensure cookies are synchronized on response
      if (!mockUserIdCookie || mockUserRoleCookie !== activeRole) {
        response.cookies.set("mock_user_id", userId, { path: "/", maxAge: 604800, sameSite: "lax" });
        response.cookies.set("mock_user_email", userEmail, { path: "/", maxAge: 604800, sameSite: "lax" });
        response.cookies.set("mock_user_name", userName, { path: "/", maxAge: 604800, sameSite: "lax" });
        response.cookies.set("mock_user_role", activeRole, { path: "/", maxAge: 604800, sameSite: "lax" });
        response.cookies.set("mock_user_onboarding_complete", "true", { path: "/", maxAge: 604800, sameSite: "lax" });
      }
      return response;
    }
  }

  // Instant edge redirection for authenticated users hitting /dashboard or /sync-role
  const isDashboardRoute = pathname === "/dashboard" || pathname === "/dashboard/";
  const isPlainSyncRoleRoute =
    (pathname === "/sync-role" || pathname === "/sync-role/") &&
    !url.searchParams.has("intent") &&
    !url.searchParams.has("landlord_email") &&
    !url.searchParams.has("token");

  if (isDashboardRoute || isPlainSyncRoleRoute) {
    try {
      const authObj = await auth();
      type SessionClaimsLike = { metadata?: { onboardingComplete?: boolean; role?: string } };
      const sessionClaims = (authObj?.sessionClaims ?? null) as SessionClaimsLike | null;
      const metadata = sessionClaims?.metadata as {
        onboardingComplete?: boolean;
        role?: "landlord" | "tenant";
      } | undefined;

      const userRole = metadata?.role;
      const cookieRole = req.cookies.get("mock_user_role")?.value;
      const effectiveRole =
        userRole ||
        (process.env.MOCK_AUTH === "true" && (cookieRole === "landlord" || cookieRole === "tenant")
          ? cookieRole
          : null);

      if (effectiveRole === "landlord") {
        return NextResponse.redirect(new URL("/landlord/dashboard", req.url));
      }
      if (effectiveRole === "tenant") {
        return NextResponse.redirect(new URL("/tenant/dashboard", req.url));
      }
    } catch {
      // If auth check fails, fall through to public route handling
    }
  }

  // Allow public routes through without edge authentication locks
  if (isPublicRoute(req)) {
    return expireMockCookies(NextResponse.next());
  }

  // Protect all non-public routes (e.g. /landlord/*, /tenant/*).
  // Real Clerk session ONLY — no cookie-fabricated session claims (C5).
  const authObj = await auth();
  type SessionClaimsLike = { metadata?: { onboardingComplete?: boolean; role?: string } };
  let sessionClaims = (authObj?.sessionClaims ?? null) as SessionClaimsLike | null;

  if (!sessionClaims) {
    const { sessionClaims: protectedClaims } = await auth.protect();
    sessionClaims = protectedClaims as unknown as SessionClaimsLike;
  }

  // Role-Based Access Control via Clerk session claims
  const metadata = sessionClaims?.metadata as {
    onboardingComplete?: boolean;
    role?: "landlord" | "tenant";
  } | undefined;

  const userRole = metadata?.role;

  // Role-based route protection — only redirect when a role conflict is definitively known
  if (pathname.startsWith("/landlord") && userRole === "tenant") {
    return NextResponse.redirect(new URL("/tenant/dashboard", req.url));
  }
  if (pathname.startsWith("/tenant") && userRole === "landlord") {
    return NextResponse.redirect(new URL("/landlord/dashboard", req.url));
  }

  return expireMockCookies(NextResponse.next());
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for Clerk's auto-proxy path
    "/__clerk/(.*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

