"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export async function completeOnboarding(role?: "landlord" | "tenant") {
  const { userId } = await auth.protect();
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      onboardingComplete: true,
      ...(role ? { role } : {}),
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
