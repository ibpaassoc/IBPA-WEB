"use client";

import { useDeferredValue, useState, useTransition } from "react";

export function useAdminFilters<TFilters extends Record<string, string>>(
  initialFilters: TFilters,
  initialSearch = "",
) {
  const [search, setSearchValue] = useState(initialSearch);
  const [filters, setFilters] = useState<TFilters>(initialFilters);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(search);

  const setSearch = (value: string) => {
    startTransition(() => setSearchValue(value));
  };

  const setFilter = <TKey extends keyof TFilters>(key: TKey, value: TFilters[TKey]) => {
    startTransition(() => {
      setFilters((current) => ({ ...current, [key]: value }));
    });
  };

  const resetFilters = () => {
    startTransition(() => {
      setSearchValue("");
      setFilters(initialFilters);
    });
  };

  return {
    deferredSearch,
    filters,
    isPending,
    resetFilters,
    search,
    setFilter,
    setSearch,
  };
}
