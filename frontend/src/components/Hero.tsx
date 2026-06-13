"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function Hero() {
  const container = useRef<HTMLDivElement>(null);
  
  // Elements for Entrance Animation
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  // Wrappers for Scroll Animation (prevents property collisions)
  const titleScrollRef = useRef<HTMLDivElement>(null);
  const subtitleScrollRef = useRef<HTMLDivElement>(null);
  const dividerScrollRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // 1. The Entrance Sequence (Runs Once)
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.fromTo(titleRef.current, 
      { y: 60, opacity: 0, scale: 0.9 }, 
      { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: "back.out(1.5)" }
    )
    .fromTo(dividerRef.current,
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.8 },
      "-=0.6"
    )
    .fromTo(subtitleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 0.85, duration: 1 },
      "-=0.4"
    );
  }, { scope: container });

  useGSAP(() => {
    // 2. The 3D Zoom Effect (Scroll-Linked)
    gsap.fromTo(titleScrollRef.current, 
      { scale: 1, opacity: 1, filter: "blur(0px)", y: 0, z: 0, rotateX: 0 },
      {
        scale: 15,
        y: 0,
        z: 0,
        rotateX: 0,
        opacity: 0,
        filter: "blur(20px)",
        scrollTrigger: {
          trigger: container.current,
          start: "top 25%", 
          end: "bottom top",
          scrub: 1.5,
        }
      }
    );

    gsap.fromTo(subtitleScrollRef.current, 
      { y: 0, opacity: 1, filter: "blur(0px)", z: 0, rotateX: 0 },
      {
        y: -50,
        z: 0,
        rotateX: 0,
        scale: 1,
        opacity: 0,
        filter: "blur(10px)",
        scrollTrigger: {
          trigger: container.current,
          start: "top 25%",
          end: "bottom top",
          scrub: 1,
        }
      }
    );

    gsap.fromTo(dividerScrollRef.current, 
      { scaleX: 1, opacity: 1 },
      {
        scaleX: 0,
        opacity: 0,
        scrollTrigger: {
          trigger: container.current,
          start: "top 25%",
          end: "bottom top",
          scrub: 1,
        }
      }
    );

  }, { scope: container });

  return (
    <section ref={container} className="max-w-[1440px] w-full mx-auto flex flex-col items-center text-center mt-10 mb-20 z-10 perspective-[1000px] overflow-visible">
      
      <div ref={titleScrollRef} className="relative w-full flex flex-col items-center origin-center will-change-transform">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-accent-light/10 to-transparent blur-3xl rounded-full -z-10"></div>
        <h1 
          ref={titleRef} 
          className="text-5xl md:text-8xl font-extrabold text-foreground mb-4 tracking-tighter drop-shadow-2xl"
        >
          Homepost
        </h1>
      </div>
      
      <div ref={dividerScrollRef} className="will-change-transform origin-center">
        <div ref={dividerRef} className="w-16 h-1 bg-accent rounded-full mb-4"></div>
      </div>

      <div ref={subtitleScrollRef} className="w-full flex justify-center will-change-transform">
        <p ref={subtitleRef} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium mt-16 px-4">
          The radically simple portal for individual property owners. Manage requests, share documents, and communicate seamlessly.
        </p>
      </div>
    </section>
  );
}
