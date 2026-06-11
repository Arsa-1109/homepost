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
  const formData = new FormData();
  formData.append("prefix", prefix);
  formData.append("file", file);

  const { file_key } = await apiFetch<{ file_key: string }>(
    `/api/v1/uploads/`,
    {
      method: "POST",
      body: formData,
    },
    token
  );

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

