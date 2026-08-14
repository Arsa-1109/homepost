import { SignIn } from "@clerk/nextjs";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; landlord_email?: string }>;
}) {
  const params = await searchParams;
  const intent = params.intent;
  const landlordEmail = params.landlord_email;

  let fallbackUrl = "/sync-role";
  if (intent) {
    fallbackUrl += `?intent=${intent}`;
    if (landlordEmail) fallbackUrl += `&landlord_email=${encodeURIComponent(landlordEmail)}`;
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Ambient background lighting & soft depth */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
        {/* Top-center radial glow with brand lime accent */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full bg-[rgb(var(--ml-accent))]/10 dark:bg-[rgb(var(--ml-accent))]/15 blur-[120px]" />
        {/* Bottom-right secondary soft ambient glow */}
        <div className="absolute -bottom-24 right-1/4 w-[450px] h-[450px] rounded-full bg-[rgb(var(--ml-accent))]/5 dark:bg-[rgb(var(--ml-accent))]/10 blur-[140px]" />
        {/* Subtle radial depth gradient layer */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(132,204,22,0.1),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(132,204,22,0.12),rgba(5,5,5,0))]" />
      </div>

      <SignIn
        fallbackRedirectUrl={fallbackUrl}
        appearance={clerkAuthAppearance}
      />
    </div>
  );
}
