import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { RequestCard, MaintenanceRequest } from "./RequestCard";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue("test-token"),
    isLoaded: true,
  }),
}));

vi.mock("@/lib/api", () => ({
  fetchAPI: vi.fn().mockResolvedValue({}),
}));

describe("RequestCard", () => {
  const mockReq: MaintenanceRequest = {
    id: "req-1",
    tenant_id: "tenant-1",
    unit_id: "unit-101",
    title: "Leaking Bathroom Faucet",
    description: "Water leaking under the sink.",
    status: "open",
    priority: "urgent",
    created_at: "2026-08-24T12:00:00Z",
    property_name: "Maplewood Heights",
    unit_label: "Unit 101",
  };

  it("renders request title, property and unit label, and priority", () => {
    render(<RequestCard req={mockReq} onUpdate={vi.fn()} />);

    expect(screen.getByText("Leaking Bathroom Faucet")).toBeInTheDocument();
    expect(screen.getByText("Maplewood Heights • Unit 101")).toBeInTheDocument();
    expect(screen.getByText("urgent")).toBeInTheDocument();
  });

  it("applies highlight styling and assigns DOM id when isHighlighted is true", () => {
    const { container } = render(
      <RequestCard req={mockReq} onUpdate={vi.fn()} isHighlighted={true} />
    );

    const card = container.querySelector("#request-req-1");
    expect(card).toBeInTheDocument();
    expect(card?.className).toContain("ring-2");
  });
});
