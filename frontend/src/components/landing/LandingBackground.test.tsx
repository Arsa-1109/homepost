import { describe, expect, it } from "vitest";
import {
  generatePeakPaths,
  generateRidgePaths,
} from "./LandingBackground";

type PathCommand = { cmd: string; x: number; y: number };

function parsePath(path: string): PathCommand[] {
  const commands: PathCommand[] = [];
  const regex = /([MLZ])\s*(-?[\d.]+)?\s*(-?[\d.]+)?/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(path)) !== null) {
    if (match[1] === "Z") {
      commands.push({ cmd: "Z", x: NaN, y: NaN });
    } else {
      commands.push({
        cmd: match[1],
        x: Number(match[2]),
        y: Number(match[3]),
      });
    }
  }
  return commands;
}

function silhouettePoints(path: string): PathCommand[] {
  return parsePath(path).filter((c) => c.cmd === "L");
}

const RIDGE_ARGS = [120, 1000, 700, 6, 65, 0.85, 2.5] as const;
const PEAK_ARGS = [550, 300, 150, 100, 6, 75, 0.8, 1.2] as const;

describe("generateRidgePaths", () => {
  it("is deterministic for the same inputs", () => {
    const a = generateRidgePaths(...RIDGE_ARGS);
    const b = generateRidgePaths(...RIDGE_ARGS);
    expect(a).toEqual(b);
  });

  it("produces valid closed SVG paths", () => {
    const paths = generateRidgePaths(...RIDGE_ARGS);
    expect(paths).toHaveLength(6);
    for (const path of paths) {
      expect(path.startsWith("M ")).toBe(true);
      expect(path.endsWith("Z")).toBe(true);
      expect(path).toContain("L ");
      const commands = parsePath(path).filter((c) => c.cmd !== "Z");
      expect(commands.every((c) => Number.isFinite(c.x) && Number.isFinite(c.y))).toBe(
        true
      );
    }
  });

  it("has no flat runs of repeated y values (no rectangular bands)", () => {
    const paths = generateRidgePaths(...RIDGE_ARGS);
    for (const path of paths) {
      const ys = silhouettePoints(path).map((c) => c.y);
      let run = 1;
      for (let i = 1; i < ys.length; i++) {
        run = ys[i] === ys[i - 1] ? run + 1 : 1;
        expect(run).toBeLessThan(6);
      }
    }
  });

  it("has irregular crest heights beyond what a uniform sine produces", () => {
    const path = generateRidgePaths(...RIDGE_ARGS)[0];
    const crestSpread = (ys: number[]): number => {
      const crests: number[] = [];
      for (let i = 1; i < ys.length - 1; i++) {
        if (ys[i] <= ys[i - 1] && ys[i] <= ys[i + 1]) crests.push(ys[i]);
      }
      if (crests.length < 3) return 0;
      const mean =
        crests.reduce((sum, v) => sum + v, 0) / crests.length;
      return Math.sqrt(
        crests.reduce((sum, v) => sum + (v - mean) ** 2, 0) / crests.length
      );
    };

    const ours = crestSpread(silhouettePoints(path).map((c) => c.y));

    const pureSineYs: number[] = [];
    const steps = 100;
    for (let step = 0; step <= steps; step++) {
      const t = (step / steps) * Math.PI * 2.8;
      pureSineYs.push(Number((120 + 50 * Math.sin(t)).toFixed(1)));
    }
    const baseline = crestSpread(pureSineYs);

    expect(ours).toBeGreaterThan(baseline * 2);
    expect(ours).toBeGreaterThan(5);
  });
});

describe("generatePeakPaths", () => {
  it("is deterministic for the same inputs", () => {
    const a = generatePeakPaths(...PEAK_ARGS);
    const b = generatePeakPaths(...PEAK_ARGS);
    expect(a).toEqual(b);
  });

  it("produces valid closed SVG paths with expected point density", () => {
    const paths = generatePeakPaths(...PEAK_ARGS);
    expect(paths).toHaveLength(6);
    for (const path of paths) {
      expect(path.startsWith("M ")).toBe(true);
      expect(path.endsWith("Z")).toBe(true);
      const lineCount = silhouettePoints(path).length;
      expect(lineCount).toBeGreaterThanOrEqual(170);
      expect(lineCount).toBeLessThanOrEqual(190);
    }
  });

  it("has no flat runs of repeated points", () => {
    const paths = generatePeakPaths(...PEAK_ARGS);
    for (const path of paths) {
      const points = silhouettePoints(path).map((c) => `${c.x},${c.y}`);
      let run = 1;
      for (let i = 1; i < points.length; i++) {
        run = points[i] === points[i - 1] ? run + 1 : 1;
        expect(run).toBeLessThan(6);
      }
    }
  });

  it("varies consecutive segment lengths beyond a small threshold", () => {
    const path = generatePeakPaths(...PEAK_ARGS)[0];
    const points = silhouettePoints(path);
    const lengths: number[] = [];
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      lengths.push(Math.hypot(dx, dy));
    }
    const mean = lengths.reduce((s, v) => s + v, 0) / lengths.length;
    const stdDev = Math.sqrt(
      lengths.reduce((s, v) => s + (v - mean) ** 2, 0) / lengths.length
    );
    expect(stdDev / mean).toBeGreaterThan(0.05);
  });
});
