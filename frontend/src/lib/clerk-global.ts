/**
 * Minimal structural types for the Clerk global injected on `window`.
 * Replaces `(window as any).Clerk` scatter across the codebase (M8).
 */
export interface ClerkSessionLike {
  getToken: () => Promise<string | null>;
  user?: { id: string };
}

export interface ClerkGlobal {
  session?: ClerkSessionLike;
  user?: { id: string };
}

/** Shape of the publicMetadata blob Homepost writes via sync-role. */
export interface ClerkPublicMetadata {
  role?: "landlord" | "tenant" | string;
  onboardingComplete?: boolean;
}

export function getClerkGlobal(): ClerkGlobal | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as { Clerk?: ClerkGlobal }).Clerk;
}
