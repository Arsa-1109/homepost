"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Building2, Wrench, Users, Megaphone, FileText } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export const FEATURE_CONTENT = {
  owner: [
    {
      id: "owner-1",
      icon: Building2,
      title: "Portfolio Management",
      description:
        "Organize your real estate assets effortlessly. Create properties, manage individual units, and maintain a clear overview of your entire portfolio.",
    },
    {
      id: "owner-2",
      icon: Wrench,
      title: "Maintenance Tracking",
      description:
        "Receive, track, and resolve tenant service requests in one unified dashboard. Keep your properties in top condition and tenants happy.",
    },
    {
      id: "owner-3",
      icon: Users,
      title: "Tenant Communications",
      description:
        "Broadcast important announcements and securely share lease documents. Establish a reliable, centralized channel for all your tenant interactions.",
    },
  ],
  tenant: [
    {
      id: "tenant-1",
      icon: Wrench,
      title: "Quick Maintenance",
      description:
        "Report issues instantly with photos from your phone. Track the repair status from request to resolution without the back-and-forth.",
    },
    {
      id: "tenant-2",
      icon: Megaphone,
      title: "Stay Informed",
      description:
        "Receive instant notifications for property-wide announcements, scheduled maintenance, and important building updates.",
    },
    {
      id: "tenant-3",
      icon: FileText,
      title: "Your Documents",
      description:
        "Access your lease agreements, house rules, and important property documents securely, anytime you need them.",
    },
  ],
};

export interface FeatureSectionProps {
  activeFeatureRole: "owner" | "tenant";
  onRoleChange: (role: "owner" | "tenant") => void;
}

export function FeatureSection({
  activeFeatureRole,
  onRoleChange,
}: FeatureSectionProps) {
  const isMobile = useIsMobile();

  return (
    <>
      {/* Role Tabs */}
      <div
        role="tablist"
        aria-label="Feature Roles"
        className="flex flex-row justify-center items-center gap-4 md:gap-12 w-full relative z-20 mt-8 sm:mt-12 mb-8 md:mb-20"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeFeatureRole === "owner"}
          onClick={() => onRoleChange("owner")}
          className="relative flex flex-col items-center justify-center group transition-all duration-500 ease-out outline-none"
        >
          <h2
            className={`text-lg sm:text-xl md:text-4xl lg:text-5xl font-extrabold tracking-tight transition-all duration-500 ${
              activeFeatureRole === "owner"
                ? "text-foreground drop-shadow-[0_0_30px_rgb(var(--ml-accent)/0.6)] scale-105"
                : "text-muted-foreground/40 hover:text-muted-foreground/80 scale-100"
            }`}
          >
            Property Owners
          </h2>
          {activeFeatureRole === "owner" && (
            <motion.div
              layoutId="activeFeatureUnderline"
              className="absolute -bottom-6 left-0 right-0 mx-auto w-[80%] h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-80 shadow-[0_0_20px_rgb(var(--ml-accent))] blur-[1px]"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </button>

        <span className="text-muted-foreground/25 text-xl md:text-4xl font-light" aria-hidden="true">
          |
        </span>

        <button
          type="button"
          role="tab"
          aria-selected={activeFeatureRole === "tenant"}
          onClick={() => onRoleChange("tenant")}
          className="relative flex flex-col items-center justify-center group transition-all duration-500 ease-out outline-none"
        >
          <h2
            className={`text-lg sm:text-xl md:text-4xl lg:text-5xl font-extrabold tracking-tight transition-all duration-500 ${
              activeFeatureRole === "tenant"
                ? "text-foreground drop-shadow-[0_0_30px_rgb(var(--ml-accent)/0.6)] scale-105"
                : "text-muted-foreground/40 hover:text-muted-foreground/80 scale-100"
            }`}
          >
            Residents
          </h2>
          {activeFeatureRole === "tenant" && (
            <motion.div
              layoutId="activeFeatureUnderline"
              className="absolute -bottom-6 left-0 right-0 mx-auto w-[80%] h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-80 shadow-[0_0_20px_rgb(var(--ml-accent))] blur-[1px]"
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
        </button>
      </div>

      {/* Floating Bento Grid */}
      <section className="max-w-6xl w-full mx-auto mb-16 md:mb-32 px-4 relative z-10 perspective-[1200px]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgb(var(--ml-accent)/0.05)] to-transparent blur-[120px] -z-10 pointer-events-none" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-6 items-center">
          {/* Card 1 */}
          <motion.div
            animate={isMobile ? undefined : { y: [0, -25, 0], x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="relative z-10 w-full will-change-transform"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, rotateZ: isMobile ? 0 : -2 }}
              whileInView={{ opacity: 1, y: 0, rotateZ: isMobile ? 0 : -2 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                mass: 1.2,
                opacity: { duration: 0.8 },
              }}
              whileHover={isMobile ? undefined : { scale: 1.03, rotateZ: 0, zIndex: 30, y: -6 }}
              className="solid-panel rounded-2xl p-6 sm:p-8 md:p-10 flex flex-col items-start shadow-lg relative overflow-hidden group cursor-pointer md:mt-12 w-full transform-gpu backface-hidden antialiased"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={FEATURE_CONTENT[activeFeatureRole][0].id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col items-start"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-full bg-accent/10 flex items-center justify-center mb-4 md:mb-6 border border-accent/20 group-hover:scale-105 transition-transform duration-500">
                    {(() => {
                      const Icon = FEATURE_CONTENT[activeFeatureRole][0].icon;
                      return <Icon className="text-accent w-6 h-6 md:w-8 md:h-8" />;
                    })()}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-2 md:mb-3 tracking-tight">
                    {FEATURE_CONTENT[activeFeatureRole][0].title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
                    {FEATURE_CONTENT[activeFeatureRole][0].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            animate={isMobile ? undefined : { y: [0, -35, 0], x: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 9, ease: "easeInOut", delay: 0.5 }}
            className="relative z-20 w-full md:-mt-16 will-change-transform"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, scale: isMobile ? 1 : 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                mass: 1,
                opacity: { duration: 0.8 },
              }}
              whileHover={isMobile ? undefined : { scale: 1.03, zIndex: 30, y: -6 }}
              className="solid-panel rounded-2xl p-6 sm:p-8 md:p-10 flex flex-col items-start shadow-xl relative overflow-hidden group cursor-pointer w-full transform-gpu backface-hidden antialiased"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={FEATURE_CONTENT[activeFeatureRole][1].id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className="flex flex-col items-start"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-full bg-accent/10 flex items-center justify-center mb-4 md:mb-6 border border-accent/20 group-hover:scale-105 transition-transform duration-500">
                    {(() => {
                      const Icon = FEATURE_CONTENT[activeFeatureRole][1].icon;
                      return <Icon className="text-accent w-6 h-6 md:w-8 md:h-8" />;
                    })()}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-2 md:mb-3 tracking-tight">
                    {FEATURE_CONTENT[activeFeatureRole][1].title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
                    {FEATURE_CONTENT[activeFeatureRole][1].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            animate={isMobile ? undefined : { y: [0, -20, 0], x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
            className="relative z-10 w-full md:mt-24 will-change-transform"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, rotateZ: isMobile ? 0 : 2 }}
              whileInView={{ opacity: 1, y: 0, rotateZ: isMobile ? 0 : 2 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                type: "spring",
                stiffness: 100,
                damping: 20,
                mass: 1,
                opacity: { duration: 0.8 },
              }}
              whileHover={isMobile ? undefined : { scale: 1.03, rotateZ: 0, zIndex: 30, y: -6 }}
              className="solid-panel rounded-2xl p-6 sm:p-8 md:p-10 flex flex-col items-start shadow-lg relative overflow-hidden group cursor-pointer w-full transform-gpu backface-hidden antialiased"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={FEATURE_CONTENT[activeFeatureRole][2].id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex flex-col items-start"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-full bg-accent/10 flex items-center justify-center mb-4 md:mb-6 border border-accent/20 group-hover:scale-105 transition-transform duration-500">
                    {(() => {
                      const Icon = FEATURE_CONTENT[activeFeatureRole][2].icon;
                      return <Icon className="text-accent w-6 h-6 md:w-8 md:h-8" />;
                    })()}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold mb-2 md:mb-3 tracking-tight">
                    {FEATURE_CONTENT[activeFeatureRole][2].title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
                    {FEATURE_CONTENT[activeFeatureRole][2].description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
