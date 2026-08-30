/**
 * Invite Join Page — /join/[token]
 *
 * Handles the invite token fast-track onboarding flow with strict
 * role & ownership validation, landlord safeguards, and preview metadata.
 */

"use client";

import { errorMessage, formatInviteError } from "@/lib/errors";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { api, UserRoleResponse } from "@/lib/api";
import { completeOnboarding } from "@/app/actions/onboarding";
import { Building2, ShieldAlert, CheckCircle2, ArrowRight, LogOut, LayoutDashboard, DoorOpen, MapPin, UserCheck, Loader2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvitePreview {
  token: string;
  property_name: string;
  property_address?: string | null;
  property_city?: string | null;
  unit_label: string;
  landlord_name?: string | null;
  landlord_id?: string | null;
  property_owner_id?: string | null;
  status: string;
  expires_at: string;
  lease_start?: string | null;
  lease_end?: string | null;
}

export default function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const { isLoaded, userId, getToken } = useAuth();
  const { signOut } = useClerk();

  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [currentUser, setCurrentUser] = useState<UserRoleResponse | null>(null);
  const [checking, setChecking] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInviteData = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      // 1. Fetch public invite preview
      const preview = await api.get<InvitePreview>(`/api/v1/onboarding/invite/${token}`);
      setInvite(preview);

      // 2. If user is signed in, fetch user details
      if (userId) {
        const authToken = await getToken();
        if (authToken) {
          const user = await api.get<UserRoleResponse>("/api/v1/onboarding/me", authToken);
          setCurrentUser(user);
        }
      }
    } catch (err: unknown) {
      const msg = errorMessage(err);
      setError(formatInviteError(msg));
    } finally {
      setChecking(false);
    }
  }, [token, userId, getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    fetchInviteData();
  }, [isLoaded, fetchInviteData]);

  const handleAccept = async () => {
    if (!userId) {
      const currentUrl = typeof window !== "undefined" ? window.location.pathname : `/join/${token}`;
      router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
      return;
    }

    setAccepting(true);
    setError(null);
    try {
      const authToken = await getToken();
      await api.post("/api/v1/onboarding/accept-invite", { token }, authToken);
      await completeOnboarding().catch(() => {});
      window.location.href = "/tenant/dashboard";
    } catch (err) {
      const msg = errorMessage(err);
      setError(formatInviteError(msg));
      setAccepting(false);
    }
  };

  const handleSignOutAndSwitch = async () => {
    await signOut();
    const currentUrl = typeof window !== "undefined" ? window.location.pathname : `/join/${token}`;
    router.push(`/sign-in?redirect_url=${encodeURIComponent(currentUrl)}`);
  };

  if (!isLoaded || checking) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-[rgb(var(--ml-bg-primary))]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-[rgb(var(--ml-accent))]" />
          <p className="text-[rgb(var(--ml-text-secondary))] font-medium text-sm">
            Verifying invitation details...
          </p>
        </div>
      </main>
    );
  }

  // Check if current logged-in user is a landlord or the owner of this property/unit
  const isLandlordUser = currentUser?.role === "landlord";
  const isPropertyOwner = !!(
    currentUser?.id &&
    invite &&
    (currentUser.id === invite.property_owner_id || currentUser.id === invite.landlord_id)
  );
  const isOwnerOrLandlord = isLandlordUser || isPropertyOwner;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[rgb(var(--ml-bg-primary))] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 pointer-events-none -z-10" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[rgb(var(--ml-accent))]/10 dark:bg-[rgb(var(--ml-accent))]/15 blur-[120px]" />
      </div>

      <div className="max-w-md w-full">
        {error ? (
          <div className="bg-[rgb(var(--ml-surface))] border border-[rgb(var(--ml-border))] rounded-2xl p-6 sm:p-8 text-center shadow-lg space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-[rgb(var(--ml-text-primary))]">
                Invalid or Expired Link
              </h2>
              <p className="text-sm text-[rgb(var(--ml-text-secondary))]">
                {error}
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="w-full h-11 rounded-xl"
              >
                Go to Homepage
              </Button>
            </div>
          </div>
        ) : isOwnerOrLandlord ? (
          /* Landlord / Owner Guard Screen */
          <div className="bg-[rgb(var(--ml-surface))] border border-amber-500/30 rounded-2xl p-6 sm:p-8 text-center shadow-lg space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-[rgb(var(--ml-text-primary))]">
                Landlord Account Detected
              </h2>
              <p className="text-sm text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                You are currently logged in as a <strong>landlord</strong>
                {isPropertyOwner ? " and the owner of this property" : ""}. Landlords cannot claim or be assigned to tenant units.
              </p>
            </div>

            {invite && (
              <div className="bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded-xl p-4 text-left text-xs space-y-2">
                <div className="flex items-center gap-2 text-[rgb(var(--ml-text-primary))] font-semibold">
                  <Building2 className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
                  <span>{invite.property_name}</span>
                </div>
                <div className="flex items-center gap-2 text-[rgb(var(--ml-text-secondary))]">
                  <DoorOpen className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
                  <span>Unit: {invite.unit_label}</span>
                </div>
                {invite.property_city && (
                  <div className="flex items-center gap-2 text-[rgb(var(--ml-text-tertiary))]">
                    <MapPin className="w-4 h-4" />
                    <span>{invite.property_city}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Button
                onClick={() => router.push("/landlord/dashboard")}
                className="w-full h-11 rounded-xl bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-accent-foreground))] font-semibold shadow-sm flex items-center justify-center gap-2 hover:opacity-95"
              >
                <LayoutDashboard className="w-4 h-4" />
                Go to Landlord Dashboard
              </Button>

              <Button
                variant="outline"
                onClick={handleSignOutAndSwitch}
                className="w-full h-11 rounded-xl border-[rgb(var(--ml-border))] text-[rgb(var(--ml-text-primary))] flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out / Switch Account
              </Button>
            </div>
          </div>
        ) : (
          /* Tenant / Unassigned Accept Invite Screen */
          <div className="bg-[rgb(var(--ml-surface))] border border-[rgb(var(--ml-border))] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgb(var(--ml-accent))]/10 border border-[rgb(var(--ml-accent))]/20 text-[rgb(var(--ml-accent))] text-xs font-semibold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Unit Invitation
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[rgb(var(--ml-text-primary))]">
                You&apos;ve Been Invited!
              </h1>
              <p className="text-sm text-[rgb(var(--ml-text-secondary))]">
                Join your property on Homepost to access maintenance, rent tracking, and announcements.
              </p>
            </div>

            {invite && (
              <div className="bg-[rgb(var(--ml-bg-secondary))] border border-[rgb(var(--ml-border))] rounded-xl p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between border-b border-[rgb(var(--ml-border))]/60 pb-3">
                  <div>
                    <span className="text-xs font-medium text-[rgb(var(--ml-text-tertiary))] uppercase tracking-wider block mb-0.5">
                      Property
                    </span>
                    <span className="text-base font-semibold text-[rgb(var(--ml-text-primary))] flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
                      {invite.property_name}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-[rgb(var(--ml-text-tertiary))] uppercase tracking-wider block mb-0.5">
                      Unit
                    </span>
                    <span className="text-base font-semibold text-[rgb(var(--ml-text-primary))] flex items-center justify-end gap-1.5">
                      <DoorOpen className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
                      {invite.unit_label}
                    </span>
                  </div>
                </div>

                {(invite.lease_start || invite.lease_end) && (
                  <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[rgb(var(--ml-bg-primary))]/70 border border-[rgb(var(--ml-border))]/50 text-xs">
                    <div className="flex items-center gap-1.5 text-[rgb(var(--ml-text-secondary))] font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                      <span>Lease Period</span>
                    </div>
                    <span className="font-semibold text-[rgb(var(--ml-text-primary))]">
                      {invite.lease_start && invite.lease_end
                        ? `${new Date(invite.lease_start).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} – ${new Date(invite.lease_end).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                        : invite.lease_start
                        ? `Starts ${new Date(invite.lease_start).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                        : `Ends ${new Date(invite.lease_end!).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5 text-[rgb(var(--ml-text-secondary))]">
                    <UserCheck className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                    <span>Invited by <strong>{invite.landlord_name || "Landlord"}</strong></span>
                  </div>
                  {invite.property_city && (
                    <div className="flex items-center gap-1 text-[rgb(var(--ml-text-tertiary))]">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{invite.property_city}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full h-12 rounded-xl bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-accent-foreground))] font-semibold shadow-md flex items-center justify-center gap-2 hover:opacity-95 transition-all text-base"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Joining Unit...
                  </>
                ) : (
                  <>
                    Accept Invite & Join
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
