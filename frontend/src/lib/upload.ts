/**
 * File Upload Utility — Cloudflare R2 Presigned URLs
 *
 * Handles the two-step upload flow:
 * 1. Request a presigned PUT URL from our backend
 * 2. Upload the file directly to R2 (server never sees the bytes)
 *
 * Supports uploading up to 3 files for maintenance requests.
 */

import { apiFetch } from "./api";

interface PresignedUrlResponse {
  presigned_url: string;
  object_key: string;
}

/**
 * Upload a single file to R2 via presigned URL.
 *
 * @param file - The File object to upload
 * @param token - Clerk session token
 * @returns The R2 object key (used to reference the file later)
 */
export async function uploadFile(
  file: File,
  token: string
): Promise<string> {
  // Step 1: Get presigned URL from backend
  const { presigned_url, object_key } =
    await apiFetch<PresignedUrlResponse>(
      "/api/v1/uploads/presigned-url",
      {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type,
        }),
      },
      token
    );

  // Step 2: Upload directly to R2
  const uploadResponse = await fetch(presigned_url, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error(
      "We had trouble uploading your file. Please check your internet connection and try again."
    );
  }

  return object_key;
}

/**
 * Upload multiple files (up to 3) in parallel.
 *
 * @param files - Array of File objects (max 3)
 * @param token - Clerk session token
 * @returns Array of R2 object keys
 */
export async function uploadFiles(
  files: File[],
  token: string
): Promise<string[]> {
  if (files.length > 3) {
    throw new Error("You can upload a maximum of 3 images per request.");
  }

  const results = await Promise.all(
    files.map((file) => uploadFile(file, token))
  );

  return results;
}
