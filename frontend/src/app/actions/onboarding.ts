"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export async function completeOnboarding(role?: "landlord" | "tenant") {
  const { userId, getToken } = await auth.protect();
  
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

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      onboardingComplete: Boolean(verifiedRole === "landlord" || verifiedRole === "tenant"),
      ...(verifiedRole ? { role: verifiedRole } : {}),
    }
  });
}

export async function resetOnboarding() {
  const { userId } = await auth.protect();
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      onboardingComplete: false,
      role: null,
    }
  });
}
