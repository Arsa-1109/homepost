"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const container = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleScrollRef = useRef<HTMLDivElement>(null);
  const titleTiltRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const subtitleScrollRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const dividerScrollRef = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP({ scope: container });

  useGSAP(() => {
    const isDesktop = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
    const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    // 1. Crisp Editorial Entrance Animation
    const enterTl = gsap.timeline();

    enterTl.fromTo(titleRef.current,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.2, ease: "power2.out" }
    );

    enterTl.fromTo(dividerRef.current,
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.18, ease: "power2.out" },
      "-=0.1"
    );

    enterTl.fromTo(subtitleRef.current,
      { y: 8, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.2, ease: "power2.out" },
      "-=0.1"
    );

  }, { scope: container });

  return (
    <section ref={container} className="relative w-full flex flex-col items-center justify-start text-center overflow-visible z-30 pt-20 sm:pt-28 pb-10 sm:pb-14 pointer-events-none">

      {/* 1. Title Area */}
      <div ref={titleScrollRef} className="relative w-full flex flex-col items-center origin-center will-change-transform [transform-style:preserve-3d]">
        <div ref={titleTiltRef} className="relative w-full flex flex-col items-center origin-center will-change-transform z-20">
          <h1
            ref={titleRef}
            className="text-4xl sm:text-6xl md:text-8xl font-extrabold text-foreground mb-4 tracking-tighter text-balance"
          >
            Homepost
          </h1>
        </div>
      </div>

      {/* 2. Subtitle Area */}
      <div ref={dividerScrollRef} className="will-change-transform origin-center mt-6">
        <div ref={dividerRef} className="w-16 h-1 bg-accent rounded-full mb-4 mx-auto"></div>
      </div>

      <div ref={subtitleScrollRef} className="w-full flex justify-center will-change-transform mt-8">
        <p ref={subtitleRef} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium px-4 text-pretty">
          The radically simple portal for individual property owners. Manage requests, share documents, and communicate seamlessly.
        </p>
      </div>

    </section>
  );
}
