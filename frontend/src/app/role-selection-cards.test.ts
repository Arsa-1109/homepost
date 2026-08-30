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
    ["min-height", "min-h-[290px]"],
    ["icon circle size", "w-12 h-12 rounded-xl"],
    ["icon glyph size", "w-6 h-6"],
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

  it.each(["min-h-[380px]", "lg:h-[430px]", "Try Owner Demo", "Try Resident Demo"])(
    "disproportion/demo artifact %q is absent",
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
    expect(tenantCard).toContain("rotateZ: 1");
    expect(ownerCard).toContain("Building2");
    expect(tenantCard).toContain("<Key ");
  });
});
