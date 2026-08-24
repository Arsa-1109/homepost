import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers";
import { UserSync } from "@/components/UserSync";
import { Outfit } from "next/font/google";
import { RootHeader } from "@/components/RootHeader";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

const CommandPalette = dynamic(
  () => import("@/components/CommandPalette").then((m) => m.CommandPalette)
);

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });

export const metadata: Metadata = {
  title: "Homepost — Tenant Portal",
  description:
    "A radically simple property management portal for individual owners managing 1–5 properties.",
};

const themeScript = `(function() {
  try {
    var stored = localStorage.getItem('theme') || 'system';
    var isDark = stored === 'dark' || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.add(isDark ? 'dark' : 'light');
    document.documentElement.classList.remove(isDark ? 'light' : 'dark');
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className={cn(
        "font-sans", 
        outfit.variable
      )}
    >
      <head>
        <meta name="color-scheme" content="light dark" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <ClerkProvider>
          <UserSync />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <RootHeader />
            {children}
            <CommandPalette />
            <Toaster />
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
