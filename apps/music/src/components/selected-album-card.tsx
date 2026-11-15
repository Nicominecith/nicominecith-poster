import { useTranslation } from "react-i18next";
import type { UseQueryResult } from "@tanstack/react-query";
import { LayersIcon, RotateCcwIcon, SearchIcon } from "lucide-react";
import { type AlbumDetail } from "@freetsy/poster";
import { type AlbumRef } from "../album/types";
import type { useAlbumEditions } from "../album/use-album-editions";
import { cn } from "@freetsy/ui/lib/utils";
import { AlbumEditionDialog } from "./album-edition-dialog";
import { AlbumSearchField } from "./album-search-field";
import { Alert, AlertDescription } from "@freetsy/ui/components/alert";
import { Button } from "@freetsy/ui/components/button";
import { Field, FieldDescription } from "@freetsy/ui/components/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@freetsy/ui/components/item";
import { Spinner } from "@freetsy/ui/components/spinner";

export function SelectedAlbumCard({
  album,
  albumQuery,
  editionChoice,
  onSelect,
  onReset,
  onCancel,
}: {
  album: AlbumRef;
  albumQuery: UseQueryResult<AlbumDetail>;
  editionChoice: ReturnType<typeof useAlbumEditions>;
  onSelect: (next: AlbumRef) => void;
  onReset: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <AlbumEditionDialog
        albumId={album.id}
        source={album.source}
        editions={editionChoice.editions}
        {...editionChoice.dialogProps}
        onCancel={onCancel}
      />
      <Field>
        <Item variant="outline" size="sm" className={cn("items-start")}>
          <ItemContent>
            {editionChoice.isPending && (
              <ItemDescription className={cn("flex items-center gap-s")}>
                <Spinner className={cn("size-3.5")} />
                {t("search.editionLoading")}
              </ItemDescription>
            )}
            {albumQuery.isLoading && (
              <ItemDescription className={cn("flex items-center gap-s")}>
                <Spinner className={cn("size-3.5")} />
                {t("search.loading")}
              </ItemDescription>
            )}
            {albumQuery.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {albumQuery.error instanceof Error
                    ? albumQuery.error.message
                    : t("search.loadFailed")}
                </AlertDescription>
              </Alert>
            )}
            {albumQuery.data && (
              <>
                <ItemTitle>{albumQuery.data.name}</ItemTitle>
                <ItemDescription>
                  {albumQuery.data.artist} ·{" "}
                  {t("search.trackCount", { count: albumQuery.data.tracks.length })}
                </ItemDescription>
              </>
            )}
          </ItemContent>
          <ItemActions className={cn("w-full flex-col items-stretch gap-xs")}>
            {editionChoice.editions.length > 1 && (
              <Button
                variant="link"
                size="sm"
                onClick={editionChoice.openDialog}
                className={cn("w-full items-start justify-start p-0 text-left whitespace-normal")}
              >
                <LayersIcon strokeWidth="var(--stroke-icon)" />
                {t("search.editionChange")}
              </Button>
            )}
            <AlbumSearchField
              onSelect={(next) => onSelect({ id: next.id, source: next.source })}
              trigger={
                <Button
                  variant="link"
                  size="sm"
                  className={cn("w-full items-start justify-start p-0 text-left whitespace-normal")}
                >
                  <SearchIcon strokeWidth="var(--stroke-icon)" />
                  {t("search.chooseOther")}
                </Button>
              }
            />
            <Button
              variant="link"
              size="sm"
              onClick={onReset}
              className={cn("w-full items-start justify-start p-0 text-left whitespace-normal")}
            >
              <RotateCcwIcon strokeWidth="var(--stroke-icon)" />
              {t("search.resetContent")}
            </Button>
          </ItemActions>
        </Item>
        <FieldDescription>{t("search.replaceHint")}</FieldDescription>
      </Field>
    </>
  );
}
