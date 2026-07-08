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
  let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  // Ensure the base URL always has a protocol scheme
  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }
  // Strip trailing slash to avoid double slashes
  baseUrl = baseUrl.replace(/\/$/, "");

  let activeToken = token;
  if (!activeToken && typeof window !== "undefined") {
    // Wait for Clerk to load/initialize (max 5 seconds)
    const clerk = await new Promise<any>((resolve) => {
      if ((window as any).Clerk?.loaded) {
        resolve((window as any).Clerk);
        return;
      }
      const interval = setInterval(() => {
        if ((window as any).Clerk?.loaded) {
          clearInterval(interval);
          resolve((window as any).Clerk);
        }
      }, 50);
      setTimeout(() => {
        clearInterval(interval);
        resolve((window as any).Clerk || null);
      }, 5000);
    });

    if (clerk?.session) {
      try {
        activeToken = await clerk.session.getToken();
      } catch (err) {
        console.error("Failed to automatically get Clerk token:", err);
      }
    }
  }

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // Only default to JSON if we aren't sending FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }

  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    console.error("Network or CORS error:", err);
    throw new Error("Unable to connect to the server. Please ensure the backend is running and try again.");
  }

  // Helper: safely parse JSON, throw readable error if HTML/non-JSON returned
  const safeJson = async () => {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await response.text().catch(() => "(unreadable body)");
      console.error("Expected JSON but got non-JSON response:", text.slice(0, 200));
      throw new Error("The server returned an unexpected response. Please try again later.");
    }
    return response.json();
  };

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
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
    throw new Error(
      "You don't have permission to access this resource. Redirecting..."
    );
  }

  // Parse error responses
  if (!response.ok) {
    const errorData = await safeJson().catch(() => null);
    const message =
      errorData?.detail?.message ||
      errorData?.detail ||
      "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return safeJson() as Promise<T>;
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
