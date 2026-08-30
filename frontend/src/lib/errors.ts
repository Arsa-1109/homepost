/**
 * Narrow an unknown thrown value into a displayable message.
 * Backend errors arrive as Error instances from apiFetch; anything else
 * degrades to an empty string so callers apply their own fallback copy.
 */
export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "";
}

/** Extract an HTTP status code from a thrown value when one is present. */
export function errorStatus(err: unknown): number | null {
  if (typeof err === "object" && err !== null) {
    const candidate = err as { response?: { status?: unknown }; status?: unknown };
    const direct = candidate.status;
    const nested = candidate.response?.status;
    for (const value of [direct, nested]) {
      if (typeof value === "number") return value;
    }
  }
  return null;
}

/** Translate technical invite error slugs into user-friendly, empathetic copy. */
export function formatInviteError(codeOrMessage: string): string {
  const msg = codeOrMessage.toLowerCase();
  if (msg.includes("unit_already_occupied")) {
    return "This unit is already occupied by another resident. Please contact your property owner if you believe this is an error.";
  }
  if (msg.includes("invite_not_found")) {
    return "This invite link is invalid or doesn't exist.";
  }
  if (msg.includes("invite_expired")) {
    return "This invite link has expired. Please ask your landlord for a new one.";
  }
  if (msg.includes("invite_already_used")) {
    return "This invite link has already been used.";
  }
  if (msg.includes("invite_inactive")) {
    return "This invite link is no longer active.";
  }
  if (msg.includes("rate_limit_exceeded") || msg.includes("too_many_requests")) {
    return "Too many requests. Please wait a moment and try again.";
  }
  if (msg.includes("unauthorized") || msg.includes("forbidden")) {
    return "You do not have permission to join this unit.";
  }
  return codeOrMessage || "Failed to process invitation. Please try again.";
}
