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

import {
  createOwnAccountId,
  isOwnAccountUserId,
  MockRole,
  MockPersona,
  persistMockSession,
} from "./mock-account";
import { generateDemoJWT } from "./demo-token";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : null;
}

function clearMockCookies() {
  for (const name of ["mock_user_id", "mock_user_email", "mock_user_name", "mock_user_role", "mock_user_onboarding_complete"]) {
    document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
  }
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("mock_user_id");
      localStorage.removeItem("mock_user_email");
      localStorage.removeItem("mock_user_name");
      localStorage.removeItem("mock_user_role");
      localStorage.removeItem("mock_user_onboarding_complete");
    } catch {}
  }
}

function readRole(): MockRole | null {
  const role = getCookie("mock_user_role");
  return role === "landlord" || role === "tenant" ? role : null;
}

const isSignedIn = () => Boolean(getCookie("mock_user_id"));

function personaFor(role: Exclude<MockRole, null>) {
  const cookieId = getCookie("mock_user_id");
  const cookieEmail = getCookie("mock_user_email");
  const cookieName = getCookie("mock_user_name");

  if (cookieId && cookieEmail) {
    return {
      id: cookieId,
      email: cookieEmail,
      name: cookieName || (role === "landlord" ? "Marcus Vance (Demo Landlord)" : "Sarah Jenkins"),
    };
  }

  return role === "landlord"
    ? {
        id: "user_demo_landlord_001",
        email: "landlord@homepost.demo",
        name: "Marcus Vance (Demo Landlord)",
      }
    : {
        id: "user_demo_tenant_001",
        email: "sarah.jenkins@demo.homepost.io",
        name: "Sarah Jenkins",
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
  const getToken = React.useCallback(async () => {
    if (!signedIn) return null;
    const email = getCookie("mock_user_email") || (role === "tenant" ? "sarah.jenkins@demo.homepost.io" : "landlord@homepost.demo");
    const name = getCookie("mock_user_name") || (role === "tenant" ? "Sarah Jenkins" : "Marcus Vance");
    const sub = getCookie("mock_user_id") || (role === "tenant" ? "user_demo_tenant_001" : "user_demo_landlord_001");
    return generateDemoJWT(email, name, sub);
  }, [signedIn, role]);
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
  const [menuOpen, setMenuOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();
  const role = readRole();
  const persona = role ? personaFor(role) : null;
  const initials = (role ?? "?").slice(0, 2).toUpperCase();

  function signOutAndRedirect() {
    clearMockCookies();
    window.location.href = "/";
  }

  React.useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        containerRef.current?.querySelector<HTMLButtonElement>("button[data-testid='mock-user-button']")?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const menuItemClass =
    "block w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[rgb(var(--ml-accent))]";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        data-testid="mock-user-button"
        title="Account menu"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-controls={menuOpen ? menuId : undefined}
        onClick={() => setMenuOpen((open) => !open)}
        className="h-8 w-8 cursor-pointer rounded-full bg-[rgb(var(--ml-accent))] text-xs font-bold uppercase text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[rgb(var(--ml-accent))]"
      >
        {initials}
      </button>

      {menuOpen && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-[rgb(var(--ml-bg-secondary))] shadow-lg"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-semibold text-[rgb(var(--ml-text-primary))]">
              {persona?.name ?? "Not signed in"}
            </p>
            {persona && (
              <p className="truncate text-xs text-[rgb(var(--ml-text-secondary))]">{persona.email}</p>
            )}
          </div>
          <nav className="p-1" aria-label="Account">
            <a
              href="/user"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className={`${menuItemClass} text-[rgb(var(--ml-text-primary))] hover:bg-[rgb(var(--ml-accent))]/10 hover:text-[rgb(var(--ml-accent))]`}
            >
              Account
            </a>
            <button
              type="button"
              role="menuitem"
              onClick={signOutAndRedirect}
              className={`${menuItemClass} text-red-600 hover:bg-red-500/10 dark:text-red-400`}
            >
              Sign out
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

const DEMO_PERSONAS: Array<MockPersona & { role: MockRole; label: string; badgeClass: string; detail: string; ariaLabel: string }> = [
  {
    id: "user_demo_landlord_001",
    email: "landlord@homepost.demo",
    name: "Marcus Vance (Demo Landlord)",
    role: "landlord",
    label: "Marcus Vance (Owner)",
    badgeClass: "bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))]",
    detail: "Portfolio: Sunset Vista & Maplewood Heights",
    ariaLabel: "Continue as landlord demo",
  },
  {
    id: "user_demo_tenant_001",
    email: "sarah.jenkins@demo.homepost.io",
    name: "Sarah Jenkins",
    role: "tenant",
    label: "Sarah Jenkins (Resident)",
    badgeClass: "bg-blue-500/10 text-blue-500",
    detail: "Unit 101 · Maplewood Heights",
    ariaLabel: "Continue as tenant demo (Sarah Jenkins)",
  },
  {
    id: "user_demo_tenant_002",
    email: "alex.rivera@demo.homepost.io",
    name: "Alex Rivera",
    role: "tenant",
    label: "Alex Rivera (Resident)",
    badgeClass: "bg-blue-500/10 text-blue-500",
    detail: "Unit 2A · Sunset Vista",
    ariaLabel: "Continue as tenant demo (Alex Rivera)",
  },
];

function choosePersona(
  role: MockRole,
  customPersona?: MockPersona
) {
  const persona = customPersona ?? DEMO_PERSONAS.find((p) => p.id === defaultDemoId(role))!;
  persistMockSession(persona, role);

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect_url") || params.get("fallbackRedirectUrl");
  window.location.href = redirect || (role === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard");
}

function defaultDemoId(role: MockRole): string {
  return role === "landlord" ? "user_demo_landlord_001" : "user_demo_tenant_001";
}

function DemoAccountList() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      {DEMO_PERSONAS.map((persona) => (
        <button
          key={persona.id}
          type="button"
          aria-label={persona.ariaLabel}
          onClick={() => choosePersona(persona.role, persona)}
          className="flex flex-col items-start p-4 rounded-2xl border border-border bg-[rgb(var(--ml-bg-secondary))] hover:border-[rgb(var(--ml-accent))] transition-all text-left group"
        >
          <div className="flex items-center justify-between w-full">
            <span className="font-semibold text-[rgb(var(--ml-text-primary))] group-hover:text-[rgb(var(--ml-accent))] transition-colors">
              {persona.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${persona.badgeClass}`}>
              {persona.role === "landlord" ? "Landlord" : "Tenant"}
            </span>
          </div>
          <span className="text-xs text-[rgb(var(--ml-text-secondary))] mt-1">{persona.email}</span>
          <span className="text-xs text-[rgb(var(--ml-text-tertiary))] mt-1">{persona.detail}</span>
        </button>
      ))}
    </div>
  );
}

function PersonaPicker() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--ml-text-primary))]">Sign in to HomePost</h1>
        <p className="mt-2 text-sm text-[rgb(var(--ml-text-secondary))]">
          Development & Test Auth Mock. Select an account persona to test drive the live database:
        </p>
      </div>
      <DemoAccountList />
    </main>
  );
}

export function SignIn() {
  return <PersonaPicker />;
}

function OwnAccountForm() {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<MockRole>("tenant");

  const canSubmit = fullName.trim().length > 0 && /.+@.+\..+/.test(email);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    choosePersona(role, {
      id: createOwnAccountId(),
      email: email.trim(),
      name: fullName.trim(),
    });
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-[rgb(var(--ml-bg-secondary))] px-3 py-2 text-sm text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-tertiary))] focus:border-[rgb(var(--ml-accent))] focus:outline-none";

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3" data-testid="own-account-form">
      <input
        type="text"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Full name"
        aria-label="Full name"
        data-testid="own-account-name"
        className={inputClass}
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        aria-label="Email address"
        data-testid="own-account-email"
        className={inputClass}
      />
      <div className="grid grid-cols-2 gap-2">
        {(["landlord", "tenant"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRole(option)}
            data-testid={`own-account-role-${option}`}
            aria-pressed={role === option}
            className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-all ${
              role === option
                ? "border-[rgb(var(--ml-accent))] bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))]"
                : "border-border bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-secondary))]"
            }`}
          >
            I&apos;m a {option}
          </button>
        ))}
      </div>
      <button
        type="submit"
        disabled={!canSubmit}
        data-testid="own-account-submit"
        className="rounded-xl bg-[rgb(var(--ml-accent))] px-4 py-2.5 text-sm font-semibold text-[rgb(var(--ml-accent-foreground))] transition-opacity disabled:opacity-40"
      >
        Create my account
      </button>
      <p className="text-center text-xs text-[rgb(var(--ml-text-tertiary))]">
        Your own test account with full read &amp; write access — separate from the shared demo data.
      </p>
    </form>
  );
}

export function SignUp() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center max-w-sm">
        <h1 className="text-2xl font-bold tracking-tight text-[rgb(var(--ml-text-primary))]">Create your account</h1>
        <p className="mt-2 text-sm text-[rgb(var(--ml-text-secondary))]">
          Development &amp; Test Auth Mock (local hosted mode).
        </p>
      </div>

      <section className="flex w-full max-w-sm flex-col gap-3" aria-labelledby="own-account-heading">
        <h2 id="own-account-heading" className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--ml-text-primary))]">
          Create Your Own Account
        </h2>
        <OwnAccountForm />
      </section>

      <div className="w-full max-w-sm border-t border-border" role="separator" />

      <section className="flex w-full max-w-sm flex-col gap-3" aria-labelledby="demo-accounts-heading">
        <div className="flex items-center justify-between">
          <h2 id="demo-accounts-heading" className="text-sm font-semibold uppercase tracking-wide text-[rgb(var(--ml-text-primary))]">
            Demo Accounts
          </h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-500/10 text-[rgb(var(--ml-text-secondary))] font-medium">
            Read-only demo
          </span>
        </div>
        <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
          Shared personas for exploring pre-seeded data. Mutations are blocked.
        </p>
        <DemoAccountList />
      </section>
    </main>
  );
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
