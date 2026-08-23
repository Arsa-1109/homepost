"use client";

import * as React from "react";

export type Theme = "light" | "dark" | "system";

export interface UseThemeProps {
  theme: Theme | undefined;
  setTheme: (theme: string) => void;
  resolvedTheme: "light" | "dark" | undefined;
  systemTheme: "light" | "dark" | undefined;
  themes: string[];
  forcedTheme?: string;
}

const ThemeContext = React.createContext<UseThemeProps>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
  systemTheme: "light",
  themes: ["light", "dark", "system"],
});

export const useTheme = () => React.useContext(ThemeContext);

export interface ThemeProviderProps {
  children?: React.ReactNode;
  attribute?: string | string[];
  defaultTheme?: string;
  enableSystem?: boolean;
  enableColorScheme?: boolean;
  storageKey?: string;
  themes?: string[];
  forcedTheme?: string;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  storageKey = "theme",
  themes = ["light", "dark", "system"],
  forcedTheme,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => {
    if (typeof window === "undefined") return defaultTheme as Theme;
    try {
      return (localStorage.getItem(storageKey) as Theme) || (defaultTheme as Theme);
    } catch {
      return defaultTheme as Theme;
    }
  });

  const [systemTheme, setSystemTheme] = React.useState<"light" | "dark" | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  // Listen to system theme changes
  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };
    media.addEventListener("change", handler);
    setSystemTheme(media.matches ? "dark" : "light");
    return () => media.removeEventListener("change", handler);
  }, []);

  const resolvedTheme: "light" | "dark" = forcedTheme
    ? (forcedTheme as "light" | "dark")
    : theme === "system"
    ? systemTheme || "light"
    : (theme as "light" | "dark");

  const applyTheme = React.useCallback(
    (targetTheme: "light" | "dark") => {
      const root = document.documentElement;
      if (disableTransitionOnChange) {
        root.classList.add("disable-transitions");
      }

      const attributes = Array.isArray(attribute) ? attribute : [attribute];
      for (const attr of attributes) {
        if (attr === "class") {
          root.classList.remove("light", "dark");
          root.classList.add(targetTheme);
        } else {
          root.setAttribute(attr, targetTheme);
        }
      }

      if (disableTransitionOnChange) {
        window.getComputedStyle(root).opacity;
        requestAnimationFrame(() => {
          root.classList.remove("disable-transitions");
        });
      }
    },
    [attribute, disableTransitionOnChange]
  );

  React.useEffect(() => {
    if (resolvedTheme) {
      applyTheme(resolvedTheme);
    }
  }, [resolvedTheme, applyTheme]);

  const setTheme = React.useCallback(
    (newTheme: string) => {
      const validTheme = (newTheme || "system") as Theme;
      setThemeState(validTheme);
      try {
        localStorage.setItem(storageKey, validTheme);
      } catch (e) {
        console.error(e);
      }
    },
    [storageKey]
  );

  const value = React.useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      systemTheme,
      themes,
      forcedTheme,
    }),
    [theme, setTheme, resolvedTheme, systemTheme, themes, forcedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
