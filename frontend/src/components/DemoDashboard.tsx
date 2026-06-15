"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Users, 
  Wrench, 
  Wallet, 
  LineChart, 
  Bell, 
  FileText, 
  MessageSquare,
  Search,
  Settings,
  Home
} from "lucide-react";

interface DemoDashboardProps {
  role?: "owner" | "tenant";
}

export function DemoDashboard({ role = "owner" }: DemoDashboardProps) {
  return (
    <div className="w-full max-w-5xl mx-auto aspect-video rounded-xl shadow-2xl overflow-hidden flex flex-col pointer-events-none ring-1 ring-border/50 glass-panel relative bg-background/50">
      
      {/* Top Navigation - Shared but with slight variations */}
      <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-muted/30 backdrop-blur-md z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
            {role === "owner" ? <Building2 className="w-4 h-4 text-primary" /> : <Home className="w-4 h-4 text-primary" />}
          </div>
          <div className="w-32 h-4 rounded-full bg-muted-foreground/20"></div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 rounded-full bg-muted-foreground/10 flex items-center justify-center">
            <Search className="w-3 h-3 text-muted-foreground/50" />
          </div>
          <div className="w-6 h-6 rounded-full bg-muted-foreground/10 flex items-center justify-center">
            <Bell className="w-3 h-3 text-muted-foreground/50" />
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 ml-2"></div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {role === "owner" ? (
          <motion.div 
            key="owner-dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="flex flex-1 overflow-hidden"
          >
            {/* Owner Sidebar */}
            <div className="w-64 border-r border-border p-4 flex flex-col gap-2 bg-muted/10 hidden md:flex">
              <div className="flex items-center gap-3 px-3 py-2 rounded-md bg-primary/10 text-primary border border-primary/20">
                <LineChart className="w-4 h-4" />
                <div className="w-24 h-3 rounded bg-primary/40"></div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground/60">
                <Building2 className="w-4 h-4" />
                <div className="w-20 h-3 rounded bg-muted-foreground/20"></div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground/60">
                <Users className="w-4 h-4" />
                <div className="w-16 h-3 rounded bg-muted-foreground/20"></div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground/60">
                <Wrench className="w-4 h-4" />
                <div className="w-24 h-3 rounded bg-muted-foreground/20"></div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground/60">
                <Wallet className="w-4 h-4" />
                <div className="w-16 h-3 rounded bg-muted-foreground/20"></div>
              </div>
              
              <div className="mt-auto flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground/60">
                <Settings className="w-4 h-4" />
                <div className="w-20 h-3 rounded bg-muted-foreground/20"></div>
              </div>
            </div>

            {/* Owner Main Content */}
            <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 bg-background/30 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <div className="w-48 h-6 rounded-md bg-foreground/20 mb-2"></div>
                  <div className="w-64 h-3 rounded-md bg-muted-foreground/30"></div>
                </div>
                <div className="w-32 h-10 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-sm bg-primary/40"></div>
                  <div className="w-16 h-3 rounded bg-primary/40"></div>
                </div>
              </div>

              {/* Owner Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Building2 className="w-16 h-16" />
                  </div>
                  <div className="w-24 h-4 rounded-full bg-muted-foreground/30"></div>
                  <div>
                    <div className="w-16 h-8 rounded-md bg-foreground/30 mb-2"></div>
                    <div className="w-32 h-3 rounded-md bg-green-500/30"></div>
                  </div>
                </div>
                <div className="h-32 rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Wallet className="w-16 h-16" />
                  </div>
                  <div className="w-20 h-4 rounded-full bg-muted-foreground/30"></div>
                  <div>
                    <div className="w-24 h-8 rounded-md bg-foreground/30 mb-2"></div>
                    <div className="w-28 h-3 rounded-md bg-green-500/30"></div>
                  </div>
                </div>
                <div className="h-32 rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10 text-destructive">
                    <Wrench className="w-16 h-16" />
                  </div>
                  <div className="w-28 h-4 rounded-full bg-muted-foreground/30"></div>
                  <div>
                    <div className="w-12 h-8 rounded-md bg-foreground/30 mb-2"></div>
                    <div className="w-24 h-3 rounded-md bg-destructive/30"></div>
                  </div>
                </div>
              </div>

              {/* Owner Main Chart/Table Area */}
              <div className="flex-1 rounded-xl border border-border bg-card/50 backdrop-blur-sm p-5 flex flex-col gap-5 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="w-40 h-5 rounded-md bg-muted-foreground/40"></div>
                  <div className="w-20 h-6 rounded-md bg-muted-foreground/20"></div>
                </div>
                <div className="flex-1 rounded-lg border border-border bg-muted/10 flex flex-col justify-start">
                  <div className="h-10 border-b border-border bg-muted/20 flex items-center px-4 gap-4">
                    <div className="w-1/4 h-3 rounded bg-muted-foreground/30"></div>
                    <div className="w-1/4 h-3 rounded bg-muted-foreground/30"></div>
                    <div className="w-1/4 h-3 rounded bg-muted-foreground/30"></div>
                    <div className="w-1/4 h-3 rounded bg-muted-foreground/30"></div>
                  </div>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 border-b border-border/50 flex items-center px-4 gap-4">
                      <div className="w-1/4 h-3 rounded bg-foreground/20"></div>
                      <div className="w-1/4 h-3 rounded bg-muted-foreground/20"></div>
                      <div className="w-1/4 flex">
                        <div className="w-16 h-5 rounded-full bg-green-500/10 border border-green-500/20"></div>
                      </div>
                      <div className="w-1/4 h-3 rounded bg-muted-foreground/20"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="tenant-dashboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="flex flex-1 flex-col overflow-hidden bg-background/30"
          >
            {/* Tenant Hero / Top section */}
            <div className="h-40 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border-b border-border relative overflow-hidden flex items-end p-8">
              <div className="absolute right-10 top-[-20px] opacity-5">
                <Home className="w-48 h-48" />
              </div>
              <div className="flex gap-6 items-center">
                <div className="w-20 h-20 rounded-xl bg-card border border-border shadow-lg flex items-center justify-center text-primary/40">
                  <Building2 className="w-10 h-10" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-48 h-6 rounded-md bg-foreground/20"></div>
                  <div className="w-32 h-4 rounded-md bg-muted-foreground/30"></div>
                </div>
              </div>
            </div>

            {/* Tenant Main Content */}
            <div className="flex-1 p-6 md:p-8 flex flex-col md:flex-row gap-6 overflow-y-auto max-w-5xl mx-auto w-full">
              
              <div className="flex-[2] flex flex-col gap-6">
                {/* Announcements Feed */}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-accent" />
                    <div className="w-32 h-5 rounded-md bg-muted-foreground/40"></div>
                  </div>
                  
                  <div className="p-5 rounded-xl border border-accent/20 bg-accent/5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="w-40 h-4 rounded-md bg-foreground/30"></div>
                      <div className="w-16 h-3 rounded-md bg-muted-foreground/30"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-full h-3 rounded bg-muted-foreground/20"></div>
                      <div className="w-full h-3 rounded bg-muted-foreground/20"></div>
                      <div className="w-3/4 h-3 rounded bg-muted-foreground/20"></div>
                    </div>
                  </div>

                  <div className="p-5 rounded-xl border border-border bg-card/50 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="w-32 h-4 rounded-md bg-foreground/20"></div>
                      <div className="w-16 h-3 rounded-md bg-muted-foreground/30"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="w-5/6 h-3 rounded bg-muted-foreground/20"></div>
                      <div className="w-4/6 h-3 rounded bg-muted-foreground/20"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-[1] flex flex-col gap-6">
                {/* Rent Status Card */}
                <div className="rounded-xl border border-border bg-card/80 shadow-sm p-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-full bg-green-500/40"></div>
                  <div className="w-24 h-4 rounded-full bg-muted-foreground/30 mb-4"></div>
                  <div className="w-32 h-8 rounded-md bg-foreground/30 mb-2"></div>
                  <div className="w-20 h-4 rounded-md bg-green-500/40 mb-6"></div>
                  <div className="w-full h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <div className="w-24 h-4 rounded bg-primary/40"></div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-xl border border-border bg-card/50 shadow-sm p-5">
                  <div className="w-32 h-4 rounded-full bg-muted-foreground/40 mb-4"></div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                      <Wrench className="w-5 h-5 text-muted-foreground/50" />
                      <div className="w-32 h-4 rounded bg-muted-foreground/30"></div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                      <FileText className="w-5 h-5 text-muted-foreground/50" />
                      <div className="w-28 h-4 rounded bg-muted-foreground/30"></div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                      <MessageSquare className="w-5 h-5 text-muted-foreground/50" />
                      <div className="w-24 h-4 rounded bg-muted-foreground/30"></div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
