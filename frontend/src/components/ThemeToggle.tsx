"use client";

import * as React from "react";
import { Moon, Sun, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex bg-background border border-border p-1 rounded-xl gap-1 shadow-sm">
      <Button
        variant="ghost"
        size="icon"
        className={`w-8 h-8 rounded-lg ${mounted && theme === 'light' ? 'bg-secondary' : ''}`}
        onClick={() => setTheme("light")}
        title="Light Mode"
      >
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
        <span className="sr-only">Light Mode</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`w-8 h-8 rounded-lg ${mounted && theme === 'system' ? 'bg-secondary' : ''}`}
        onClick={() => setTheme("system")}
        title="System Default"
      >
        <Laptop className="h-[1.2rem] w-[1.2rem] transition-all" />
        <span className="sr-only">System Mode</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`w-8 h-8 rounded-lg ${mounted && theme === 'dark' ? 'bg-secondary' : ''}`}
        onClick={() => setTheme("dark")}
        title="Dark Mode"
      >
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
        <span className="sr-only">Dark Mode</span>
      </Button>
    </div>
  );
}
