import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Catalog } from "@freetsy/catalog";
import { useDebouncedCallback } from "use-debounce";
import { useTranslation } from "react-i18next";
import { SearchIcon } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@freetsy/ui/components/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@freetsy/ui/components/dialog";
import { Alert, AlertDescription } from "@freetsy/ui/components/alert";
import { Spinner } from "@freetsy/ui/components/spinner";
import { cn } from "@freetsy/ui/lib/utils";

const SEARCH_DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export type CatalogHit = {
  id: string;
  title: string;
  facts: string;
  source: string;
  tag: string;
};

type SearchProps<Summary, Detail> = {
  catalog: Catalog<Summary, Detail>;
  toHit: (summary: Summary) => CatalogHit;
};

function CatalogResult({ hit, onSelect }: { hit: CatalogHit; onSelect: () => void }) {
  return (
    <CommandItem value={hit.id} onSelect={onSelect} className={cn("group min-h-11 font-mono-ui")}>
      <span className={cn("font-body text-sm leading-snug font-bold")}>{hit.title}</span>
      {hit.facts && (
        <span
          className={cn(
            "text-xs text-secondary uppercase group-data-[selected=true]:text-on-primary-soft",
          )}
        >
          {hit.facts}
        </span>
      )}
      <span
        className={cn("flex flex-wrap items-center gap-s pt-xs text-2xs tracking-ui uppercase")}
      >
        <span
          className={cn(
            "border border-tertiary px-xs text-secondary",
            "group-data-[selected=true]:border-on-primary-soft group-data-[selected=true]:text-on-primary-soft",
          )}
        >
          {hit.source}
        </span>
        <span className={cn("text-secondary group-data-[selected=true]:text-on-primary-soft")}>
          {hit.tag}
        </span>
      </span>
    </CommandItem>
  );
}

function CatalogResults<Summary, Detail>({
  catalog,
  toHit,
  query,
  onSelect,
}: SearchProps<Summary, Detail> & { query: string; onSelect: (hit: CatalogHit) => void }) {
  const { t, i18n } = useTranslation();
  const enabled = query.length >= MIN_QUERY_LENGTH;
  const {
    data: results,
    isFetching,
    isError,
  } = useQuery({ ...catalog.searchOptions(query, i18n.language), enabled });

  const list = enabled ? (results ?? []).map(toHit) : [];

  if (!enabled) {
    return <p className={cn("p-m font-mono-ui text-xs text-secondary")}>{t("search.hint")}</p>;
  }

  return (
    <>
      {isFetching && list.length === 0 && (
        <p className={cn("flex items-center gap-s p-m font-mono-ui text-xs text-secondary")}>
          <Spinner className={cn("size-3.5")} />
          {t("search.searching")}
        </p>
      )}
      {isError && (
        <Alert variant="destructive" className={cn("m-m w-auto")}>
          <AlertDescription>{t("search.failed")}</AlertDescription>
        </Alert>
      )}
      {!isFetching && !isError && <CommandEmpty>{t("search.empty")}</CommandEmpty>}
      {list.map((hit) => (
        <CatalogResult key={hit.id} hit={hit} onSelect={() => onSelect(hit)} />
      ))}
    </>
  );
}

export function CatalogSearchField<Summary, Detail>({
  catalog,
  toHit,
  copy,
  onSelect,
  trigger,
}: SearchProps<Summary, Detail> & {
  copy: { placeholder: string; title: string; description: string };
  onSelect: (hit: CatalogHit) => void;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const setDebounced = useDebouncedCallback(
    (value: string) => setDebouncedQuery(value),
    SEARCH_DEBOUNCE_MS,
  );

  function close() {
    setOpen(false);
    setQuery("");
    setDebouncedQuery("");
    setDebounced.cancel();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setOpen(true);
        else close();
      }}
    >
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger
          className={cn(
            "flex w-full items-center gap-s border border-tertiary px-m py-s text-left",
            "font-mono-ui text-sm text-secondary-soft transition-colors outline-none",
            "pointer-coarse:text-base",
            "hover:border-secondary hover:text-secondary focus-visible:border-accent",
          )}
        >
          <SearchIcon className={cn("size-4 shrink-0")} strokeWidth="var(--stroke-icon)" />
          <span className={cn("truncate")}>{copy.placeholder}</span>
        </DialogTrigger>
      )}

      <DialogContent size="full" className={cn("overflow-y-hidden")}>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <Command shouldFilter={false} className={cn("min-h-0 flex-1 gap-m")}>
          <CommandInput
            autoFocus
            value={query}
            placeholder={copy.placeholder}
            onValueChange={(value) => {
              setQuery(value);
              setDebounced(value);
            }}
          />
          <CommandList className={cn("max-h-none min-h-0 flex-1")}>
            <CatalogResults
              catalog={catalog}
              toHit={toHit}
              query={debouncedQuery.trim()}
              onSelect={(hit) => {
                close();
                onSelect(hit);
              }}
            />
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
