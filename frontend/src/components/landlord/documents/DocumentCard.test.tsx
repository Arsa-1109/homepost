import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { DocumentCard, Document } from "./DocumentCard";

describe("DocumentCard", () => {
  const mockDoc: Document = {
    id: "doc-1",
    title: "Standard Lease Agreement",
    file_key: "documents/lease-123.pdf",
    file_type: "application/pdf",
    created_at: "2026-08-24T12:00:00Z",
    unit_id: "unit-101",
    unit_label: "Unit 101",
    property_name: "Maplewood Heights",
  };

  it("renders document title, unit badge, and pdf label", () => {
    render(
      <DocumentCard
        doc={mockDoc}
        unitLabel="Unit 101"
        onPreview={vi.fn()}
        onDownload={vi.fn()}
      />
    );

    expect(screen.getByText("Standard Lease Agreement")).toBeInTheDocument();
    expect(screen.getByText("Unit 101")).toBeInTheDocument();
    expect(screen.getAllByText("PDF").length).toBeGreaterThanOrEqual(1);
  });

  it("applies highlight styling and assigns correct DOM id when isHighlighted is true", () => {
    const { container } = render(
      <DocumentCard
        doc={mockDoc}
        unitLabel="Unit 101"
        onPreview={vi.fn()}
        onDownload={vi.fn()}
        isHighlighted={true}
      />
    );

    const card = container.querySelector("#document-doc-1");
    expect(card).toBeInTheDocument();
    expect(card?.className).toContain("ring-2");
  });

  it("renders video badge and label for video files", () => {
    const mockVideoDoc: Document = {
      id: "doc-2",
      title: "Property Inspection Video",
      file_key: "documents/walkthrough.mp4",
      file_type: "video/mp4",
      created_at: "2026-08-24T12:00:00Z",
      unit_id: null,
      unit_label: null,
      property_name: "Maplewood Heights",
    };

    render(
      <DocumentCard
        doc={mockVideoDoc}
        unitLabel="Property-Wide"
        onPreview={vi.fn()}
        onDownload={vi.fn()}
      />
    );

    expect(screen.getByText("Property Inspection Video")).toBeInTheDocument();
    expect(screen.getByText("Property-Wide")).toBeInTheDocument();
    expect(screen.getAllByText("VIDEO").length).toBeGreaterThanOrEqual(1);
  });
});
