import { SignUp } from "@clerk/nextjs";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ intent?: string; landlord_email?: string }> }) {
  const params = await searchParams;
  const intent = params.intent;
  const landlordEmail = params.landlord_email;

  let fallbackUrl = "/sync-role";
  if (intent) {
    fallbackUrl += `?intent=${intent}`;
    if (landlordEmail) fallbackUrl += `&landlord_email=${encodeURIComponent(landlordEmail)}`;
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
      <SignUp fallbackRedirectUrl={fallbackUrl} />
    </div>
  );
}
