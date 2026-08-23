import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");

function extractCard(roleMarker: string): string {
  const start = PAGE_SOURCE.indexOf(`{/* ${roleMarker} Card */}`);
  expect(start).toBeGreaterThan(-1);
  const sectionEnd = PAGE_SOURCE.indexOf("</motion.article>", start);
  expect(sectionEnd).toBeGreaterThan(start);
  return PAGE_SOURCE.slice(start, sectionEnd);
}

const ownerCard = extractCard("Owner");
const tenantCard = extractCard("Tenant");

describe("role selection card structural parity", () => {
  it.each([
    ["min-height", "min-h-[380px]"],
    ["desktop height", "lg:h-[430px]"],
    ["icon circle size", "w-16 h-16 rounded-full"],
    ["icon glyph size", "w-8 h-8"],
  ] as const)("%s is identical on both cards", (_label, fragment) => {
    for (const [name, card] of [
      ["owner", ownerCard],
      ["tenant", tenantCard],
    ] as const) {
      expect(card, `${name} card missing ${fragment}`).toContain(fragment);
      expect(
        card.split(fragment).length - 1,
        `${name} card should have exactly one ${fragment}`
      ).toBe(1);
    }
  });

  it.each(["scale: 0.96", "lg:top-[50px]", "lg:h-[410px]", "w-14 h-14"])(
    "disproportion artifact %q is absent",
    (fragment) => {
      expect(ownerCard).not.toContain(fragment);
      expect(tenantCard).not.toContain(fragment);
    }
  );

  it("resting scale is 1 on both cards", () => {
    const restingScales = [...PAGE_SOURCE.matchAll(/animate=\{\{[^}]*scale:\s*([\d.]+)/g)]
      .map((m) => m[1]);
    const cardScales = restingScales.slice(0, 2);
    expect(cardScales).toEqual(["1", "1"]);
  });

  it("both cards share the same desktop vertical position", () => {
    expect(tenantCard).toMatch(/lg:top-0\b/);
    expect(ownerCard).toMatch(/lg:top-0\b/);
    expect(PAGE_SOURCE.slice(0)).not.toContain("lg:top-[");
  });

  it("CTAs stay bottom-aligned within each card regardless of content length", () => {
    for (const [name, card] of [
      ["owner", ownerCard],
      ["tenant", tenantCard],
    ] as const) {
      expect(card, `${name} card must use flex column with justify-between`).toContain(
        "flex flex-col items-start justify-between"
      );
      expect(card, `${name} card CTA group must pin to bottom`).toContain(
        'className="flex flex-col gap-2.5 w-full mt-auto"'
      );
    }
  });

  it("preserves intentional per-role differentiation", () => {
    expect(ownerCard).toContain("rotateZ: -1");
    expect(tenantCard).toContain("rotateZ: 2");
    expect(ownerCard).toContain("Building2");
    expect(tenantCard).toContain("<Key ");
  });
});
