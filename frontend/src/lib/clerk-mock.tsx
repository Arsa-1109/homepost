"use client";

/**
 * Offline Clerk mock (MOCK_AUTH builds only).
 *
 * next.config.mjs aliases @clerk/nextjs here when MOCK_AUTH=true or the
 * publishable key is a placeholder — used by Playwright smoke runs so no
 * real Clerk session is needed. Identity lives in the same mock_user_*
 * cookies the sync-role flow and proxy.ts already manage.
 */

import React, { createContext, useContext, useMemo } from "react";

type MockRole = "landlord" | "tenant" | null;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=604800; SameSite=Lax`;
}

function clearMockCookies() {
  for (const name of ["mock_user_id", "mock_user_email", "mock_user_name", "mock_user_role", "mock_user_onboarding_complete"]) {
    document.cookie = `${name}=; path=/; max-age=0`;
  }
}

function readRole(): MockRole {
  const role = getCookie("mock_user_role");
  return role === "landlord" || role === "tenant" ? role : null;
}

const isSignedIn = () => Boolean(getCookie("mock_user_id"));

function personaFor(role: Exclude<MockRole, null>) {
  return role === "landlord"
    ? {
        id: "user_e2e_landlord",
        email: "e2e-landlord@homepost.test",
        name: "E2E Landlord",
      }
    : {
        id: "user_e2e_tenant",
        email: "e2e-tenant@homepost.test",
        name: "E2E Tenant",
      };
}

const AuthStateContext = createContext<{ signedIn: boolean }>({ signedIn: false });

export function ClerkProvider({ children }: { children: React.ReactNode }) {
  const [signedIn, setSignedIn] = React.useState(isSignedIn());

  React.useEffect(() => {
    const poll = setInterval(() => {
      setSignedIn((prev) => (prev === isSignedIn() ? prev : isSignedIn()));
    }, 200);
    return () => clearInterval(poll);
  }, []);

  const value = useMemo(() => ({ signedIn }), [signedIn]);
  return <AuthStateContext.Provider value={value}>{children}</AuthStateContext.Provider>;
}

function useAuthState() {
  const context = useContext(AuthStateContext);
  if (typeof document !== "undefined") {
    return isSignedIn();
  }
  return context.signedIn;
}

export function useAuth() {
  const signedIn = useAuthState();
  const role = readRole();
  const userId = signedIn ? getCookie("mock_user_id") : null;
  const getToken = React.useCallback(async () => (signedIn ? `e2e-mock-token-${role || "user"}` : null), [signedIn, role]);
  return useMemo(() => ({
    isLoaded: true,
    isSignedIn: signedIn,
    userId,
    getToken,
    role,
  }), [signedIn, userId, getToken, role]);
}

export function useUser() {
  const signedIn = useAuthState();
  const role = readRole();
  const persona = signedIn && role ? personaFor(role) : null;
  return useMemo(() => ({
    isLoaded: true,
    isSignedIn: signedIn,
    user: persona
      ? {
          id: persona.id,
          fullName: persona.name,
          primaryEmailAddress: { emailAddress: persona.email },
          publicMetadata: { role, onboardingComplete: true },
        }
      : null,
  }), [signedIn, role, persona]);
}

export function useSession() {
  const reload = React.useCallback(async () => {}, []);
  return useMemo(() => ({
    isLoaded: true,
    session: { reload },
  }), [reload]);
}

export function useClerk() {
  const signOut = React.useCallback(async () => {
    clearMockCookies();
    window.location.href = "/";
  }, []);
  const openSignIn = React.useCallback(() => {
    window.location.href = "/sign-in";
  }, []);
  return useMemo(() => ({
    signOut,
    openSignIn,
  }), [signOut, openSignIn]);
}

export function SignedIn({ children }: { children: React.ReactNode }) {
  return useAuthState() ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  return useAuthState() ? null : <>{children}</>;
}

export function Show({
  when,
  children,
}: {
  when: "signed-in" | "signed-out";
  children: React.ReactNode;
}) {
  const signedIn = useAuthState();
  return (when === "signed-in") === signedIn ? <>{children}</> : null;
}

function SignInButtonBase({ children }: { children?: React.ReactNode }) {
  return (
    <a
      href="/sign-in"
      data-testid="mock-signin"
      className="cursor-pointer rounded-lg bg-[rgb(var(--ml-accent))] px-4 py-2 text-sm font-medium text-[rgb(var(--ml-accent-foreground))]"
    >
      {children ?? "Sign in"}
    </a>
  );
}
export const SignInButton = SignInButtonBase;

function SignUpButtonBase({ children }: { children?: React.ReactNode }) {
  return (
    <a href="/sign-up" data-testid="mock-signup" className="cursor-pointer text-sm font-medium">
      {children ?? "Sign up"}
    </a>
  );
}
export const SignUpButton = SignUpButtonBase;

export function UserButton() {
  const role = readRole();
  return (
    <button
      type="button"
      data-testid="mock-user-button"
      title="Sign out"
      onClick={() => {
        clearMockCookies();
        window.location.href = "/";
      }}
      className="h-8 w-8 rounded-full bg-[rgb(var(--ml-accent))] text-xs font-bold uppercase text-white"
    >
      {(role ?? "?").slice(0, 2)}
    </button>
  );
}

function choosePersona(role: Exclude<MockRole, null>) {
  const persona = personaFor(role);
  setCookie("mock_user_id", persona.id);
  setCookie("mock_user_email", persona.email);
  setCookie("mock_user_name", persona.name);
  setCookie("mock_user_role", role);
  setCookie("mock_user_onboarding_complete", "true");
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect_url");
  window.location.href = redirect || (role === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard");
}

function PersonaPicker() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Sign in to HomePost</h1>
        <p className="mt-1 text-sm text-neutral-500">Offline auth mock — pick a persona.</p>
      </div>
      <div className="flex w-64 flex-col gap-3">
        <button
          type="button"
          onClick={() => choosePersona("landlord")}
          className="rounded-xl border border-neutral-300 px-4 py-3 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-900"
        >
          Continue as Landlord
        </button>
        <button
          type="button"
          onClick={() => choosePersona("tenant")}
          className="rounded-xl border border-neutral-300 px-4 py-3 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-900"
        >
          Continue as Tenant
        </button>
      </div>
    </main>
  );
}

export function SignIn() {
  return <PersonaPicker />;
}

export function SignUp() {
  return <PersonaPicker />;
}

export function UserProfile() {
  const role = readRole();
  const persona = role ? personaFor(role) : null;
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-neutral-200 p-6 dark:border-neutral-800">
      <h2 className="text-lg font-semibold">Account (offline mock)</h2>
      <p className="mt-2 text-sm text-neutral-500">{persona?.name ?? "Not signed in"}</p>
      <p className="text-sm text-neutral-500">{persona?.email ?? ""}</p>
    </div>
  );
}
