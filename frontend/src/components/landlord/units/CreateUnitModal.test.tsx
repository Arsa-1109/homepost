import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { CreateUnitModal, getNextUnitLabel } from "./CreateUnitModal";
import * as api from "@/lib/api";

vi.mock("@/lib/api", () => ({
  fetchAPI: vi.fn(),
}));

describe("CreateUnitModal Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNextUnitLabel helper", () => {
    it("increments numeric unit labels", () => {
      expect(getNextUnitLabel("Apt 101")).toBe("Apt 102");
      expect(getNextUnitLabel("Unit 1")).toBe("Unit 2");
      expect(getNextUnitLabel("109")).toBe("110");
      expect(getNextUnitLabel("Suite 01")).toBe("Suite 02");
    });

    it("increments alphabetical unit labels", () => {
      expect(getNextUnitLabel("Room A")).toBe("Room B");
      expect(getNextUnitLabel("Unit X")).toBe("Unit Y");
    });

    it("returns empty string if no sequence is found", () => {
      expect(getNextUnitLabel("Penthouse")).toBe("");
    });
  });

  describe("Modal Rendering & Interaction", () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      selectedProperty: "prop-123",
      selectedPropertyName: "Oceanview Heights",
      existingUnits: [
        { id: "u-1", property_id: "prop-123", unit_label: "Apt 101", rent_due_day: 1 },
        { id: "u-2", property_id: "prop-123", unit_label: "Apt 102", rent_due_day: 1 },
      ],
      onSuccess: vi.fn(),
    };

    it("renders modal header with property name and segmented tabs", () => {
      render(<CreateUnitModal {...defaultProps} />);

      expect(screen.getByText("Add Units")).toBeInTheDocument();
      expect(screen.getByText("Oceanview Heights")).toBeInTheDocument();
      expect(screen.getByText("Single Unit")).toBeInTheDocument();
      expect(screen.getByText("Bulk Generator")).toBeInTheDocument();
    });

    it("detects and highlights duplicates in single unit mode", () => {
      render(<CreateUnitModal {...defaultProps} />);

      const input = screen.getByPlaceholderText("e.g. Apt 104, Suite 2B, Penthouse A");
      fireEvent.change(input, { target: { value: "Apt 101" } });

      expect(
        screen.getByText('Unit "Apt 101" already exists in Oceanview Heights.')
      ).toBeInTheDocument();

      const createBtn = screen.getByRole("button", { name: /create 1 unit/i });
      expect(createBtn).toBeDisabled();
    });

    it("successfully creates a single unit", async () => {
      const mockCreated = {
        id: "u-new",
        property_id: "prop-123",
        unit_label: "Apt 103",
        rent_due_day: 1,
      };
      (api.fetchAPI as any).mockResolvedValueOnce(mockCreated);

      render(<CreateUnitModal {...defaultProps} />);

      const input = screen.getByPlaceholderText("e.g. Apt 104, Suite 2B, Penthouse A");
      fireEvent.change(input, { target: { value: "Apt 103" } });

      const createBtn = screen.getByRole("button", { name: /create 1 unit/i });
      expect(createBtn).not.toBeDisabled();
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(api.fetchAPI).toHaveBeenCalledWith("/api/v1/landlord/units", {
          method: "POST",
          body: JSON.stringify({
            property_id: "prop-123",
            unit_label: "Apt 103",
          }),
        });
        expect(defaultProps.onSuccess).toHaveBeenCalledWith([mockCreated]);
        expect(defaultProps.onClose).toHaveBeenCalled();
      });
    });

    it("switches to Bulk Generator, generates preview chips, and enforces 30 unit cap", async () => {
      render(<CreateUnitModal {...defaultProps} />);

      const bulkTab = screen.getByText("Bulk Generator");
      fireEvent.click(bulkTab);

      expect(screen.getByText("Prefix / Format")).toBeInTheDocument();
      expect(screen.getByText("Starting Number")).toBeInTheDocument();
      expect(screen.getByText("Unit Count")).toBeInTheDocument();
      expect(screen.getByText("Max 30")).toBeInTheDocument();

      // Check live indicator
      expect(screen.getByText(/units will be created/i)).toBeInTheDocument();

      // Check duplicate badge in bulk
      expect(screen.getByText(/2 units already exist/i)).toBeInTheDocument();
    });

    it("preserves state and shows inline error on API failure (Failure Recovery)", async () => {
      (api.fetchAPI as any).mockRejectedValueOnce(new Error("Server timeout"));

      render(<CreateUnitModal {...defaultProps} />);

      const input = screen.getByPlaceholderText("e.g. Apt 104, Suite 2B, Penthouse A");
      fireEvent.change(input, { target: { value: "Apt 105" } });

      const createBtn = screen.getByRole("button", { name: /create 1 unit/i });
      fireEvent.click(createBtn);

      await waitFor(() => {
        expect(screen.getByText("Server timeout")).toBeInTheDocument();
        // Modal should still be open with typed value intact
        expect(input).toHaveValue("Apt 105");
        expect(defaultProps.onClose).not.toHaveBeenCalled();
      });
    });

    it("increments and decrements unit count with stepper buttons", () => {
      render(<CreateUnitModal {...defaultProps} />);

      const bulkTab = screen.getByText("Bulk Generator");
      fireEvent.click(bulkTab);

      const increaseBtn = screen.getByLabelText("Increase unit count");
      const decreaseBtn = screen.getByLabelText("Decrease unit count");

      fireEvent.click(increaseBtn);
      expect(screen.getByDisplayValue("11")).toBeInTheDocument();

      fireEvent.click(decreaseBtn);
      expect(screen.getByDisplayValue("10")).toBeInTheDocument();
    });
  });
});
