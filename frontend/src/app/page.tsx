"use client";

import { ClerkPublicMetadata } from "@/lib/clerk-global";

import { errorMessage } from "@/lib/errors";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { FeatureSection } from "@/components/landing/FeatureSection";

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

function PortalSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 justify-center items-center opacity-60 animate-pulse px-4 min-h-[400px]">
      <div className="w-full md:w-[440px] min-h-[300px] lg:h-[350px] rounded-xl border border-border/20 bg-card/20 backdrop-blur-md p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6 md:flex-1 lg:flex-none">
        <div className="w-16 h-16 rounded-full bg-muted/40 border border-border/10" />
        <div className="space-y-3 flex-1 w-full">
          <div className="h-6 w-2/3 bg-muted/40 rounded-md" />
          <div className="h-4 w-5/6 bg-muted/20 rounded-md" />
          <div className="h-4 w-3/4 bg-muted/20 rounded-md" />
        </div>
        <div className="h-12 w-full bg-muted/30 rounded-lg" />
      </div>

      <div className="w-full md:w-[440px] min-h-[280px] lg:h-[320px] rounded-xl border border-border/10 bg-card/10 backdrop-blur-sm p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6 hidden md:flex md:flex-1 lg:flex-none">
        <div className="w-14 h-14 rounded-full bg-muted/30 border border-border/10" />
        <div className="space-y-3 flex-1 w-full">
          <div className="h-6 w-1/2 bg-muted/40 rounded-md" />
          <div className="h-4 w-4/5 bg-muted/20 rounded-md" />
        </div>
        <div className="h-12 w-full bg-muted/30 rounded-lg" />
      </div>
    </div>
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
  const [hasRole, setHasRole] = useState<boolean | null>(null);

  const handleLaunchDemo = (role: "owner" | "tenant") => {
    setLaunchingDemo(role);
    const targetUrl = startDemoSession(role);
    window.location.href = targetUrl;
  };

  useEffect(() => {
    setMounted(true);
    let isMounted = true;

    const metadataRole = (user?.publicMetadata as ClerkPublicMetadata | undefined)?.role;
    const metadataComplete = (user?.publicMetadata as ClerkPublicMetadata | undefined)?.onboardingComplete;
    const cookieRole =
      typeof document !== "undefined"
        ? document.cookie.match(/(^|;\s*)mock_user_role=([^;]*)/)?.[2]
        : null;

    if (
      metadataRole === "landlord" ||
      metadataRole === "tenant" ||
      metadataComplete ||
      cookieRole === "landlord" ||
      cookieRole === "tenant"
    ) {
      setHasRole(true);
    }

    if (isLoaded && isSignedIn && user) {
      const checkRole = async () => {
        try {
          const token = await getToken();
          const me = await api.get<UserRoleResponse>("/api/v1/onboarding/me", token);
          if (isMounted) {
            if (me && me.role && me.role !== "none" && me.role !== "unassigned") {
              setHasRole(true);
              if (IS_DEMO_MODE && typeof window !== "undefined") {
                document.cookie = `mock_user_role=${me.role}; path=/; max-age=604800; SameSite=Lax`;
                document.cookie = "mock_user_onboarding_complete=true; path=/; max-age=604800; SameSite=Lax";
              }
            } else if (!metadataRole && !metadataComplete && !cookieRole) {
              setHasRole(false);
            }
          }
        } catch (err) {
          if (isMounted && !metadataRole && !metadataComplete && !cookieRole) {
            setHasRole(false);
          }
        }
      };
      checkRole();
    } else if (isLoaded && !isSignedIn) {
      setHasRole(false);
    }
    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, user, getToken]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasRole === null && (!isLoaded || !isSignedIn)) {
        setHasRole(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [hasRole, isLoaded, isSignedIn]);

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
                variant="link"
                onClick={() => router.push("/sign-in")}
                data-testid="mock-signin"
                className="text-sm font-medium text-accent"
              >
                Log in
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                {hasRole ? (
                  <Button
                    variant="link"
                    onClick={() => router.push("/dashboard")}
                    className="text-sm font-medium text-accent"
                  >
                    Dashboard
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
          className="max-w-6xl w-full mx-auto relative min-h-[450px] sm:min-h-[500px] mb-20 sm:mb-28 md:mb-32 z-20 flex justify-center mt-12 sm:mt-24 md:mt-48"
        >
          {hasRole === null ? (
            <PortalSkeleton />
          ) : hasRole ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 sm:p-12 rounded-2xl bg-card border border-border shadow-xl flex flex-col items-center space-y-6 self-center z-30 w-full max-w-lg text-center"
            >
              <h2 className="text-2xl sm:text-3xl font-bold">Welcome back!</h2>
              <Button
                onClick={() => router.push("/dashboard")}
                className="px-8 sm:px-10 py-4 sm:py-5 rounded-lg bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.8)] text-white font-bold text-base sm:text-lg hover:opacity-90 transition-opacity flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-accent hover:text-white hover:shadow-none hover:translate-y-0"
              >
                Go to Dashboard <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
            </motion.div>
          ) : (
            <div className="w-full relative min-h-[460px] lg:h-[560px] flex flex-col lg:block gap-8 max-w-5xl mx-auto px-2 sm:px-4">
              {error && (
                <div className="absolute top-[-60px] left-1/2 -translate-x-1/2 w-full max-w-lg bg-destructive text-destructive-foreground p-4 rounded-xl text-center font-medium z-50">
                  {error}
                </div>
              )}

              <AnimatePresence>
                {roleSelection === "none" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="w-full relative min-h-auto lg:h-[520px] flex flex-col md:flex-row lg:block gap-8 max-w-5xl mx-auto perspective-[1200px]"
                  >
                    {/* Owner Card */}
                    <motion.article
                      initial={{ rotateZ: -1, y: 0, scale: 1 }}
                      animate={{ rotateZ: -1, y: 0, scale: 1 }}
                      whileHover={{ scale: 1.04, rotateZ: -1, rotateX: 4, rotateY: 4, y: -10, zIndex: 50 }}
                      transition={{ type: "spring", stiffness: 120, damping: 20, mass: 1 }}
                      className="relative lg:absolute lg:top-0 lg:left-[5%] w-full md:flex-1 lg:w-[440px] bg-card border border-border rounded-xl p-6 sm:p-8 lg:p-9 flex flex-col items-start justify-between shadow-xl min-h-[380px] lg:h-[430px] z-30 focus-within:ring-2 focus-within:ring-accent origin-bottom-left group"
                    >
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4 border border-accent/20">
                        <Building2 className="text-accent w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight">
                          I am a Property Owner
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground mb-6 font-medium">
                          Manage your properties, review tenant requests, and oversee maintenance with absolute clarity.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2.5 w-full mt-auto">
                        <Button
                          type="button"
                          onClick={handleLandlordSelect}
                          isLoading={isSubmitting && roleSelection === "none"}
                          className="w-full py-3.5 h-auto rounded-lg bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.8)] text-white font-bold text-base hover:opacity-90 transition-opacity hover:text-white hover:shadow-none hover:translate-y-0"
                        >
                          Enter Owner Portal
                        </Button>
                        {IS_DEMO_MODE && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleLaunchDemo("owner")}
                            isLoading={launchingDemo === "owner"}
                            className="w-full py-2.5 h-auto rounded-lg border border-[rgb(var(--ml-accent))]/30 bg-[rgb(var(--ml-accent))]/5 hover:bg-[rgb(var(--ml-accent))]/15 text-[rgb(var(--ml-accent))] font-bold text-sm transition-all flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Try Owner Demo</span>
                            <span className="text-xs opacity-75 font-normal ml-0.5">(Instant Access)</span>
                          </Button>
                        )}
                      </div>
                    </motion.article>

                    {/* Tenant Card */}
                    <motion.article
                      initial={{ rotateZ: 2, y: 0, scale: 0.96 }}
                      animate={{ rotateZ: 2, y: 0, scale: 0.96 }}
                      whileHover={{ scale: 1.02, rotateZ: 2, rotateX: -4, rotateY: -4, y: -10, zIndex: 50 }}
                      transition={{ type: "spring", stiffness: 120, damping: 20, mass: 1 }}
                      className="relative lg:absolute lg:top-[50px] lg:right-[5%] w-full md:flex-1 lg:w-[440px] bg-card border border-border rounded-xl p-6 sm:p-8 lg:p-9 flex flex-col items-start justify-between shadow-lg min-h-[360px] lg:h-[410px] z-20 focus-within:ring-2 focus-within:ring-accent origin-bottom-right group"
                    >
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4 border border-border">
                        <Key className="text-muted-foreground w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-semibold mb-2 tracking-tight">
                          I am a Tenant
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground mb-6 font-medium">
                          Submit requests, view announcements, and access important documents securely.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2.5 w-full mt-auto">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setRoleSelection("tenant")}
                          className="w-full py-3.5 h-auto rounded-lg text-foreground font-semibold text-base hover:bg-muted hover:border-border"
                        >
                          Access Tenant Portal
                        </Button>
                        {IS_DEMO_MODE && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleLaunchDemo("tenant")}
                            isLoading={launchingDemo === "tenant"}
                            className="w-full py-2.5 h-auto rounded-lg border border-border/80 bg-background/60 hover:bg-muted/60 text-foreground font-bold text-sm transition-all flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
                            <span>Try Resident Demo</span>
                            <span className="text-xs text-muted-foreground font-normal ml-0.5">(Instant Access)</span>
                          </Button>
                        )}
                      </div>
                    </motion.article>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {roleSelection === "tenant" && (
                  <motion.form
                    initial={{ opacity: 0, y: 30, scale: 0.95, x: "-50%" }}
                    animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                    exit={{ opacity: 0, y: 30, scale: 0.95, x: "-50%" }}
                    onSubmit={handleTenantSubmit}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-1rem)] max-w-2xl bg-card border border-border shadow-xl rounded-2xl p-5 sm:p-8 md:p-12 flex flex-col items-start justify-center z-40 min-h-[420px]"
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-muted flex items-center justify-center mb-6 sm:mb-8 border border-border mx-auto">
                      <Key className="text-muted-foreground w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4 tracking-tight w-full text-center">
                      Tenant Access
                    </h2>
                    <p className="text-center w-full text-sm sm:text-base text-muted-foreground font-medium mb-6 sm:mb-8">
                      Enter your landlord&apos;s email address to connect with their portal.
                    </p>

                    <div className="w-full mb-6 sm:mb-8">
                      <label
                        htmlFor="landlord-email"
                        className="block text-sm font-semibold mb-2.5 sm:mb-3 text-foreground tracking-wide"
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
                        className="w-full p-3.5 sm:p-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all text-foreground text-base sm:text-lg font-medium shadow-inner placeholder:text-muted-foreground/40"
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setRoleSelection("none")}
                        className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 h-auto rounded-lg font-semibold hover:bg-muted hover:border-border"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        isLoading={isSubmitting}
                        className="flex-1 w-full px-6 sm:px-8 py-3.5 sm:py-4 h-auto rounded-lg bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.8)] text-white font-bold hover:text-white hover:shadow-none hover:translate-y-0"
                      >
                        Request Access
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Features Section */}
        <FeatureSection
          activeFeatureRole={activeFeatureRole}
          onRoleChange={setActiveFeatureRole}
        />

        {/* Demo Dashboard Area */}
        <section className="w-full max-w-6xl mx-auto px-4 md:px-10 mb-32 relative z-10">
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

