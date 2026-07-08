"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
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
      type="button"
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
      className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label="Toggle theme"
    >
      {currentTheme === "dark" ? <Sun className="w-5 h-5 text-accent" /> : <Moon className="w-5 h-5 text-accent" />}
    </button>
  );
}

function PortalSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-8 justify-center items-center opacity-60 animate-pulse px-4 min-h-[400px]">
      {/* Owner Card Skeleton */}
      <div className="w-full md:w-[440px] min-h-[300px] lg:h-[350px] rounded-xl border border-border/20 bg-card/20 backdrop-blur-md p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6 md:flex-1 lg:flex-none">
        <div className="w-16 h-16 rounded-full bg-muted/40 border border-border/10"></div>
        <div className="space-y-3 flex-1 w-full">
          <div className="h-6 w-2/3 bg-muted/40 rounded-md"></div>
          <div className="h-4 w-5/6 bg-muted/20 rounded-md"></div>
          <div className="h-4 w-3/4 bg-muted/20 rounded-md"></div>
        </div>
        <div className="h-12 w-full bg-muted/30 rounded-lg"></div>
      </div>
      
      {/* Tenant Card Skeleton */}
      <div className="w-full md:w-[440px] min-h-[280px] lg:h-[320px] rounded-xl border border-border/10 bg-card/10 backdrop-blur-sm p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6 hidden md:flex md:flex-1 lg:flex-none">
        <div className="w-14 h-14 rounded-full bg-muted/30 border border-border/10"></div>
        <div className="space-y-3 flex-1 w-full">
          <div className="h-6 w-1/2 bg-muted/40 rounded-md"></div>
          <div className="h-4 w-4/5 bg-muted/20 rounded-md"></div>
        </div>
        <div className="h-12 w-full bg-muted/30 rounded-lg"></div>
      </div>
    </div>
  );
}

function generatePeakPaths(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count: number,
  spacing: number,
  waveAmp: number,
  phaseShift: number = 0
): string[] {
  const paths: string[] = [];

  const hash = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const c2 = hash(phaseShift * 1.7) * 0.45 + 0.25;
  const s2 = hash(phaseShift * 2.3) * Math.PI * 2;
  const c3 = hash(phaseShift * 3.1) * 0.35 + 0.15;
  const s3 = hash(phaseShift * 4.7) * Math.PI * 2;
  const c4 = hash(phaseShift * 5.9) * 0.25 + 0.10;
  const s4 = hash(phaseShift * 6.8) * Math.PI * 2;
  const c5 = hash(phaseShift * 7.2) * 0.15 + 0.05;
  const s5 = hash(phaseShift * 8.4) * Math.PI * 2;

  for (let i = 0; i < count; i++) {
    const R = 30 + i * spacing;
    const points: string[] = [];
    const steps = 180;

    for (let step = 0; step <= steps; step++) {
      const theta = (step / steps) * 2 * Math.PI;

      const wave = Math.sin(2 * theta + s2) * c2
        + Math.cos(3 * theta + s3) * c3
        + Math.sin(4 * theta + s4) * c4
        + Math.cos(5 * theta + s5) * c5;

      const r = R * (1 + waveAmp * wave);
      const px = cx + Math.cos(theta) * r * (rx / 100);
      const py = cy + Math.sin(theta) * r * (ry / 100);

      if (step === 0) {
        points.push(`M ${px.toFixed(1)} ${py.toFixed(1)}`);
      } else {
        points.push(`L ${px.toFixed(1)} ${py.toFixed(1)}`);
      }
    }
    points.push('Z');
    paths.push(points.join(' '));
  }

  return paths;
}

function generateRidgePaths(
  startY: number,
  width: number,
  height: number,
  count: number,
  spacing: number,
  waveAmp: number,
  phaseShift: number = 0
): string[] {
  const paths: string[] = [];

  const hash = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const a1 = hash(phaseShift * 1.5) * 45 + 30;
  const p1 = hash(phaseShift * 2.2) * Math.PI * 2;
  const a2 = hash(phaseShift * 3.3) * 35 + 15;
  const p2 = hash(phaseShift * 4.4) * Math.PI * 2;
  const a3 = hash(phaseShift * 5.5) * 25 + 10;
  const p3 = hash(phaseShift * 6.6) * Math.PI * 2;
  const a4 = hash(phaseShift * 7.1) * 15 + 5;
  const p4 = hash(phaseShift * 8.8) * Math.PI * 2;

  for (let i = 0; i < count; i++) {
    const yOffset = startY + i * spacing;
    const points: string[] = [];
    const steps = 100;

    points.push(`M 0 ${height}`);

    for (let step = 0; step <= steps; step++) {
      const x = (step / steps) * width;
      const t = (step / steps) * Math.PI * 2.8;

      const wave = Math.sin(t + p1) * a1
        + Math.sin(2 * t + p2) * a2
        + Math.cos(0.5 * t + p3 + i * 0.05) * a3
        + Math.sin(4 * t + p4) * a4;

      const y = yOffset + wave * waveAmp;
      points.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
    }

    points.push(`L ${width} ${height}`);
    points.push('Z');

    paths.push(points.join(' '));
  }

  return paths;
}

const DUNES_CONFIG = [
  {
    type: "peak" as const,
    widthBase: 75,
    heightBase: 75,
    cx: 550,
    cy: 300,
    rx: 150,
    ry: 100,
    count: 6,
    spacing: 75,
    waveAmp: 0.8,
    phaseShift: 1.2,
    anim: "animate-dune-drift-1",
    blur: "blur-[100px]",
    opacity: "opacity-90",
    viewBox: "0 0 1000 700"
  },
  {
    type: "peak" as const,
    widthBase: 85,
    heightBase: 70,
    cx: 500,
    cy: 350,
    rx: 160,
    ry: 110,
    count: 6,
    spacing: 75,
    waveAmp: 0.7,
    phaseShift: 2.5,
    anim: "animate-dune-drift-2",
    blur: "blur-[110px]",
    opacity: "opacity-80",
    viewBox: "0 0 1000 700"
  },
  {
    type: "peak" as const,
    widthBase: 80,
    heightBase: 75,
    cx: 450,
    cy: 350,
    rx: 140,
    ry: 95,
    count: 6,
    spacing: 70,
    waveAmp: 0.9,
    phaseShift: 3.8,
    anim: "animate-dune-drift-3",
    blur: "blur-[100px]",
    opacity: "opacity-85",
    viewBox: "0 0 1100 700"
  },
  {
    type: "peak" as const,
    widthBase: 50,
    heightBase: 55,
    cx: 400,
    cy: 300,
    rx: 130,
    ry: 95,
    count: 6,
    spacing: 50,
    waveAmp: 0.8,
    phaseShift: 5.0,
    anim: "animate-dune-drift-1",
    blur: "blur-[95px]",
    opacity: "opacity-85",
    viewBox: "0 0 800 600"
  }
];

function getDeterministicHash(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const RANDOMIZED_DUNES = DUNES_CONFIG.map((dune, idx) => {
  const hashY = getDeterministicHash(idx * 79.13 + 17.89);
  const hashX = getDeterministicHash(idx * 31.45 + 56.72);
  const hashW = getDeterministicHash(idx * 43.21 + 89.12);
  const hashH = getDeterministicHash(idx * 67.89 + 23.45);

  let yBase = 0;
  let xBase = 0;

  if (idx === 0) {
    yBase = -5 + hashY * 20;
    xBase = 45 + hashX * 30;
  } else if (idx === 1) {
    yBase = 15 + hashY * 20;
    xBase = -35 + hashX * 20;
  } else if (idx === 2) {
    yBase = 40 + hashY * 20;
    xBase = 40 + hashX * 30;
  } else {
    yBase = 70 + hashY * 20;
    xBase = 5 + hashX * 30;
  }

  const width = dune.widthBase + (hashW * 30 - 15);
  const height = dune.heightBase + (hashH * 20 - 10);

  return {
    ...dune,
    top: `${yBase.toFixed(1)}%`,
    left: `${xBase.toFixed(1)}vw`,
    width: `${width.toFixed(1)}vw`,
    height: `${height.toFixed(1)}vh`,
    seed: idx * 42.17 + 8.93
  };
});


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
          if (me && me.role && me.role !== "none" && me.role !== "unassigned") {
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

  // Fallback: If Clerk takes too long or fails to load, default to showing the portal cards
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasRole === null) {
        console.warn("Clerk loading timed out. Falling back to default landing page state.");
        setHasRole(false);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [hasRole]);

  const handleLandlordSelect = async () => {
    if (!isLoaded) return;
    setIsSubmitting(true);
    setError("");

    if (isSignedIn) {
      try {
        await api.post("/api/v1/onboarding/register-landlord");
        if (typeof window !== "undefined") {
          document.cookie = "mock_user_onboarding_complete=true; path=/";
        }
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
        if (typeof window !== "undefined") {
          document.cookie = "mock_user_onboarding_complete=true; path=/";
        }
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
      {/* Ambient Sand Dune Topographic Background System */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {RANDOMIZED_DUNES.map((dune: any, index) => {
          const paths =
            dune.type === "peak"
              ? generatePeakPaths(
                dune.cx!,
                dune.cy!,
                dune.rx!,
                dune.ry!,
                dune.count,
                dune.spacing,
                dune.waveAmp,
                dune.phaseShift
              ).reverse()
              : generateRidgePaths(
                dune.startY!,
                dune.viewWidth!,
                dune.viewHeight!,
                dune.count,
                dune.spacing,
                dune.waveAmp,
                dune.phaseShift
              );

          return (
            <div
              key={index}
              className={`absolute transform-gpu will-change-transform ${dune.opacity} ${dune.anim} ${dune.blur}`}
              style={{
                top: dune.top,
                left: dune.left,
                width: dune.width,
                height: dune.height,
              }}
            >
              <svg className="w-full h-full" viewBox={dune.viewBox}>
                {paths.map((path, idx) => {
                  const opIndex = Math.max(1, 5 - idx);
                  return (
                    <path
                      key={idx}
                      d={path}
                      fill={`rgb(var(--ml-accent) / var(--ml-dune-op-${opIndex}))`}
                    />
                  );
                })}
              </svg>
            </div>
          );
        })}
      </div>

      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-3xl border-b border-border shadow-[0_0_20px_rgb(var(--ml-accent)/0.02)]">
        <div className="flex justify-between items-center px-6 md:px-16 py-4 max-w-[1440px] mx-auto h-20">
          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold tracking-tighter">Homepost</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {!isSignedIn ? (
              <button type="button" onClick={() => router.push("/sign-in")} className="text-sm font-medium text-accent hover:scale-105 transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-accent rounded-md px-2 py-1">
                Log in
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => router.push("/dashboard")} className="text-sm font-medium text-accent hover:scale-105 transition-transform duration-300 focus-visible:ring-2 focus-visible:ring-accent rounded-md px-2 py-1">
                  Dashboard
                </button>
                <UserButton />
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="relative pt-32 pb-24 px-6 md:px-16 min-h-screen z-10 block">

        {/* Hero Section */}
        <Hero />

        {/* Auth / Role Selection Area */}
        <section className="max-w-6xl w-full mx-auto relative min-h-[500px] mb-32 z-20 flex justify-center mt-48">

          {hasRole === null ? (
            <PortalSkeleton />
          ) : hasRole ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-12 rounded-2xl bg-card border border-border shadow-xl flex flex-col items-center space-y-6 self-center z-30 w-full max-w-lg text-center"
            >
              <h2 className="text-3xl font-bold">Welcome back!</h2>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-10 py-5 rounded-lg bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.8)] text-white font-bold text-lg hover:opacity-90 transition-opacity flex items-center gap-3 focus-visible:ring-2 focus-visible:ring-accent"
              >
                Go to Dashboard <ArrowRight className="w-6 h-6" />
              </button>
            </motion.div>
          ) : (
            <div className="w-full relative min-h-auto lg:h-[500px] flex flex-col lg:block gap-8 max-w-5xl mx-auto px-4">
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
                    className="w-full relative min-h-auto lg:h-[450px] flex flex-col md:flex-row lg:block gap-8 max-w-5xl mx-auto perspective-[1200px]"
                  >
                    {/* Owner Card (Closer, Left, Higher Z) */}
                    <motion.article
                      initial={{ rotateZ: -1, y: 0, scale: 1 }}
                      animate={{ rotateZ: -1, y: 0, scale: 1 }}
                      whileHover={{ scale: 1.04, rotateZ: -1, rotateX: 4, rotateY: 4, y: -10, zIndex: 50 }}
                      transition={{ type: "spring", stiffness: 120, damping: 20, mass: 1 }}
                      className="relative lg:absolute lg:top-0 lg:left-[5%] w-full md:flex-1 lg:w-[440px] bg-card border border-border rounded-xl p-6 sm:p-8 lg:p-10 flex flex-col items-start justify-between shadow-xl min-h-[300px] lg:h-[350px] z-30 focus-within:ring-2 focus-within:ring-accent origin-bottom-left group"
                    >
                      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6 border border-accent/20">
                        <Building2 className="text-accent w-8 h-8" />
                      </div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-semibold mb-3 tracking-tight">I am a Property Owner</h2>
                        <p className="text-base text-muted-foreground mb-6 font-medium">Manage your properties, review tenant requests, and oversee maintenance with absolute clarity.</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleLandlordSelect}
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-lg bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.8)] text-white font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2 relative before:absolute before:inset-0"
                      >
                        {isSubmitting && roleSelection === 'none' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enter Owner Portal"}
                      </button>
                    </motion.article>

                    {/* Tenant Card (Further back, Right, Tilted) */}
                    <motion.article
                      initial={{ rotateZ: 2, y: 0, scale: 0.96 }}
                      animate={{ rotateZ: 2, y: 0, scale: 0.96 }}
                      whileHover={{ scale: 1.02, rotateZ: 2, rotateX: -4, rotateY: -4, y: -10, zIndex: 50 }}
                      transition={{ type: "spring", stiffness: 120, damping: 20, mass: 1 }}
                      className="relative lg:absolute lg:top-[60px] lg:right-[5%] w-full md:flex-1 lg:w-[440px] bg-card border border-border rounded-xl p-6 sm:p-8 lg:p-10 flex flex-col items-start justify-between shadow-lg min-h-[280px] lg:h-[320px] z-20 focus-within:ring-2 focus-within:ring-accent origin-bottom-right group"
                    >
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-6 border border-border">
                        <Key className="text-muted-foreground w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-2xl md:text-3xl font-semibold mb-3 tracking-tight">I am a Tenant</h2>
                        <p className="text-base text-muted-foreground mb-6 font-medium">Submit requests, view announcements, and access important documents securely.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRoleSelection("tenant")}
                        className="w-full py-4 rounded-lg border border-border text-foreground font-semibold text-base hover:bg-black/5 dark:hover:bg-white/5 transition-colors mt-auto relative before:absolute before:inset-0"
                      >
                        Access Tenant Portal
                      </button>
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
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-card border border-border shadow-xl rounded-xl p-12 flex flex-col items-start justify-center z-40 min-h-[400px]"
                  >
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-8 border border-border mx-auto">
                      <Key className="text-muted-foreground w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-semibold mb-4 tracking-tight w-full text-center">Tenant Access</h2>
                    <p className="text-center w-full text-muted-foreground font-medium mb-8">Enter your landlord's email address to connect with their portal.</p>

                    <div className="w-full mb-8">
                      <label htmlFor="landlord-email" className="block text-sm font-semibold mb-3 text-foreground tracking-wide">Landlord's Email Address</label>
                      <input
                        id="landlord-email"
                        type="email"
                        value={tenantEmail}
                        onChange={(e) => setTenantEmail(e.target.value)}
                        placeholder="landlord@example.com"
                        required
                        inputMode="email"
                        autoComplete="email"
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
                        className="flex-1 px-8 py-4 rounded-lg bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.8)] text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-accent"
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

        {/* Text Divider between Auth and Features */}
        <div className="flex flex-row justify-center items-center gap-4 md:gap-12 w-full relative z-20 mt-12 mb-20">
          <button
            type="button"
            onClick={() => setActiveFeatureRole("owner")}
            className="relative flex flex-col items-center justify-center group transition-all duration-500 ease-out outline-none"
          >
            <h2 className={`text-lg sm:text-xl md:text-4xl lg:text-5xl font-extrabold tracking-tight transition-all duration-500 ${activeFeatureRole === "owner" ? "text-foreground drop-shadow-[0_0_30px_rgb(var(--ml-accent)/0.6)] scale-105" : "text-muted-foreground/40 hover:text-muted-foreground/80 scale-100"}`}>Property Owners</h2>
            {activeFeatureRole === "owner" && (
              <motion.div
                layoutId="activeFeatureUnderline"
                className="absolute -bottom-6 left-0 right-0 mx-auto w-[80%] h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-80 shadow-[0_0_20px_rgb(var(--ml-accent))] blur-[1px]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>

          <span className="text-muted-foreground/25 text-xl md:text-4xl font-light">|</span>

          <button
            type="button"
            onClick={() => setActiveFeatureRole("tenant")}
            className="relative flex flex-col items-center justify-center group transition-all duration-500 ease-out outline-none"
          >
            <h2 className={`text-lg sm:text-xl md:text-4xl lg:text-5xl font-extrabold tracking-tight transition-all duration-500 ${activeFeatureRole === "tenant" ? "text-foreground drop-shadow-[0_0_30px_rgb(var(--ml-accent)/0.6)] scale-105" : "text-muted-foreground/40 hover:text-muted-foreground/80 scale-100"}`}>Residents</h2>
            {activeFeatureRole === "tenant" && (
              <motion.div
                layoutId="activeFeatureUnderline"
                className="absolute -bottom-6 left-0 right-0 mx-auto w-[80%] h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-80 shadow-[0_0_20px_rgb(var(--ml-accent))] blur-[1px]"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Features Section (Asymmetrical Floating Bento) */}
        <section className="max-w-6xl w-full mx-auto mb-32 px-4 relative z-10 perspective-[1200px]">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgb(var(--ml-accent)/0.05)] to-transparent blur-[120px] -z-10 pointer-events-none"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 items-center">

            {/* Left Card: (Tilted Right, Floating Up) */}
            <motion.div
              animate={{ y: [0, -25, 0], x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
              className="relative z-10 w-full will-change-transform"
            >
              <motion.div
                initial={{ opacity: 0, y: 50, rotateZ: -2 }}
                whileInView={{ opacity: 1, y: 0, rotateZ: -2 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1.2, opacity: { duration: 0.8 } }}
                whileHover={{ scale: 1.05, rotateZ: 0, zIndex: 30, y: -10 }}
                className="glass-panel rounded-xl p-10 flex flex-col items-start shadow-lg relative overflow-hidden group cursor-pointer md:mt-12 w-full transform-gpu backface-hidden antialiased"
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
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1, opacity: { duration: 0.8 } }}
                whileHover={{ scale: 1.05, zIndex: 30, y: -10 }}
                className="glass-panel rounded-xl p-10 flex flex-col items-start shadow-xl relative overflow-hidden group cursor-pointer border-accent/20 w-full transform-gpu backface-hidden antialiased"
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
                whileInView={{ opacity: 1, y: 0, rotateZ: 2 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1, opacity: { duration: 0.8 } }}
                whileHover={{ scale: 1.05, rotateZ: 0, zIndex: 30, y: -10 }}
                className="glass-panel rounded-xl p-10 flex flex-col items-start shadow-lg relative overflow-hidden group cursor-pointer w-full transform-gpu backface-hidden antialiased"
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

        {/* Contextual Demo Dashboard Area */}
        <section className="w-full max-w-6xl mx-auto px-4 md:px-10 mb-32 relative z-10">
          <DemoDashboard role={activeFeatureRole} />
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full relative py-8 bg-background/40 backdrop-blur-md border-t border-border/10 mt-24 z-10">
        <div className="flex flex-col md:flex-row justify-between items-center px-6 md:px-16 gap-4 max-w-[1440px] mx-auto">
          <div className="text-xl font-bold text-foreground">
            Homepost
          </div>
          <div className="text-xs font-semibold text-muted-foreground">
            © 2026 Homepost.
          </div>
        </div>
      </footer>
    </div>
  );
}
