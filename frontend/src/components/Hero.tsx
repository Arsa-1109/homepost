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
    // 1. Entrance Animation (graceful & cinematic)
    const enterTl = gsap.timeline();

    enterTl.fromTo(titleRef.current,
      { y: 30, opacity: 0.7, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "power3.out" }
    );

    enterTl.fromTo(dividerRef.current,
      { scaleX: 0, opacity: 0.7 },
      { scaleX: 1, opacity: 1, duration: 0.7, ease: "power3.out" },
      "-=0.5"
    );

    enterTl.fromTo(subtitleRef.current,
      { y: 15, opacity: 0.7 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      "-=0.5"
    );

    // 2. Continuous 3D Floating Animation
    gsap.to(titleTiltRef.current, {
      y: -15,
      rotateX: 5,
      rotateY: -2,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // 4. Scroll Reveal Animation - Master Timeline
    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: container.current,
        // Dynamically set the start position to exactly where the container is on load!
        // This eliminates the "dead zone" and makes it pin instantly upon scrolling.
        start: () => `top top+=${container.current?.getBoundingClientRect().top || 128}`,
        end: "+=150%", // How long the pin lasts
        scrub: 1.5,
        pin: true,
        pinSpacing: false, // THIS enables the parallax "slide over" effect!
      }
    });

    // Animate the text container to scale up (zooming into the void)
    scrollTl.to(titleScrollRef.current, {
      scale: 15,
      ease: "power2.in",
    }, 0);

    // Fade out Homepost text with smooth, relaxed pacing
    scrollTl.to(titleScrollRef.current, {
      opacity: 0,
      duration: 0.45,
      ease: "power2.inOut",
    }, 0);

    // Fade out divider and subtitle gracefully
    scrollTl.to([dividerScrollRef.current, subtitleScrollRef.current], {
      opacity: 0,
      y: -50,
      duration: 0.35,
      ease: "power2.inOut",
    }, 0);

  }, { scope: container });

  return (
    <section ref={container} className="relative w-full min-h-[50vh] sm:min-h-[60vh] flex flex-col items-center justify-start text-center overflow-visible z-30 perspective-[1000px] pt-16 sm:pt-24 md:pt-28 pb-12 sm:pb-16 pointer-events-none">

      {/* 1. Title Area */}
      <div ref={titleScrollRef} className="relative w-full flex flex-col items-center origin-center will-change-transform [transform-style:preserve-3d]">
        <div ref={titleTiltRef} className="relative w-full flex flex-col items-center origin-center will-change-transform z-20">
          <h1
            ref={titleRef}
            className="text-4xl sm:text-6xl md:text-8xl font-extrabold text-foreground mb-4 tracking-tighter drop-shadow-2xl"
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
        <p ref={subtitleRef} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium px-4">
          The radically simple portal for individual property owners. Manage requests, share documents, and communicate seamlessly.
        </p>
      </div>

    </section>
  );
}
