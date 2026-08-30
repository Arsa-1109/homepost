/**
 * File Upload Utility — Cloudflare R2 via Backend Proxy
 *
 * Handles file uploads with validation, progress callbacks, and granular error reporting.
 */

import { apiFetch } from "./api";

export interface UploadOptions {
  prefix?: string;
  token?: string | null;
  onProgress?: (percent: number) => void;
}

/**
 * Upload a single file via backend direct upload proxy.
 *
 * @param file - The File object to upload
 * @param prefixOrOptions - Folder prefix string (e.g. 'maintenance', 'documents', 'announcements') or UploadOptions object
 * @param token - Clerk session token (if string prefix used)
 * @param onProgress - Optional upload progress callback (0-100)
 * @returns The R2 object key
 */
export async function uploadFile(
  file: File,
  prefixOrOptions: string | UploadOptions = "maintenance",
  token: string | null = null,
  onProgress?: (percent: number) => void
): Promise<string> {
  const options: UploadOptions =
    typeof prefixOrOptions === "string"
      ? { prefix: prefixOrOptions, token, onProgress }
      : prefixOrOptions;

  const prefix = options.prefix || "maintenance";
  const authToken = options.token ?? null;
  const progressCallback = options.onProgress;

  if (!file) {
    throw new Error("No file provided for upload.");
  }

  const formData = new FormData();
  formData.append("prefix", prefix);
  formData.append("file", file);

  try {
    if (progressCallback) {
      progressCallback(10);
    }

    const { file_key } = await apiFetch<{ file_key: string }>(
      `/api/v1/uploads/`,
      {
        method: "POST",
        body: formData,
      },
      authToken
    );

    if (progressCallback) {
      progressCallback(100);
    }

    return file_key;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Upload failed";
    throw new Error(`Failed to upload "${file.name}": ${errorMsg}`);
  }
}

/**
 * Upload multiple files (up to 3) in parallel with individual file failure details.
 *
 * @param files - Array of File objects (max 3)
 * @param prefixOrOptions - Folder prefix or UploadOptions object
 * @param token - Clerk session token
 * @returns Array of R2 object keys
 */
export async function uploadFiles(
  files: File[],
  prefixOrOptions: string | UploadOptions = "maintenance",
  token: string | null = null
): Promise<string[]> {
  if (!Array.isArray(files) || files.length === 0) {
    return [];
  }

  if (files.length > 3) {
    throw new Error("You can upload a maximum of 3 files at once.");
  }

  const options: UploadOptions =
    typeof prefixOrOptions === "string"
      ? { prefix: prefixOrOptions, token }
      : prefixOrOptions;

  const results = await Promise.all(
    files.map((file) => uploadFile(file, options))
  );

  return results;
}
