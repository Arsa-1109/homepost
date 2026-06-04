import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardRedirect() {
  const authState = await auth();
  const token = await authState.getToken();

  if (!token) {
    redirect("/sign-in");
  }

  try {
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    if (!baseUrl.startsWith("http")) {
      baseUrl = `https://${baseUrl}`;
    }
    const res = await fetch(`${baseUrl}/api/v1/onboarding/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: "no-store"
    });

    if (!res.ok) {
      redirect("/onboarding");
    }

    const user = await res.json();

    if (user.role === "landlord") {
      redirect("/landlord/dashboard");
    } else if (user.role === "tenant") {
      redirect("/tenant/dashboard");
    } else {
      redirect("/onboarding");
    }
  } catch (err) {
    console.error("Dashboard redirect failed:", err);
    redirect("/onboarding");
  }
}
