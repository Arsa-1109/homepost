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
 * @param prefix - Folder prefix (e.g., 'maintenance' or 'documents')
 * @param token - Clerk session token
 * @returns The R2 object key (used to reference the file later)
 */
export async function uploadFile(
  file: File,
  prefix: string = "maintenance",
  token: string | null = null
): Promise<string> {
  const filename = encodeURIComponent(file.name);
  const contentType = encodeURIComponent(file.type);
  const path = `/api/v1/uploads/presigned-url?filename=${filename}&content_type=${contentType}&prefix=${prefix}`;

  // Step 1: Get presigned POST payload from backend (GET endpoint with query params)
  const { upload_url, fields, file_key } =
    await apiFetch<{ upload_url: string; fields: Record<string, string>; file_key: string }>(
      path,
      {
        method: "GET",
      },
      token
    );

  // Step 2: Upload directly to R2 using PUT (R2 doesn't support presigned POST)
  const uploadResponse = await fetch(upload_url, {
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

  return file_key;
}

/**
 * Upload multiple files (up to 3) in parallel.
 *
 * @param files - Array of File objects (max 3)
 * @param prefix - Folder prefix (e.g., 'maintenance' or 'documents')
 * @param token - Clerk session token
 * @returns Array of R2 object keys
 */
export async function uploadFiles(
  files: File[],
  prefix: string = "maintenance",
  token: string | null = null
): Promise<string[]> {
  if (files.length > 3) {
    throw new Error("You can upload a maximum of 3 images per request.");
  }

  const results = await Promise.all(
    files.map((file) => uploadFile(file, prefix, token))
  );

  return results;
}

