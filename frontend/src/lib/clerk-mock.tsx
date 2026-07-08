"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface MockUser {
  id: string;
  primaryEmailAddress: { emailAddress: string } | null;
  fullName: string | null;
}

interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  user: MockUser | null;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  isLoaded: false,
  isSignedIn: false,
  userId: null,
  user: null,
  getToken: async () => null,
});


let setMockStateGlobal: any = null;

function encodeBase64Url(str: string): string {
  if (typeof window === "undefined") return "";
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function generateMockJWT(email: string, name: string, sub: string): string {
  const header = { alg: "none", typ: "JWT" };
  const payload = {
    sub: sub,
    email: email,
    name: name,
    iss: "https://test.clerk.dev",
    exp: Math.floor(Date.now() / 1000) + 3600 * 24, // 24 hours
  };
  
  return `${encodeBase64Url(JSON.stringify(header))}.${encodeBase64Url(JSON.stringify(payload))}.`;
}

export function mockLogin(email: string, name: string) {
  const userId = "mock_" + email.replace(/[^a-zA-Z0-9]/g, "");
  localStorage.setItem("mock_user_email", email);
  localStorage.setItem("mock_user_name", name);
  localStorage.setItem("mock_user_id", userId);
  
  if (typeof window !== "undefined") {
    document.cookie = `mock_user_email=${encodeURIComponent(email)}; path=/`;
    document.cookie = `mock_user_name=${encodeURIComponent(name)}; path=/`;
    document.cookie = `mock_user_id=${encodeURIComponent(userId)}; path=/`;
    (window as any).Clerk = {
      loaded: true,
      session: {
        getToken: async () => {
          const e = localStorage.getItem("mock_user_email");
          const n = localStorage.getItem("mock_user_name");
          const u = localStorage.getItem("mock_user_id");
          if (!e) return null;
          return generateMockJWT(e, n || "Mock User", u || "mock_user");
        }
      }
    };
  }

  if (setMockStateGlobal) {
    setMockStateGlobal({
      isLoaded: true,
      isSignedIn: true,
      userId: userId,
      user: {
        id: userId,
        primaryEmailAddress: { emailAddress: email },
        fullName: name,
      },
    });
  }
}

export function mockLogout() {
  localStorage.removeItem("mock_user_email");
  localStorage.removeItem("mock_user_name");
  localStorage.removeItem("mock_user_id");
  localStorage.removeItem("onboarding_intent");
  localStorage.removeItem("landlord_email");
  
  if (typeof window !== "undefined") {
    document.cookie = "mock_user_email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "mock_user_name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "mock_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "mock_user_onboarding_complete=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    (window as any).Clerk = {
      loaded: true,
      session: null
    };
  }

  if (setMockStateGlobal) {
    setMockStateGlobal({
      isLoaded: true,
      isSignedIn: false,
      userId: null,
      user: null,
    });
  }
}

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({
    isLoaded: false,
    isSignedIn: false,
    userId: null,
    user: null,
  });

  useEffect(() => {
    setMockStateGlobal = setState;
    const email = localStorage.getItem("mock_user_email");
    const name = localStorage.getItem("mock_user_name");
    const userId = localStorage.getItem("mock_user_id");
    
    if (typeof window !== "undefined") {
      (window as any).mockLogin = mockLogin;
      (window as any).mockLogout = mockLogout;
    }

    // Define window.Clerk for api.ts to use
    (window as any).Clerk = {
      loaded: true,
      session: email ? {
        getToken: async () => {
          const e = localStorage.getItem("mock_user_email");
          const n = localStorage.getItem("mock_user_name");
          const u = localStorage.getItem("mock_user_id");
          if (!e) return null;
          return generateMockJWT(e, n || "Mock User", u || "mock_user");
        }
      } : null
    };

    if (email) {
      setState({
        isLoaded: true,
        isSignedIn: true,
        userId: userId as any,
        user: {
          id: userId,
          primaryEmailAddress: { emailAddress: email },
          fullName: name,
        } as any,
      });
    } else {
      setState({
        isLoaded: true,
        isSignedIn: false,
        userId: null,
        user: null,
      });
    }
    return () => {
      setMockStateGlobal = null;
      if (typeof window !== "undefined") {
        delete (window as any).Clerk;
        delete (window as any).mockLogin;
        delete (window as any).mockLogout;
      }
    };
  }, []);

  const getToken = async () => {
    const email = localStorage.getItem("mock_user_email");
    const name = localStorage.getItem("mock_user_name");
    const userId = localStorage.getItem("mock_user_id");
    if (!email) return null;
    return generateMockJWT(email, name || "Mock User", userId || "mock_user");
  };

  return (
    <AuthContext.Provider value={{ ...state, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return {
    isLoaded: context.isLoaded,
    isSignedIn: context.isSignedIn,
    userId: context.userId,
    getToken: context.getToken,
  };
}

export function useUser() {
  const context = useContext(AuthContext);
  return {
    isLoaded: context.isLoaded,
    isSignedIn: context.isSignedIn,
    user: context.user,
  };
}

export function useSession() {
  const context = useContext(AuthContext);
  // Mock session — reload() is a no-op since mock JWTs are always current
  const session = context.isSignedIn
    ? {
        reload: async () => {},
        getToken: context.getToken,
      }
    : null;
  return {
    isLoaded: context.isLoaded,
    isSignedIn: context.isSignedIn,
    session,
  };
}

export function UserButton() {
  const { isSignedIn, user } = useUser();
  const [open, setOpen] = useState(false);

  if (!isSignedIn || !user) return null;

  const initials = (user.fullName || user.primaryEmailAddress?.emailAddress || "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm select-none hover:opacity-90 focus:outline-none"
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-xl py-2 z-50">
          <div className="px-4 py-2 border-b border-border">
            <p className="text-sm font-semibold truncate text-foreground">{user.fullName || "Mock User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.primaryEmailAddress?.emailAddress}</p>
          </div>
          <button
            onClick={() => {
              mockLogout();
              setOpen(false);
              window.location.href = "/";
            }}
            className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export function UserProfile() {
  const { user } = useUser();
  if (!user) return null;
  return (
    <div className="p-6 bg-card border border-border rounded-xl">
      <h3 className="text-xl font-bold mb-4">Mock User Profile</h3>
      <p><strong>Name:</strong> {user.fullName}</p>
      <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
    </div>
  );
}

export function SignInButton({ children }: { children: React.ReactNode }) {
  return (
    <button onClick={() => window.location.href = "/sign-in"} className="contents">
      {children}
    </button>
  );
}

export function SignUpButton({ children }: { children: React.ReactNode }) {
  return (
    <button onClick={() => window.location.href = "/sign-up"} className="contents">
      {children}
    </button>
  );
}

export function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    mockLogin(email, name || email.split("@")[0]);
    
    const intent = localStorage.getItem("onboarding_intent");
    if (intent) {
      router.push("/");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="w-full max-w-md bg-card border border-border/40 rounded-xl p-8 shadow-2xl relative z-10 backdrop-blur-md">
      <h2 className="text-3xl font-extrabold text-center mb-2 tracking-tight text-foreground">Sign In</h2>
      <p className="text-center text-sm text-muted-foreground mb-8">Mock Authentication (Local Dev Mode)</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-accent/50 outline-none text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Full Name (Optional)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-accent/50 outline-none text-foreground"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.8)] text-white font-bold hover:opacity-90 transition-opacity"
        >
          Mock Log In
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <button onClick={() => router.push("/sign-up")} className="text-accent hover:underline font-semibold">
          Sign Up
        </button>
      </p>
    </div>
  );
}

export function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    mockLogin(email, name || email.split("@")[0]);
    
    const intent = localStorage.getItem("onboarding_intent");
    if (intent) {
      router.push("/");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="w-full max-w-md bg-card border border-border/40 rounded-xl p-8 shadow-2xl relative z-10 backdrop-blur-md">
      <h2 className="text-3xl font-extrabold text-center mb-2 tracking-tight text-foreground">Create Account</h2>
      <p className="text-center text-sm text-muted-foreground mb-8">Mock Authentication (Local Dev Mode)</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            required
            className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-accent/50 outline-none text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-foreground">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-accent/50 outline-none text-foreground"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.8)] text-white font-bold hover:opacity-90 transition-opacity"
        >
          Mock Register & Log In
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button onClick={() => router.push("/sign-in")} className="text-accent hover:underline font-semibold">
          Sign In
        </button>
      </p>
    </div>
  );
}

export function Show({ children, when }: { children: React.ReactNode, when: "signed-in" | "signed-out" }) {
  const { isSignedIn } = useAuth();
  
  if (when === "signed-in" && isSignedIn) {
    return <>{children}</>;
  }
  if (when === "signed-out" && !isSignedIn) {
    return <>{children}</>;
  }
  return null;
}
