"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export async function completeOnboarding(role?: "landlord" | "tenant") {
  try {
    const { userId, getToken } = await auth();
    if (!userId) return;
    
    // Verify genuine role from backend DB before updating metadata
    const token = await getToken();
    let verifiedRole = role;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${apiUrl}/api/v1/onboarding/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const dbUser = await res.json();
        if (dbUser?.role === "landlord" || dbUser?.role === "tenant") {
          verifiedRole = dbUser.role;
        }
      }
    } catch (err) {
      console.error("Failed to verify role with backend:", err);
    }

    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          onboardingComplete: Boolean(verifiedRole === "landlord" || verifiedRole === "tenant"),
          ...(verifiedRole ? { role: verifiedRole } : {}),
        }
      });
    } catch (clerkErr) {
      console.warn("Clerk metadata update skipped (offline or missing secret key):", clerkErr);
    }
  } catch (err) {
    console.error("completeOnboarding non-fatal error:", err);
  }
}

export async function resetOnboarding() {
  try {
    const { userId } = await auth();
    if (!userId) return;
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          onboardingComplete: false,
          role: null,
        }
      });
    } catch (clerkErr) {
      console.warn("Clerk reset metadata skipped:", clerkErr);
    }
  } catch (err) {
    console.error("resetOnboarding non-fatal error:", err);
  }
}
