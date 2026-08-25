import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DemoTenantPhone } from "./DemoTenantPhone";

function findScreenContainer(container: HTMLElement): HTMLElement {
  const screens = Array.from(
    container.querySelectorAll<HTMLDivElement>("[class*='overflow-hidden']"),
  ).filter((el) => el.className.includes("rounded-[38px]"));
  expect(screens.length).toBeGreaterThan(0);
  return screens[0];
}

function findScrollRegion(screen: HTMLElement): HTMLElement {
  const regions = screen.querySelectorAll<HTMLElement>(".overflow-y-auto");
  expect(regions.length).toBe(1);
  return regions[0];
}

describe("DemoTenantPhone structural invariants", () => {
  function setup() {
    return render(
      <DemoTenantPhone
        activeTab="home"
        onSelectTab={vi.fn()}
        onLaunchDemo={vi.fn()}
      />,
    );
  }

  it("contains a clipped screen viewport with a definite height", () => {
    const { container } = setup();
    const screenEl = findScreenContainer(container);
    expect(screenEl.className).toContain("overflow-hidden");
    expect(screenEl.className).toMatch(/h-\[\d+px\]/);
    expect(screenEl.className).not.toContain("min-h-[");
    expect(screenEl.className).not.toContain("max-h-[");
  });

  it("scroll region can shrink below its content and scrolls", () => {
    const { container } = setup();
    const scroll = findScrollRegion(findScreenContainer(container));
    expect(scroll.className).toContain("flex-1");
    expect(scroll.className).toContain("min-h-0");
    expect(scroll.className).toContain("overflow-y-auto");
  });

  it("scroll region bottom padding clears the bottom nav height", () => {
    const { container } = setup();
    const screenEl = findScreenContainer(container);
    const scroll = findScrollRegion(screenEl);
    expect(scroll.className).toContain("pb-20");

    const nav = within(screenEl).getByRole("navigation");
    expect(nav.className).toMatch(/h-(14|16)/);

    const navPaddingPx = Number(/pb-(\d+)/.exec(scroll.className)![1]) * 4;
    const navHeightPx = Number(/h-(\d+)/.exec(nav.className)![1]) * 4;
    expect(navPaddingPx).toBeGreaterThanOrEqual(navHeightPx);
  });

  it("renders device chrome: status bar, island pill, home indicator", () => {
    const { container } = setup();
    expect(screen.getByText("9:41")).toBeInTheDocument();

    const island = container.querySelector(".bg-black.rounded-full.w-24.h-4");
    expect(island).not.toBeNull();

    const homeIndicator = container.querySelector(
      'div[class*="rounded-full"][class*="w-28"]',
    );
    expect(homeIndicator).not.toBeNull();
  });

  it("keeps the header outside the scroll region (static, not sticky)", () => {
    const { container } = setup();
    const screenEl = findScreenContainer(container);
    const header = screenEl.querySelector("header");
    expect(header).not.toBeNull();
    expect(header!.className).not.toContain("sticky");

    const scroll = findScrollRegion(screenEl);
    expect(header!.nextElementSibling).toBe(scroll);
  });
});
