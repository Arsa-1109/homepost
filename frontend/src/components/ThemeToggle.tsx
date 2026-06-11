"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex bg-[rgb(var(--ml-bg-tertiary))] border border-[rgb(var(--ml-border))] p-1 rounded-xl gap-1 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className={`w-8 h-8 rounded-lg ${mounted && resolvedTheme === 'light' ? 'bg-[rgb(var(--ml-bg-secondary))] shadow-sm border border-[rgb(var(--ml-border))]' : 'hover:bg-[rgb(var(--ml-bg-secondary))]'}`}
        onClick={() => setTheme("light")}
        title="Light Mode"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all text-[rgb(var(--ml-text-primary))]" />
        <span className="sr-only">Light Mode</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`w-8 h-8 rounded-lg ${mounted && resolvedTheme === 'dark' ? 'bg-[rgb(var(--ml-bg-secondary))] shadow-sm border border-[rgb(var(--ml-border))]' : 'hover:bg-[rgb(var(--ml-bg-secondary))]'}`}
        onClick={() => setTheme("dark")}
        title="Dark Mode"
      >
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all text-[rgb(var(--ml-text-primary))]" />
        <span className="sr-only">Dark Mode</span>
      </Button>
    </div>
  );
}
