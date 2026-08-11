import { Megaphone, UserPlus, LayoutDashboard } from "lucide-react"
import Link from "next/link"

export function DashboardHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[rgb(var(--ml-text-primary))]">
          Landlord Dashboard
        </h1>
        <p className="text-sm font-semibold text-[rgb(var(--ml-text-secondary))] mt-2">
          Overview of property performance, maintenance requests, and tenant activity.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link 
          href="/landlord/units" 
          className="text-xs text-center font-bold border border-border/60 text-[rgb(var(--ml-text-primary))] bg-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-bg-secondary))] px-4 py-2.5 rounded-xl transition-all w-full sm:w-auto cursor-pointer hover-lift shadow-sm flex items-center justify-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Invite Tenant
        </Link>
        <Link 
          href="/landlord/announcements" 
          className="text-xs text-center bg-[rgb(var(--ml-accent))] text-[rgb(var(--ml-bg-primary))] font-extrabold px-4 py-2.5 rounded-xl hover:bg-[rgb(var(--ml-accent-dark))] transition-all w-full sm:w-auto cursor-pointer hover-lift shadow-[0_4px_12px_rgba(var(--ml-accent),0.15)] flex items-center justify-center gap-2"
        >
          <Megaphone className="h-4 w-4" />
          New Announcement
        </Link>
      </div>
    </div>
  )
}
