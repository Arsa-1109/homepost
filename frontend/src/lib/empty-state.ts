/**
 * Empty-state gating predicate.
 *
 * Returns true only when it is safe to show an "empty" message: loading has
 * finished, no error occurred, and there are no items. Prevents empty-state
 * flashes while data is being fetched or after an error.
 */
export function shouldShowEmpty(
  isLoading: boolean,
  items: readonly unknown[] | null | undefined,
  hasError?: boolean
): boolean {
  return !isLoading && !hasError && (!items || items.length === 0);
}
