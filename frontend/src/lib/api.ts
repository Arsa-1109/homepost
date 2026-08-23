/**
 * Authenticated API Fetch Utility
 *
 * Wraps the native fetch() to:
 * 1. Attach the Clerk JWT as a Bearer token
 * 2. Prefix the backend API URL
 * 3. Handle 401/403 gracefully with empathetic redirects
 *
 * Demo sessions attach a token ONLY in builds where NEXT_PUBLIC_DEMO_MODE is
 * "true"; otherwise requests proceed without an Authorization header and the
 * backend rejects unauthenticated calls cleanly (C5).
 *
 * Usage:
 *   const data = await apiFetch("/api/v1/properties", { method: "GET" });
 */

import { ALLOWED_DEMO_IDS, IS_DEMO_MODE } from "@/lib/demo-mode";
import { generateDemoJWT } from "@/lib/demo-token";
import { DEMO_ACCOUNTS } from "@/lib/demo-auth";
import { getClerkGlobal } from "@/lib/clerk-global";

export interface UserRoleResponse {
  id: string;
  clerk_id: string;
  email: string;
  full_name: string;
  role: "landlord" | "tenant" | "tenant_pending" | "unassigned" | "none" | string;
  requested_landlord_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

const MOCK_STORAGE_KEYS = [
  "mock_user_email",
  "mock_user_name",
  "mock_user_id",
  "mock_user_role",
  "mock_user_onboarding_complete",
] as const;

function clearLingeringMockStorage(): void {
  try {
    for (const key of MOCK_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    document.cookie = "mock_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
  } catch (e) {
    // ignore storage access errors
  }
}

interface ClerkGlobalWindow extends Window {
  Clerk?: {
    session?: {
      getToken: () => Promise<string | null>;
    };
  };
}

async function getClerkToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const clerkGlobal = (window as unknown as ClerkGlobalWindow).Clerk;
  if (!clerkGlobal?.session) return null;
  try {
    return await clerkGlobal.session.getToken();
  } catch (err) {
    console.error("Failed to get Clerk session token:", err);
    return null;
  }
}

/**
 * Resolve a demo bearer token — reachable only in flagged demo builds.
 * Returns null unless the stored mock identity is an allowlisted demo account.
 */
function resolveDemoToken(): string | null {
  if (!IS_DEMO_MODE || typeof window === "undefined") return null;

  const getCookie = (name: string) => {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
    return match ? decodeURIComponent(match[3]) : null;
  };

  const mockId = localStorage.getItem("mock_user_id") || getCookie("mock_user_id");
  if (!mockId || !ALLOWED_DEMO_IDS.has(mockId)) return null;

  const config =
    Object.values(DEMO_ACCOUNTS).find((account) => account.userId === mockId) ?? null;

  return generateDemoJWT(
    localStorage.getItem("mock_user_email") || getCookie("mock_user_email") || config?.email || "",
    localStorage.getItem("mock_user_name") || getCookie("mock_user_name") || config?.name || "",
    mockId,
  );
}

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
  let baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    if (typeof window !== "undefined" && window.location.hostname) {
      baseUrl = `${window.location.protocol}//${window.location.hostname}:8000`;
    } else {
      baseUrl = "http://127.0.0.1:8000";
    }
  }
  // Ensure the base URL always has a protocol scheme
  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }
  // Strip trailing slash to avoid double slashes
  baseUrl = baseUrl.replace(/\/$/, "");

  let activeToken = token;
  if (!activeToken && typeof window !== "undefined") {
    const clerkGlobal = getClerkGlobal();
    const isRealUserPresent = Boolean(clerkGlobal?.user || clerkGlobal?.session?.user);

    if (isRealUserPresent) {
      // Clear any lingering demo state from previous sessions
      clearLingeringMockStorage();

      activeToken = await getClerkToken();

      if (!activeToken) {
        // Short poll (max 500ms) to see if Clerk session token resolves
        const clerk = await new Promise<any>((resolve) => {
          if (getClerkGlobal()?.session) {
            resolve(getClerkGlobal());
            return;
          }
          const interval = setInterval(() => {
            if (getClerkGlobal()?.session) {
              clearInterval(interval);
              resolve(getClerkGlobal());
            }
          }, 30);
          setTimeout(() => {
            clearInterval(interval);
            resolve(getClerkGlobal() || null);
          }, 500);
        });

        if (clerk?.session) {
          try {
            activeToken = await clerk.session.getToken();
          } catch (err) {
            console.error("Failed to automatically get Clerk token after polling:", err);
          }
        }
      }
    } else {
      // No real Clerk user session present — demo tokens only behind the build flag.
      activeToken = resolveDemoToken();
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
      credentials: options.credentials || "include",
      ...options,
      headers,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    console.error("Network error fetching " + path + ":", err);
    throw new Error("Unable to connect to the server. Please ensure the backend is running and try again.");
  }

  // Helper: safely parse JSON, throw readable error if HTML/non-JSON returned
  const safeJson = async () => {
    if (response.status === 204) {
      return null;
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await response.text().catch(() => "(unreadable body)");
      console.error("Expected JSON but got non-JSON response:", text.slice(0, 200));
      throw new Error("The server returned an unexpected response. Please try again later.");
    }
    return response.json();
  };

  // Parse error responses
  if (!response.ok) {
    const errorData = await safeJson().catch(() => null);
    
    // Extract backend error message cleanly
    let message = "";
    if (typeof errorData?.detail === "string") {
      message = errorData.detail;
    } else if (typeof errorData?.detail?.message === "string") {
      message = errorData.detail.message;
    } else if (typeof errorData?.message === "string") {
      message = errorData.message;
    } else if (response.status === 401) {
      message = "Authentication required or session expired. Please verify your credentials.";
    } else if (response.status === 403) {
      message = "You don't have permission to perform this action.";
    } else if (response.status === 413) {
      message = "File is too large. Please upload files under 10MB.";
    } else {
      message = "Something went wrong. Please try again.";
    }
    
    throw new Error(message);
  }

  return safeJson() as Promise<T>;
}

// Alias for files expecting fetchAPI
export const fetchAPI = apiFetch;

// Alias for files expecting api.post/api.get
export const api = {
  get: <T = unknown>(path: string, token: string | null = null) => apiFetch<T>(path, { method: "GET" }, token),
  post: <T = unknown>(path: string, body?: unknown, token: string | null = null) => apiFetch<T>(path, { 
    method: "POST", 
    body: body ? JSON.stringify(body) : undefined 
  }, token),
  put: <T = unknown>(path: string, body?: unknown, token: string | null = null) => apiFetch<T>(path, { 
    method: "PUT", 
    body: body ? JSON.stringify(body) : undefined 
  }, token),
  delete: <T = unknown>(path: string, token: string | null = null) => apiFetch<T>(path, { method: "DELETE" }, token)
};

