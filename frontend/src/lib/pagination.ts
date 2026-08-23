/**
 * Pagination envelope utilities.
 *
 * Backend list endpoints return a FastAPI Page envelope:
 * `{ items, total, limit, offset }`. Some callers may still receive bare
 * arrays; unwrapPage normalizes both shapes into an array.
 */

export function unwrapPage<T>(
  data: T[] | { items?: T[] } | null | undefined
): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.items) ? data.items : [];
}
