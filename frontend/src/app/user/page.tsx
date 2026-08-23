import { UserProfile } from "@clerk/nextjs";

export default function UserPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <UserProfile />
    </main>
  );
}
