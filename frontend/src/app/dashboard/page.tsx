import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardRedirect() {
  const authState = await auth();
  const token = await authState.getToken();

  if (!token) {
    redirect("/sign-in");
  }

  let userRole = null;

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

    if (res.ok) {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const user = await res.json();
        userRole = user.role;
      } else {
        console.warn("API returned non-JSON response:", res.status);
      }
    }
  } catch (err) {
    console.error("Dashboard fetch failed:", err);
  }

  if (userRole === "landlord") {
    redirect("/landlord/dashboard");
  } else if (userRole === "tenant") {
    redirect("/tenant/dashboard");
  } else {
    redirect("/onboarding");
  }
}
