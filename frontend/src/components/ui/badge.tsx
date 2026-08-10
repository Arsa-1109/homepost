import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-ring/50 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-[rgb(var(--ml-accent))]/15 text-[rgb(var(--ml-accent))] border-[rgb(var(--ml-accent))]/30",
        secondary:
          "bg-secondary text-secondary-foreground border-border",
        destructive:
          "bg-red-500/10 text-red-400 border-red-500/20",
        outline:
          "border-border text-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground",
        link: "text-[rgb(var(--ml-accent))] underline-offset-4 hover:underline",
        success:
          "bg-lime-500/10 text-lime-400 border-lime-500/20",
        warning:
          "bg-amber-500/10 text-amber-400 border-amber-500/20",
        orange:
          "bg-orange-500/10 text-orange-400 border-orange-500/20",
        info:
          "bg-blue-500/10 text-blue-400 border-blue-500/20",
        neutral:
          "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
