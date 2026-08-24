import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AnnouncementCard, Announcement } from "./AnnouncementCard";

describe("AnnouncementCard", () => {
  const mockAnnouncement: Announcement = {
    id: "ann-1",
    property_id: "prop-1",
    unit_id: "unit-101",
    unit_label: "Unit 101",
    property_name: "Maplewood Heights",
    title: "Scheduled Plumbing Riser Inspection",
    body: "Plumbing inspection scheduled for tomorrow.",
    created_at: "2026-08-24T12:00:00Z",
  };

  it("renders the resolved unit label immediately", () => {
    render(
      <AnnouncementCard
        announcement={mockAnnouncement}
        propertyName="Maplewood Heights"
        unitLabel="Unit 101"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onViewImage={vi.fn()}
      />
    );

    expect(screen.getByText("Unit 101")).toBeInTheDocument();
    expect(screen.getByText("Maplewood Heights")).toBeInTheDocument();
    expect(screen.getByText("Scheduled Plumbing Riser Inspection")).toBeInTheDocument();
  });

  it("renders Property-Wide label for non-unit announcements", () => {
    const propWideAnnouncement: Announcement = {
      ...mockAnnouncement,
      unit_id: null,
      unit_label: null,
    };

    render(
      <AnnouncementCard
        announcement={propWideAnnouncement}
        propertyName="Maplewood Heights"
        unitLabel="Property-Wide"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onViewImage={vi.fn()}
      />
    );

    expect(screen.getByText("Property-Wide")).toBeInTheDocument();
  });

  it("renders a loading placeholder without flashing fallback text when unitLabel is null", () => {
    const { container } = render(
      <AnnouncementCard
        announcement={mockAnnouncement}
        propertyName="Maplewood Heights"
        unitLabel={null}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onViewImage={vi.fn()}
      />
    );

    expect(screen.queryByText("Unit Specific")).not.toBeInTheDocument();
    const pulseElement = container.querySelector(".animate-pulse");
    expect(pulseElement).toBeInTheDocument();
  });
});
