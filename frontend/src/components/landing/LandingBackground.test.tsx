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
      commands.push({ cmd: match[1], x: Number(match[2]), y: Number(match[3]) });
    }
  }
  return commands;
}

function ysOf(path: string): number[] {
  return parsePath(path)
    .filter((c) => c.cmd !== "Z")
    .slice(1)
    .map((c) => c.y);
}

function radialSeries(path: string, cx: number, cy: number): number[] {
  return parsePath(path)
    .filter((c) => c.cmd !== "Z")
    .map((c) => Math.hypot(c.x - cx, c.y - cy));
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  );
}

function localMinimaIndices(values: number[]): number[] {
  const indices: number[] = [];
  for (let i = 1; i < values.length - 1; i++) {
    if (values[i] <= values[i - 1] && values[i] < values[i + 1]) {
      indices.push(i);
    }
  }
  return indices;
}

function crestHeightStdDev(ys: number[]): number {
  return stdDev(localMinimaIndices(ys).map((i) => ys[i]));
}

function meanAbsSecondDifference(values: number[]): number {
  let sum = 0;
  for (let i = 2; i < values.length; i++) {
    sum += Math.abs(values[i] - 2 * values[i - 1] + values[i - 2]);
  }
  return sum / (values.length - 2);
}

function crestSpanAsymmetry(ys: number[]): number {
  const minima = localMinimaIndices(ys);
  if (minima.length < 3) return 0;
  let sum = 0;
  for (let k = 1; k < minima.length - 1; k++) {
    const left = minima[k] - minima[k - 1];
    const right = minima[k + 1] - minima[k];
    sum += Math.abs(left - right) / (left + right);
  }
  return sum / (minima.length - 2);
}

function crossLayerEnvelopeVariability(paths: string[]): number {
  return stdDev(paths.map((p) => crestHeightStdDev(ysOf(p))));
}

const RIDGE_ARGS = [120, 1000, 700, 6, 65, 0.85, 2.5] as const;
const PEAK_ARGS = [550, 300, 150, 100, 6, 75, 0.8, 1.2] as const;

function hashFraction(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function legacyGenerateRidgePaths(
  startY: number,
  width: number,
  height: number,
  count: number,
  spacing: number,
  waveAmp: number,
  phaseShift: number = 0
): string[] {
  const paths: string[] = [];
  const a1 = hashFraction(phaseShift * 1.5) * 45 + 30;
  const p1 = hashFraction(phaseShift * 2.2) * Math.PI * 2;
  const a2 = hashFraction(phaseShift * 3.3) * 35 + 15;
  const p2 = hashFraction(phaseShift * 4.4) * Math.PI * 2;
  const a3 = hashFraction(phaseShift * 5.5) * 25 + 10;
  const p3 = hashFraction(phaseShift * 6.6) * Math.PI * 2;
  const a4 = hashFraction(phaseShift * 7.1) * 15 + 5;
  const p4 = hashFraction(phaseShift * 8.8) * Math.PI * 2;

  for (let i = 0; i < count; i++) {
    const yOffset = startY + i * spacing;
    const points: string[] = [`M 0 ${height}`];
    const steps = 100;

    for (let step = 0; step <= steps; step++) {
      const x = (step / steps) * width;
      const t = (step / steps) * Math.PI * 2.8;
      const wave =
        Math.sin(t + p1) * a1 +
        Math.sin(2 * t + p2) * a2 +
        Math.cos(0.5 * t + p3 + i * 0.05) * a3 +
        Math.sin(4 * t + p4) * a4;
      points.push(`L ${x.toFixed(1)} ${(yOffset + wave * waveAmp).toFixed(1)}`);
    }

    points.push(`L ${width} ${height}`, "Z");
    paths.push(points.join(" "));
  }
  return paths;
}

function legacyGeneratePeakPaths(
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
  const c2 = hashFraction(phaseShift * 1.7) * 0.45 + 0.25;
  const s2 = hashFraction(phaseShift * 2.3) * Math.PI * 2;
  const c3 = hashFraction(phaseShift * 3.1) * 0.35 + 0.15;
  const s3 = hashFraction(phaseShift * 4.7) * Math.PI * 2;
  const c4 = hashFraction(phaseShift * 5.9) * 0.25 + 0.10;
  const s4 = hashFraction(phaseShift * 6.8) * Math.PI * 2;
  const c5 = hashFraction(phaseShift * 7.2) * 0.15 + 0.05;
  const s5 = hashFraction(phaseShift * 8.4) * Math.PI * 2;

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
      points.push(
        `${step === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`
      );
    }
    points.push("Z");
    paths.push(points.join(" "));
  }
  return paths;
}

describe("generateRidgePaths", () => {
  it("is deterministic for the same inputs", () => {
    expect(generateRidgePaths(...RIDGE_ARGS)).toEqual(
      generateRidgePaths(...RIDGE_ARGS)
    );
  });

  it("produces valid closed SVG paths", () => {
    const paths = generateRidgePaths(...RIDGE_ARGS);
    expect(paths).toHaveLength(6);
    for (const path of paths) {
      expect(path.startsWith("M ")).toBe(true);
      expect(path.endsWith("Z")).toBe(true);
      expect(path).toContain("L ");
      const coordinateCommands = parsePath(path).filter((c) => c.cmd !== "Z");
      expect(
        coordinateCommands.every(
          (c) => Number.isFinite(c.x) && Number.isFinite(c.y)
        )
      ).toBe(true);
    }
  });

  it("has no flat runs of repeated y values (no rectangular bands)", () => {
    for (const path of generateRidgePaths(...RIDGE_ARGS)) {
      const ys = ysOf(path);
      let run = 1;
      for (let i = 1; i < ys.length; i++) {
        run = ys[i] === ys[i - 1] ? run + 1 : 1;
        expect(run).toBeLessThan(6);
      }
    }
  });

  it("modulates amplitude differently per layer unlike the uniform legacy generator", () => {
    // Legacy rings are structural clones (per-ring crest-height stddev identical
    // across layers); noise-driven rings each get independent PRNG draws.
    const legacyValue = crossLayerEnvelopeVariability(
      legacyGenerateRidgePaths(...RIDGE_ARGS)
    );
    const currentValue = crossLayerEnvelopeVariability(
      generateRidgePaths(...RIDGE_ARGS)
    );

    expect(currentValue).toBeGreaterThan(legacyValue * 5);
    expect(currentValue).toBeGreaterThan(3);
  });

  it("has per-point jitter roughness beyond the smooth legacy curve", () => {
    const legacyValue = meanAbsSecondDifference(
      legacyGenerateRidgePaths(...RIDGE_ARGS).flatMap(ysOf)
    );
    const currentValue = meanAbsSecondDifference(
      generateRidgePaths(...RIDGE_ARGS).flatMap(ysOf)
    );

    expect(currentValue).toBeGreaterThan(legacyValue * 1.12);
    expect(currentValue).toBeGreaterThan(16.5);
  });

  it("has asymmetric rise/fall crest spans unlike the symmetric legacy sine", () => {
    const legacyValue = crestSpanAsymmetry(
      ysOf(legacyGenerateRidgePaths(...RIDGE_ARGS)[0])
    );
    const currentValue = crestSpanAsymmetry(
      ysOf(generateRidgePaths(...RIDGE_ARGS)[0])
    );

    expect(currentValue).toBeGreaterThan(legacyValue * 3);
    expect(currentValue).toBeGreaterThan(0.15);
  });
});

describe("generatePeakPaths", () => {
  it("is deterministic for the same inputs", () => {
    expect(generatePeakPaths(...PEAK_ARGS)).toEqual(
      generatePeakPaths(...PEAK_ARGS)
    );
  });

  it("produces valid closed SVG paths with expected point density", () => {
    const paths = generatePeakPaths(...PEAK_ARGS);
    expect(paths).toHaveLength(6);
    for (const path of paths) {
      expect(path.startsWith("M ")).toBe(true);
      expect(path.endsWith("Z")).toBe(true);
      const lineCount = parsePath(path).filter((c) => c.cmd === "L").length;
      expect(lineCount).toBeGreaterThanOrEqual(170);
      expect(lineCount).toBeLessThanOrEqual(190);
    }
  });

  it("has no flat runs of repeated points", () => {
    for (const path of generatePeakPaths(...PEAK_ARGS)) {
      const points = parsePath(path)
        .filter((c) => c.cmd === "L")
        .map((c) => `${c.x},${c.y}`);
      let run = 1;
      for (let i = 1; i < points.length; i++) {
        run = points[i] === points[i - 1] ? run + 1 : 1;
        expect(run).toBeLessThan(6);
      }
    }
  });

  it("has radial roughness beyond the smooth legacy ellipse harmonics", () => {
    const radialRoughness = (paths: string[]) =>
      meanAbsSecondDifference(
        paths.flatMap((p) => radialSeries(p, PEAK_ARGS[0], PEAK_ARGS[1]))
      );

    const legacyValue = radialRoughness(
      legacyGeneratePeakPaths(...PEAK_ARGS)
    );
    const currentValue = radialRoughness(generatePeakPaths(...PEAK_ARGS));

    expect(currentValue).toBeGreaterThan(legacyValue * 3);
    expect(currentValue).toBeGreaterThan(3.5);
  });
});
