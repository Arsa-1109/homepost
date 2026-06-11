"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Home, ClipboardList, Megaphone, Settings, FileText, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push("/landlord/dashboard"))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/landlord/properties"))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Properties</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/landlord/units"))}>
            <Home className="mr-2 h-4 w-4" />
            <span>Units</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/landlord/requests"))}>
            <ClipboardList className="mr-2 h-4 w-4" />
            <span>Requests</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/landlord/announcements"))}>
            <Megaphone className="mr-2 h-4 w-4" />
            <span>Announcements</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/landlord/documents"))}>
            <FileText className="mr-2 h-4 w-4" />
            <span>Documents</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Settings & Theme">
          <CommandItem onSelect={() => runCommand(() => router.push("/landlord/settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark Mode</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
