import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { uploadFile, uploadFiles } from "./upload";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockClear();
});

describe("uploadFile", () => {
  it("uploads a file successfully and returns file_key", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ file_key: "maintenance/123/photo.jpg" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    const file = new File(["test content"], "photo.jpg", { type: "image/jpeg" });
    const progressSpy = vi.fn();

    const fileKey = await uploadFile(file, {
      prefix: "maintenance",
      token: "test_jwt",
      onProgress: progressSpy,
    });

    expect(fileKey).toBe("maintenance/123/photo.jpg");
    expect(progressSpy).toHaveBeenCalledWith(10);
    expect(progressSpy).toHaveBeenCalledWith(100);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/v1/uploads/");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer test_jwt");
  });

  it("throws descriptive error when upload fails", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "File too large" }), {
        status: 413,
        headers: { "content-type": "application/json" },
      })
    );

    const file = new File(["huge content"], "video.mp4", { type: "video/mp4" });

    await expect(uploadFile(file, "maintenance")).rejects.toThrow(
      'Failed to upload "video.mp4":'
    );
  });
});

describe("uploadFiles", () => {
  it("uploads multiple files up to max limit of 3", async () => {
    fetchMock
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ file_key: "maintenance/key1.jpg" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ file_key: "maintenance/key2.jpg" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      );

    const file1 = new File(["1"], "img1.jpg", { type: "image/jpeg" });
    const file2 = new File(["2"], "img2.jpg", { type: "image/jpeg" });

    const keys = await uploadFiles([file1, file2], "maintenance", "tok_123");
    expect(keys).toEqual(["maintenance/key1.jpg", "maintenance/key2.jpg"]);
  });

  it("rejects when exceeding 3 files", async () => {
    const files = [
      new File(["1"], "1.jpg", { type: "image/jpeg" }),
      new File(["2"], "2.jpg", { type: "image/jpeg" }),
      new File(["3"], "3.jpg", { type: "image/jpeg" }),
      new File(["4"], "4.jpg", { type: "image/jpeg" }),
    ];

    await expect(uploadFiles(files)).rejects.toThrow(
      "You can upload a maximum of 3 files at once."
    );
  });
});
