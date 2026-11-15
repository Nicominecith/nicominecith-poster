import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Catalog } from "./catalog";

export function useCatalogSelection<Summary, Detail>(
  catalog: Catalog<Summary, Detail>,
  onLoad: (detail: Detail) => void,
) {
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [id, setId] = useState<string | null>(null);
  const [language, setLanguage] = useState(i18n.language);
  const [filledFrom, setFilledFrom] = useState<string | null>(null);
  const options = catalog.detailOptions(id, language);
  const query = useQuery(options);
  const { data } = query;

  useEffect(() => {
    if (id === null || !data || filledFrom === id) return;
    setFilledFrom(id);
    onLoad(data);
  }, [id, data, filledFrom, onLoad]);

  return {
    id,
    query,
    isLoading: id !== null && filledFrom !== id && !query.isError,
    select(next: string) {
      setFilledFrom(null);
      setLanguage(i18n.language);
      setId(next);
    },
    cancel() {
      if (id !== null) void queryClient.cancelQueries({ queryKey: options.queryKey });
      setId(null);
      setFilledFrom(null);
    },
  };
}

export type CatalogSelection<Detail> = ReturnType<typeof useCatalogSelection<unknown, Detail>>;
