import { buttonVariants } from "@/components/ui/button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { UserPlus, Megaphone } from "lucide-react"

export function DashboardHeader({ description }: { description?: string }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-slide-up">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Landlord Dashboard</h1>
        {description && (
          <div className="text-muted-foreground text-sm mt-1 font-medium">{description}</div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link 
          href="/landlord/units" 
          className={cn(
            buttonVariants({ variant: "outline" }), 
            "w-full sm:w-auto border-border bg-card text-foreground hover:bg-muted hover:text-foreground transition-all font-semibold rounded-lg"
          )}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Invite tenant
        </Link>
        <Link 
          href="/landlord/announcements" 
          className={cn(
            buttonVariants({ variant: "default" }), 
            "w-full sm:w-auto bg-[#84CC16] hover:bg-[#65A30D] text-[#04241D] font-bold border-none shadow-[0_4px_14px_rgba(132,204,22,0.15)] hover:shadow-[0_6px_20px_rgba(132,204,22,0.25)] transition-all rounded-lg"
          )}
        >
          <Megaphone className="mr-2 h-4 w-4" />
          New announcement
        </Link>
      </div>
    </div>
  )
}
