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
  provisionCustomAccount,
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

function subscribeAuth(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getClientSignedIn() {
  return isSignedIn();
}

function useAuthState() {
  const context = useContext(AuthStateContext);
  return React.useSyncExternalStore(
    subscribeAuth,
    getClientSignedIn,
    () => context.signedIn
  );
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
  const [mounted, setMounted] = React.useState(false);
  const signedIn = useAuthState();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return signedIn ? <>{children}</> : null;
}

export function SignedOut({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  const signedIn = useAuthState();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return signedIn ? null : <>{children}</>;
}

export function Show({
  when,
  children,
}: {
  when: "signed-in" | "signed-out";
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = React.useState(false);
  const signedIn = useAuthState();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
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
  const [mounted, setMounted] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  React.useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return <div className="h-8 w-8 rounded-full bg-[rgb(var(--ml-accent))]/20" />;
  }

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

import { Building2, Key, Users, UserPlus, ChevronRight, Sparkles } from "lucide-react";

function getInitials(name: string): string {
  const clean = name.replace(/\(.*?\)/g, "").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "HP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const DEMO_PERSONAS: Array<MockPersona & { role: MockRole; label: string; badgeClass: string; detail: string; ariaLabel: string }> = [
  {
    id: "user_demo_landlord_001",
    email: "landlord@homepost.demo",
    name: "Marcus Vance (Demo Landlord)",
    role: "landlord",
    label: "Marcus Vance (Owner)",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    detail: "Portfolio: Sunset Vista & Maplewood Heights",
    ariaLabel: "Continue as landlord demo",
  },
  {
    id: "user_demo_tenant_001",
    email: "sarah.jenkins@demo.homepost.io",
    name: "Sarah Jenkins",
    role: "tenant",
    label: "Sarah Jenkins (Resident)",
    badgeClass: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    detail: "Unit 101 · Maplewood Heights",
    ariaLabel: "Continue as tenant demo (Sarah Jenkins)",
  },
  {
    id: "user_demo_tenant_002",
    email: "alex.rivera@demo.homepost.io",
    name: "Alex Rivera",
    role: "tenant",
    label: "Alex Rivera (Resident)",
    badgeClass: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    detail: "Unit 2A · Sunset Vista",
    ariaLabel: "Continue as tenant demo (Alex Rivera)",
  },
];

export function getSafeRedirectUrl(target: string | null | undefined, fallbackUrl: string): string {
  if (!target || typeof target !== "string") {
    return fallbackUrl;
  }

  const trimmed = target.trim();
  if (!trimmed) {
    return fallbackUrl;
  }

  // Reject control characters or whitespace within the path
  if (/[\x00-\x1F\x7F\s]/.test(trimmed)) {
    return fallbackUrl;
  }

  // Reject protocol-relative, backslash bypasses, or leading backslashes
  if (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.startsWith("\\") ||
    trimmed.includes("/\\") ||
    trimmed.includes("\\")
  ) {
    return fallbackUrl;
  }

  // Check if it is a safe relative URL starting with a single '/'
  if (trimmed.startsWith("/")) {
    try {
      const origin =
        typeof window !== "undefined" && window.location?.origin
          ? window.location.origin
          : "http://localhost";
      const parsed = new URL(trimmed, origin);
      if (
        parsed.origin === origin &&
        (parsed.protocol === "http:" || parsed.protocol === "https:")
      ) {
        return parsed.pathname + parsed.search + parsed.hash;
      }
    } catch {
      return fallbackUrl;
    }
    return fallbackUrl;
  }

  // If it's an absolute URL, verify same origin
  try {
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost";
    const parsed = new URL(trimmed);
    if (
      parsed.origin === origin &&
      (parsed.protocol === "http:" || parsed.protocol === "https:")
    ) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
  } catch {
    return fallbackUrl;
  }

  return fallbackUrl;
}

async function choosePersona(
  role: MockRole,
  customPersona?: MockPersona
) {
  const params = new URLSearchParams(window.location.search);
  const rawRedirect = params.get("redirect_url") || params.get("fallbackRedirectUrl");
  const fallback = role === "landlord" ? "/landlord/dashboard" : "/tenant/dashboard";
  const redirect = getSafeRedirectUrl(rawRedirect, fallback);

  if (customPersona) {
    const targetUrl = await provisionCustomAccount(customPersona, role);
    window.location.href = rawRedirect ? redirect : targetUrl;
    return;
  }

  const persona = DEMO_PERSONAS.find((p) => p.id === defaultDemoId(role))!;
  persistMockSession(persona, role);
  window.location.href = redirect;
}

function defaultDemoId(role: MockRole): string {
  return role === "landlord" ? "user_demo_landlord_001" : "user_demo_tenant_001";
}

function DemoAccountList() {
  return (
    <div className="flex w-full flex-col gap-2">
      {DEMO_PERSONAS.map((persona) => (
        <button
          key={persona.id}
          type="button"
          aria-label={persona.ariaLabel}
          onClick={() => void choosePersona(persona.role, persona)}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-border/70 bg-[rgb(var(--ml-bg-primary))]/50 hover:bg-[rgb(var(--ml-bg-primary))] hover:border-[rgb(var(--ml-accent))]/50 transition-all text-left group cursor-pointer shadow-xs active:scale-[0.99] relative overflow-hidden"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-full bg-[rgb(var(--ml-bg-secondary))] border border-border/80 flex items-center justify-center text-xs font-bold text-[rgb(var(--ml-text-primary))] group-hover:border-[rgb(var(--ml-accent))]/50 group-hover:text-[rgb(var(--ml-accent))] group-hover:bg-[rgb(var(--ml-accent))]/10 transition-colors shadow-xs">
              {getInitials(persona.name)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-[rgb(var(--ml-text-primary))] group-hover:text-[rgb(var(--ml-accent))] transition-colors truncate">
                  {persona.label}
                </span>
              </div>
              <p className="text-[11px] text-[rgb(var(--ml-text-secondary))] truncate">{persona.email}</p>
              <p className="text-[10px] text-[rgb(var(--ml-text-tertiary))] truncate mt-0.5">{persona.detail}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${persona.badgeClass}`}>
              {persona.role === "landlord" ? "Owner" : "Tenant"}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[rgb(var(--ml-text-tertiary))] group-hover:text-[rgb(var(--ml-accent))] group-hover:translate-x-0.5 transition-all" />
          </div>
        </button>
      ))}
    </div>
  );
}

function OwnAccountForm() {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<MockRole>("landlord");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const canSubmit = fullName.trim().length > 0 && /.+@.+\..+/.test(email) && !isSubmitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      await choosePersona(role, {
        id: createOwnAccountId(),
        email: email.trim(),
        name: fullName.trim(),
      });
    } catch (e) {
      console.error("Failed to provision account:", e);
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-border/80 bg-[rgb(var(--ml-bg-primary))] px-3.5 py-2.5 text-xs text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-tertiary))] focus:border-[rgb(var(--ml-accent))] focus:bg-[rgb(var(--ml-bg-primary))] focus:outline-none focus:ring-1 focus:ring-[rgb(var(--ml-accent))]/30 transition-all font-sans";

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3" data-testid="own-account-form">
      <div className="space-y-1">
        <label className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
          Full Name
        </label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="e.g. Jordan Smith"
          aria-label="Full name"
          data-testid="own-account-name"
          className={inputClass}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
          Email Address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. jordan@test.local"
          aria-label="Email address"
          data-testid="own-account-email"
          className={inputClass}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))]">
          Account Role (Clean Slate)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(["landlord", "tenant"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRole(option)}
              data-testid={`own-account-role-${option}`}
              aria-pressed={role === option}
              disabled={isSubmitting}
              className={`rounded-xl border p-2.5 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                role === option
                  ? option === "landlord"
                    ? "border-[rgb(var(--ml-accent))] bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-text-primary))] shadow-xs"
                    : "border-blue-500 bg-blue-500/10 text-[rgb(var(--ml-text-primary))] shadow-xs"
                  : "border-border/60 bg-[rgb(var(--ml-bg-primary))]/60 text-[rgb(var(--ml-text-secondary))] hover:border-border"
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {option === "landlord" ? (
                  <Building2 className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                ) : (
                  <Key className="w-3.5 h-3.5 text-blue-400" />
                )}
                <span>{option === "landlord" ? "Landlord" : "Tenant"}</span>
              </div>
              <span className="text-[10px] text-[rgb(var(--ml-text-tertiary))] leading-tight">
                {option === "landlord" ? "0 properties" : "Active tenant profile"}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        data-testid="own-account-submit"
        className={`w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-2 font-sans mt-1 ${
          canSubmit
            ? "bg-[rgb(var(--ml-accent))] hover:bg-[rgb(var(--ml-accent-light))] text-black hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.3)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
            : "bg-neutral-800 text-neutral-400 border border-neutral-700/50 cursor-not-allowed opacity-80"
        }`}
      >
        {isSubmitting ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Provisioning Account...</span>
          </>
        ) : (
          <span>Create &amp; Enter Dashboard</span>
        )}
      </button>

      <p className="text-center text-[11px] text-[rgb(var(--ml-text-tertiary))] leading-tight mt-0.5">
        Auto-registers in backend database with clean slate &amp; full write access.
      </p>
    </form>
  );
}

interface MockAuthHubProps {
  initialTab?: "personas" | "custom";
  title?: string;
  subtitle?: string;
  fallbackRedirectUrl?: string;
  appearance?: unknown;
  routing?: string;
  path?: string;
}

export function MockAuthHub({
  initialTab = "personas",
  title = "Sign in to HomePost",
  subtitle = "Select an account persona or create a custom test account:",
}: MockAuthHubProps) {
  const [activeTab, setActiveTab] = React.useState<"personas" | "custom">(initialTab);
  const [quickLoading, setQuickLoading] = React.useState<string | null>(null);

  const handleQuickLaunch = async (role: MockRole) => {
    setQuickLoading(role);
    const id = createOwnAccountId();
    const suffix = Math.floor(100 + Math.random() * 900);
    try {
      await choosePersona(role, {
        id,
        name: role === "landlord" ? `Test Landlord ${suffix}` : `Test Tenant ${suffix}`,
        email: `${role}.${suffix}@local.test`,
      });
    } catch (e) {
      console.error("Quick launch failed:", e);
      setQuickLoading(null);
    }
  };

  return (
    <div className="w-full max-w-[440px] rounded-3xl border border-border/80 bg-[rgb(var(--ml-bg-secondary))]/90 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] p-6 sm:p-7 relative overflow-hidden text-[rgb(var(--ml-text-primary))] font-sans transition-all">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-1.5 mb-5 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-xl bg-[rgb(var(--ml-accent))] text-black flex items-center justify-center font-black text-xs shadow-sm shadow-[rgb(var(--ml-accent))]/30">
            HP
          </div>
          <span className="font-extrabold text-sm tracking-tight text-[rgb(var(--ml-text-primary))]">
            HomePost
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Localhost Dev Auth</span>
        </div>

        <h1 className="text-xl font-bold tracking-tight text-[rgb(var(--ml-text-primary))] pt-0.5">
          {title}
        </h1>
        <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed max-w-[320px]">
          {subtitle}
        </p>
      </div>

      {/* Segmented Tab Switcher */}
      <div className="grid grid-cols-2 p-1 rounded-xl bg-[rgb(var(--ml-bg-primary))]/80 border border-border/70 mb-5 relative z-10" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "personas"}
          data-testid="mock-tab-personas"
          onClick={() => setActiveTab("personas")}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "personas"
              ? "bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] shadow-sm border border-border/80"
              : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))]"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Preset Personas</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "custom"}
          data-testid="mock-tab-custom"
          onClick={() => setActiveTab("custom")}
          className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === "custom"
              ? "bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))] shadow-sm border border-border/80"
              : "text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))]"
          }`}
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Custom Account</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="relative z-10">
        {activeTab === "personas" ? (
          <div className="space-y-3" role="tabpanel" aria-label="Demo Personas">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                Demo Accounts
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-500/10 text-[rgb(var(--ml-text-secondary))] font-medium">
                Read-only demo
              </span>
            </div>
            <DemoAccountList />
          </div>
        ) : (
          <div className="space-y-3.5" role="tabpanel" aria-label="Custom Account Maker">
            {/* Quick 1-Click Launchers */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                  1-Click Clean Slate Launchers
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                  Write-enabled
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={quickLoading !== null}
                  onClick={() => void handleQuickLaunch("landlord")}
                  className="flex flex-col items-start p-3 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-primary))]/60 hover:bg-[rgb(var(--ml-bg-primary))] hover:border-[rgb(var(--ml-accent))]/50 transition-all text-left group cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-[rgb(var(--ml-text-primary))] group-hover:text-[rgb(var(--ml-accent))]">
                    {quickLoading === "landlord" ? (
                      <span className="w-3.5 h-3.5 border-2 border-[rgb(var(--ml-accent))] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Building2 className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                    )}
                    <span>Quick Landlord</span>
                  </div>
                  <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] leading-tight">
                    Clean slate · 0 properties
                  </span>
                </button>

                <button
                  type="button"
                  disabled={quickLoading !== null}
                  onClick={() => void handleQuickLaunch("tenant")}
                  className="flex flex-col items-start p-3 rounded-xl border border-border/60 bg-[rgb(var(--ml-bg-primary))]/60 hover:bg-[rgb(var(--ml-bg-primary))] hover:border-blue-500/50 transition-all text-left group cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50"
                >
                  <div className="flex items-center gap-1.5 mb-1 text-xs font-bold text-[rgb(var(--ml-text-primary))] group-hover:text-blue-400">
                    {quickLoading === "tenant" ? (
                      <span className="w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Key className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    <span>Quick Tenant</span>
                  </div>
                  <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] leading-tight">
                    Clean slate · Unlinked unit
                  </span>
                </button>
              </div>
            </div>

            <div className="relative flex items-center justify-center py-0.5">
              <div className="border-t border-border/60 w-full" />
              <span className="bg-[rgb(var(--ml-bg-secondary))] px-2.5 text-[10px] uppercase font-bold text-[rgb(var(--ml-text-tertiary))] absolute">
                or configure custom
              </span>
            </div>

            {/* Custom Account Form */}
            <OwnAccountForm />
          </div>
        )}
      </div>
    </div>
  );
}

export function SignIn(props: MockAuthHubProps) {
  return <MockAuthHub {...props} initialTab="personas" title="Sign in to HomePost" />;
}

export function SignUp(props: MockAuthHubProps) {
  return <MockAuthHub {...props} initialTab="custom" title="Create your account" />;
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
