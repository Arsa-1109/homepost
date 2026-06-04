/**
 * Authenticated API Fetch Utility
 *
 * Wraps the native fetch() to:
 * 1. Attach the Clerk JWT as a Bearer token
 * 2. Prefix the backend API URL
 * 3. Handle 401/403 gracefully with empathetic redirects
 *
 * Usage:
 *   const data = await apiFetch("/api/v1/properties", { method: "GET" });
 */

/**
 * Make an authenticated API request to the FastAPI backend.
 *
 * @param path - API path (e.g., "/api/v1/properties")
 * @param options - Standard fetch options (method, body, headers, etc.)
 * @param token - Clerk session token (pass from useAuth().getToken())
 * @returns Parsed JSON response
 * @throws Error with empathetic message on failure
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
  token: string | null = null
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  let activeToken = token;
  if (!activeToken && typeof window !== "undefined") {
    const clerk = (window as any).Clerk;
    if (clerk?.session) {
      try {
        activeToken = await clerk.session.getToken();
      } catch (err) {
        console.error("Failed to automatically get Clerk token:", err);
      }
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  // Handle auth errors gracefully
  if (response.status === 401) {
    // Token expired or invalid — redirect to sign-in
    if (typeof window !== "undefined") {
      window.location.href = "/sign-in";
    }
    throw new Error(
      "Your session has expired. Please sign in again to continue."
    );
  }

  if (response.status === 403) {
    throw new Error(
      "You don't have permission to access this resource. If you believe this is a mistake, please contact your property manager."
    );
  }

  // Parse error responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message =
      errorData?.detail?.message ||
      errorData?.detail ||
      "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// Alias for files expecting fetchAPI
export const fetchAPI = apiFetch;

// Alias for files expecting api.post/api.get
export const api = {
  get: (path: string, token: string | null = null) => apiFetch(path, { method: "GET" }, token),
  post: (path: string, body?: any, token: string | null = null) => apiFetch(path, { 
    method: "POST", 
    body: body ? JSON.stringify(body) : undefined 
  }, token)
};
