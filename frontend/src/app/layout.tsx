import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/providers";
import { UserSync } from "@/components/UserSync";
import { Outfit } from "next/font/google";
import { CommandPalette } from "@/components/CommandPalette";
import { RootHeader } from "@/components/RootHeader";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "Homepost — Tenant Portal",
  description:
    "A radically simple property management portal for individual owners managing 1–5 properties.",
};

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
      <body>
        <ClerkProvider>
          <UserSync />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange={true}
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
