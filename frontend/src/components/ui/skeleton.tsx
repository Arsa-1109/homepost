import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-[rgb(var(--ml-border))]", className)}
      {...props}
    />
  )
}

export { Skeleton }
