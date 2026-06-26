import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const auth = async () => {
  const cookieStore = await cookies();
  const mockUserEmail = cookieStore.get("mock_user_email")?.value || null;
  const mockUserId = cookieStore.get("mock_user_id")?.value || null;
  const mockUserName = cookieStore.get("mock_user_name")?.value || null;
  const mockOnboardingComplete = cookieStore.get("mock_user_onboarding_complete")?.value === "true";

  return {
    userId: mockUserId,
    sessionClaims: mockUserId ? {
      sub: mockUserId,
      email: mockUserEmail,
      name: mockUserName,
      metadata: {
        onboardingComplete: mockOnboardingComplete,
      }
    } : null,
    getToken: async () => {
      return auth.getToken();
    },
    protect: async () => {
      return auth.protect();
    }
  };
};

auth.protect = async () => {
  const cookieStore = await cookies();
  const mockUserId = cookieStore.get("mock_user_id")?.value || null;
  const mockUserEmail = cookieStore.get("mock_user_email")?.value || null;
  const mockUserName = cookieStore.get("mock_user_name")?.value || null;
  const mockOnboardingComplete = cookieStore.get("mock_user_onboarding_complete")?.value === "true";

  if (!mockUserId) {
    throw new Error("Auth required (mocked)");
  }
  return {
    userId: mockUserId,
    sessionClaims: {
      sub: mockUserId,
      email: mockUserEmail,
      name: mockUserName,
      metadata: {
        onboardingComplete: mockOnboardingComplete,
      }
    }
  };
};

auth.getToken = async () => {
  const cookieStore = await cookies();
  const mockUserId = cookieStore.get("mock_user_id")?.value || null;
  const mockUserEmail = cookieStore.get("mock_user_email")?.value || null;
  const mockUserName = cookieStore.get("mock_user_name")?.value || null;
  if (!mockUserEmail) return null;
  const encodeBase64Url = (str: string) => {
    return Buffer.from(str)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  };
  const header = { alg: "none", typ: "JWT" };
  const payload = {
    sub: mockUserId,
    email: mockUserEmail,
    name: mockUserName,
    iss: "https://test.clerk.dev",
    exp: Math.floor(Date.now() / 1000) + 3600 * 24,
  };
  return `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}.`;
};

export const clerkClient = async () => {
  return {
    users: {
      getUser: async () => null,
      updateUserMetadata: async (userId: string, metadata: any) => {
        const cookieStore = await cookies();
        const complete = metadata?.publicMetadata?.onboardingComplete;
        if (complete) {
          cookieStore.set("mock_user_onboarding_complete", "true");
        } else {
          cookieStore.set("mock_user_onboarding_complete", "false");
        }
        return {};
      }
    }
  };
};

export function clerkMiddleware(handler: any) {
  return async (req: any, event: any) => {
    const mockUserEmail = req.cookies?.get("mock_user_email")?.value || null;
    const mockUserId = req.cookies?.get("mock_user_id")?.value || null;
    const mockUserName = req.cookies?.get("mock_user_name")?.value || null;
    const mockOnboardingComplete = req.cookies?.get("mock_user_onboarding_complete")?.value === "true";

    const mockAuthResult = {
      userId: mockUserId,
      sessionClaims: mockUserId ? {
        sub: mockUserId,
        email: mockUserEmail,
        name: mockUserName,
        metadata: {
          onboardingComplete: mockOnboardingComplete,
        }
      } : null,
      getToken: async () => {
        if (!mockUserEmail) return null;
        const encodeBase64Url = (str: string) => {
          return Buffer.from(str)
            .toString("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");
        };
        const header = { alg: "none", typ: "JWT" };
        const payload = {
          sub: mockUserId,
          email: mockUserEmail,
          name: mockUserName,
          iss: "https://test.clerk.dev",
          exp: Math.floor(Date.now() / 1000) + 3600 * 24,
        };
        return `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}.`;
      },
      protect: () => {
        if (!mockUserId) {
          throw new Error("Auth required (mocked)");
        }
        return {
          userId: mockUserId,
          sessionClaims: {
            sub: mockUserId,
            email: mockUserEmail,
            name: mockUserName,
            metadata: {
              onboardingComplete: mockOnboardingComplete,
            }
          }
        };
      }
    };

    const mockAuthObj = async () => mockAuthResult;
    Object.assign(mockAuthObj, mockAuthResult);

    return handler(mockAuthObj, req, event);
  };
}

export function createRouteMatcher(routes: string[]) {
  return (req: any) => {
    const pathname = req.nextUrl.pathname;
    return routes.some(route => {
      const regexStr = route.replace(/\(\.\*\)/g, ".*").replace(/\/\*/g, "/.*");
      const regex = new RegExp(`^${regexStr}$`);
      return regex.test(pathname);
    });
  };
}
