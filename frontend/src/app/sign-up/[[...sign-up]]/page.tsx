import { SignUp } from "@clerk/nextjs";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

export default async function SignUpPage({
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
    <div className="relative min-h-[calc(100vh-80px)] w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden bg-[rgb(var(--ml-bg-primary))]">
      {/* Ambient background grid & refined vignette */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
        {/* Subtle Micro Dot Matrix Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(132,204,22,0.4)_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.08] dark:opacity-[0.09]" />

        {/* Top-center soft ambient light cone */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/3 w-[600px] h-[320px] rounded-full bg-[rgb(var(--ml-accent))]/10 blur-[100px] pointer-events-none" />

        {/* Radial vignette mask */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,transparent_30%,rgb(var(--ml-bg-primary))_100%)]" />
      </div>

      {/* Centered Auth Card Container */}
      <div className="w-full max-w-[440px] flex items-center justify-center relative z-10">
        <SignUp
          fallbackRedirectUrl={fallbackUrl}
          appearance={clerkAuthAppearance}
        />
      </div>
    </div>
  );
}
