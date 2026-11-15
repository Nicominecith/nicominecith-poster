import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebouncedCallback } from "use-debounce";
import { useTranslation } from "react-i18next";
import { SearchIcon } from "lucide-react";
import { albumKey } from "../album/providers";
import { albumQueries } from "../album/queries";
import { type AlbumSummary, type SearchableSource } from "../album/types";
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

const SOURCE_LABELS: Record<SearchableSource, string> = {
  itunes: "iTunes",
  musicbrainz: "MusicBrainz",
};

function AlbumResult({ album, onSelect }: { album: AlbumSummary; onSelect: () => void }) {
  const { t } = useTranslation();

  const facts = [
    t(`search.kind.${album.kind}`),
    album.trackCount > 0 ? t("search.trackCount", { count: album.trackCount }) : "",
    album.releaseCount > 0 ? t("search.releaseCount", { count: album.releaseCount }) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <CommandItem
      value={albumKey(album)}
      onSelect={onSelect}
      className={cn("group min-h-11 font-mono-ui")}
    >
      <span className={cn("font-body text-sm leading-snug font-bold")}>{album.name}</span>
      <span
        className={cn(
          "text-xs text-secondary uppercase group-data-[selected=true]:text-on-primary-soft",
        )}
      >
        {album.artist}
        {album.year && ` · ${album.year}`}
      </span>
      <span
        className={cn("flex flex-wrap items-center gap-s pt-xs text-2xs tracking-ui uppercase")}
      >
        <span
          className={cn(
            "border border-tertiary px-xs text-secondary",
            "group-data-[selected=true]:border-on-primary-soft group-data-[selected=true]:text-on-primary-soft",
          )}
        >
          {SOURCE_LABELS[album.source]}
        </span>
        <span className={cn("text-secondary group-data-[selected=true]:text-on-primary-soft")}>
          {facts}
        </span>
      </span>
    </CommandItem>
  );
}

function AlbumResults({
  query,
  onSelect,
}: {
  query: string;
  onSelect: (album: AlbumSummary) => void;
}) {
  const { t } = useTranslation();
  const enabled = query.length >= MIN_QUERY_LENGTH;
  const {
    data: results,
    isFetching,
    isError,
  } = useQuery({ ...albumQueries.search(query), enabled });

  const list = enabled ? (results ?? []) : [];

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
      {list.map((album) => (
        <AlbumResult key={albumKey(album)} album={album} onSelect={() => onSelect(album)} />
      ))}
    </>
  );
}

export function AlbumSearchField({
  onSelect,
  trigger,
}: {
  onSelect: (album: AlbumSummary) => void;
  trigger?: ReactNode;
}) {
  const { t } = useTranslation();
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
          <span className={cn("truncate")}>{t("search.placeholder")}</span>
        </DialogTrigger>
      )}

      <DialogContent size="full" className={cn("overflow-y-hidden")}>
        <DialogHeader>
          <DialogTitle>{t("search.title")}</DialogTitle>
          <DialogDescription>{t("search.description")}</DialogDescription>
        </DialogHeader>

        <Command shouldFilter={false} className={cn("min-h-0 flex-1 gap-m")}>
          <CommandInput
            autoFocus
            value={query}
            placeholder={t("search.placeholder")}
            onValueChange={(value) => {
              setQuery(value);
              setDebounced(value);
            }}
          />
          <CommandList className={cn("max-h-none min-h-0 flex-1")}>
            <AlbumResults
              query={debouncedQuery.trim()}
              onSelect={(album) => {
                close();
                onSelect(album);
              }}
            />
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
