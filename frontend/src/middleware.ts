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
  // Allow public routes through
  if (isPublicRoute(req)) {
    const authState = await auth();
    // Redirect signed-in users away from auth/landing pages
    if (authState.userId) {
      if (req.nextUrl.pathname.startsWith("/sign-")) {
        // Do not redirect for sso-callback pages to allow Clerk client-side handling
        if (req.nextUrl.pathname.endsWith("/sso-callback")) {
          return NextResponse.next();
        }
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      if (req.nextUrl.pathname === "/") {
        const metadata = authState.sessionClaims?.metadata as { onboardingComplete?: boolean } | undefined;
        if (metadata?.onboardingComplete) {
          return NextResponse.redirect(new URL("/dashboard", req.url));
        }
      }
    }
    return NextResponse.next();
  }

  // Protect all non-public routes
  const { sessionClaims } = await auth.protect();

  // ⚠️ Secure Onboarding Guard + Role-Based Access Control
  // Requires "metadata": "{{user.public_metadata}}" in the Clerk JWT template
  const metadata = sessionClaims?.metadata as {
    onboardingComplete?: boolean;
    role?: "landlord" | "tenant";
  } | undefined;

  const pathname = req.nextUrl.pathname;
  const isSyncOrDashboard = pathname === "/dashboard" || pathname === "/sync-role";

  // If onboarding is not complete, only allow /dashboard and /sync-role
  if (!metadata?.onboardingComplete && !isSyncOrDashboard) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Role-based route protection — block access to wrong-role dashboards
  const userRole = metadata?.role;
  if (pathname.startsWith("/landlord") && userRole !== "landlord") {
    // Tenant trying to access landlord area → send to their dashboard
    return NextResponse.redirect(new URL(userRole === "tenant" ? "/tenant/dashboard" : "/", req.url));
  }
  if (pathname.startsWith("/tenant") && userRole !== "tenant") {
    // Landlord trying to access tenant area → send to their dashboard
    return NextResponse.redirect(new URL(userRole === "landlord" ? "/landlord/dashboard" : "/", req.url));
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
