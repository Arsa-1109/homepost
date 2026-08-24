"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputGroup,
  InputGroupAddon,
} from "@/components/ui/input-group"
import { SearchIcon, CheckIcon } from "lucide-react"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-2xl bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))]",
        className
      )}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
  children: React.ReactNode
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent
        className={cn(
          "top-[18%] translate-y-0 w-full max-w-[calc(100%-1.5rem)] sm:max-w-xl md:max-w-2xl rounded-2xl sm:rounded-3xl border border-border/80 bg-[rgb(var(--ml-bg-secondary))] shadow-[0_24px_80px_rgba(0,0,0,0.25)] p-0 overflow-hidden outline-none duration-200 animate-in fade-in-0 zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          className
        )}
        showCloseButton={showCloseButton}
      >
        <Command className="flex flex-col w-full overflow-hidden bg-[rgb(var(--ml-bg-secondary))] text-[rgb(var(--ml-text-primary))]">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="flex items-center border-b border-border/60 px-4 py-3.5 bg-[rgb(var(--ml-bg-secondary))]">
      <SearchIcon className="mr-3 size-4.5 shrink-0 text-[rgb(var(--ml-text-secondary))]" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "flex h-8 w-full bg-transparent text-sm font-medium text-[rgb(var(--ml-text-primary))] placeholder:text-[rgb(var(--ml-text-secondary))]/60 outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 border-none ring-0 shadow-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-[380px] overflow-x-hidden overflow-y-auto p-2 scroll-py-2 outline-none",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-10 text-center text-xs font-semibold text-[rgb(var(--ml-text-secondary))]", className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-[rgb(var(--ml-text-primary))] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-extrabold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-[rgb(var(--ml-text-secondary))]/80",
        className
      )}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("my-1.5 h-px bg-border/60", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  children,
  onSelect,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-[rgb(var(--ml-text-primary))] outline-none select-none transition-all duration-150 ease-out active:scale-[0.98] hover:bg-[rgb(var(--ml-bg-tertiary))] hover:text-[rgb(var(--ml-text-primary))] aria-selected:bg-[rgb(var(--ml-bg-tertiary))] aria-selected:text-[rgb(var(--ml-text-primary))] data-[selected=true]:bg-[rgb(var(--ml-bg-tertiary))] data-[selected=true]:text-[rgb(var(--ml-text-primary))] data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:shrink-0 [&_svg]:size-4.5 [&_svg]:text-[rgb(var(--ml-text-secondary))] hover:[&_svg]:text-[rgb(var(--ml-accent))] aria-selected:[&_svg]:text-[rgb(var(--ml-accent))] group-hover/command-item:[&_svg]:text-[rgb(var(--ml-accent))]",
        className
      )}
      onSelect={onSelect}
      onClick={(e) => {
        if (onSelect) {
          onSelect(props.value || "");
        }
      }}
      {...props}
    >
      {children}
      <CheckIcon className="ml-auto size-4 opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" />
    </CommandPrimitive.Item>
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-[10px] font-mono font-semibold tracking-wider text-[rgb(var(--ml-text-secondary))] border border-border/60 bg-[rgb(var(--ml-bg-primary))] px-1.5 py-0.5 rounded-md",
        className
      )}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
