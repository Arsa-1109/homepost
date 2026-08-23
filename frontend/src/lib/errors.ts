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
