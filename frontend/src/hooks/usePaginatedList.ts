"use client";

import { useState, useMemo, useCallback } from "react";

export interface PaginationOptions<T> {
  initialPage?: number;
  initialPageSize?: number;
  filterFn?: (item: T, search: string, filterValue: string) => boolean;
}

export interface UsePaginatedListResult<T> {
  page: number;
  pageSize: number;
  search: string;
  filterValue: string;
  totalItems: number;
  totalPages: number;
  paginatedItems: T[];
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setFilterValue: (filterValue: string) => void;
  nextPage: () => void;
  prevPage: () => void;
  canNextPage: boolean;
  canPrevPage: boolean;
}

/**
 * Shared hook for client/server list filtering and pagination (M6).
 */
export function usePaginatedList<T>(
  items: T[] = [],
  options: PaginationOptions<T> = {}
): UsePaginatedListResult<T> {
  const {
    initialPage = 1,
    initialPageSize = 10,
    filterFn,
  } = options;

  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [search, setSearchState] = useState("");
  const [filterValue, setFilterValueState] = useState("all");

  const setSearch = useCallback((s: string) => {
    setSearchState(s);
    setPageState(1); // Reset to page 1 on search change
  }, []);

  const setFilterValue = useCallback((f: string) => {
    setFilterValueState(f);
    setPageState(1); // Reset to page 1 on filter change
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setPageState(1);
  }, []);

  const setPage = useCallback((p: number) => {
    setPageState(p);
  }, []);

  const filteredItems = useMemo(() => {
    if (!filterFn) return items;
    return items.filter((item) => filterFn(item, search, filterValue));
  }, [items, search, filterValue, filterFn]);

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Ensure current page doesn't exceed totalPages
  const currentPage = Math.min(page, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const canPrevPage = currentPage > 1;
  const canNextPage = currentPage < totalPages;

  const nextPage = useCallback(() => {
    if (canNextPage) setPageState((p) => p + 1);
  }, [canNextPage]);

  const prevPage = useCallback(() => {
    if (canPrevPage) setPageState((p) => p - 1);
  }, [canPrevPage]);

  return {
    page: currentPage,
    pageSize,
    search,
    filterValue,
    totalItems,
    totalPages,
    paginatedItems,
    setPage,
    setPageSize,
    setSearch,
    setFilterValue,
    nextPage,
    prevPage,
    canNextPage,
    canPrevPage,
  };
}
