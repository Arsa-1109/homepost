import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FeatureSection } from "@/components/landing/FeatureSection";

vi.mock("motion/react", () => {
  const passthrough = (tag: string) =>
    function MotionComponent({
      children,
      className,
      ...rest
    }: {
      children?: React.ReactNode;
      className?: string;
      // Animation-only props (initial/animate/etc.) have no DOM effect in tests.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } & Record<string, any>) {
      return React.createElement(tag, { className }, children ?? null);
    };
  return {
    motion: new Proxy(
      {},
      {
        get: (_target, tag: string) => passthrough(tag),
      }
    ),
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  };
});

describe("FeatureSection glassmorphism removal", () => {
  it.each(["owner", "tenant"] as const)('renders without glass classes for "%s" role', (role) => {
    const { container } = render(
      <FeatureSection activeFeatureRole={role} onRoleChange={vi.fn()} />
    );

    const glassy = container.querySelectorAll(".glass-panel, [class*='backdrop-blur']");
    expect(glassy).toHaveLength(0);

    expect(container.querySelectorAll(".solid-panel")).toHaveLength(3);
  });
});
