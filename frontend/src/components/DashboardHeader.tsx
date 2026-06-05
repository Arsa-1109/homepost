import { Button } from "@/components/ui/button"
import { Megaphone, UserPlus } from "lucide-react"
import Link from "next/link"

export function DashboardHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Landlord Dashboard</h1>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="w-full sm:w-auto" asChild>
          <Link href="/landlord/tenants">
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Tenant
          </Link>
        </Button>
        <Button className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white" asChild>
          <Link href="/landlord/announcements">
            <Megaphone className="mr-2 h-4 w-4" />
            New Announcement
          </Link>
        </Button>
      </div>
    </div>
  )
}
