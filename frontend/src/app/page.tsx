"use client";

import { ClerkPublicMetadata } from "@/lib/clerk-global";

import { errorMessage } from "@/lib/errors";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@/components/providers";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/Hero";
import {
  Building2,
  Key,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import { startDemoSession } from "@/lib/demo-auth";
import { IS_DEMO_MODE } from "@/lib/demo-mode";
import { api, UserRoleResponse } from "@/lib/api";
import { LandingBackground } from "@/components/landing/LandingBackground";

const FeatureSection = dynamic(
  () => import("@/components/landing/FeatureSection").then((m) => m.FeatureSection),
  {
    loading: () => <div className="w-full h-80 rounded-3xl bg-muted/10 animate-pulse my-12" />,
  }
);

const DemoDashboard = dynamic(
  () => import("@/components/DemoDashboard").then((m) => m.DemoDashboard),
  {
    ssr: false,
    loading: () => <div className="w-full h-96 rounded-2xl bg-muted/20 animate-pulse" />,
  }
);

function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <button
      type="button"
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Toggle theme"
    >
      {currentTheme === "dark" ? (
        <Sun className="w-5 h-5 text-accent" />
      ) : (
        <Moon className="w-5 h-5 text-accent" />
      )}
    </button>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();

  const [mounted, setMounted] = useState(false);
  const [roleSelection, setRoleSelection] = useState<"none" | "landlord" | "tenant">("none");
  const [activeFeatureRole, setActiveFeatureRole] = useState<"owner" | "tenant">("owner");
  const [tenantEmail, setTenantEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [launchingDemo, setLaunchingDemo] = useState<"owner" | "tenant" | null>(null);
  const [error, setError] = useState("");
  const [hasRole, setHasRole] = useState<boolean>(false);

  const handleLaunchDemo = (role: "owner" | "tenant", targetRoute?: string) => {
    setLaunchingDemo(role);
    const defaultUrl = startDemoSession(role);
    window.location.href = targetRoute || defaultUrl;
  };

  useEffect(() => {
    setMounted(true);
    // Pre-warm backend during idle time (eliminates cold start without blocking mobile rendering)
    const warmBackend = () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      if (apiUrl && !apiUrl.includes("localhost") && !apiUrl.includes("127.0.0.1")) {
        fetch(`${apiUrl.replace(/\/$/, "")}/health`, { mode: "no-cors" }).catch(() => {});
      }
    };
    if (typeof window !== "undefined") {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(warmBackend);
      } else {
        setTimeout(warmBackend, 2000);
      }
    }
    let isMounted = true;

    const metadataRole = (user?.publicMetadata as ClerkPublicMetadata | undefined)?.role;
    const metadataComplete = (user?.publicMetadata as ClerkPublicMetadata | undefined)?.onboardingComplete;
    const cookieRole =
      typeof document !== "undefined"
        ? document.cookie.match(/(^|;\s*)mock_user_role=([^;]*)/)?.[2]
        : null;
    const cookieComplete =
      typeof document !== "undefined" &&
      document.cookie.includes("mock_user_onboarding_complete=true");

    if (
      metadataRole === "landlord" ||
      metadataRole === "tenant" ||
      metadataComplete ||
      cookieRole === "landlord" ||
      cookieRole === "tenant" ||
      cookieComplete
    ) {
      setHasRole(true);
    }

    if (isLoaded && isSignedIn && user) {
      const checkRole = async () => {
        try {
          const token = await getToken();
          const me = await api.get<UserRoleResponse>("/api/v1/onboarding/me", token);
          if (isMounted && me && me.role && me.role !== "none" && me.role !== "unassigned") {
            setHasRole(true);
            if (IS_DEMO_MODE && typeof window !== "undefined") {
              document.cookie = `mock_user_role=${me.role}; path=/; max-age=604800; SameSite=Lax`;
              document.cookie = "mock_user_onboarding_complete=true; path=/; max-age=604800; SameSite=Lax";
            }
          }
        } catch (err) {
          // ignore background check failure
        }
      };
      checkRole();
    }
    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, user, getToken]);

  const handleLandlordSelect = async () => {
    if (!isLoaded) return;
    setIsSubmitting(true);
    setError("");

    if (isSignedIn) {
      try {
        const token = await getToken();
        await api.post("/api/v1/onboarding/register-landlord", undefined, token);
        if (typeof window !== "undefined") {
          document.cookie = "mock_user_onboarding_complete=true; path=/";
        }
        router.push("/sync-role");
      } catch (err) {
        setError(errorMessage(err) || "Failed to register as landlord.");
        setIsSubmitting(false);
      }
    } else {
      router.push("/sign-up?intent=landlord");
    }
  };

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantEmail || !isLoaded) return;
    setIsSubmitting(true);
    setError("");

    if (isSignedIn) {
      try {
        const token = await getToken();
        await api.post("/api/v1/onboarding/request-access", { landlord_email: tenantEmail }, token);
        if (typeof window !== "undefined") {
          document.cookie = "mock_user_onboarding_complete=true; path=/";
        }
        router.push("/sync-role");
      } catch (err) {
        setError(errorMessage(err) || "Failed to request access. Check the email.");
        setIsSubmitting(false);
      }
    } else {
      router.push(`/sign-up?intent=tenant&landlord_email=${encodeURIComponent(tenantEmail)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-accent/20 selection:text-foreground relative font-sans transition-colors duration-300">
      <LandingBackground />

      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-3xl border-b border-border shadow-[0_0_20px_rgb(var(--ml-accent)/0.02)]">
        <div className="flex justify-between items-center px-6 md:px-16 py-4 max-w-[1440px] mx-auto h-20">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold tracking-tighter">Homepost</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {!mounted || !isLoaded ? (
              <div className="w-16 h-8 rounded-lg bg-muted/20 animate-pulse" />
            ) : !isSignedIn ? (
              <Button
                asChild
                variant="link"
                data-testid="mock-signin"
                className="text-sm font-medium text-accent"
              >
                <Link href="/sign-in">Log in</Link>
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                {hasRole ? (
                  <Button
                    asChild
                    variant="link"
                    className="text-sm font-medium text-accent"
                  >
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                ) : (
                  <a
                    href="#role-selection"
                    className="text-sm font-medium text-accent hover:underline px-3 py-1.5"
                  >
                    Select Role
                  </a>
                )}
                <UserButton />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative pt-20 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6 md:px-16 min-h-screen z-10 block">
        <Hero />

        {/* Role Selection Area */}
        <section
          id="role-selection"
          className="max-w-5xl w-full mx-auto relative min-h-[340px] mb-16 sm:mb-24 z-20 flex justify-center mt-8 sm:mt-16 md:mt-24"
        >
          <AnimatePresence mode="wait">
            {hasRole ? (
              <motion.div
                key="welcome-back-card"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="p-8 sm:p-10 rounded-2xl bg-card border border-border shadow-xl flex flex-col items-center space-y-6 self-center z-30 w-full max-w-lg text-center"
              >
                <h2 className="text-2xl sm:text-3xl font-bold">Welcome back!</h2>
                <Button
                  asChild
                  className="px-8 sm:px-10 py-4 sm:py-5 rounded-lg bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.8)] text-white font-bold text-base sm:text-lg hover:opacity-90 transition-opacity flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-accent hover:text-white hover:shadow-none hover:translate-y-0"
                >
                  <Link href="/dashboard" className="flex items-center gap-3">
                    Go to Dashboard <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Link>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="role-selection-wrapper"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="w-full relative flex flex-col items-center gap-8 max-w-4xl mx-auto px-4"
              >
                {error && (
                  <div className="w-full max-w-lg bg-destructive text-destructive-foreground p-4 rounded-xl text-center font-medium z-50">
                    {error}
                  </div>
                )}

                <AnimatePresence mode="wait">
                  {roleSelection === "none" && (
                    <motion.div
                      key="cards-grid"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="w-full flex flex-col md:flex-row items-stretch justify-center gap-6 max-w-4xl mx-auto"
                    >
                      {/* Owner Card */}
                      <motion.article
                        initial={{ rotateZ: -1, y: 0, scale: 1 }}
                        animate={{ rotateZ: -1, y: 0, scale: 1 }}
                        whileHover={{ scale: 1.02, y: -6, zIndex: 30 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="w-full md:flex-1 bg-card border border-border rounded-2xl p-6 sm:p-7 flex flex-col items-start justify-between shadow-lg hover:shadow-xl hover:border-accent/40 min-h-[290px] z-20 focus-within:ring-2 focus-within:ring-accent transition-colors group"
                      >
                        <div>
                          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 border border-accent/20">
                            <Building2 className="text-accent w-6 h-6" />
                          </div>
                          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2 text-foreground">
                            I am a Property Owner
                          </h2>
                          <p className="text-sm text-muted-foreground mb-6 leading-relaxed font-normal">
                            Manage your properties, review tenant requests, and oversee maintenance with absolute clarity.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2.5 w-full mt-auto">
                          <Button
                            type="button"
                            onClick={handleLandlordSelect}
                            isLoading={isSubmitting && roleSelection === "none"}
                            className="w-full py-3 h-auto rounded-xl bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.85)] text-white font-semibold text-sm sm:text-base hover:opacity-90 transition-opacity hover:text-white hover:shadow-none hover:translate-y-0"
                          >
                            Enter Owner Portal
                          </Button>
                        </div>
                      </motion.article>

                      {/* Tenant Card */}
                      <motion.article
                        initial={{ rotateZ: 1, y: 0, scale: 1 }}
                        animate={{ rotateZ: 1, y: 0, scale: 1 }}
                        whileHover={{ scale: 1.02, y: -6, zIndex: 30 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="w-full md:flex-1 bg-card border border-border rounded-2xl p-6 sm:p-7 flex flex-col items-start justify-between shadow-lg hover:shadow-xl hover:border-border/80 min-h-[290px] z-20 focus-within:ring-2 focus-within:ring-accent transition-colors group"
                      >
                        <div>
                          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 border border-border">
                            <Key className="text-muted-foreground w-6 h-6" />
                          </div>
                          <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2 text-foreground">
                            I am a Tenant
                          </h2>
                          <p className="text-sm text-muted-foreground mb-6 leading-relaxed font-normal">
                            Submit requests, view announcements, and access important documents securely.
                          </p>
                        </div>
                        <div className="flex flex-col gap-2.5 w-full mt-auto">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRoleSelection("tenant")}
                            className="w-full py-3 h-auto rounded-xl border border-border bg-background/80 hover:bg-muted text-foreground font-semibold text-sm sm:text-base shadow-sm transition-all"
                          >
                            Access Tenant Portal
                          </Button>
                        </div>
                      </motion.article>
                    </motion.div>
                  )}

                  {roleSelection === "tenant" && (
                    <motion.form
                      key="tenant-form"
                      initial={{ opacity: 0, y: 12, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -12, scale: 0.99 }}
                      onSubmit={handleTenantSubmit}
                      className="w-full max-w-xl bg-card border border-border shadow-xl rounded-2xl p-6 sm:p-8 flex flex-col items-start justify-center z-40"
                    >
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 border border-border mx-auto">
                        <Key className="text-muted-foreground w-6 h-6" />
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-2 w-full text-center">
                        Tenant Access
                      </h2>
                      <p className="text-center w-full text-sm text-muted-foreground mb-6">
                        Enter your landlord&apos;s email address to connect with their portal.
                      </p>

                      <div className="w-full mb-6">
                        <label
                          htmlFor="landlord-email"
                          className="block text-sm font-medium mb-2 text-foreground"
                        >
                          Landlord&apos;s Email Address
                        </label>
                        <input
                          id="landlord-email"
                          type="email"
                          value={tenantEmail}
                          onChange={(e) => setTenantEmail(e.target.value)}
                          placeholder="landlord@example.com"
                          required
                          inputMode="email"
                          autoComplete="email"
                          className="w-full p-3 rounded-xl border border-border bg-background focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all text-foreground text-sm sm:text-base placeholder:text-muted-foreground/40"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 w-full">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setRoleSelection("none")}
                          className="w-full sm:w-auto px-6 py-3 h-auto rounded-xl font-semibold hover:bg-muted"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          isLoading={isSubmitting}
                          className="flex-1 w-full px-6 py-3 h-auto rounded-xl bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.85)] text-white font-semibold hover:opacity-90 hover:text-white"
                        >
                          Request Access
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Features Section */}
        <section>
          <FeatureSection
            activeFeatureRole={activeFeatureRole}
            onRoleChange={setActiveFeatureRole}
          />
        </section>

        {/* Demo Dashboard Area */}
        <section className="w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-10 mb-16 sm:mb-24 md:mb-32 relative z-10">
          <DemoDashboard role={activeFeatureRole} onLaunchDemo={handleLaunchDemo} />
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full relative py-8 bg-background/40 backdrop-blur-md border-t border-border/10 mt-24 z-10">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-16 gap-4 max-w-[1440px] mx-auto">
          <div className="text-xl font-bold text-foreground">Homepost</div>
          <div className="text-xs font-semibold text-muted-foreground">© 2026 Homepost.</div>
        </div>
      </footer>
    </div>
  );
}

