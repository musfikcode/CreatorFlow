import { useEffect, useState } from "react";
import { PAGINATION } from "@/config/constants";

interface useEntitySearchProps<
  T extends {
    search: string;
    page: number;
  },
> {
  params: T;
  setParams: (params: T | ((prev: T) => T)) => void;
  debounceMs?: number;
}

export function useEntitySearch<
  T extends {
    search: string;
    page: number;
  },
>({ params, setParams, debounceMs = 500 }: useEntitySearchProps<T>) {
  const [localSearch, setLocalSearch] = useState(params.search);

  useEffect(() => {
    if (localSearch === "" && params.search !== "") {
      setParams((prev) => ({
        ...prev,
        search: "",
        page: PAGINATION.DEFAULT_PAGE,
      }));
      return;
    }
    const timer = setTimeout(() => {
      if (localSearch !== params.search) {
        setParams((prev) => ({
          ...prev,
          search: localSearch,
          page: PAGINATION.DEFAULT_PAGE,
        }));
      }
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [localSearch, params.search, setParams, debounceMs]);

  useEffect(() => {
    setLocalSearch(params.search);
  }, [params.search]);

  return {
    searchValue: localSearch,
    onSearchChange: setLocalSearch,
  };
}
