import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes — no auth required
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/join/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const url = req.nextUrl;
  const pathname = url.pathname;
  const demoParam = url.searchParams.get("demo");

  // Check for active demo session in cookies or query params
  const ALLOWED_DEMO_COOKIE_IDS = new Set([
    "user_demo_landlord_001",
    "user_demo_tenant_001",
    "user_demo_tenant_002",
  ]);
  const mockUserIdCookie = req.cookies.get("mock_user_id")?.value;
  const mockUserRoleCookie = req.cookies.get("mock_user_role")?.value;
  const isDemo = Boolean(
    demoParam === "owner" ||
    demoParam === "landlord" ||
    demoParam === "tenant" ||
    (mockUserIdCookie && ALLOWED_DEMO_COOKIE_IDS.has(mockUserIdCookie))
  );


  // Handle demo mode bypass & auto-role provisioning
  if (isDemo) {
    let activeRole = mockUserRoleCookie || (pathname.startsWith("/tenant") ? "tenant" : "landlord");
    if (demoParam === "tenant" || pathname.startsWith("/tenant")) {
      activeRole = "tenant";
    } else if (demoParam === "owner" || demoParam === "landlord" || pathname.startsWith("/landlord")) {
      activeRole = "landlord";
    }

    const isLandlord = activeRole === "landlord";
    const demoId = isLandlord ? "user_demo_landlord_001" : "user_demo_tenant_001";
    const demoEmail = isLandlord ? "landlord@homepost.demo" : "sarah.jenkins@demo.homepost.io";
    const demoName = isLandlord ? "Marcus Vance (Demo Landlord)" : "Sarah Jenkins";

    // If navigating to generic /dashboard in demo mode, redirect to appropriate role dashboard
    if (pathname === "/dashboard") {
      const targetDashboard = isLandlord ? "/landlord/dashboard" : "/tenant/dashboard";
      const redirectRes = NextResponse.redirect(new URL(targetDashboard, req.url));
      redirectRes.cookies.set("mock_user_id", demoId, { path: "/", maxAge: 604800, sameSite: "lax" });
      redirectRes.cookies.set("mock_user_email", demoEmail, { path: "/", maxAge: 604800, sameSite: "lax" });
      redirectRes.cookies.set("mock_user_name", demoName, { path: "/", maxAge: 604800, sameSite: "lax" });
      redirectRes.cookies.set("mock_user_role", activeRole, { path: "/", maxAge: 604800, sameSite: "lax" });
      redirectRes.cookies.set("mock_user_onboarding_complete", "true", { path: "/", maxAge: 604800, sameSite: "lax" });
      return redirectRes;
    }

    const response = NextResponse.next();
    // Ensure cookies are synchronized on response
    if (!mockUserIdCookie || mockUserRoleCookie !== activeRole) {
      response.cookies.set("mock_user_id", demoId, { path: "/", maxAge: 604800, sameSite: "lax" });
      response.cookies.set("mock_user_email", demoEmail, { path: "/", maxAge: 604800, sameSite: "lax" });
      response.cookies.set("mock_user_name", demoName, { path: "/", maxAge: 604800, sameSite: "lax" });
      response.cookies.set("mock_user_role", activeRole, { path: "/", maxAge: 604800, sameSite: "lax" });
      response.cookies.set("mock_user_onboarding_complete", "true", { path: "/", maxAge: 604800, sameSite: "lax" });
    }
    return response;
  }

  // Allow public routes through
  if (isPublicRoute(req)) {
    const authState = await auth();
    // Redirect signed-in users away from auth/landing pages
    if (authState.userId) {
      if (pathname.startsWith("/sign-")) {
        // Do not redirect for sso-callback pages to allow Clerk client-side handling
        if (pathname.endsWith("/sso-callback")) {
          return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      if (pathname === "/") {
        const metadata = authState.sessionClaims?.metadata as { onboardingComplete?: boolean } | undefined;
        if (metadata?.onboardingComplete) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }
    }
    return NextResponse.next();
  }

  // Protect all non-public routes for real users
  const { sessionClaims } = await auth.protect();

  // Role-Based Access Control via Clerk session claims or cookies
  const metadata = sessionClaims?.metadata as {
    onboardingComplete?: boolean;
    role?: "landlord" | "tenant";
  } | undefined;

  const cookieRole = req.cookies.get("mock_user_role")?.value;
  const userRole = metadata?.role || (cookieRole === "landlord" || cookieRole === "tenant" ? cookieRole : undefined);

  // Role-based route protection — only redirect when a role conflict is definitively known
  if (pathname.startsWith("/landlord") && userRole === "tenant") {
    return NextResponse.redirect(new URL("/tenant/dashboard", req.url));
  }
  if (pathname.startsWith("/tenant") && userRole === "landlord") {
    return NextResponse.redirect(new URL("/landlord/dashboard", req.url));
  }

  return NextResponse.next();
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
