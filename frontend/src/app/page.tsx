"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Hero } from "@/components/Hero";
import { DemoDashboard } from "@/components/DemoDashboard";
import { Building2, Key, ArrowRight, Loader2, Wrench, Megaphone, FileText, Sun, Moon, LineChart, Users } from "lucide-react";

const FEATURE_CONTENT = {
  owner: [
    {
      id: "owner-1",
      icon: Building2,
      title: "Portfolio Management",
      description: "Organize your real estate assets effortlessly. Create properties, manage individual units, and maintain a clear overview of your entire portfolio."
    },
    {
      id: "owner-2",
      icon: Wrench,
      title: "Maintenance Tracking",
      description: "Receive, track, and resolve tenant service requests in one unified dashboard. Keep your properties in top condition and tenants happy."
    },
    {
      id: "owner-3",
      icon: Users,
      title: "Tenant Communications",
      description: "Broadcast important announcements and securely share lease documents. Establish a reliable, centralized channel for all your tenant interactions."
    }
  ],
  tenant: [
    {
      id: "tenant-1",
      icon: Wrench,
      title: "Quick Maintenance",
      description: "Report issues instantly with photos from your phone. Track the repair status from request to resolution without the back-and-forth."
    },
    {
      id: "tenant-2",
      icon: Megaphone,
      title: "Stay Informed",
      description: "Receive instant notifications for property-wide announcements, scheduled maintenance, and important building updates."
    },
    {
      id: "tenant-3",
      icon: FileText,
      title: "Your Documents",
      description: "Access your lease agreements, house rules, and important property documents securely, anytime you need them."
    }
  ]
};
import { api } from "@/lib/api";

function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="w-9 h-9" />;

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <button
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Toggle theme"
    >
      {currentTheme === "dark" ? <Sun className="w-5 h-5 text-accent-light" /> : <Moon className="w-5 h-5 text-accent-dark" />}
    </button>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();

  const [roleSelection, setRoleSelection] = useState<"none" | "landlord" | "tenant">("none");
  const [activeFeatureRole, setActiveFeatureRole] = useState<"owner" | "tenant">("owner");
  const [tenantEmail, setTenantEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hasRole, setHasRole] = useState<boolean | null>(null);

  // Check if user already has a role
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const checkRole = async () => {
        try {
          const me: any = await api.get("/api/v1/onboarding/me");
          if (me && me.role && me.role !== "none") {
            setHasRole(true);
          } else {
            setHasRole(false);
          }
        } catch (err) {
          setHasRole(false);
        }
      };
      checkRole();
    } else if (isLoaded && !isSignedIn) {
      setHasRole(false);
    }
  }, [isLoaded, isSignedIn, user]);

  const handleLandlordSelect = async () => {
    if (!isLoaded) return;
    setIsSubmitting(true);
    setError("");

    if (isSignedIn) {
      try {
        await api.post("/api/v1/onboarding/register-landlord");
        router.push("/sync-role");
      } catch (err: any) {
        setError(err.message || "Failed to register as landlord.");
        setIsSubmitting(false);
      }
    } else {
      localStorage.setItem("onboarding_intent", "landlord");
      router.push("/sign-up");
    }
  };

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantEmail || !isLoaded) return;
    setIsSubmitting(true);
    setError("");

    if (isSignedIn) {
      try {
        await api.post("/api/v1/onboarding/request-access", { landlord_email: tenantEmail });
        router.push("/sync-role");
      } catch (err: any) {
        setError(err.message || "Failed to request access. Check the email.");
        setIsSubmitting(false);
      }
    } else {
      localStorage.setItem("onboarding_intent", "tenant");
      localStorage.setItem("landlord_email", tenantEmail);
      router.push("/sign-up");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-accent/20 selection:text-foreground relative font-sans transition-colors duration-300">
      <style>{`
        .glass-panel {
            background: var(--glass-bg, rgba(255, 255, 255, 0.6));
            backdrop-filter: blur(32px);
            -webkit-backdrop-filter: blur(32px);
            border: 1px solid var(--glass-border, rgba(0, 0, 0, 0.05));
            background-clip: padding-box, border-box;
        }
        .dark .glass-panel {
            --glass-bg: rgba(26, 26, 26, 0.6);
            --glass-border: rgba(255, 255, 255, 0.1);
        }

        .glow-amber-high {
            box-shadow: 0 32px 64px -12px rgba(245, 158, 11, 0.15), 0 0 40px rgba(245, 158, 11, 0.1);
        }

        .glow-amber-low {
            box-shadow: 0 16px 32px -8px rgba(245, 158, 11, 0.08), 0 0 20px rgba(245, 158, 11, 0.05);
        }

        .ambient-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 0;
            background: radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.06) 0%, transparent 60%);
        }
      `}</style>

      <div className="ambient-bg"></div>

      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-background/60 backdrop-blur-3xl border-b border-border shadow-[0_0_20px_rgba(245,158,11,0.02)]">
        <div className="flex justify-between items-center px-6 md:px-16 py-4 max-w-[1440px] mx-auto h-20">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold tracking-tighter">Homepost</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {!isSignedIn ? (
              <button onClick={() => router.push("/sign-in")} className="text-sm font-medium text-accent hover:scale-105 transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-accent rounded-md px-2 py-1">
                Log in
              </button>
            ) : (
              <button onClick={() => router.push("/dashboard")} className="text-sm font-medium text-accent hover:scale-105 transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-accent rounded-md px-2 py-1">
                Dashboard
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative pt-32 pb-24 px-6 md:px-16 min-h-screen z-10 block">

        {/* Background decorative elements to enhance depth */}
        <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-accent/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-accent-dark/5 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Hero Section */}
        <Hero />

        {/* Auth / Role Selection Area */}
        <section className="max-w-6xl w-full mx-auto relative min-h-[500px] mb-32 z-20 flex justify-center mt-48">

          {hasRole === null ? (
            <div className="w-full relative min-h-[500px] opacity-0"></div>
          ) : hasRole ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-12 rounded-2xl bg-card border border-border glow-amber-high flex flex-col items-center space-y-6 self-center z-30 w-full max-w-lg text-center"
            >
              <h2 className="text-3xl font-bold">Welcome back!</h2>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-10 py-5 rounded-lg bg-gradient-to-r from-accent to-accent-dark text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-accent"
              >
                Go to Dashboard <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          ) : (
            <div className="w-full relative h-[600px] md:h-[500px]">
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
                    className="w-full relative h-[650px] md:h-[450px] max-w-5xl mx-auto perspective-[1200px]"
                  >
                    {/* Owner Card (Closer, Left, Higher Z) */}
                    <motion.div
                      initial={{ rotateZ: -1, y: 0, scale: 1 }}
                      animate={{ rotateZ: -1, y: 0, scale: 1 }}
                      whileHover={{ scale: 1.04, rotateZ: -1, rotateX: 4, rotateY: 4, y: -10, zIndex: 50 }}
                      transition={{ type: "spring", stiffness: 120, damping: 20, mass: 1 }}
                      className="absolute top-0 left-0 md:left-[5%] w-full md:w-[440px] bg-card border border-border rounded-xl p-10 flex flex-col items-start justify-between glow-amber-high h-[300px] md:h-[350px] z-30 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent origin-bottom-left"
                      onClick={handleLandlordSelect}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleLandlordSelect() }}
                    >
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6 border border-accent/20">
                        <Building2 className="text-accent w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-semibold mb-3 tracking-tight">I am a Property Owner</h2>
                        <p className="text-base text-muted-foreground mb-6 font-medium">Manage your properties, review tenant requests, and oversee maintenance with absolute clarity.</p>
                      </div>
                      <button disabled={isSubmitting} className="w-full py-4 rounded-lg bg-gradient-to-r from-accent to-accent-dark text-white font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2">
                        {isSubmitting && roleSelection === 'none' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enter Owner Portal"}
                      </button>
                    </motion.div>

                    {/* Tenant Card (Further back, Right, Tilted) */}
                    <motion.div
                      initial={{ rotateZ: 2, y: 0, scale: 0.96 }}
                      animate={{ rotateZ: 2, y: 0, scale: 0.96 }}
                      whileHover={{ scale: 1.02, rotateZ: 2, rotateX: -4, rotateY: -4, y: -10, zIndex: 50 }}
                      transition={{ type: "spring", stiffness: 120, damping: 20, mass: 1 }}
                      className="absolute top-[320px] md:top-[60px] right-0 md:right-[5%] w-full md:w-[440px] bg-card border border-border rounded-xl p-10 flex flex-col items-start justify-between glow-amber-low h-[280px] md:h-[320px] z-20 cursor-pointer focus-visible:ring-2 focus-visible:ring-accent origin-bottom-right"
                      onClick={() => setRoleSelection("tenant")}
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') setRoleSelection("tenant") }}
                    >
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-6 border border-border">
                        <Key className="text-muted-foreground w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-semibold mb-3 tracking-tight">I am a Tenant</h2>
                        <p className="text-base text-muted-foreground mb-6 font-medium">Submit requests, view announcements, and access important documents securely.</p>
                      </div>
                      <button className="w-full py-4 rounded-lg border border-border text-foreground font-semibold text-base hover:bg-black/5 dark:hover:bg-white/5 transition-colors mt-auto">
                        Access Tenant Portal
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {roleSelection === "tenant" && (
                  <motion.form
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.95 }}
                    onSubmit={handleTenantSubmit}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-card border border-border glow-amber-high rounded-xl p-12 flex flex-col items-start justify-center z-40 min-h-[400px]"
                  >
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-8 border border-border mx-auto">
                      <Key className="text-muted-foreground w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-semibold mb-4 tracking-tight w-full text-center">Tenant Access</h2>
                    <p className="text-center w-full text-muted-foreground font-medium mb-8">Enter your landlord's email address to connect with their portal.</p>

                    <div className="w-full mb-8">
                      <label className="block text-sm font-semibold mb-3 text-foreground tracking-wide">Landlord's Email Address</label>
                      <input
                        type="email"
                        value={tenantEmail}
                        onChange={(e) => setTenantEmail(e.target.value)}
                        placeholder="landlord@example.com"
                        required
                        className="w-full p-4 rounded-lg border border-border bg-background focus:ring-2 focus:ring-accent/50 focus:border-accent outline-none transition-all text-foreground text-lg font-medium shadow-inner placeholder:text-muted-foreground/40"
                      />
                    </div>
                    <div className="flex gap-4 w-full">
                      <button
                        type="button"
                        onClick={() => setRoleSelection("none")}
                        className="px-8 py-4 rounded-lg font-semibold border border-border text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-8 py-4 rounded-lg bg-gradient-to-r from-accent to-accent-dark text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Request Access"}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Demo Dashboard Area */}
        <section className="w-full max-w-6xl mx-auto px-4 md:px-10 mb-32 relative z-10">
          <DemoDashboard />
        </section>

        {/* Text Divider between Auth and Features */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 w-full relative z-20 mt-12 mb-20">
          <button
            onClick={() => setActiveFeatureRole("owner")}
            className="relative flex flex-col items-center justify-center group transition-all duration-500 ease-out outline-none"
          >
            <h2 className={`text-4xl md:text-5xl font-extrabold tracking-tight transition-all duration-500 ${activeFeatureRole === "owner" ? "text-foreground drop-shadow-[0_0_30px_rgba(245,158,11,0.6)] scale-105" : "text-muted-foreground/40 hover:text-muted-foreground/80 scale-100"}`}>Property Owners</h2>
            {activeFeatureRole === "owner" && (
              <motion.div
                layoutId="activeFeatureUnderline"
                className="absolute -bottom-6 left-0 right-0 mx-auto w-[80%] h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-80 shadow-[0_0_20px_rgba(245,158,11,1)] blur-[1px]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>

          <span className="hidden md:block text-muted-foreground/20 text-4xl font-light">|</span>

          <button
            onClick={() => setActiveFeatureRole("tenant")}
            className="relative flex flex-col items-center justify-center group transition-all duration-500 ease-out outline-none"
          >
            <h2 className={`text-4xl md:text-5xl font-extrabold tracking-tight transition-all duration-500 ${activeFeatureRole === "tenant" ? "text-foreground drop-shadow-[0_0_30px_rgba(245,158,11,0.6)] scale-105" : "text-muted-foreground/40 hover:text-muted-foreground/80 scale-100"}`}>Tenants</h2>
            {activeFeatureRole === "tenant" && (
              <motion.div
                layoutId="activeFeatureUnderline"
                className="absolute -bottom-6 left-0 right-0 mx-auto w-[80%] h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-80 shadow-[0_0_20px_rgba(245,158,11,1)] blur-[1px]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Features Section (Asymmetrical Floating Bento) */}
        <section className="max-w-6xl w-full mx-auto mb-32 px-4 relative z-10 perspective-[1200px]">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent blur-[120px] -z-10 pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 items-center">

            {/* Left Card: (Tilted Right, Floating Up) */}
            <motion.div
              animate={{ y: [0, -25, 0], x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="relative z-10 w-full will-change-transform"
            >
              <motion.div
                initial={{ opacity: 0, y: 50, rotateZ: -2 }}
                animate={{ opacity: 1, y: 0, rotateZ: -2 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1.2, opacity: { duration: 0.8 } }}
                whileHover={{ scale: 1.05, rotateZ: 0, zIndex: 30, y: -10 }}
                className="glass-panel rounded-xl p-10 flex flex-col items-start glow-amber-low relative overflow-hidden group cursor-pointer md:mt-12 w-full transform-gpu backface-hidden antialiased"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={FEATURE_CONTENT[activeFeatureRole][0].id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-start"
                  >
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6 border border-accent/20 group-hover:scale-110 transition-transform duration-500">
                      {(() => {
                        const Icon = FEATURE_CONTENT[activeFeatureRole][0].icon;
                        return <Icon className="text-accent w-8 h-8" />;
                      })()}
                    </div>
                    <h3 className="text-2xl font-semibold mb-3 tracking-tight">{FEATURE_CONTENT[activeFeatureRole][0].title}</h3>
                    <p className="text-base text-muted-foreground font-medium">
                      {FEATURE_CONTENT[activeFeatureRole][0].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* Center Card: (Floating Higher, Larger Focus) */}
            <motion.div
              animate={{ y: [0, -35, 0], x: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 0.5 }}
              className="relative z-20 w-full md:-mt-16 will-change-transform"
            >
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1.2, opacity: { duration: 0.8 } }}
                whileHover={{ scale: 1.05, zIndex: 30, y: -10 }}
                className="glass-panel rounded-xl p-10 flex flex-col items-start glow-amber-high relative overflow-hidden group cursor-pointer border-accent/20 w-full transform-gpu backface-hidden antialiased"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={FEATURE_CONTENT[activeFeatureRole][1].id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                    className="flex flex-col items-start"
                  >
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6 border border-accent/20 group-hover:scale-110 transition-transform duration-500">
                      {(() => {
                        const Icon = FEATURE_CONTENT[activeFeatureRole][1].icon;
                        return <Icon className="text-accent w-8 h-8" />;
                      })()}
                    </div>
                    <h3 className="text-2xl font-semibold mb-3 tracking-tight">{FEATURE_CONTENT[activeFeatureRole][1].title}</h3>
                    <p className="text-base text-muted-foreground font-medium">
                      {FEATURE_CONTENT[activeFeatureRole][1].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* Right Card: (Tilted Left, Floating Down) */}
            <motion.div
              animate={{ y: [0, -20, 0], x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
              className="relative z-10 w-full md:mt-24 will-change-transform"
            >
              <motion.div
                initial={{ opacity: 0, y: 50, rotateZ: 2 }}
                animate={{ opacity: 1, y: 0, rotateZ: 2 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1.2, opacity: { duration: 0.8 } }}
                whileHover={{ scale: 1.05, rotateZ: 0, zIndex: 30, y: -10 }}
                className="glass-panel rounded-xl p-10 flex flex-col items-start glow-amber-low relative overflow-hidden group cursor-pointer w-full transform-gpu backface-hidden antialiased"
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={FEATURE_CONTENT[activeFeatureRole][2].id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="flex flex-col items-start"
                  >
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6 border border-accent/20 group-hover:scale-110 transition-transform duration-500">
                      {(() => {
                        const Icon = FEATURE_CONTENT[activeFeatureRole][2].icon;
                        return <Icon className="text-accent w-8 h-8" />;
                      })()}
                    </div>
                    <h3 className="text-2xl font-semibold mb-3 tracking-tight">{FEATURE_CONTENT[activeFeatureRole][2].title}</h3>
                    <p className="text-base text-muted-foreground font-medium">
                      {FEATURE_CONTENT[activeFeatureRole][2].description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </motion.div>

          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full relative py-8 bg-card shadow-inner mt-24">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-16 gap-4 max-w-[1440px] mx-auto">
          <div className="text-xl font-bold text-foreground">
            Homepost
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            © 2024 Homepost. Grounded Futurism.
          </div>
          <div className="flex gap-6">
            <a className="text-xs font-semibold text-muted-foreground hover:text-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent rounded-sm" href="#">Privacy</a>
            <a className="text-xs font-semibold text-muted-foreground hover:text-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent rounded-sm" href="#">Terms</a>
            <a className="text-xs font-semibold text-muted-foreground hover:text-accent transition-colors focus-visible:ring-2 focus-visible:ring-accent rounded-sm" href="#">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
