import { describe, expect, it } from "vitest";
import {
  getFriendlyFileName,
  isVideoUrl,
  isImageUrl,
  isPdfUrl,
  isDocUrl,
  isSpreadsheetUrl,
  getFileTypeInfo,
} from "./LightboxModal";

describe("LightboxModal helpers", () => {
  describe("getFriendlyFileName", () => {
    it("generates correct format-specific fallback names when UUID is present without extra name", () => {
      expect(
        getFriendlyFileName(
          "https://example.com/uploads/e7f8045e-04ea-4c57-897d-65e38699da76.mp4"
        )
      ).toBe("Video.mp4");

      expect(
        getFriendlyFileName(
          "https://example.com/uploads/e7f8045e-04ea-4c57-897d-65e38699da76.jpg"
        )
      ).toBe("Image.jpg");

      expect(
        getFriendlyFileName(
          "https://example.com/uploads/e7f8045e-04ea-4c57-897d-65e38699da76.png"
        )
      ).toBe("Image.png");

      expect(
        getFriendlyFileName(
          "https://example.com/uploads/e7f8045e-04ea-4c57-897d-65e38699da76.pdf"
        )
      ).toBe("Document.pdf");

      expect(
        getFriendlyFileName(
          "https://example.com/uploads/e7f8045e-04ea-4c57-897d-65e38699da76.docx"
        )
      ).toBe("Document.docx");

      expect(
        getFriendlyFileName(
          "https://example.com/uploads/e7f8045e-04ea-4c57-897d-65e38699da76.xlsx"
        )
      ).toBe("Spreadsheet.xlsx");

      expect(
        getFriendlyFileName(
          "https://example.com/uploads/e7f8045e-04ea-4c57-897d-65e38699da76.csv"
        )
      ).toBe("Spreadsheet.csv");
    });

    it("preserves friendly custom filenames when present", () => {
      expect(
        getFriendlyFileName(
          "https://example.com/uploads/kitchen_sink_leak.mp4"
        )
      ).toBe("kitchen_sink_leak.mp4");

      expect(
        getFriendlyFileName(
          "https://example.com/uploads/lease_contract_2026.pdf"
        )
      ).toBe("lease_contract_2026.pdf");
    });
  });

  describe("Format detection helpers", () => {
    it("correctly identifies videos, images, pdfs, docs, and spreadsheets", () => {
      expect(isVideoUrl("https://example.com/walkthrough.mp4")).toBe(true);
      expect(isVideoUrl("https://example.com/tour.webm")).toBe(true);
      expect(isVideoUrl("https://example.com/preview.mov")).toBe(true);
      expect(isVideoUrl("https://example.com/stream?type=video")).toBe(true);
      expect(isVideoUrl("blob:http://localhost/123", "video/mp4")).toBe(true);

      expect(isPdfUrl("https://example.com/agreement.pdf")).toBe(true);
      expect(isDocUrl("https://example.com/notice.docx")).toBe(true);
      expect(isSpreadsheetUrl("https://example.com/rent_ledger.xlsx")).toBe(true);
      expect(isSpreadsheetUrl("https://example.com/data.csv")).toBe(true);

      // Videos and PDFs should NOT be classified as images
      expect(isImageUrl("https://example.com/walkthrough.mp4")).toBe(false);
      expect(isImageUrl("https://example.com/doc.pdf")).toBe(false);

      expect(isImageUrl("https://example.com/photo.jpg")).toBe(true);
      expect(isImageUrl("https://example.com/photo.png")).toBe(true);
      expect(isImageUrl("https://example.com/photo.webp")).toBe(true);
    });
  });

  describe("getFileTypeInfo", () => {
    it("returns correct category, badge, and color info for all file types", () => {
      const videoInfo = getFileTypeInfo("clip.mp4");
      expect(videoInfo.category).toBe("video");
      expect(videoInfo.label).toBe("VIDEO");
      expect(videoInfo.badgeClass).toContain("violet");

      const pdfInfo = getFileTypeInfo("contract.pdf");
      expect(pdfInfo.category).toBe("pdf");
      expect(pdfInfo.label).toBe("PDF");
      expect(pdfInfo.badgeClass).toContain("rose");

      const imgInfo = getFileTypeInfo("photo.jpg");
      expect(imgInfo.category).toBe("image");
      expect(imgInfo.label).toBe("Image");
      expect(imgInfo.badgeClass).toContain("emerald");

      const docInfo = getFileTypeInfo("notes.docx");
      expect(docInfo.category).toBe("doc");
      expect(docInfo.label).toBe("DOC");
      expect(docInfo.badgeClass).toContain("blue");

      const sheetInfo = getFileTypeInfo("finance.xlsx");
      expect(sheetInfo.category).toBe("sheet");
      expect(sheetInfo.label).toBe("SHEET");
      expect(sheetInfo.badgeClass).toContain("emerald");
    });
  });
});
