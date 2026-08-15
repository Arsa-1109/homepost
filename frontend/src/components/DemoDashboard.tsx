"use client";

import React, { useState } from "react";
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
  Home,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  Plus,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Zap,
  Droplets
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DemoDashboardProps {
  role?: "owner" | "tenant";
  onLaunchDemo?: (role: "owner" | "tenant") => void;
}

export function DemoDashboard({ role = "owner", onLaunchDemo }: DemoDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");

  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-border/80 glass-panel relative bg-card/75 backdrop-blur-2xl transition-all duration-300 ring-1 ring-white/10 dark:ring-white/5">
      
      {/* Top Interactive Demo Browser Header */}
      <div className="h-16 border-b border-border/70 flex items-center justify-between px-4 sm:px-6 bg-[rgb(var(--ml-bg-secondary))]/90 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600/30" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/30" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/30" />
          </div>
          
          <div className="h-4 w-px bg-border/80 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[rgb(var(--ml-accent))]/15 border border-[rgb(var(--ml-accent))]/30 flex items-center justify-center text-[rgb(var(--ml-accent))]">
              {role === "owner" ? <Building2 className="w-4 h-4" /> : <Home className="w-4 h-4" />}
            </div>
            <span className="font-bold text-sm text-[rgb(var(--ml-text-primary))] tracking-tight">
              Homepost <span className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] ml-1">/ {role === "owner" ? "Portfolio Manager" : "Resident Portal"}</span>
            </span>
          </div>

          <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/20">
            <Sparkles className="w-2.5 h-2.5" /> Interactive Preview
          </span>
        </div>

        {/* Center Search Preview (Hidden on small mobile) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background/60 border border-border/60 text-xs text-[rgb(var(--ml-text-secondary))] w-64">
          <Search className="w-3.5 h-3.5 opacity-60 shrink-0" />
          <span className="truncate">{role === "owner" ? "Search units, tenants, tickets..." : "Search docs, notices, requests..."}</span>
          <kbd className="ml-auto text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/50">⌘K</kbd>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative p-2 rounded-xl bg-background/50 border border-border/50 text-[rgb(var(--ml-text-secondary))] hover:text-[rgb(var(--ml-text-primary))] transition-colors">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[rgb(var(--ml-accent))] ring-2 ring-background" />
          </div>

          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-border/60">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.7)] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {role === "owner" ? "MV" : "SJ"}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-[rgb(var(--ml-text-primary))] leading-tight">
                {role === "owner" ? "Marcus Vance" : "Sarah Jenkins"}
              </span>
              <span className="text-[10px] font-semibold text-[rgb(var(--ml-text-secondary))] leading-tight capitalize">
                {role === "owner" ? "Demo Owner" : "Unit 101"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Animated Role Transitions */}
      <div className="relative min-h-[560px] flex flex-col bg-background/40">
        <AnimatePresence mode="wait">
          {role === "owner" ? (
            <motion.div 
              key="owner-preview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-1 overflow-hidden"
            >
              {/* Sidebar Navigation */}
              <div className="w-56 border-r border-border/70 p-4 flex-col gap-1.5 bg-[rgb(var(--ml-bg-secondary))]/50 hidden lg:flex shrink-0">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] px-3 py-1 mb-1">
                  Navigation
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[rgb(var(--ml-bg-tertiary))] text-[rgb(var(--ml-accent))] font-bold text-xs border border-[rgb(var(--ml-accent))]/20 shadow-xs">
                  <LineChart className="w-4 h-4" />
                  <span>Dashboard</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-[rgb(var(--ml-text-secondary))] hover:bg-muted/40 font-semibold text-xs transition-colors">
                  <Building2 className="w-4 h-4" />
                  <span>Properties (2)</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-[rgb(var(--ml-text-secondary))] hover:bg-muted/40 font-semibold text-xs transition-colors">
                  <Home className="w-4 h-4" />
                  <span>Units (4)</span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 rounded-xl text-[rgb(var(--ml-text-secondary))] hover:bg-muted/40 font-semibold text-xs transition-colors">
                  <div className="flex items-center gap-3">
                    <Wrench className="w-4 h-4" />
                    <span>Requests</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">3</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-[rgb(var(--ml-text-secondary))] hover:bg-muted/40 font-semibold text-xs transition-colors">
                  <Bell className="w-4 h-4" />
                  <span>Announcements</span>
                </div>
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl text-[rgb(var(--ml-text-secondary))] hover:bg-muted/40 font-semibold text-xs transition-colors">
                  <FileText className="w-4 h-4" />
                  <span>Documents</span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-border/60 flex items-center justify-between px-2 text-[11px] text-[rgb(var(--ml-text-secondary))]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Database
                  </span>
                  <span className="font-mono text-[10px] opacity-70">v2.4</span>
                </div>
              </div>

              {/* Main Owner Content Area */}
              <div className="flex-1 p-4 sm:p-6 lg:p-7 flex flex-col gap-6 overflow-y-auto max-w-full">
                
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/50">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
                      Portfolio Command Center
                    </h3>
                    <p className="text-xs text-[rgb(var(--ml-text-secondary))] font-medium mt-0.5">
                      2 properties in Austin & San Diego · 4 total units across portfolio
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      100% Operational
                    </span>
                  </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: Occupancy */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between shadow-xs relative overflow-hidden group hover:border-[rgb(var(--ml-accent))]/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">Portfolio Occupancy</span>
                      <div className="p-2 rounded-xl bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))]">
                        <Building2 className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-[rgb(var(--ml-text-primary))] tabular-nums">50%</span>
                        <span className="text-xs font-bold text-[rgb(var(--ml-text-secondary))]">2 of 4 Units</span>
                      </div>
                      <div className="w-full bg-border/60 h-2 rounded-full mt-3 overflow-hidden flex">
                        <div className="bg-emerald-500 h-full w-1/2 rounded-full" />
                        <div className="bg-amber-500/40 h-full w-1/2" />
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-semibold text-[rgb(var(--ml-text-secondary))] mt-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">2 Occupied</span>
                        <span>2 Vacant</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Rent Roll */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between shadow-xs relative overflow-hidden group hover:border-[rgb(var(--ml-accent))]/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">Active Rent Roll</span>
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                        <Wallet className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-[rgb(var(--ml-text-primary))] tabular-nums">$4,200</span>
                        <span className="text-xs font-bold text-muted-foreground">/ month</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>100% on-time this month</span>
                      </div>
                      <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-medium block mt-1">
                        Next cycle due 1st
                      </span>
                    </div>
                  </div>

                  {/* Card 3: Maintenance Health */}
                  <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] flex flex-col justify-between shadow-xs relative overflow-hidden group hover:border-[rgb(var(--ml-accent))]/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">Maintenance Queue</span>
                      <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                        <Wrench className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-black text-[rgb(var(--ml-text-primary))] tabular-nums">3 Tickets</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">1 Urgent</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">1 In Progress</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">1 Resolved</span>
                      </div>
                      <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-medium block mt-1.5">
                        Avg resolution time: 1.8 days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Two Column Grid: Active Maintenance & Property Units */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* Left (Maintenance List & Recent Feed) */}
                  <div className="lg:col-span-7 flex flex-col gap-4">
                    <div className="p-5 rounded-2xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[rgb(var(--ml-accent))]" />
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-primary))]">
                            Active Maintenance Queue
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-[rgb(var(--ml-text-secondary))]">
                          3 total tickets
                        </span>
                      </div>

                      {/* Ticket 1: Urgent HVAC */}
                      <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-500 flex items-center justify-center shrink-0 mt-0.5">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[rgb(var(--ml-text-primary))] truncate">
                                HVAC blowing warm air
                              </span>
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-red-500/20 text-red-600 dark:text-red-400">
                                Urgent
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                In Progress
                              </span>
                            </div>
                            <p className="text-[11px] text-[rgb(var(--ml-text-secondary))] font-medium mt-0.5">
                              Sunset Vista · Unit 2A (Alex Rivera)
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1 italic">
                              &ldquo;Apex Heating & Air dispatched. Tech scheduled Mon 10 AM.&rdquo;
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-medium shrink-0">
                          4d ago
                        </span>
                      </div>

                      {/* Ticket 2: High Sink Leak */}
                      <div className="p-3.5 rounded-xl border border-orange-500/20 bg-orange-500/5 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                            <Droplets className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[rgb(var(--ml-text-primary))] truncate">
                                Leaking kitchen sink pipe
                              </span>
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-600 dark:text-orange-400">
                                High
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                Open
                              </span>
                            </div>
                            <p className="text-[11px] text-[rgb(var(--ml-text-secondary))] font-medium mt-0.5">
                              Maplewood Heights · Unit 101 (Sarah Jenkins)
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-medium shrink-0">
                          2d ago
                        </span>
                      </div>

                      {/* Ticket 3: Resolved Door Latch */}
                      <div className="p-3.5 rounded-xl border border-border/50 bg-background/50 flex items-start justify-between gap-3 opacity-80">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-[rgb(var(--ml-text-primary))] truncate">
                                Broken balcony door latch
                              </span>
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                                Low
                              </span>
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                Resolved
                              </span>
                            </div>
                            <p className="text-[11px] text-[rgb(var(--ml-text-secondary))] font-medium mt-0.5">
                              Maplewood Heights · Unit 101
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] text-[rgb(var(--ml-text-secondary))] font-medium shrink-0">
                          10d ago
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right (Units & Properties Overview) */}
                  <div className="lg:col-span-5 flex flex-col gap-4">
                    <div className="p-5 rounded-2xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-primary))]">
                            Units & Occupancy
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[rgb(var(--ml-accent))]">
                          4 Units Total
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {/* Unit 1 */}
                        <div className="p-3 rounded-xl border border-border/60 bg-background/50 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[rgb(var(--ml-bg-tertiary))] font-black text-xs flex items-center justify-center text-[rgb(var(--ml-text-primary))]">
                              101
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[rgb(var(--ml-text-primary))]">
                                Maplewood Heights · Unit 101
                              </div>
                              <div className="text-[11px] text-[rgb(var(--ml-text-secondary))]">
                                Sarah Jenkins · $2,100/mo
                              </div>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Occupied
                          </span>
                        </div>

                        {/* Unit 2 */}
                        <div className="p-3 rounded-xl border border-border/60 bg-background/50 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[rgb(var(--ml-bg-tertiary))] font-black text-xs flex items-center justify-center text-[rgb(var(--ml-text-primary))]">
                              2A
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[rgb(var(--ml-text-primary))]">
                                Sunset Vista · Unit 2A
                              </div>
                              <div className="text-[11px] text-[rgb(var(--ml-text-secondary))]">
                                Alex Rivera · $2,100/mo
                              </div>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Occupied
                          </span>
                        </div>

                        {/* Unit 3 */}
                        <div className="p-3 rounded-xl border border-border/40 bg-background/30 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 opacity-70">
                            <div className="w-8 h-8 rounded-lg bg-muted font-black text-xs flex items-center justify-center text-muted-foreground">
                              102
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[rgb(var(--ml-text-primary))]">
                                Maplewood Heights · Unit 102
                              </div>
                              <div className="text-[11px] text-[rgb(var(--ml-text-secondary))]">
                                Vacant · Ready to lease
                              </div>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Vacant
                          </span>
                        </div>

                        {/* Unit 4 */}
                        <div className="p-3 rounded-xl border border-border/40 bg-background/30 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-3 opacity-70">
                            <div className="w-8 h-8 rounded-lg bg-muted font-black text-xs flex items-center justify-center text-muted-foreground">
                              2B
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[rgb(var(--ml-text-primary))]">
                                Sunset Vista · Unit 2B
                              </div>
                              <div className="text-[11px] text-[rgb(var(--ml-text-secondary))]">
                                Vacant · Turnover in progress
                              </div>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            Vacant
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="resident-preview"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-1 flex-col overflow-hidden"
            >
              {/* Resident Welcome Banner */}
              <div className="border-b border-border/70 bg-gradient-to-r from-[rgb(var(--ml-accent))]/10 via-[rgb(var(--ml-bg-secondary))] to-transparent p-5 sm:p-7 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-card border border-border shadow-md flex items-center justify-center text-[rgb(var(--ml-accent))] shrink-0">
                    <Home className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[rgb(var(--ml-text-primary))]">
                        Welcome Home, Sarah
                      </h3>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Active Resident
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[rgb(var(--ml-text-secondary))] flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                      Unit 101 · Maplewood Heights (742 Evergreen Terrace, Austin TX)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button 
                    size="sm"
                    onClick={() => onLaunchDemo?.("tenant")}
                    className="rounded-xl font-bold text-xs bg-[rgb(var(--ml-text-primary))] text-[rgb(var(--ml-bg-primary))] hover:bg-[rgb(var(--ml-accent))] hover:text-black transition-all"
                  >
                    <Wrench className="w-3.5 h-3.5 mr-1.5" />
                    New Request
                  </Button>
                </div>
              </div>

              {/* Resident Main Content */}
              <div className="flex-1 p-4 sm:p-6 lg:p-7 flex flex-col gap-6 overflow-y-auto">
                
                {/* 2 Hero Cards: Rent Schedule + Lease Term */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Rent Due Card */}
                  <div className="p-5 rounded-2xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] flex items-center justify-between gap-4 shadow-xs hover:border-[rgb(var(--ml-accent))]/40 transition-all">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                        Monthly Rent
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-[rgb(var(--ml-text-primary))]">
                        $2,100 <span className="text-xs font-semibold text-muted-foreground">/ month</span>
                      </div>
                      <p className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">
                        Due on the 1st of each month · <span className="text-emerald-600 dark:text-emerald-400 font-bold">16 days left</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Paid / On Track
                      </span>
                    </div>
                  </div>

                  {/* Lease Overview Card */}
                  <div className="p-5 rounded-2xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] flex items-center justify-between gap-4 shadow-xs hover:border-[rgb(var(--ml-accent))]/40 transition-all">
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[rgb(var(--ml-accent))]" />
                        Lease Agreement
                      </span>
                      <div className="text-2xl sm:text-3xl font-black text-[rgb(var(--ml-text-primary))]">
                        138 Days <span className="text-xs font-semibold text-muted-foreground">Remaining</span>
                      </div>
                      <p className="text-xs font-medium text-[rgb(var(--ml-text-secondary))]">
                        Jan 1, 2026 – Jan 1, 2027 (12-Month Lease)
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[rgb(var(--ml-accent))]/10 text-[rgb(var(--ml-accent))] border border-[rgb(var(--ml-accent))]/20">
                        Verified Valid
                      </span>
                    </div>
                  </div>
                </div>

                {/* Announcements Feed & Maintenance History */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  
                  {/* Left: Building & Unit Announcements */}
                  <div className="lg:col-span-6 flex flex-col gap-4">
                    <div className="p-5 rounded-2xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-primary))]">
                            Property Announcements
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">2 New</span>
                      </div>

                      {/* Announcement 1 */}
                      <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                            Unit 101 Specific Notice
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">Yesterday</span>
                        </div>
                        <h4 className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">
                          Scheduled Plumbing Riser Inspection (Unit 101)
                        </h4>
                        <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed">
                          Plumbing inspection for Unit 101 is scheduled for tomorrow at 2:00 PM to verify line pressure following building maintenance.
                        </p>
                      </div>

                      {/* Announcement 2 */}
                      <div className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-secondary))]">
                            Building-Wide Notice
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">5 days ago</span>
                        </div>
                        <h4 className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">
                          Annual Fire Alarm & Sprinkler Testing
                        </h4>
                        <p className="text-xs text-[rgb(var(--ml-text-secondary))] leading-relaxed line-clamp-2">
                          The city fire department will be conducting annual audible alarm testing this Thursday between 10:00 AM and 2:00 PM.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Resident Maintenance Requests */}
                  <div className="lg:col-span-6 flex flex-col gap-4">
                    <div className="p-5 rounded-2xl border border-border/70 bg-[rgb(var(--ml-bg-secondary))] flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border/40">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-[rgb(var(--ml-accent))]" />
                          <span className="text-xs font-extrabold uppercase tracking-wider text-[rgb(var(--ml-text-primary))]">
                            My Service Requests
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-[rgb(var(--ml-accent))]">2 Tickets</span>
                      </div>

                      {/* Active Ticket */}
                      <div className="p-4 rounded-xl border border-orange-500/25 bg-orange-500/5 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Status: Open
                          </span>
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400">High Priority</span>
                        </div>
                        <h4 className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">
                          Leaking kitchen sink pipe
                        </h4>
                        <p className="text-xs text-[rgb(var(--ml-text-secondary))] line-clamp-2">
                          Noticeable water pooling under the kitchen sink cabinet after running faucet. P-trap joint loose.
                        </p>
                        <div className="text-[10px] text-muted-foreground font-medium pt-1">
                          Submitted 2 days ago · Attached: 1 photo
                        </div>
                      </div>

                      {/* Resolved Ticket */}
                      <div className="p-4 rounded-xl border border-border/60 bg-background/50 space-y-2 opacity-80">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Status: Resolved
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground">Low Priority</span>
                        </div>
                        <h4 className="text-sm font-bold text-[rgb(var(--ml-text-primary))]">
                          Broken balcony door latch
                        </h4>
                        <p className="text-xs text-[rgb(var(--ml-text-secondary))] line-clamp-1 italic">
                          &ldquo;Replaced strike plate and lubricated tracks. Tested lock mechanism successfully.&rdquo;
                        </p>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
                          Resolved 3 days ago by Marcus Vance
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Demo Bar: Instant Full Application Launch Bar */}
      <div className="p-4 sm:px-6 bg-[rgb(var(--ml-bg-secondary))] border-t border-border/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs z-20">
        <div className="flex items-center gap-2 text-[rgb(var(--ml-text-secondary))] font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>Interactive preview with real mock data. Experience the live app in one click:</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {role === "owner" ? (
            <Button
              size="sm"
              onClick={() => onLaunchDemo?.("owner")}
              className="w-full sm:w-auto font-bold rounded-xl px-5 bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.8)] text-white hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>Explore Live Owner Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => onLaunchDemo?.("tenant")}
              className="w-full sm:w-auto font-bold rounded-xl px-5 bg-gradient-to-r from-[rgb(var(--ml-accent))] to-[rgb(var(--ml-accent)/0.8)] text-white hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>Explore Live Resident Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}
