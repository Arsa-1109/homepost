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

  // Track first application so initial paint/hydration never animates
  const hasAppliedRef = React.useRef(false);

  const applyDom = React.useCallback(
    (targetTheme: "light" | "dark") => {
      const root = document.documentElement;
      const attributes = Array.isArray(attribute) ? attribute : [attribute];
      for (const attr of attributes) {
        if (attr === "class") {
          root.classList.remove("light", "dark");
          root.classList.add(targetTheme);
        } else {
          root.setAttribute(attr, targetTheme);
        }
      }
    },
    [attribute]
  );

  const applyTheme = React.useCallback(
    (targetTheme: "light" | "dark") => {
      const root = document.documentElement;
      const isFirstApply = !hasAppliedRef.current;
      hasAppliedRef.current = true;

      const reducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Initial mount / hydration / forced no-animation: swap instantly
      // with CSS transitions suppressed to avoid any flash or stutter.
      if (
        isFirstApply ||
        disableTransitionOnChange ||
        reducedMotion ||
        typeof document.startViewTransition !== "function"
      ) {
        root.classList.add("theme-switching");
        applyDom(targetTheme);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            root.classList.remove("theme-switching");
          });
        });
        return;
      }

      // Smooth path: View Transitions API cross-fades the whole document
      // snapshot; CSS color transitions are suppressed during the swap so
      // the two mechanisms don't compete.
      document.startViewTransition(() => {
        root.classList.add("theme-switching");
        applyDom(targetTheme);
      });
    },
    [applyDom, disableTransitionOnChange]
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
