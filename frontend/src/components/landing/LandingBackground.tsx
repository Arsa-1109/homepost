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
    blur: "blur-[100px]",
    opacity: "opacity-90",
    viewBox: "0 0 1000 700",
  },
  {
    type: "peak" as const,
    widthBase: 85,
    heightBase: 70,
    cx: 500,
    cy: 350,
    rx: 160,
    ry: 110,
    count: 6,
    spacing: 75,
    waveAmp: 0.7,
    phaseShift: 2.5,
    anim: "animate-dune-drift-2",
    blur: "blur-[110px]",
    opacity: "opacity-80",
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
    blur: "blur-[100px]",
    opacity: "opacity-85",
    viewBox: "0 0 1100 700",
  },
  {
    type: "peak" as const,
    widthBase: 50,
    heightBase: 55,
    cx: 400,
    cy: 300,
    rx: 130,
    ry: 95,
    count: 6,
    spacing: 50,
    waveAmp: 0.8,
    phaseShift: 5.0,
    anim: "animate-dune-drift-1",
    blur: "blur-[95px]",
    opacity: "opacity-85",
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
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 bg-background/50">
      {/* Background Gradients & Dunes */}
      {RANDOMIZED_DUNES.map((dune, idx) => {
        const paths = generatePeakPaths(
          dune.cx,
          dune.cy,
          dune.rx,
          dune.ry,
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
                  <stop offset="0%" stopColor="rgb(var(--ml-accent))" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="rgb(var(--ml-text-primary))" stopOpacity="0.05" />
                </linearGradient>
              </defs>
              {paths.map((p, pIdx) => (
                <path
                  key={`p-${pIdx}`}
                  d={p}
                  fill={`url(#grad-${uniqueId}-${idx})`}
                  opacity={0.3 + pIdx * 0.1}
                />
              ))}
            </svg>
          </div>
        );
      })}
    </div>
  );
}
