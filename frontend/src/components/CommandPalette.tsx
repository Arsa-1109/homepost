"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Building2,
  Users,
  Wrench,
  Megaphone,
  FileText,
  Settings,
  Sun,
  Moon,
  Laptop,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import { useTheme } from "@/components/providers";

export function CommandPalette() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const openPalette = () => setOpen(true);
    document.addEventListener("keydown", down);
    document.addEventListener("open-command-palette", openPalette);
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("open-command-palette", openPalette);
    };
  }, []);

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false);
    command();
  }, []);

  const isLandlord = pathname?.startsWith("/landlord");
  const isTenant = pathname?.startsWith("/tenant");

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions (role-aware) */}
        {isLandlord && (
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => runCommand(() => router.push("/landlord/announcements?new=1"))}>
              <Megaphone className="mr-2 h-4 w-4" />
              <span>New Announcement</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/landlord/units?add=1"))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Add Unit</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/landlord/properties?new=1"))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>New Property</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/landlord/access-requests"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Review Access Requests</span>
            </CommandItem>
          </CommandGroup>
        )}
        {isTenant && (
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => runCommand(() => router.push("/tenant/requests/new"))}>
              <Wrench className="mr-2 h-4 w-4" />
              <span>File Maintenance Request</span>
            </CommandItem>
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Landlord Navigation */}
        {isLandlord && (
          <CommandGroup heading="Landlord Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push("/landlord/dashboard"))}>
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/landlord/properties"))}>
              <Building2 className="mr-2 h-4 w-4" />
              <span>Properties</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/landlord/access-requests"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Access Requests</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/landlord/units"))}>
              <Home className="mr-2 h-4 w-4" />
              <span>Units</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/landlord/requests"))}>
              <Wrench className="mr-2 h-4 w-4" />
              <span>Maintenance Requests</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/landlord/announcements"))}>
              <Megaphone className="mr-2 h-4 w-4" />
              <span>Announcements</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/landlord/documents"))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Documents</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/landlord/settings"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Tenant Navigation */}
        {isTenant && (
          <CommandGroup heading="Tenant Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push("/tenant/dashboard"))}>
              <Home className="mr-2 h-4 w-4" />
              <span>Home Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/tenant/requests"))}>
              <Wrench className="mr-2 h-4 w-4" />
              <span>Maintenance Requests</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/tenant/announcements"))}>
              <Megaphone className="mr-2 h-4 w-4" />
              <span>Announcements</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/tenant/documents"))}>
              <FileText className="mr-2 h-4 w-4" />
              <span>Documents & Leases</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/tenant/settings"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
        )}

        {/* Public / General Navigation */}
        {!isLandlord && !isTenant && (
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => runCommand(() => router.push("/"))}>
              <Home className="mr-2 h-4 w-4" />
              <span>Home</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/landlord/dashboard"))}>
              <Building2 className="mr-2 h-4 w-4" />
              <span>Landlord Portal</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/tenant/dashboard"))}>
              <Home className="mr-2 h-4 w-4" />
              <span>Tenant Portal</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/sign-in"))}>
              <LogIn className="mr-2 h-4 w-4" />
              <span>Sign In</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/sign-up"))}>
              <UserPlus className="mr-2 h-4 w-4" />
              <span>Sign Up</span>
            </CommandItem>
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Theme & Display Options */}
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark Mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
            <Laptop className="mr-2 h-4 w-4" />
            <span>System Default</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
