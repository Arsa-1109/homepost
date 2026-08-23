"use client";

import React, { useId } from "react";

function generatePeakPaths(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count: number,
  spacing: number,
  waveAmp: number,
  phaseShift: number = 0
): string[] {
  const paths: string[] = [];

  const hash = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const c2 = hash(phaseShift * 1.7) * 0.45 + 0.25;
  const s2 = hash(phaseShift * 2.3) * Math.PI * 2;
  const c3 = hash(phaseShift * 3.1) * 0.35 + 0.15;
  const s3 = hash(phaseShift * 4.7) * Math.PI * 2;
  const c4 = hash(phaseShift * 5.9) * 0.25 + 0.10;
  const s4 = hash(phaseShift * 6.8) * Math.PI * 2;
  const c5 = hash(phaseShift * 7.2) * 0.15 + 0.05;
  const s5 = hash(phaseShift * 8.4) * Math.PI * 2;

  for (let i = 0; i < count; i++) {
    const R = 30 + i * spacing;
    const points: string[] = [];
    const steps = 180;

    for (let step = 0; step <= steps; step++) {
      const theta = (step / steps) * 2 * Math.PI;

      const wave =
        Math.sin(2 * theta + s2) * c2 +
        Math.cos(3 * theta + s3) * c3 +
        Math.sin(4 * theta + s4) * c4 +
        Math.cos(5 * theta + s5) * c5;

      const r = R * (1 + waveAmp * wave);
      const px = cx + Math.cos(theta) * r * (rx / 100);
      const py = cy + Math.sin(theta) * r * (ry / 100);

      if (step === 0) {
        points.push(`M ${px.toFixed(1)} ${py.toFixed(1)}`);
      } else {
        points.push(`L ${px.toFixed(1)} ${py.toFixed(1)}`);
      }
    }
    points.push("Z");
    paths.push(points.join(" "));
  }

  return paths;
}

function generateRidgePaths(
  startY: number,
  width: number,
  height: number,
  count: number,
  spacing: number,
  waveAmp: number,
  phaseShift: number = 0
): string[] {
  const paths: string[] = [];

  const hash = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const a1 = hash(phaseShift * 1.5) * 45 + 30;
  const p1 = hash(phaseShift * 2.2) * Math.PI * 2;
  const a2 = hash(phaseShift * 3.3) * 35 + 15;
  const p2 = hash(phaseShift * 4.4) * Math.PI * 2;
  const a3 = hash(phaseShift * 5.5) * 25 + 10;
  const p3 = hash(phaseShift * 6.6) * Math.PI * 2;
  const a4 = hash(phaseShift * 7.1) * 15 + 5;
  const p4 = hash(phaseShift * 8.8) * Math.PI * 2;

  for (let i = 0; i < count; i++) {
    const yOffset = startY + i * spacing;
    const points: string[] = [];
    const steps = 100;

    points.push(`M 0 ${height}`);

    for (let step = 0; step <= steps; step++) {
      const x = (step / steps) * width;
      const t = (step / steps) * Math.PI * 2.8;

      const wave =
        Math.sin(t + p1) * a1 +
        Math.sin(2 * t + p2) * a2 +
        Math.cos(0.5 * t + p3 + i * 0.05) * a3 +
        Math.sin(4 * t + p4) * a4;

      const y = yOffset + wave * waveAmp;
      points.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
    }

    points.push(`L ${width} ${height}`);
    points.push("Z");

    paths.push(points.join(" "));
  }

  return paths;
}

const DUNES_CONFIG = [
  {
    type: "peak" as const,
    widthBase: 75,
    heightBase: 75,
    cx: 550,
    cy: 300,
    rx: 150,
    ry: 100,
    count: 6,
    spacing: 75,
    waveAmp: 0.8,
    phaseShift: 1.2,
    anim: "animate-dune-drift-1",
    blur: "blur-[35px]",
    opacity: "opacity-90",
    viewBox: "0 0 1000 700",
  },
  {
    type: "ridge" as const,
    widthBase: 85,
    heightBase: 70,
    startY: 120,
    viewWidth: 1000,
    viewHeight: 700,
    count: 6,
    spacing: 65,
    waveAmp: 0.85,
    phaseShift: 2.5,
    anim: "animate-dune-drift-2",
    blur: "blur-[40px]",
    opacity: "opacity-85",
    viewBox: "0 0 1000 700",
  },
  {
    type: "peak" as const,
    widthBase: 80,
    heightBase: 75,
    cx: 450,
    cy: 350,
    rx: 140,
    ry: 95,
    count: 6,
    spacing: 70,
    waveAmp: 0.9,
    phaseShift: 3.8,
    anim: "animate-dune-drift-3",
    blur: "blur-[35px]",
    opacity: "opacity-85",
    viewBox: "0 0 1100 700",
  },
  {
    type: "ridge" as const,
    widthBase: 70,
    heightBase: 60,
    startY: 80,
    viewWidth: 800,
    viewHeight: 600,
    count: 5,
    spacing: 55,
    waveAmp: 0.8,
    phaseShift: 5.0,
    anim: "animate-dune-drift-4",
    blur: "blur-[30px]",
    opacity: "opacity-90",
    viewBox: "0 0 800 600",
  },
];

function getDeterministicHash(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const RANDOMIZED_DUNES = DUNES_CONFIG.map((dune, idx) => {
  const hashY = getDeterministicHash(idx * 79.13 + 17.89);
  const hashX = getDeterministicHash(idx * 31.45 + 56.72);
  const hashW = getDeterministicHash(idx * 43.21 + 89.12);
  const hashH = getDeterministicHash(idx * 67.89 + 23.45);

  let yBase = 0;
  let xBase = 0;

  if (idx === 0) {
    yBase = -5 + hashY * 20;
    xBase = 45 + hashX * 30;
  } else if (idx === 1) {
    yBase = 15 + hashY * 20;
    xBase = -35 + hashX * 20;
  } else if (idx === 2) {
    yBase = 40 + hashY * 20;
    xBase = 40 + hashX * 30;
  } else {
    yBase = 70 + hashY * 20;
    xBase = 5 + hashX * 30;
  }

  const width = dune.widthBase + (hashW * 30 - 15);
  const height = dune.heightBase + (hashH * 20 - 10);

  return {
    ...dune,
    top: `${yBase.toFixed(1)}%`,
    left: `${xBase.toFixed(1)}vw`,
    width: `${width.toFixed(1)}vw`,
    height: `${height.toFixed(1)}vh`,
    seed: idx * 42.17 + 8.93,
  };
});

export function LandingBackground() {
  const uniqueId = useId();

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Subtle ambient radial light pools */}
      <div className="absolute top-[-10%] left-[20%] w-[50vw] h-[50vh] bg-accent/10 dark:bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[60vw] h-[60vh] bg-accent/8 dark:bg-accent/4 rounded-full blur-[140px] pointer-events-none" />

      {/* Topographic Sand Dune System */}
      {RANDOMIZED_DUNES.map((dune, idx) => {
        const paths =
          dune.type === "peak"
            ? generatePeakPaths(
                dune.cx,
                dune.cy,
                dune.rx,
                dune.ry,
                dune.count,
                dune.spacing,
                dune.waveAmp,
                dune.phaseShift
              ).reverse()
            : generateRidgePaths(
                dune.startY,
                dune.viewWidth,
                dune.viewHeight,
                dune.count,
                dune.spacing,
                dune.waveAmp,
                dune.phaseShift
              );

        return (
          <div
            key={`dune-${idx}`}
            className={`absolute ${dune.anim} ${dune.blur} ${dune.opacity}`}
            style={{
              top: dune.top,
              left: dune.left,
              width: dune.width,
              height: dune.height,
            }}
          >
            <svg
              viewBox={dune.viewBox}
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id={`grad-${uniqueId}-${idx}`}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="rgb(var(--ml-accent))" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="rgb(var(--ml-text-primary))" stopOpacity="0.08" />
                </linearGradient>
              </defs>
              {paths.map((p, pIdx) => {
                const opIndex = Math.min(5, Math.max(1, 5 - pIdx));
                return (
                  <path
                    key={`p-${pIdx}`}
                    d={p}
                    fill={`rgb(var(--ml-accent) / var(--ml-dune-op-${opIndex}))`}
                    stroke="rgb(var(--ml-accent) / 0.15)"
                    strokeWidth="0.75"
                  />
                );
              })}
            </svg>
          </div>
        );
      })}
    </div>
  );
}
