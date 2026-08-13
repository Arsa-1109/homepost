import { Megaphone, UserPlus, LayoutDashboard } from "lucide-react"
import Link from "next/link"

export function DashboardHeader() {
  return (
    <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-border bg-[rgb(var(--ml-bg-secondary))] shadow-sm">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/20">
            <LayoutDashboard className="w-3.5 h-3.5" />
            Control Center
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
            Landlord Dashboard
          </h1>
          <p className="text-sm font-medium text-[rgb(var(--ml-text-secondary))] leading-relaxed">
            Overview of property performance, maintenance requests, and tenant activity.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <Link 
            href="/landlord/units" 
            className="text-xs font-bold border border-border/60 text-[rgb(var(--ml-text-primary))] bg-[rgb(var(--ml-bg-primary))]/80 hover:bg-[rgb(var(--ml-bg-tertiary))] hover:border-[rgb(var(--ml-text-primary))]/40 px-4 py-2.5 rounded-xl transition-all duration-200 ease-out active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="h-4 w-4 text-[rgb(var(--ml-accent))]" />
            Invite Tenant
          </Link>
          <Link 
            href="/landlord/announcements" 
            className="text-xs bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] font-extrabold px-4 py-2.5 rounded-xl hover:bg-[rgb(var(--ml-accent))] hover:text-black transition-all duration-200 ease-out active:scale-[0.98] shadow-sm hover:shadow-[0_4px_16px_rgba(var(--ml-accent),0.2)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Megaphone className="h-4 w-4" />
            New Announcement
          </Link>
        </div>
      </div>
    </div>
  )
}
