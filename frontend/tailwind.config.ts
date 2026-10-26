import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "rgb(var(--ml-border) / <alpha-value>)",
        input: "rgb(var(--ml-border) / <alpha-value>)",
        ring: "rgb(var(--ml-accent) / <alpha-value>)",
        background: "rgb(var(--ml-bg-primary) / <alpha-value>)",
        foreground: "rgb(var(--ml-text-primary) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--ml-text-primary) / <alpha-value>)",
          foreground: "rgb(var(--ml-bg-primary) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--ml-bg-tertiary) / <alpha-value>)",
          foreground: "rgb(var(--ml-text-primary) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive-rgb, 239 68 68) / <alpha-value>)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "rgb(var(--ml-bg-tertiary) / <alpha-value>)",
          foreground: "rgb(var(--ml-text-secondary) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--ml-bg-secondary) / <alpha-value>)",
          foreground: "rgb(var(--ml-text-primary) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--ml-bg-secondary) / <alpha-value>)",
          foreground: "rgb(var(--ml-text-primary) / <alpha-value>)",
        },
        // Stepped dark slate palette
        slate: {
          850: "#1a1f2e",
          950: "#0f1219",
        },
        // Calibrated lime/emerald accent
        accent: {
          DEFAULT: "rgb(var(--ml-accent) / <alpha-value>)",
          foreground: "var(--accent-foreground)",
          light: "#a3e635",
          dark: "#65a30d",
        },
        // Off-white for light mode
        surface: {
          light: "#f8f9fa",
          DEFAULT: "#ffffff",
        },
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
