import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes — no auth required
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/join/(.*)",
]);

// Onboarding route — auth required but no onboarding check
const isOnboardingRoute = createRouteMatcher(["/onboarding(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // Allow public routes through
  if (isPublicRoute(req)) {
    const authState = await auth();
    // Redirect signed-in users away from auth/landing pages
    if (authState.userId) {
      if (req.nextUrl.pathname.startsWith("/sign-")) {
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
  const { userId, sessionClaims } = await auth.protect();

  // Skip onboarding check for the onboarding page itself
  if (isOnboardingRoute(req)) {
    return NextResponse.next();
  }

  // ⚠️ Secure Onboarding Guard: Check session claims mapping to publicMetadata
  // Requires "metadata": "{{user.public_metadata}}" in the Clerk JWT template
  const metadata = sessionClaims?.metadata as { onboardingComplete?: boolean } | undefined;
  if (!metadata?.onboardingComplete) {
    const onboardingUrl = new URL("/onboarding", req.url);
    return NextResponse.redirect(onboardingUrl);
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
