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
  Home,
  HeartHandshake,
  Key,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  LogOut,
  Smartphone,
  Lock,
  Calendar,
  Building2,
} from "lucide-react";

export default function TenantSettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();

  // Mock settings state for interactive resident demo experience
  const [profileName, setProfileName] = useState("Sarah Jenkins");
  const [profileEmail, setProfileEmail] = useState("sarah.jenkins@demo.homepost.io");
  const [profilePhone, setProfilePhone] = useState("+1 (512) 555-0142");
  const [emergencyName, setEmergencyName] = useState("David Jenkins");
  const [emergencyRelation, setEmergencyRelation] = useState("Father");
  const [emergencyPhone, setEmergencyPhone] = useState("+1 (512) 555-0188");
  const [isSaving, setIsSaving] = useState(false);

  // Notification toggles
  const [notifs, setNotifs] = useState({
    rentReminders: true,
    announcements: true,
    maintenanceUpdates: true,
    packageDeliveries: true,
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      localStorage.setItem("mock_user_name", profileName);
      toast.success("Resident profile updated successfully (Demo Mode)");
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
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            Resident Portal
          </span>
          {!isSignedIn && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
              Demo Mode Active
            </span>
          )}
        </div>
        <h1 className="text-3xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
          Resident Settings
        </h1>
        <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] mt-1">
          Manage your personal contact info, lease emergency contacts, and automated rent alerts.
        </p>
      </div>

      {isSignedIn ? (
        /* Real Authenticated Clerk User Profile */
        <div className="border border-border/60 hover:border-border/80 transition-all rounded-3xl bg-[rgb(var(--ml-bg-secondary))] p-1.5 sm:p-5 shadow-sm overflow-hidden flex justify-center">
          <UserProfile routing="hash" appearance={clerkUserProfileAppearance} />
        </div>
      ) : (
        /* 1:1 Interactive Resident Demo Settings View */
        <div className="space-y-6">
          {/* Demo Mode Notice Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-[rgb(var(--ml-text-primary))]">
                  Resident Demo Preview
                </p>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                  Previewing settings as <span className="font-semibold text-purple-400">Sarah Jenkins (Unit 101)</span>. Changes persist in your browser session.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  startDemoSession("owner");
                  window.location.href = "/landlord/settings";
                }}
                className="text-xs h-9 rounded-xl border-border hover:border-[rgb(var(--ml-accent))] flex-1 sm:flex-initial"
              >
                <span>Switch to Owner</span>
                <ArrowRight className="size-3.5 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* Section 1: Tenancy & Profile Info */}
          <div className="p-6 rounded-3xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <User className="size-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-[rgb(var(--ml-text-primary))]">
                    Personal & Tenancy Details
                  </h2>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                    Your contact information and active unit assignment
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Active Tenancy
              </span>
            </div>

            {/* Current Lease Card */}
            <div className="p-4 rounded-2xl bg-[rgb(var(--ml-bg-tertiary))] border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-[rgb(var(--ml-accent)/0.15)] text-[rgb(var(--ml-accent))] flex items-center justify-center shrink-0">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">Maplewood Heights · Unit 101</p>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))]">742 Evergreen Terrace, Austin, TX</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[rgb(var(--ml-text-secondary))]">
                <Calendar className="size-3.5 text-[rgb(var(--ml-accent))]" />
                <span>Lease: Oct 2025 – Sep 2026</span>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-black text-xl flex items-center justify-center shadow-md">
                  SJ
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[rgb(var(--ml-text-primary))]">Sarah Jenkins</h3>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))]">Primary Leaseholder · Unit 101</p>
                  <span className="text-[11px] text-[rgb(var(--ml-accent))] font-medium cursor-pointer hover:underline mt-0.5 inline-block">
                    Change profile photo
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Full Name</label>
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="h-10 bg-[rgb(var(--ml-bg-tertiary))] border-border rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Email Address</label>
                  <Input
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="h-10 bg-[rgb(var(--ml-bg-tertiary))] border-border rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Mobile Phone</label>
                  <Input
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="h-10 bg-[rgb(var(--ml-bg-tertiary))] border-border rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Rent Payment Method</label>
                  <div className="h-10 px-3 flex items-center justify-between rounded-xl bg-[rgb(var(--ml-bg-tertiary))] border border-border text-xs text-[rgb(var(--ml-text-secondary))]">
                    <span>Auto-Debit (Chase ****4129)</span>
                    <span className="text-emerald-400 font-semibold text-[10px]">VERIFIED</span>
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

          {/* Section 2: Emergency Contact */}
          <div className="p-6 rounded-3xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="size-9 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center">
                <HeartHandshake className="size-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-[rgb(var(--ml-text-primary))]">
                  Emergency Contact
                </h2>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                  Designated person for building management in urgent situations
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Contact Name</label>
                <Input
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  className="h-10 bg-[rgb(var(--ml-bg-tertiary))] border-border rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Relationship</label>
                <Input
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  className="h-10 bg-[rgb(var(--ml-bg-tertiary))] border-border rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">Emergency Phone</label>
                <Input
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="h-10 bg-[rgb(var(--ml-bg-tertiary))] border-border rounded-xl text-sm"
                />
              </div>
            </div>
          </div>


          {/* Section 3: Notification Preferences */}
          <div className="p-6 rounded-3xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] space-y-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="size-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <Bell className="size-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-[rgb(var(--ml-text-primary))]">
                  Resident Notifications
                </h2>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                  Select which SMS & push notifications to receive for your home
                </p>
              </div>
            </div>

            <div className="divide-y divide-border/40">
              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--ml-text-primary))]">
                    Rent Due Reminders
                  </p>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                    SMS and email notice 3 days before rent is due on the 1st
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotif("rentReminders")}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    notifs.rentReminders ? "bg-[rgb(var(--ml-accent))]" : "bg-neutral-700"
                  }`}
                >
                  <div
                    className={`bg-white size-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      notifs.rentReminders ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--ml-text-primary))]">
                    Building & Water Outage Announcements
                  </p>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                    Critical notices posted by property management regarding maintenance risers
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotif("announcements")}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    notifs.announcements ? "bg-[rgb(var(--ml-accent))]" : "bg-neutral-700"
                  }`}
                >
                  <div
                    className={`bg-white size-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      notifs.announcements ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[rgb(var(--ml-text-primary))]">
                    Maintenance Request Live Progress
                  </p>
                  <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                    Live updates when contractors schedule repairs or mark requests as resolved
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotif("maintenanceUpdates")}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                    notifs.maintenanceUpdates ? "bg-[rgb(var(--ml-accent))]" : "bg-neutral-700"
                  }`}
                >
                  <div
                    className={`bg-white size-4 rounded-full shadow-md transform transition-transform duration-200 ${
                      notifs.maintenanceUpdates ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Demo Session Controls */}
          <div className="p-6 rounded-3xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border/50 pb-4">
              <div className="size-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Shield className="size-5" />
              </div>
              <div>
                <h2 className="font-bold text-base text-[rgb(var(--ml-text-primary))]">
                  Demo Session Controls
                </h2>
                <p className="text-xs text-[rgb(var(--ml-text-secondary))]">
                  Switch between roles or return to the main landing page
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-[rgb(var(--ml-text-secondary))] text-center sm:text-left">
                Test drive the property owner dashboard or complete your demo session.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    startDemoSession("owner");
                    window.location.href = "/landlord/dashboard";
                  }}
                  className="text-xs h-9 rounded-xl border-border hover:border-[rgb(var(--ml-accent))]"
                >
                  <span>Explore Owner View</span>
                  <ArrowRight className="size-3.5 ml-1.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearDemoSession();
                    window.location.href = "/";
                  }}
                  className="text-xs h-9 rounded-xl text-[rgb(var(--ml-text-secondary))] hover:text-red-400 hover:border-red-400/40"
                >
                  <LogOut className="size-3.5 mr-1.5" />
                  <span>Exit Demo</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


