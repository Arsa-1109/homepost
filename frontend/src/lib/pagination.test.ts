/**
 * unwrapPage — normalizes backend pagination envelopes.
 *
 * The FastAPI Page envelope is `{ items, total, limit, offset }`. Tenant
 * pages must unwrap it; legacy endpoints may still return bare arrays.
 */
import { describe, expect, it } from "vitest";

import { unwrapPage } from "@/lib/pagination";

type Item = { id: string };

describe("unwrapPage", () => {
  it("extracts items from a pagination envelope", () => {
    const envelope = {
      items: [{ id: "a" }, { id: "b" }],
      total: 2,
      limit: 20,
      offset: 0,
    };

    expect(unwrapPage<Item>(envelope)).toEqual([{ id: "a" }, { id: "b" }]);
  });

  it("passes through a plain array unchanged", () => {
    const array = [{ id: "a" }];

    expect(unwrapPage<Item>(array)).toEqual([{ id: "a" }]);
  });

  it("returns an empty array for an envelope with missing items", () => {
    expect(unwrapPage<Item>({})).toEqual([]);
  });

  it("returns an empty array for null input", () => {
    expect(unwrapPage<Item>(null)).toEqual([]);
  });

  it("returns an empty array for undefined input", () => {
    expect(unwrapPage<Item>(undefined)).toEqual([]);
  });

  it("returns an empty array for unexpected object shapes", () => {
    expect(unwrapPage<Item>({ detail: "not found" } as never)).toEqual([]);
  });
});
