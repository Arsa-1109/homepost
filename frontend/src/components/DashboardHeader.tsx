import { buttonVariants } from "@/components/ui/button"
import { Megaphone, UserPlus } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function DashboardHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Landlord Dashboard</h1>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link 
          href="/landlord/units" 
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Tenant
        </Link>
        <Link 
          href="/landlord/announcements" 
          className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white")}
        >
          <Megaphone className="mr-2 h-4 w-4" />
          New Announcement
        </Link>
      </div>
    </div>
  )
}
