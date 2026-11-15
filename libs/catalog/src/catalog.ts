import { queryOptions } from "@tanstack/react-query";
import type { ResultAsync } from "neverthrow";

export type CatalogRequest = { language: string; signal?: AbortSignal };

export type CatalogAdapter<Summary, Detail> = {
  id: string;
  search: (query: string, request: CatalogRequest) => ResultAsync<Summary[], Error>;
  detail: (id: string, request: CatalogRequest) => ResultAsync<Detail, Error>;
};

export type Catalog<Summary, Detail> = CatalogAdapter<Summary, Detail> & {
  searchOptions: (
    query: string,
    language: string,
  ) => ReturnType<typeof searchOptions<Summary, Detail>>;
  detailOptions: (
    id: string | null,
    language: string,
  ) => ReturnType<typeof detailOptions<Summary, Detail>>;
};

function settle<T>(result: ResultAsync<T, Error>): Promise<T> {
  return result.match(
    (value) => value,
    (error) => {
      throw error;
    },
  );
}

function searchOptions<Summary, Detail>(
  adapter: CatalogAdapter<Summary, Detail>,
  query: string,
  language: string,
) {
  return queryOptions({
    queryKey: [adapter.id, "search", language, query] as const,
    queryFn: ({ signal }) => settle(adapter.search(query, { language, signal })),
  });
}

function detailOptions<Summary, Detail>(
  adapter: CatalogAdapter<Summary, Detail>,
  id: string | null,
  language: string,
) {
  return queryOptions({
    queryKey: [adapter.id, "detail", language, id ?? ""] as const,
    enabled: id !== null,
    queryFn: ({ signal }) =>
      id === null
        ? Promise.reject(new Error(`${adapter.id}: nothing selected`))
        : settle(adapter.detail(id, { language, signal })),
  });
}

export function createCatalog<Summary, Detail>(
  adapter: CatalogAdapter<Summary, Detail>,
): Catalog<Summary, Detail> {
  return {
    ...adapter,
    searchOptions: (query, language) => searchOptions(adapter, query, language),
    detailOptions: (id, language) => detailOptions(adapter, id, language),
  };
}
