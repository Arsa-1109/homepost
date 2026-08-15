"use client";

import { useState } from "react";
import { useAuth, UserProfile } from "@clerk/nextjs";
import { clerkUserProfileAppearance } from "@/lib/clerk-appearance";
import { startDemoSession, clearDemoSession } from "@/lib/demo-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import {
  User,
  Shield,
  Bell,
  Mail,
  Phone,
  Building,
  Key,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  LogOut,
  Sliders,
  Smartphone,
  Lock,
} from "lucide-react";

export default function LandlordSettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();

  // Mock settings state for interactive demo experience
  const [profileName, setProfileName] = useState("Marcus Vance");
  const [profileEmail, setProfileEmail] = useState("landlord@homepost.demo");
  const [profilePhone, setProfilePhone] = useState("+1 (512) 555-0199");
  const [orgName, setOrgName] = useState("Vance Property Holdings LLC");
  const [isSaving, setIsSaving] = useState(false);

  // Notification toggles
  const [notifs, setNotifs] = useState({
    maintenance: true,
    rentPayments: true,
    applications: true,
    monthlyReports: false,
    leaseExpirations: true,
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      localStorage.setItem("mock_user_name", profileName);
      toast.success("Profile preferences updated successfully (Demo Mode)");
    }, 600);
  };

  const toggleNotif = (key: keyof typeof notifs) => {
    setNotifs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      toast.info(`Notification preference updated`);
      return next;
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-slide-up pb-16">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[rgb(var(--ml-accent)/0.15)] text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent)/0.3)]">
            Account Management
          </span>
          {!isSignedIn && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
              Demo Mode Active
            </span>
          )}
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
          Settings & Preferences
        </h1>
        <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] mt-1">
          Manage your landlord credentials, notification channels, and property portfolio preferences.
        </p>
      </div>

      {isSignedIn ? (
        /* Real Authenticated Clerk User Profile */
        <div className="border border-border/60 hover:border-border/80 transition-all rounded-3xl bg-[rgb(var(--ml-bg-secondary))] p-1.5 sm:p-5 shadow-sm overflow-hidden flex justify-center">
          <UserProfile routing="hash" appearance={clerkUserProfileAppearance} />
        </div>
      ) : (
        /* 1:1 Interactive Demo Settings View */
        <div className="space-y-6">
          {/* Demo Mode Notice Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-[rgb(var(--ml-text-primary))]">
                  Interactive Demo Mode
                </p>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                  Previewing settings as <span className="font-semibold text-amber-500">Marcus Vance (Property Owner)</span>. Changes persist in your browser session.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  startDemoSession("tenant");
                  window.location.href = "/tenant/settings";
                }}
                className="text-xs h-9 rounded-xl border-border hover:border-[rgb(var(--ml-accent))] flex-1 sm:flex-initial"
              >
                <span>Switch to Resident</span>
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Section 1: Profile Information */}
          <div className="p-6 rounded-3xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-[rgb(var(--ml-accent)/0.15)] text-[rgb(var(--ml-accent))] flex items-center justify-center">
                  <User className="size-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-[rgb(var(--ml-text-primary))]">
                    Profile Information
                  </h2>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                    Your personal details and property management contact info
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Verified Owner
              </span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white font-black text-xl flex items-center justify-center shadow-md">
                  MV
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[rgb(var(--ml-text-primary))]">Marcus Vance</h3>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))]">Portfolio Owner · 2 Properties (4 Units)</p>
                  <span className="text-[11px] text-[rgb(var(--ml-accent))] font-medium cursor-pointer hover:underline mt-0.5 inline-block">
                    Change profile photo
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Full Name</label>
                  <div className="relative">
                    <Input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="h-10 bg-[rgb(var(--ml-bg-tertiary))] border-border rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Email Address</label>
                  <div className="relative">
                    <Input
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="h-10 bg-[rgb(var(--ml-bg-tertiary))] border-border rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Phone Number</label>
                  <div className="relative">
                    <Input
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="h-10 bg-[rgb(var(--ml-bg-tertiary))] border-border rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Management Entity</label>
                  <div className="relative">
                    <Input
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="h-10 bg-[rgb(var(--ml-bg-tertiary))] border-border rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>


              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl font-bold bg-[rgb(var(--ml-accent))] text-black hover:opacity-90 transition-all h-9 px-5 text-xs shadow-sm"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>

          {/* Section 2: Notifications & Communication */}
          <div className="p-6 rounded-3xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] space-y-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="size-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <Bell className="size-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-[rgb(var(--ml-text-primary))]">
                  Notification Preferences
                </h2>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                  Choose which activity alerts and financial digests you receive
                </p>
              </div>
            </div>

            <div className="divide-y divide-border/40">
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--ml-text-primary))]">
                    Tenant Maintenance Tickets
                  </p>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                    Instant push and email alert when a tenant submits or updates a ticket
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotif("maintenance")}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    notifs.maintenance ? "bg-[rgb(var(--ml-accent))]" : "bg-neutral-700"
                  }`}
                >
                  <div
                    className={`bg-white size-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      notifs.maintenance ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--ml-text-primary))]">
                    Rent Payment Confirmations
                  </p>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                    Notifications when tenant rent transfers are settled or overdue
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotif("rentPayments")}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    notifs.rentPayments ? "bg-[rgb(var(--ml-accent))]" : "bg-neutral-700"
                  }`}
                >
                  <div
                    className={`bg-white size-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      notifs.rentPayments ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--ml-text-primary))]">
                    Tenant Access & Move-In Requests
                  </p>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                    Alerts when pending tenants accept lease invitations or submit verification
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotif("applications")}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    notifs.applications ? "bg-[rgb(var(--ml-accent))]" : "bg-neutral-700"
                  }`}
                >
                  <div
                    className={`bg-white size-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      notifs.applications ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--ml-text-primary))]">
                    Monthly Portfolio & Occupancy Digest
                  </p>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                    Monthly PDF summary of collected revenue, open expenses, and vacancy rate
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotif("monthlyReports")}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    notifs.monthlyReports ? "bg-[rgb(var(--ml-accent))]" : "bg-neutral-700"
                  }`}
                >
                  <div
                    className={`bg-white size-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      notifs.monthlyReports ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Security & Session Management */}
          <div className="p-6 rounded-3xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Shield className="size-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-[rgb(var(--ml-text-primary))]">
                  Account Security & Session
                </h2>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                  Authentication methods and demo session controls
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Lock className="size-5 text-[rgb(var(--ml-text-secondary))]" />
                  <div>
                    <p className="text-xs font-bold text-[rgb(var(--ml-text-primary))]">Password Protection</p>
                    <p className="text-[11px] text-[rgb(var(--ml-text-secondary))]">Last updated 14 days ago</p>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">Active</span>
              </div>

              <div className="p-4 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="size-5 text-[rgb(var(--ml-text-secondary))]" />
                  <div>
                    <p className="text-xs font-bold text-[rgb(var(--ml-text-primary))]">2-Factor Authentication</p>
                    <p className="text-[11px] text-[rgb(var(--ml-text-secondary))]">Authenticator App (TOTP)</p>
                  </div>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold">Enabled</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/40">
              <p className="text-xs text-[rgb(var(--ml-text-secondary))] text-center sm:text-left">
                Ready to explore with a real account or reset your current test drive?
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearDemoSession();
                    window.location.href = "/";
                  }}
                  className="text-xs h-9 rounded-xl border-border hover:text-red-400 hover:border-red-400/40"
                >
                  <LogOut className="size-3.5 mr-1.5" />
                  <span>Exit Demo Session</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


